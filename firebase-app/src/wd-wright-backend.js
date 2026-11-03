"use client";

import {
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { db } from "./firebase.js";
import { buildContactPreferenceState, buildLeadSla, scoreProfileCompleteness, transitionLeadStatus } from "./wd-wright-account-services.js";
import {
  buildCrewAvailability,
  buildJobSchedule,
  buildShiftStatusFeed,
  createDispatchRequest,
  forecastCapacity,
  buildTimelineState,
} from "./wd-wright-operations.js";

const LOCAL_LEAD_STORAGE_KEY = "wd-wright-leads-v2";
const WRIGHT_PRIVILEGED_EMAILS = new Set([
  "administrator@estatehat.com",
  "webmaster@estatehat.com",
  "webmaster.login@estatehat.com",
  "administrator@wdwright.com",
  "admin@wdwright.com",
  "webmaster@wdwright.com",
  "dispatch@wdwright.com",
  "it@wdwright.com",
]);
const AUTH_REQUIRED_LEAD_TYPES = new Set([
  "quote-request",
  "contact-request",
]);

const ROLE_LABELS = {
  buyer: "Customer Contact",
  seller: "Crew Member / Candidate",
  corp_buyer: "Prime Contractor / Utility",
  corp_seller: "Municipal / Agency Contact",
  attorney: "Legal",
  agent: "Dispatch / Coordinator",
  inspector: "Safety / Inspection",
  lender: "Finance",
  admin: "Administrator",
  webmaster: "Webmaster",
  gov_municipality: "Municipality",
  gov_township: "Township",
  gov_county: "County",
  gov_borough: "Borough",
  gov_parish: "Parish",
  gov_state: "State",
  gov_territory: "Territory",
  gov_federal: "Federal",
};

function cleanString(value, maxLength = 160) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function sanitizeEmail(value) {
  return cleanString(value, 160).toLowerCase();
}

function sanitizePhone(value) {
  return cleanString(value, 32).replace(/[^0-9()+\-\s]/g, "");
}

function sanitizeLeadType(type) {
  const value = cleanString(type, 40);
  return [
    "quote-request",
    "contact-request",
    "career-interest",
    "resource-request",
    "general",
  ].includes(value)
    ? value
    : "general";
}

function sanitizeTagList(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => cleanString(entry, 24))
    .filter(Boolean)
    .slice(0, 10);
}

function normalizeLeadPayload(payload = {}, firebaseUser = null) {
  return {
    ...payload,
    name: cleanString(payload.name || payload.contactName || firebaseUser?.displayName || "", 80),
    company: cleanString(payload.company || "", 120),
    email: sanitizeEmail(payload.email || payload.contactEmail || firebaseUser?.email || ""),
    phone: sanitizePhone(payload.phone || payload.contactPhone || ""),
    role: cleanString(payload.role || "", 120),
    location: cleanString(payload.location || payload.projectLocation || "", 160),
    service: cleanString(payload.service || payload.serviceType || "", 120),
    timeline: cleanString(payload.timeline || "", 120),
    details: cleanString(payload.details || payload.message || payload.notes || "", 2000),
    routeContext: cleanString(payload.routeContext || "", 80),
    source: cleanString(payload.source || "wd-wright-public-site", 60) || "wd-wright-public-site",
  };
}

function attributeLeadSource(payload = {}, firebaseUser = null) {
  const routeContext = cleanString(payload.routeContext || "", 80) || "/";
  const source = cleanString(payload.source || "", 60).toLowerCase();
  let channel = "direct";
  if (routeContext.includes("quote")) channel = "quote";
  else if (routeContext.includes("contact")) channel = "contact";
  else if (source.includes("career")) channel = "recruiting";
  if (firebaseUser?.uid) channel = `${channel}-authenticated`;
  return {
    source: source || "wd-wright-public-site",
    routeContext,
    channel,
  };
}

function fingerprintLead(type, payload = {}, firebaseUser = null) {
  const basis = [
    sanitizeLeadType(type),
    sanitizeEmail(firebaseUser?.email || payload.email || payload.contactEmail || ""),
    cleanString(payload.location || payload.projectLocation || "", 120).toLowerCase(),
    cleanString(payload.service || payload.serviceType || "", 120).toLowerCase(),
    cleanString(payload.timeline || "", 80).toLowerCase(),
  ].join("|");

  let hash = 0;
  for (let i = 0; i < basis.length; i += 1) {
    hash = (hash * 31 + basis.charCodeAt(i)) >>> 0;
  }
  return `wdwl-${hash.toString(16)}`;
}

function resolveLeadAssignment(payload = {}) {
  const dispatchRequest = createDispatchRequest("lead-intake", payload);
  const region = dispatchRequest.coverage.region || "general";
  const queue = dispatchRequest.route.queue || "general-intake";
  const priorityScore = Number(dispatchRequest.route.priorityScore || 42);
  return {
    region,
    queue,
    officeHint: dispatchRequest.route.officeHint || region,
    market: dispatchRequest.route.market || "General Coverage",
    priority: dispatchRequest.route.priority || "standard",
    priorityScore,
  };
}

function timestampToIso(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value?.toDate === "function") {
    return value.toDate().toISOString();
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  return "";
}

function readStoredLeads() {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(LOCAL_LEAD_STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStoredLeads(leads) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOCAL_LEAD_STORAGE_KEY, JSON.stringify(leads.slice(0, 120)));
}

export function isPrivilegedWrightUser(user = {}) {
  const email = sanitizeEmail(user?.email);
  return user?.accountType === "admin" || user?.accountType === "webmaster" || WRIGHT_PRIVILEGED_EMAILS.has(email);
}

export function formatWrightAccountType(accountType) {
  const normalized = cleanString(accountType, 40);
  return ROLE_LABELS[normalized] || "Platform User";
}

export function formatWrightPlatformId(profile = {}) {
  const raw = cleanString(profile.oneWrightId || profile.oneEstateHatId, 32);
  if (!raw) return "";
  return raw.startsWith("EH-") ? `WR-${raw.slice(3)}` : raw;
}

export function getOneWrightId(profile = {}) {
  return formatWrightPlatformId(profile);
}

function markLeadSyncAttempt(entry = {}, error = "") {
  return {
    ...entry,
    lastSyncAttemptAt: new Date().toISOString(),
    retryCount: Number(entry.retryCount || 0) + 1,
    syncError: cleanString(error, 220),
  };
}

function buildLeadEntry(type, payload = {}, firebaseUser = null) {
  const normalizedType = sanitizeLeadType(type);
  const normalizedPayload = normalizeLeadPayload(payload, firebaseUser);
  const attribution = attributeLeadSource(normalizedPayload, firebaseUser);
  const assignment = resolveLeadAssignment(normalizedPayload);
  const dispatchRequest = createDispatchRequest(normalizedType, normalizedPayload);
  const dedupeKey = fingerprintLead(normalizedType, normalizedPayload, firebaseUser);
  const sla = buildLeadSla(normalizedType, assignment.priorityScore);
  const lifecycleTimeline = buildTimelineState(normalizedType, dispatchRequest);
  const crewAvailability = buildCrewAvailability(dispatchRequest);
  const scheduling = buildJobSchedule(normalizedType, dispatchRequest);
  const capacityForecast = forecastCapacity(dispatchRequest);
  const shiftFeed = buildShiftStatusFeed(dispatchRequest);
  const requesterUid = cleanString(firebaseUser?.uid, 128);
  const requesterEmail = sanitizeEmail(firebaseUser?.email || normalizedPayload.email || "");
  const requesterName = cleanString(firebaseUser?.displayName || normalizedPayload.name || normalizedPayload.company || "Wright Contact", 80);
  const contactName = cleanString(normalizedPayload.name || requesterName, 80);
  const company = cleanString(normalizedPayload.company || "", 120);
  const contactEmail = sanitizeEmail(normalizedPayload.email || requesterEmail);
  const contactPhone = sanitizePhone(normalizedPayload.phone || "");
  const role = cleanString(normalizedPayload.role || "", 120);
  const location = cleanString(normalizedPayload.location || "", 160);
  const service = cleanString(normalizedPayload.service || "", 120);
  const projectTimeline = cleanString(normalizedPayload.timeline || "", 120);
  const details = cleanString(normalizedPayload.details || "", 2000);
  const tags = sanitizeTagList([
    normalizedType,
    payload.service || "",
    payload.location || "",
    payload.timeline || "",
  ]);

  return {
    schemaVersion: 1,
    type: normalizedType,
    source: attribution.source,
    status: "new",
    dedupeKey,
    routeContext: attribution.routeContext,
    attribution,
    assignment,
    dispatch: dispatchRequest,
    sla,
    timeline: lifecycleTimeline,
    scheduling,
    crewAvailability,
    capacityForecast,
    shiftFeed,
    requester: {
      uid: requesterUid,
      email: requesterEmail,
      name: requesterName,
    },
    contact: {
      name: contactName,
      email: contactEmail,
      phone: contactPhone,
      company,
    },
    project: {
      role,
      location,
      service,
      timeline: projectTimeline,
      details,
    },
    tags,
    comments: [
      {
        type: "system",
        body: `Lead created from ${attribution.channel}.`,
        createdAt: new Date().toISOString(),
      },
    ],
    notes: cleanString(payload.internalNotes || "", 400),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

function buildLocalLeadRecord(documentId, type, payload = {}, firebaseUser = null) {
  const now = new Date().toISOString();
  const normalizedPayload = normalizeLeadPayload(payload, firebaseUser);
  const attribution = attributeLeadSource(normalizedPayload, firebaseUser);
  const assignment = resolveLeadAssignment(normalizedPayload);
  const dispatchRequest = createDispatchRequest(type, normalizedPayload);
  const dedupeKey = fingerprintLead(type, normalizedPayload, firebaseUser);
  const sla = buildLeadSla(type, assignment.priorityScore);
  const lifecycleTimeline = buildTimelineState(type, dispatchRequest);
  const crewAvailability = buildCrewAvailability(dispatchRequest);
  const scheduling = buildJobSchedule(type, dispatchRequest);
  const capacityForecast = forecastCapacity(dispatchRequest);
  const shiftFeed = buildShiftStatusFeed(dispatchRequest);
  return {
    id: documentId,
    schemaVersion: 1,
    type: sanitizeLeadType(type),
    source: attribution.source,
    status: "queued_local",
    dedupeKey,
    routeContext: attribution.routeContext,
    attribution,
    assignment,
    dispatch: dispatchRequest,
    sla,
    timeline: lifecycleTimeline,
    scheduling,
    crewAvailability,
    capacityForecast,
    shiftFeed,
    requester: {
      uid: cleanString(firebaseUser?.uid, 128),
      email: sanitizeEmail(firebaseUser?.email || normalizedPayload.email || ""),
      name: cleanString(firebaseUser?.displayName || normalizedPayload.name || normalizedPayload.company || "Wright Contact", 80),
    },
    contact: {
      name: cleanString(normalizedPayload.name || "", 80),
      email: sanitizeEmail(normalizedPayload.email || ""),
      phone: sanitizePhone(normalizedPayload.phone || ""),
      company: cleanString(normalizedPayload.company || "", 120),
    },
    project: {
      role: cleanString(normalizedPayload.role || "", 120),
      location: cleanString(normalizedPayload.location || "", 160),
      service: cleanString(normalizedPayload.service || "", 120),
      timeline: cleanString(normalizedPayload.timeline || "", 120),
      details: cleanString(normalizedPayload.details || "", 2000),
    },
    tags: sanitizeTagList([type, payload.service || "", payload.location || ""]),
    notes: "",
    comments: [
      {
        type: "system",
        body: `Lead created from ${attribution.channel}.`,
        createdAt: now,
      },
    ],
    syncState: "queued_retry",
    retryCount: 0,
    lastSyncAttemptAt: null,
    syncError: "",
    createdAt: now,
    updatedAt: now,
  };
}

async function persistLeadToFirestore(type, payload = {}, firebaseUser = null, leadId = "") {
  const leadRef = leadId ? doc(db, "jdwrightLeads", leadId) : doc(collection(db, "jdwrightLeads"));
  const writePayload = buildLeadEntry(type, payload, firebaseUser);
  await setDoc(leadRef, writePayload, { merge: true });
  return {
    id: leadRef.id,
    ...buildLocalLeadRecord(leadRef.id, type, payload, firebaseUser),
    status: "new",
    syncState: "synced",
    retryCount: 0,
    lastSyncAttemptAt: new Date().toISOString(),
    syncError: "",
  };
}

export async function flushLocalWrightLeadsToFirestore(firebaseUser = null) {
  if (!firebaseUser?.uid) return { flushed: 0, remaining: readStoredLeads().length };
  const leads = readStoredLeads();
  if (!leads.length) return { flushed: 0, remaining: 0 };

  const syncedIds = new Set();
  const nextLeads = [];

  for (const entry of leads) {
    try {
      await persistLeadToFirestore(entry.type || "general", {
        name: entry.contact?.name || entry.requester?.name || "",
        company: entry.contact?.company || "",
        email: entry.contact?.email || entry.requester?.email || "",
        phone: entry.contact?.phone || "",
        role: entry.project?.role || "",
        location: entry.project?.location || "",
        service: entry.project?.service || "",
        timeline: entry.project?.timeline || "",
        details: entry.project?.details || "",
        routeContext: entry.routeContext || "",
        source: entry.source || "wd-wright-public-site",
        internalNotes: entry.notes || "",
      }, firebaseUser, entry.id || "");
      syncedIds.add(entry.id);
    } catch (error) {
      nextLeads.push(markLeadSyncAttempt(entry, error instanceof Error ? error.message : "sync_failed"));
    }
  }

  writeStoredLeads(nextLeads);
  return {
    flushed: syncedIds.size,
    remaining: nextLeads.length,
  };
}

export async function submitWrightLead(type, payload = {}, { firebaseUser = null } = {}) {
  const normalizedType = sanitizeLeadType(type);
  if (AUTH_REQUIRED_LEAD_TYPES.has(normalizedType) && !firebaseUser?.uid) {
    throw new Error("You must be signed in to request Wright services or submit related intake.");
  }

  if (firebaseUser?.uid) {
    try {
      await flushLocalWrightLeadsToFirestore(firebaseUser);
    } catch {
      // Best-effort flush only.
    }
  }

  const dedupeKey = fingerprintLead(normalizedType, payload, firebaseUser);
  try {
    const duplicateQuery = query(collection(db, "jdwrightLeads"), where("dedupeKey", "==", dedupeKey), limit(1));
    const duplicateSnap = await getDocs(duplicateQuery);
    if (!duplicateSnap.empty) {
      const existing = duplicateSnap.docs[0];
      return {
        ok: true,
        persisted: "firestore",
        duplicate: true,
        entry: {
          id: existing.id,
          ...existing.data(),
        },
        message: "A matching Wright request is already on file. Existing intake was reused instead of creating a duplicate.",
      };
    }
  } catch {
    // Best-effort dedupe only. Continue to primary write path.
  }

  try {
    const persistedEntry = await persistLeadToFirestore(normalizedType, payload, firebaseUser);
    return {
      ok: true,
      persisted: "firestore",
      entry: persistedEntry,
      message: "Your request was captured in Wright's intake database.",
    };
  } catch {
    const leadRef = doc(collection(db, "jdwrightLeads"));
    const localEntry = buildLocalLeadRecord(leadRef.id, normalizedType, payload, firebaseUser);
    const leads = readStoredLeads();
    leads.unshift(localEntry);
    writeStoredLeads(leads);
    return {
      ok: true,
      persisted: "local",
      entry: localEntry,
      message: "Your request was captured in Wright's local intake queue while the live database path is unavailable.",
    };
  }
}

export function readLocalWrightLeads() {
  return readStoredLeads();
}

export function reopenLocalWrightLead(leadId) {
  const leads = readStoredLeads();
  const next = leads.map((entry) => (
    entry.id === leadId
      ? { ...entry, status: transitionLeadStatus(entry.status, "reopen"), updatedAt: new Date().toISOString() }
      : entry
  ));
  writeStoredLeads(next);
  return next.find((entry) => entry.id === leadId) || null;
}

export function closeLocalWrightLead(leadId) {
  const leads = readStoredLeads();
  const next = leads.map((entry) => (
    entry.id === leadId
      ? { ...entry, status: transitionLeadStatus(entry.status, "close"), updatedAt: new Date().toISOString() }
      : entry
  ));
  writeStoredLeads(next);
  return next.find((entry) => entry.id === leadId) || null;
}

export function subscribeToWrightLeads(onData, onError) {
  const leadsQuery = query(collection(db, "jdwrightLeads"), orderBy("createdAt", "desc"));
  return onSnapshot(
    leadsQuery,
    (snapshot) => {
      onData(
        snapshot.docs.map((entry) => {
          const data = entry.data() || {};
          return {
            id: entry.id,
            ...data,
            createdAtLabel: timestampToIso(data.createdAt),
            updatedAtLabel: timestampToIso(data.updatedAt),
          };
        })
      );
    },
    (error) => {
      onError?.(error);
    }
  );
}

export function subscribeToWrightUsers(onData, onError) {
  const usersQuery = query(collection(db, "users"), orderBy("updatedAt", "desc"));
  return onSnapshot(
    usersQuery,
    (snapshot) => {
      onData(
        snapshot.docs.map((entry) => {
          const data = entry.data() || {};
          return {
            id: entry.id,
            ...data,
            derivedProfileDepthScore: scoreProfileCompleteness(data),
            derivedContactPreferences: buildContactPreferenceState(data),
            createdAtLabel: timestampToIso(data.createdAt),
            updatedAtLabel: timestampToIso(data.updatedAt),
          };
        })
      );
    },
    (error) => {
      onError?.(error);
    }
  );
}
