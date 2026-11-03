import { addDoc, collection, doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "./firebase.js";
import { sanitizeUserProfile } from "./backend.js";

function cleanString(value = "", max = 160) {
  return String(value || "").trim().slice(0, max);
}

function scorePriority(userDatabase = {}) {
  let score = 20;
  if (String(userDatabase.transactionIntent || "").trim() && userDatabase.transactionIntent !== "browse") score += 20;
  if (String(userDatabase.targetMarket || "").trim()) score += 15;
  if (String(userDatabase.timelineBand || "").trim() && userDatabase.timelineBand !== "undisclosed") score += 15;
  if (String(userDatabase.budgetBand || "").trim() && userDatabase.budgetBand !== "undisclosed") score += 15;
  if (userDatabase.supportTier === "priority" || userDatabase.supportTier === "white_glove") score += 10;
  if (String(userDatabase.stageOwner || "").trim()) score += 5;
  return Math.max(0, Math.min(100, score));
}

export function scoreProfileCompleteness(profile = {}) {
  const userDatabase = profile.userDatabase || {};
  const checks = [
    cleanString(profile.name, 120).length >= 2,
    cleanString(profile.email, 160).length >= 5,
    cleanString(profile.phone, 30).replace(/\D/g, "").length >= 7,
    cleanString(userDatabase.preferredContact, 24).length > 0,
    ["customer", "contractor", "public_agency", "job_seeker", "wright_team"].includes(cleanString(userDatabase.accountPurpose, 32)),
    cleanString(userDatabase.organizationName, 100).length > 0,
    cleanString(userDatabase.preferredLanguage, 40).length > 0,
    cleanString(userDatabase.timezone, 60).length > 0,
    cleanString(userDatabase.targetMarket, 80).length > 0,
    cleanString(userDatabase.transactionIntent, 80).length > 0,
    cleanString(userDatabase.timelineBand, 40).length > 0,
    cleanString(userDatabase.budgetBand, 40).length > 0,
    Array.isArray(userDatabase.tags) && userDatabase.tags.length > 0,
    cleanString(userDatabase.notes, 400).length > 0,
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

function deriveAccountStatus(profile = {}) {
  const current = cleanString(profile?.userDatabase?.status || "", 24);
  if (current === "suspended" || current === "archived") return current;
  if (profile?.trust?.verifiedProfileActive === true) return "transacting";
  if (profile?.userDatabase?.profileDepthScore >= 75) return "active";
  return "onboarding";
}

function validateEditableProfile(profile = {}) {
  const errors = [];
  const userDatabase = profile.userDatabase || {};
  if (cleanString(profile.name, 120).length < 2) errors.push("Name must be at least 2 characters.");
  if (cleanString(userDatabase.preferredLanguage, 40).length < 2) errors.push("Preferred language is required.");
  if (cleanString(userDatabase.timezone, 60).length < 2) errors.push("Timezone is required.");
  if (cleanString(userDatabase.targetMarket, 80).length > 80) errors.push("Target market is too long.");
  if (cleanString(userDatabase.stageOwner, 60).length > 60) errors.push("Stage owner is too long.");
  if (cleanString(userDatabase.notes, 400).length > 400) errors.push("Notes are too long.");
  if (errors.length) {
    throw new Error(errors[0]);
  }
}

function diffProfile(existing = {}, next = {}) {
  const tracked = [
    "name",
    "phone",
    "accountType",
    "employeeProfile.department",
    "employeeProfile.office",
    "employeeProfile.title",
    "employeeProfile.employmentStatus",
    "employeeProfile.managerLevel",
    "userDatabase.preferredContact",
    "userDatabase.preferredLanguage",
    "userDatabase.timezone",
    "userDatabase.transactionIntent",
    "userDatabase.targetMarket",
    "userDatabase.stageOwner",
    "userDatabase.supportTier",
    "userDatabase.budgetBand",
    "userDatabase.timelineBand",
    "userDatabase.marketingOptIn",
    "userDatabase.notes",
  ];
  const changes = [];
  for (const key of tracked) {
    const before = key.split(".").reduce((acc, part) => acc?.[part], existing);
    const after = key.split(".").reduce((acc, part) => acc?.[part], next);
    if (JSON.stringify(before ?? null) !== JSON.stringify(after ?? null)) {
      changes.push({ field: key, before: before ?? null, after: after ?? null });
    }
  }
  return changes;
}

export function buildCanonicalWrightProfile(profile = {}, firebaseUser = null) {
  const sanitized = sanitizeUserProfile(profile, firebaseUser);
  const userDatabase = sanitized.userDatabase || {};
  const contactPreferences = buildContactPreferenceState(sanitized);
  const profileDepthScore = scoreProfileCompleteness({
    ...sanitized,
    userDatabase: {
      ...userDatabase,
      preferredContact: contactPreferences.preferredContact,
      preferredLanguage: contactPreferences.preferredLanguage,
      timezone: contactPreferences.timezone,
    },
  });
  return {
    ...sanitized,
    userDatabase: {
      ...userDatabase,
      preferredContact: contactPreferences.preferredContact,
      preferredLanguage: contactPreferences.preferredLanguage,
      timezone: contactPreferences.timezone,
      contactPreferences,
      profileDepthScore,
      priorityScore: scorePriority(userDatabase),
      status: deriveAccountStatus({
        ...sanitized,
        userDatabase: {
          ...userDatabase,
          profileDepthScore,
        },
      }),
    },
  };
}

export async function saveCanonicalWrightProfile(uid, profile, firebaseUser = null) {
  validateEditableProfile(profile);
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  const existing = snap.exists() ? (snap.data() || {}) : {};
  const canonical = buildCanonicalWrightProfile({ ...existing, ...profile, uid }, firebaseUser);
  const changes = diffProfile(existing, canonical);

  await setDoc(ref, {
    ...canonical,
    updatedAt: serverTimestamp(),
  }, { merge: true });

  if (changes.length) {
    try {
      await addDoc(collection(db, "profileChangeHistory"), {
        uid,
        changes,
        createdAt: serverTimestamp(),
      });
    } catch {
      // Profile persistence is primary. The audit collection is server-only
      // until a trusted backend endpoint is deployed.
    }
  }

  const beforeOptIn = existing?.userDatabase?.marketingOptIn === true;
  const afterOptIn = canonical?.userDatabase?.marketingOptIn === true;
  if (beforeOptIn !== afterOptIn) {
    try {
      await addDoc(collection(db, "consentLedger"), {
        uid,
        type: "marketing_opt_in",
        value: afterOptIn,
        version: cleanString(canonical?.userDatabase?.marketingConsentVersion || "", 40),
        method: cleanString(canonical?.userDatabase?.marketingConsentMethod || "", 40),
        createdAt: serverTimestamp(),
      });
    } catch {
      // The consent choice remains in the canonical profile. A trusted backend
      // must write the append-only ledger before treating it as an audit record.
    }
  }

  return { ...canonical, profilePersistenceStatus: "saved" };
}

export function buildLeadSla(type, priorityScore = 20) {
  const leadType = cleanString(type, 40);
  const baseHours = leadType === "quote-request" ? 4 : leadType === "contact-request" ? 8 : 24;
  const reduction = priorityScore >= 70 ? 2 : priorityScore >= 50 ? 1 : 0;
  const dueAt = new Date(Date.now() + Math.max(1, baseHours - reduction) * 60 * 60 * 1000);
  return {
    dueAt: dueAt.toISOString(),
    targetHours: Math.max(1, baseHours - reduction),
  };
}

export function transitionLeadStatus(currentStatus = "new", action = "close") {
  const current = cleanString(currentStatus, 40);
  if (action === "reopen" && ["closed", "resolved"].includes(current)) return "reopened";
  if (action === "close" && ["new", "assigned", "reopened", "in_progress"].includes(current)) return "closed";
  return current || "new";
}

export function buildAccountMergeConflictReview(primary = {}, secondary = {}) {
  const keys = ["name", "phone", "accountType", "email", "oneWrightId"];
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
