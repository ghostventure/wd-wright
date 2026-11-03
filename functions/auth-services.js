import admin from "firebase-admin";
import { apiError, enqueueJob } from "./backend-core.js";

function trimString(value = "", max = 160) {
  return String(value || "").trim().slice(0, max);
}

export function assertFreshAuth(userRecord, maxAgeMinutes = 15) {
  const authTimeSeconds = Number(userRecord?.auth?.auth_time || 0);
  if (!authTimeSeconds) {
    throw apiError("stale_auth", "A recent sign-in is required for this action.", 401);
  }
  const authAgeMs = Date.now() - authTimeSeconds * 1000;
  if (authAgeMs > maxAgeMinutes * 60 * 1000) {
    throw apiError("stale_auth", "Please sign in again before completing this action.", 401, {
      maxAgeMinutes,
    });
  }
}

export function buildDeviceFingerprint(req) {
  const userAgent = trimString(req.headers["user-agent"] || "", 240);
  const language = trimString(req.headers["accept-language"] || "", 120);
  const forwarded = trimString(req.headers["x-forwarded-for"] || req.ip || "", 120);
  const basis = `${userAgent}|${language}|${forwarded}`;
  let hash = 0;
  for (let i = 0; i < basis.length; i += 1) hash = (hash * 33 + basis.charCodeAt(i)) >>> 0;
  return {
    fingerprint: `wdwdev-${hash.toString(16)}`,
    userAgent,
    language,
    forwarded,
  };
}

export async function recordTrustedDevice(db, uid, req, extra = {}) {
  const device = buildDeviceFingerprint(req);
  const ref = db.collection("trustedDevices").doc(`${uid}:${device.fingerprint}`);
  await ref.set({
    uid,
    fingerprint: device.fingerprint,
    userAgent: device.userAgent,
    language: device.language,
    forwarded: device.forwarded,
    trusted: extra.trusted === true,
    label: trimString(extra.label || "", 80),
    lastSeenAt: admin.firestore.FieldValue.serverTimestamp(),
    createdAt: extra.createdAt || admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });
  return device;
}

export async function detectLoginAnomaly(db, uid, req) {
  const device = buildDeviceFingerprint(req);
  const snap = await db.collection("trustedDevices").where("uid", "==", uid).limit(5).get();
  const known = snap.docs.map((doc) => doc.data()?.fingerprint).filter(Boolean);
  const anomalous = known.length > 0 && !known.includes(device.fingerprint);
  if (anomalous) {
    await db.collection("securityEvents").add({
      uid,
      type: "new_device_detected",
      fingerprint: device.fingerprint,
      userAgent: device.userAgent,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
  return {
    anomalous,
    fingerprint: device.fingerprint,
    knownDeviceCount: known.length,
  };
}

export async function revokeOwnSessions(uid) {
  await admin.auth().revokeRefreshTokens(uid);
  return {
    revoked: true,
    revokedAt: new Date().toISOString(),
  };
}

export async function publishSessionEvent(db, uid, type, details = {}) {
  await db.collection("sessionEvents").add({
    uid,
    type: trimString(type, 60),
    details,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

export async function syncCustomClaims(db, userRecord) {
  const accountType = trimString(userRecord?.profile?.accountType || "buyer", 40);
  const privileged = ["admin", "webmaster"].includes(accountType);
  const oneWrightId = trimString(userRecord?.profile?.oneWrightId || userRecord?.profile?.oneEstateHatId || "", 40);
  await admin.auth().setCustomUserClaims(userRecord.uid, {
    accountType,
    privileged,
    oneWrightId,
  });
  await enqueueJob(db, "claims_sync_audit", {
    uid: userRecord.uid,
    accountType,
    privileged,
  });
  return { synced: true, accountType, privileged };
}

export async function getMfaState(db, uid) {
  const authUser = await admin.auth().getUser(uid);
  const factors = authUser.multiFactor?.enrolledFactors || [];
  const state = {
    enrolled: factors.length > 0,
    methods: factors.map((factor) => trimString(factor.factorId, 40)).filter(Boolean).slice(0, 5),
    checkedAt: new Date().toISOString(),
  };
  await db.collection("mfaStates").doc(uid).set({ ...state, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
  return state;
}

export async function setMfaState(db, uid) {
  return getMfaState(db, uid);
}

export async function createPrivilegedAccessRequest(db, userRecord, justification = "") {
  const ref = db.collection("privilegedAccessRequests").doc();
  const payload = {
    uid: userRecord.uid,
    email: trimString(userRecord?.auth?.email || userRecord?.profile?.email || "", 160).toLowerCase(),
    justification: trimString(justification, 500),
    status: "pending",
    requestedAt: admin.firestore.FieldValue.serverTimestamp(),
  };
  await ref.set(payload, { merge: true });
  return { id: ref.id, ...payload };
}

export async function reviewPrivilegedAccessRequest(db, requestId, reviewerUid, decision = "approved") {
  const ref = db.collection("privilegedAccessRequests").doc(trimString(requestId, 120));
  await ref.set({
    status: decision === "approved" ? "approved" : "rejected",
    reviewedBy: trimString(reviewerUid, 120),
    reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });
  return { ok: true, requestId, status: decision === "approved" ? "approved" : "rejected" };
}
