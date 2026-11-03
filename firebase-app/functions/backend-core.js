import admin from "firebase-admin";
import crypto from "node:crypto";

const ROLE_GROUPS = {
  privileged: new Set([
    "admin",
    "webmaster",
  ]),
  serviceProvider: new Set([
    "agent",
    "inspector",
    "lender",
  ]),
};

function trimString(value = "", max = 160) {
  return String(value || "").trim().slice(0, max);
}

export function createRequestContext(req, scope = "wd-wright-backend") {
  return {
    requestId: trimString(req.headers["x-request-id"] || crypto.randomUUID(), 80),
    scope,
    method: req.method,
    path: req.originalUrl || req.url || "/",
    ip: trimString(req.headers["x-forwarded-for"] || req.ip || "", 160),
    userAgent: trimString(req.headers["user-agent"] || "", 240),
    startedAt: Date.now(),
  };
}

export function logEvent(level, event, context = {}, details = {}) {
  const payload = {
    severity: String(level || "INFO").toUpperCase(),
    event: trimString(event, 120),
    requestId: context.requestId || "",
    scope: context.scope || "wd-wright-backend",
    method: context.method || "",
    path: context.path || "",
    durationMs: context.startedAt ? Math.max(0, Date.now() - context.startedAt) : undefined,
    details,
    timestamp: new Date().toISOString(),
  };
  const line = JSON.stringify(payload);
  if (payload.severity === "ERROR") {
    console.error(line);
    return;
  }
  if (payload.severity === "WARN") {
    console.warn(line);
    return;
  }
  console.log(line);
}

export function apiError(code, message, statusCode = 400, details = {}) {
  const error = new Error(message);
  error.code = code;
  error.statusCode = statusCode;
  error.details = details;
  return error;
}

export function sendError(res, error, context) {
  const statusCode = Number(error?.statusCode || 500);
  const code = trimString(error?.code || "internal_error", 80);
  const message = trimString(error?.message || "Request failed.", 240);
  const body = {
    ok: false,
    error: {
      code,
      message,
      requestId: context?.requestId || "",
      details: error?.details || {},
    },
  };
  res.status(statusCode).set("Content-Type", "application/json").send(JSON.stringify(body));
}

export function sendOk(res, statusCode, body = {}, context = {}) {
  res.status(statusCode).set("Content-Type", "application/json").send(JSON.stringify({
    ok: body?.ok === false ? false : true,
    requestId: context?.requestId || "",
    ...body,
  }));
}

export function assertMethod(req, allowedMethods = []) {
  if (!allowedMethods.includes(req.method)) {
    throw apiError("method_not_allowed", "Method not allowed.", 405, {
      allowedMethods,
    });
  }
}

export function validateBody(schema = {}, body = {}) {
  const output = {};
  for (const [field, config] of Object.entries(schema)) {
    const raw = body?.[field];
    const required = config?.required === true;
    if ((raw === undefined || raw === null || raw === "") && required) {
      throw apiError("validation_error", `Missing required field: ${field}.`, 400, { field });
    }
    if (raw === undefined || raw === null || raw === "") continue;

    if (config.type === "string") {
      const value = trimString(raw, config.max || 2000);
      if (config.min && value.length < config.min) {
        throw apiError("validation_error", `Field ${field} is too short.`, 400, { field });
      }
      if (config.enum && !config.enum.includes(value)) {
        throw apiError("validation_error", `Field ${field} is invalid.`, 400, { field });
      }
      output[field] = value;
      continue;
    }

    if (config.type === "number") {
      const value = Number(raw);
      if (!Number.isFinite(value)) {
        throw apiError("validation_error", `Field ${field} must be a number.`, 400, { field });
      }
      if (config.min !== undefined && value < config.min) {
        throw apiError("validation_error", `Field ${field} is below minimum.`, 400, { field });
      }
      if (config.max !== undefined && value > config.max) {
        throw apiError("validation_error", `Field ${field} is above maximum.`, 400, { field });
      }
      output[field] = value;
      continue;
    }

    if (config.type === "boolean") {
      output[field] = raw === true;
      continue;
    }
  }
  return output;
}

export function getRoleSet(userRecord = {}) {
  const roles = new Set();
  const accountType = trimString(userRecord?.profile?.accountType || "", 40);
  if (accountType) roles.add(accountType);
  for (const [group, members] of Object.entries(ROLE_GROUPS)) {
    if (members.has(accountType)) roles.add(group);
  }
  return roles;
}

export function requireRole(userRecord, allowedRoles = []) {
  const roleSet = getRoleSet(userRecord);
  const matched = allowedRoles.some((role) => roleSet.has(role));
  if (!matched) {
    throw apiError("forbidden", "This action requires a higher-permission WD Wright account.", 403, {
      allowedRoles,
      currentRoles: Array.from(roleSet),
    });
  }
}

export async function enqueueJob(db, type, payload = {}, options = {}) {
  const ref = db.collection("systemJobs").doc();
  const attempts = Number(options.attempts || 0);
  const nextRunAt = options.nextRunAt instanceof Date ? options.nextRunAt : new Date();
  await ref.set({
    type: trimString(type, 80),
    status: "queued",
    attempts,
    maxAttempts: Number(options.maxAttempts || 5),
    payload,
    errorMessage: trimString(options.errorMessage || "", 500),
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    nextRunAt: admin.firestore.Timestamp.fromDate(nextRunAt),
  }, { merge: true });
  return ref.id;
}

export async function scheduleRetry(db, type, payload = {}, options = {}) {
  const attempts = Number(options.attempts || 0) + 1;
  const delayMs = Math.min(60_000 * 2 ** Math.max(0, attempts - 1), 24 * 60 * 60 * 1000);
  const nextRunAt = new Date(Date.now() + delayMs);
  return enqueueJob(db, type, payload, {
    ...options,
    attempts,
    nextRunAt,
  });
}

export async function ensureWebhookReplayGuard(db, provider, eventId, payload = {}) {
  const normalizedProvider = trimString(provider, 24);
  const normalizedEventId = trimString(eventId, 160);
  if (!normalizedProvider || !normalizedEventId) {
    throw apiError("invalid_webhook", "Webhook event id is required.", 400);
  }
  const legacyKey = `${normalizedProvider}:${normalizedEventId}`;
  const key = legacyKey.includes("/")
    ? crypto.createHash("sha256").update(legacyKey).digest("hex")
    : legacyKey;
  const ref = db.collection("processedWebhookEvents").doc(key);
  const claimId = crypto.randomUUID();
  const now = Date.now();
  return db.runTransaction(async (transaction) => {
    const snap = await transaction.get(ref);
    const existing = snap.exists ? snap.data() || {} : null;
    if (existing && (existing.status !== "processing" || Number(existing.leaseUntilMs || 0) > now)) {
      return { duplicate: true, key };
    }

    const record = {
      provider: normalizedProvider,
      eventId: normalizedEventId,
      status: "processing",
      claimId,
      leaseUntilMs: now + 120_000,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      payloadSummary: payload,
    };
    if (existing) transaction.set(ref, record, { merge: true });
    else transaction.create(ref, {
      ...record,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return { duplicate: false, key, ref, claimId };
  });
}

export async function completeWebhookReplayGuard(db, claim) {
  if (!claim?.ref || !claim?.claimId) return false;
  return db.runTransaction(async (transaction) => {
    const snap = await transaction.get(claim.ref);
    const current = snap.exists ? snap.data() || {} : {};
    if (current.claimId !== claim.claimId || current.status !== "processing") return false;
    transaction.set(claim.ref, {
      status: "processed",
      leaseUntilMs: 0,
      processedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    return true;
  });
}

export async function releaseWebhookReplayGuard(db, claim) {
  if (!claim?.ref || !claim?.claimId) return false;
  return db.runTransaction(async (transaction) => {
    const snap = await transaction.get(claim.ref);
    const current = snap.exists ? snap.data() || {} : {};
    if (current.claimId !== claim.claimId || current.status !== "processing") return false;
    transaction.delete(claim.ref);
    return true;
  });
}
