import admin from "firebase-admin";
import crypto from "node:crypto";
import { apiError, enqueueJob } from "./backend-core.js";

const ALLOWED_FILE_TYPES = {
  "application/pdf": { extension: "pdf", category: "pdf" },
  "image/jpeg": { extension: "jpg", category: "image" },
  "image/png": { extension: "png", category: "image" },
  "image/webp": { extension: "webp", category: "image" },
  "text/plain": { extension: "txt", category: "text" },
};

function cleanString(value = "", max = 160) {
  return String(value || "").trim().slice(0, max);
}

function cleanNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function cleanStringArray(values, maxItems = 10, maxLength = 64) {
  if (!Array.isArray(values)) return [];
  return values.map((item) => cleanString(item, maxLength)).filter(Boolean).slice(0, maxItems);
}

export function verifyDocumentFileType(file = {}) {
  const mimeType = cleanString(file.mimeType, 80).toLowerCase();
  const extension = cleanString(file.extension, 16).toLowerCase().replace(/^\./, "");
  const allowed = ALLOWED_FILE_TYPES[mimeType];
  if (!allowed) {
    throw apiError("unsupported_file_type", "This document type is not allowed.", 400, {
      mimeType,
    });
  }
  if (extension && extension !== allowed.extension) {
    throw apiError("file_extension_mismatch", "The document extension does not match the content type.", 400, {
      mimeType,
      extension,
      expectedExtension: allowed.extension,
    });
  }
  return {
    mimeType,
    extension: allowed.extension,
    category: allowed.category,
  };
}

export function applyRetentionPolicy(document = {}) {
  const category = cleanString(document.category, 40) || "general";
  const retentionDays = category === "identity"
    ? 365
    : category === "billing"
      ? 2555
      : category === "legal"
        ? 1825
        : 730;
  const expiresAt = new Date(Date.now() + retentionDays * 24 * 60 * 60 * 1000).toISOString();
  return {
    category,
    retentionDays,
    expiresAt,
  };
}

export function buildDocumentAccessPolicy(payload = {}) {
  const sensitivity = cleanString(payload.sensitivity, 24) || "protected";
  const sharedWith = cleanStringArray(payload.sharedWith, 16, 120);
  return {
    sensitivity,
    ownerUid: cleanString(payload.ownerUid, 120),
    roleScope: cleanStringArray(payload.roleScope, 8, 40),
    sharedWith,
    requiresTrustedDevice: payload.requiresTrustedDevice !== false,
    allowPrivilegedOverride: payload.allowPrivilegedOverride !== false,
  };
}

export function buildSecureDocumentMetadata(payload = {}) {
  const typeInfo = verifyDocumentFileType(payload);
  const retention = applyRetentionPolicy(payload);
  const accessPolicy = buildDocumentAccessPolicy(payload);
  return {
    documentId: cleanString(payload.documentId, 120) || `wdw-doc-${Date.now().toString(36)}`,
    ownerUid: cleanString(payload.ownerUid, 120),
    title: cleanString(payload.title, 160) || "WD Wright Document",
    description: cleanString(payload.description, 320),
    bucketPath: cleanString(payload.bucketPath, 240),
    byteSize: cleanNumber(payload.byteSize),
    mimeType: typeInfo.mimeType,
    extension: typeInfo.extension,
    category: cleanString(payload.category, 40) || typeInfo.category,
    tags: cleanStringArray(payload.tags, 12, 40),
    accessPolicy,
    retention,
    security: {
      hash: cleanString(payload.hash, 160),
      virusScanStatus: "queued",
      metadataVerified: true,
    },
  };
}

export async function registerDocumentVersion(db, payload = {}) {
  const metadata = buildSecureDocumentMetadata(payload);
  const versionNumber = Math.max(1, cleanNumber(payload.versionNumber, 1));
  const versionId = cleanString(payload.versionId, 120) || `${metadata.documentId}-v${versionNumber}`;
  const record = {
    ...metadata,
    versionId,
    versionNumber,
    status: cleanString(payload.status, 40) || "active",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };
  const documentRef = db.collection("documentRecords").doc(metadata.documentId);
  const versionRef = documentRef.collection("versions").doc(versionId);
  await db.runTransaction(async (transaction) => {
    const [documentSnap, versionSnap] = await Promise.all([
      transaction.get(documentRef),
      transaction.get(versionRef),
    ]);
    if (documentSnap.exists && documentSnap.data()?.ownerUid !== metadata.ownerUid) {
      throw apiError("forbidden", "You cannot modify another user's document.", 403);
    }
    if (versionSnap.exists) {
      throw apiError("version_exists", "This document version already exists.", 409);
    }
    transaction.set(documentRef, {
    ownerUid: metadata.ownerUid,
    currentVersionId: versionId,
    title: metadata.title,
    category: metadata.category,
    accessPolicy: metadata.accessPolicy,
    retention: metadata.retention,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });
    transaction.create(versionRef, record);
  });
  return record;
}

export async function queueVirusScan(db, documentId, versionId, metadata = {}) {
  const payload = {
    documentId: cleanString(documentId, 120),
    versionId: cleanString(versionId, 120),
    bucketPath: cleanString(metadata.bucketPath, 240),
    mimeType: cleanString(metadata.mimeType, 80),
  };
  await enqueueJob(db, "document_virus_scan", payload, { maxAttempts: 6 });
  return payload;
}

export async function queueOcrExtraction(db, documentId, versionId, metadata = {}) {
  const payload = {
    documentId: cleanString(documentId, 120),
    versionId: cleanString(versionId, 120),
    bucketPath: cleanString(metadata.bucketPath, 240),
    mimeType: cleanString(metadata.mimeType, 80),
  };
  await enqueueJob(db, "document_ocr_extract", payload, { maxAttempts: 6 });
  return payload;
}

export async function createExpiringShareLink(db, payload = {}) {
  const ttlHours = Math.min(168, Math.max(1, cleanNumber(payload.ttlHours, 24)));
  const token = `wdw-share-${crypto.randomBytes(32).toString("base64url")}`;
  const record = {
    token,
    documentId: cleanString(payload.documentId, 120),
    versionId: cleanString(payload.versionId, 120),
    ownerUid: cleanString(payload.ownerUid, 120),
    createdBy: cleanString(payload.createdBy, 120),
    purpose: cleanString(payload.purpose, 120) || "document_review",
    expiresAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() + ttlHours * 60 * 60 * 1000)),
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    status: "active",
  };
  await db.collection("documentShareLinks").doc(token).set(record, { merge: true });
  return record;
}

export function normalizeLeadRecord(record = {}) {
  return {
    type: cleanString(record.type, 40) || "general",
    source: cleanString(record.source, 80) || "wd-wright-site",
    status: cleanString(record.status, 40) || "new",
    location: cleanString(record?.project?.location || record.location, 160),
    service: cleanString(record?.project?.service || record.service, 120),
    timeline: cleanString(record?.project?.timeline || record.timeline, 120),
    contactEmail: cleanString(record?.contact?.email || record.email, 160).toLowerCase(),
    contactName: cleanString(record?.contact?.name || record.name, 120),
  };
}

export function attributeLeadSource(record = {}, context = {}) {
  const routeContext = cleanString(record.routeContext || context.routeContext, 80) || "/";
  const referrer = cleanString(context.referrer, 240).toLowerCase();
  const campaign = cleanString(context.campaign, 80);
  let channel = "direct";
  if (referrer.includes("google")) channel = "search";
  else if (referrer.includes("facebook") || referrer.includes("instagram")) channel = "social";
  else if (campaign) channel = "campaign";
  return {
    routeContext,
    referrerDomain: referrer ? referrer.replace(/^https?:\/\//, "").split("/")[0] : "",
    campaign,
    channel,
  };
}

export async function appendLeadComment(db, leadId, payload = {}) {
  const visibility = cleanString(payload.visibility, 24) || "internal";
  if (!["internal", "requester"].includes(visibility)) {
    throw apiError("invalid_visibility", "Lead comment visibility must be internal or requester.", 400);
  }
  const comment = {
    leadId: cleanString(leadId, 120),
    authorUid: cleanString(payload.authorUid, 120),
    authorLabel: cleanString(payload.authorLabel, 120),
    body: cleanString(payload.body, 800),
    visibility,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };
  if (!comment.leadId || !comment.body) {
    throw apiError("validation_error", "Lead comment requires a leadId and body.", 400);
  }
  const ref = db.collection("leadComments").doc();
  await ref.set(comment, { merge: true });
  return { id: ref.id, ...comment };
}

export async function exportLeadIntake(db, options = {}) {
  const uid = cleanString(options.uid, 120);
  const privileged = options.privileged === true;
  let queryRef = db.collection("jdwrightLeads");
  if (!privileged && uid) {
    queryRef = queryRef.where("requester.uid", "==", uid);
  }
  const snap = await queryRef.limit(privileged ? 200 : 100).get();
  const rows = snap.docs.map((docSnap) => ({
    id: docSnap.id,
    ...normalizeLeadRecord(docSnap.data() || {}),
  }));
  return {
    count: rows.length,
    exportedAt: new Date().toISOString(),
    rows,
  };
}

export function scoreProfileCompleteness(profile = {}) {
  const userDatabase = profile.userDatabase || {};
  const checks = [
    cleanString(profile.name, 120).length >= 2,
    cleanString(profile.email, 160).length >= 5,
    cleanString(profile.phone, 30).length >= 7,
    cleanString(userDatabase.preferredContact, 24).length > 0,
    cleanString(userDatabase.preferredLanguage, 40).length > 0,
    cleanString(userDatabase.timezone, 60).length > 0,
    cleanString(userDatabase.targetMarket, 80).length > 0,
    cleanString(userDatabase.transactionIntent, 80).length > 0,
    cleanString(userDatabase.timelineBand, 40).length > 0,
    cleanString(userDatabase.budgetBand, 40).length > 0,
    Array.isArray(userDatabase.tags) && userDatabase.tags.length > 0,
    cleanString(userDatabase.notes, 400).length > 0,
    userDatabase.marketingOptIn === true,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

export function buildContactPreferenceState(profile = {}) {
  const userDatabase = profile.userDatabase || {};
  return {
    preferredContact: cleanString(userDatabase.preferredContact, 24) || "email",
    preferredLanguage: cleanString(userDatabase.preferredLanguage, 40) || "English",
    timezone: cleanString(userDatabase.timezone, 60) || "America/New_York",
    marketingOptIn: userDatabase.marketingOptIn === true,
    smsReady: cleanString(profile.phone, 30).length >= 7,
    emailReady: cleanString(profile.email, 160).length >= 5,
  };
}

export function buildAccountMergeConflictReview(primary = {}, secondary = {}) {
  const keys = ["name", "phone", "accountType", "email"];
  const conflicts = keys
    .map((key) => ({
      field: key,
      primary: primary?.[key] ?? null,
      secondary: secondary?.[key] ?? null,
    }))
    .filter((entry) => JSON.stringify(entry.primary) !== JSON.stringify(entry.secondary));
  return {
    conflictCount: conflicts.length,
    conflicts,
  };
}

export function buildAccountMergePreview(primary = {}, secondary = {}) {
  const merged = {
    ...secondary,
    ...primary,
    userDatabase: {
      ...(secondary.userDatabase || {}),
      ...(primary.userDatabase || {}),
    },
  };
  return {
    merged,
    review: buildAccountMergeConflictReview(primary, secondary),
  };
}

export async function archiveAccountRecord(db, uid, profile = {}, actorUid = "") {
  const payload = {
    uid: cleanString(uid, 120),
    actorUid: cleanString(actorUid, 120),
    profile,
    archivedAt: admin.firestore.FieldValue.serverTimestamp(),
    status: "archived",
  };
  await db.collection("archivedAccounts").doc(payload.uid).set(payload, { merge: true });
  await db.collection("users").doc(payload.uid).set({
    userDatabase: {
      ...(profile.userDatabase || {}),
      status: "archived",
      archivedAt: new Date().toISOString(),
    },
  }, { merge: true });
  return payload;
}

export async function restoreArchivedAccount(db, uid, actorUid = "") {
  const archivedRef = db.collection("archivedAccounts").doc(cleanString(uid, 120));
  const snap = await archivedRef.get();
  if (!snap.exists) {
    throw apiError("not_found", "Archived account record not found.", 404);
  }
  const data = snap.data() || {};
  const profile = data.profile || {};
  await db.collection("users").doc(uid).set({
    ...profile,
    userDatabase: {
      ...(profile.userDatabase || {}),
      status: "active",
      restoredAt: new Date().toISOString(),
      restoredBy: cleanString(actorUid, 120),
    },
  }, { merge: true });
  await archivedRef.set({
    restoredAt: admin.firestore.FieldValue.serverTimestamp(),
    restoredBy: cleanString(actorUid, 120),
    status: "restored",
  }, { merge: true });
  return { uid, restored: true };
}

export async function recordFirestoreMetric(db, payload = {}) {
  const record = {
    scope: cleanString(payload.scope, 80) || "general",
    action: cleanString(payload.action, 40) || "read",
    target: cleanString(payload.target, 120),
    uid: cleanString(payload.uid, 120),
    requestId: cleanString(payload.requestId, 80),
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };
  await db.collection("firestoreAccessMetrics").add(record);
  return record;
}

export async function createSecurityIncidentHook(db, payload = {}) {
  const record = {
    type: cleanString(payload.type, 80) || "security_watch",
    severity: cleanString(payload.severity, 24) || "watch",
    uid: cleanString(payload.uid, 120),
    requestId: cleanString(payload.requestId, 80),
    details: payload.details || {},
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    status: "open",
  };
  await db.collection("securityIncidentHooks").add(record);
  return record;
}
