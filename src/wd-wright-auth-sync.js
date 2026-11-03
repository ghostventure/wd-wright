"use client";

const AUTH_CHANNEL_NAME = "wd-wright-auth";
const AUTH_SIGNAL_KEY = "wd-wright-auth-signal-v1";

function canUseWindow() {
  return typeof window !== "undefined";
}

function cleanValue(value, maxLength = 160) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function normalizeIdentity(identityOrUid = "", email = "", accountType = "") {
  if (identityOrUid && typeof identityOrUid === "object") {
    return {
      uid: cleanValue(identityOrUid.uid, 128),
      email: cleanValue(identityOrUid.email, 160).toLowerCase(),
      accountType: cleanValue(identityOrUid.accountType, 64).toLowerCase(),
      oneId: cleanValue(identityOrUid.oneId, 64),
    };
  }

  return {
    uid: cleanValue(identityOrUid, 128),
    email: cleanValue(email, 160).toLowerCase(),
    accountType: cleanValue(accountType, 64).toLowerCase(),
    oneId: "",
  };
}

function buildSignal(type, identityOrUid = "", email = "", accountType = "") {
  const identity = normalizeIdentity(identityOrUid, email, accountType);
  return {
    type,
    uid: identity.uid,
    email: identity.email,
    accountType: identity.accountType,
    oneId: identity.oneId,
    scope: "one-id-all-wd-wright",
    at: Date.now(),
    source: Math.random().toString(36).slice(2, 12),
  };
}

function publishSignal(signal) {
  if (!canUseWindow()) return;
  try {
    window.localStorage.setItem(AUTH_SIGNAL_KEY, JSON.stringify(signal));
  } catch {
    // Non-blocking.
  }

  try {
    const channel = new BroadcastChannel(AUTH_CHANNEL_NAME);
    channel.postMessage(signal);
    channel.close();
  } catch {
    // BroadcastChannel is optional.
  }
}

export function announceWrightSignIn(identityOrUid = "", email = "", accountType = "") {
  publishSignal(buildSignal("sign_in", identityOrUid, email, accountType));
}

export function announceWrightSignOut(identityOrUid = "", email = "", accountType = "") {
  publishSignal(buildSignal("sign_out", identityOrUid, email, accountType));
}

export function subscribeToWrightAuthSignals(handler) {
  if (!canUseWindow() || typeof handler !== "function") {
    return () => {};
  }

  let channel = null;

  const onStorage = (event) => {
    if (event.key !== AUTH_SIGNAL_KEY || !event.newValue) return;
    try {
      handler(JSON.parse(event.newValue));
    } catch {
      // Ignore malformed payloads.
    }
  };

  window.addEventListener("storage", onStorage);

  try {
    channel = new BroadcastChannel(AUTH_CHANNEL_NAME);
    channel.addEventListener("message", (event) => {
      if (event?.data) handler(event.data);
    });
  } catch {
    channel = null;
  }

  return () => {
    window.removeEventListener("storage", onStorage);
    try {
      channel?.close();
    } catch {
      // Ignore close failures.
    }
  };
}
