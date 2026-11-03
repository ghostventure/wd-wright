import admin from "firebase-admin";
import crypto from "node:crypto";
import { apiError, sendOk } from "./backend-core.js";

export const API_VERSION = "2026-11-02";

export function withApiVersion(res) {
  res.set("X-WD-Wright-API-Version", API_VERSION);
}

export async function withTimeout(task, timeoutMs = 15000, label = "request") {
  let timeoutId;
  try {
    return await Promise.race([
      Promise.resolve().then(task),
      new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(apiError("timeout", `${label} timed out.`, 504)), timeoutMs);
      }),
    ]);
  } finally {
    clearTimeout(timeoutId);
  }
}

function hashIdempotency(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

async function claimIdempotency(db, { scope, key, uid, requestHash }) {
  const ref = db.collection("apiIdempotency").doc(hashIdempotency(`${uid}:${scope}:${key}`));
  const claimId = crypto.randomUUID();
  const now = Date.now();
  return db.runTransaction(async (transaction) => {
    const snap = await transaction.get(ref);
    const existing = snap.exists ? snap.data() || {} : null;

    if (existing?.requestHash && existing.requestHash !== requestHash) {
      throw apiError("idempotency_conflict", "This idempotency key was already used for a different request.", 409);
    }
    if (existing?.status === "completed") {
      return { ref, cached: existing.responseBody, replay: true };
    }
    if (existing?.status === "started" && Number(existing.leaseUntilMs || 0) > now) {
      throw apiError("request_in_progress", "A request with this idempotency key is still processing.", 409);
    }

    const payload = {
      scope,
      uid,
      keyHash: hashIdempotency(key),
      requestHash,
      claimId,
      status: "started",
      leaseUntilMs: now + 60_000,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    if (existing) {
      transaction.set(ref, payload, { merge: true });
    } else {
      transaction.create(ref, {
        ...payload,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
    return { ref, claimId, replay: false };
  });
}

export async function withIdempotency(db, req, scope, handler) {
  const key = String(req.headers["x-idempotency-key"] || "").trim();
  if (!key) return handler();
  if (key.length > 120 || /[^\x21-\x7e]/.test(key)) {
    throw apiError("invalid_idempotency_key", "The idempotency key must contain 1 to 120 visible ASCII characters.", 400);
  }

  const authorization = String(req.headers.authorization || "");
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  if (!match) throw apiError("unauthenticated", "A signed-in user is required for idempotent requests.", 401);

  let uid;
  try {
    ({ uid } = await admin.auth().verifyIdToken(match[1]));
  } catch {
    throw apiError("unauthenticated", "The sign-in token is invalid or expired.", 401);
  }

  const url = new URL(req.originalUrl || req.url || "/", `${req.protocol || "https"}://${req.headers.host || "localhost"}`);
  const requestHash = hashIdempotency(JSON.stringify({
    method: req.method,
    path: url.pathname,
    body: req.body ?? null,
  }));
  const claim = await claimIdempotency(db, { scope, key, uid, requestHash });
  if (claim.replay) return claim.cached;

  let responseBody;
  try {
    responseBody = await handler();
  } catch (error) {
    await db.runTransaction(async (transaction) => {
      const snap = await transaction.get(claim.ref);
      const current = snap.exists ? snap.data() || {} : {};
      if (current.claimId === claim.claimId && current.status === "started") transaction.delete(claim.ref);
    }).catch(() => null);
    throw error;
  }
  await db.runTransaction(async (transaction) => {
    const snap = await transaction.get(claim.ref);
    const current = snap.exists ? snap.data() || {} : {};
    if (current.claimId !== claim.claimId) {
      throw apiError("request_claim_lost", "The request claim expired before it could be saved. Retry with the same key.", 409);
    }
    transaction.set(claim.ref, {
      status: "completed",
      responseBody: responseBody ?? null,
      leaseUntilMs: 0,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
  });
  return responseBody;
}

export function createApiRouter({ db, req, res, context, routes = [] }) {
  withApiVersion(res);
  return {
    async dispatch() {
      const pathname = new URL(req.originalUrl, `${req.protocol}://${req.headers.host}`).pathname;
      const route = routes.find((item) => item.method === req.method && item.path === pathname);
      if (!route) {
        throw apiError("not_found", "Unknown API route.", 404, {
          method: req.method,
          path: pathname,
        });
      }
      const execute = async () => withTimeout(() => route.handler({ req, res, context, pathname }), route.timeoutMs || 15000, pathname);
      const body = route.idempotent
        ? await withIdempotency(db, req, route.scope || route.path, execute)
        : await execute();
      if (body !== undefined && !res.headersSent) {
        sendOk(res, route.statusCode || 200, body, context);
      }
    },
  };
}

export function randomKey(prefix = "wdw") {
  return `${prefix}-${crypto.randomUUID()}`.slice(0, 80);
}
