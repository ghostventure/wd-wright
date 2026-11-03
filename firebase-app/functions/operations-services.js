import admin from "firebase-admin";
import { apiError, enqueueJob } from "./backend-core.js";

function cleanString(value = "", max = 160) {
  return String(value || "").trim().slice(0, max);
}

function cleanNumber(value, fallback = 0) {
  const normalized = Number(value);
  return Number.isFinite(normalized) ? normalized : fallback;
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function resolveCoverageArea(payload = {}) {
  const location = cleanString(payload.location || payload.projectLocation || "", 160).toLowerCase();

  if (/(north carolina|raleigh|charlotte|durham|greensboro|asheville|wilmington|kannapolis)/.test(location)) {
    return { region: "north-carolina", officeCode: "nc-core", timezone: "America/New_York", market: "North Carolina" };
  }
  if (/(florida|jacksonville|orlando|ocala|sarasota|clearwater|casselberry)/.test(location)) {
    return { region: "florida", officeCode: "fl-core", timezone: "America/New_York", market: "Florida" };
  }
  if (/(pennsylvania|pittsburgh|harrisburg|york|greensburg|washington|beaver)/.test(location)) {
    return { region: "pennsylvania", officeCode: "pa-core", timezone: "America/New_York", market: "Pennsylvania" };
  }
  if (/(virginia|richmond|manassas|staunton)/.test(location)) {
    return { region: "virginia", officeCode: "va-core", timezone: "America/New_York", market: "Virginia" };
  }
  if (/(ohio|columbus|cincinnati|findlay|medina)/.test(location)) {
    return { region: "ohio", officeCode: "oh-core", timezone: "America/New_York", market: "Ohio" };
  }
  if (/(indiana|indianapolis|bloomington|jeffersonville|kokomo)/.test(location)) {
    return { region: "indiana", officeCode: "in-core", timezone: "America/Indiana/Indianapolis", market: "Indiana" };
  }

  return { region: "general", officeCode: "national-desk", timezone: "America/New_York", market: "General Coverage" };
}

export function routeOffice(coverage = {}, payload = {}) {
  const service = cleanString(payload.service || payload.serviceType || "", 120).toLowerCase();
  let queue = "general-intake";
  if (service.includes("flag")) queue = "flagging";
  else if (service.includes("plan") || service.includes("mot") || service.includes("tcp")) queue = "planning";
  else if (service.includes("tma")) queue = "tma";
  else if (service.includes("event")) queue = "event-closures";
  else if (service.includes("smart") || service.includes("afad")) queue = "smart-work-zone";

  const priorityScore = queue === "planning" || queue === "tma" ? 78 : queue === "flagging" ? 64 : 42;
  return {
    region: coverage.region || "general",
    queue,
    officeHint: coverage.officeCode || coverage.region || "general",
    market: coverage.market || "General Coverage",
    priority: priorityScore >= 70 ? "priority" : "standard",
    priorityScore,
  };
}

export function isAfterHours(coverage = {}, now = new Date()) {
  const hour = new Date(now).getHours();
  return hour < 6 || hour >= 18;
}

export function createDispatchRequest(type, payload = {}) {
  const coverage = resolveCoverageArea(payload);
  const route = routeOffice(coverage, payload);
  const afterHours = isAfterHours(coverage);
  return {
    requestId: `wdw-dispatch-${Date.now().toString(36)}`,
    type: cleanString(type, 40),
    coverage,
    route,
    afterHours,
    escalationLevel: afterHours || route.priority === "priority" ? "dispatch-supervisor" : "office-coordinator",
    dispatchWindow: afterHours ? "after-hours" : "standard-hours",
  };
}

export function buildTimelineState(type, dispatchRequest = {}) {
  const milestones = [
    { key: "intake_received", label: "Intake Received", status: "complete" },
    { key: "dispatch_review", label: "Dispatch Review", status: "active" },
    { key: "crew_assignment", label: "Crew Assignment", status: "pending" },
    { key: "schedule_confirmation", label: "Schedule Confirmation", status: "pending" },
  ];
  if (String(type) === "quote-request") {
    milestones.push({ key: "quote_release", label: "Quote Release", status: "pending" });
  }
  if (dispatchRequest.afterHours) {
    milestones.splice(2, 0, { key: "after_hours_escalation", label: "After-Hours Escalation", status: "active" });
  }
  return milestones;
}

export function transitionTimelineMilestone(timeline = [], targetKey = "", nextStatus = "complete") {
  return timeline.map((item) => {
    if (item.key !== targetKey) return item;
    return { ...item, status: cleanString(nextStatus, 24) || "complete" };
  });
}

export function buildCrewAvailability(dispatchRequest = {}) {
  const queue = dispatchRequest?.route?.queue || "general-intake";
  return {
    region: dispatchRequest?.coverage?.region || "general",
    queue,
    availableNow: !dispatchRequest.afterHours || queue === "flagging" || queue === "tma",
    crewBand: queue === "planning" ? "planner-led" : queue === "tma" ? "specialized" : "field-standard",
  };
}

export function buildJobSchedule(type, dispatchRequest = {}) {
  const targetHours = dispatchRequest?.route?.priorityScore >= 70 ? 2 : 6;
  return {
    type: cleanString(type, 40),
    targetWindowHours: targetHours,
    schedulingMode: dispatchRequest.afterHours ? "escalated" : "standard",
    firstTouchEta: `${targetHours}h`,
  };
}

export function forecastCapacity(dispatchRequest = {}) {
  const queue = dispatchRequest?.route?.queue || "general-intake";
  const utilization = queue === "planning" ? 0.72 : queue === "tma" ? 0.81 : queue === "flagging" ? 0.64 : 0.51;
  return {
    region: dispatchRequest?.coverage?.region || "general",
    queue,
    utilization,
    forecast: dispatchRequest?.route?.priorityScore >= 70 ? "watchlist" : utilization >= 0.8 ? "tight" : "available",
  };
}

export async function publishShiftStatusEvent(db, payload = {}) {
  const event = {
    region: cleanString(payload.region, 40),
    officeHint: cleanString(payload.officeHint, 40),
    queue: cleanString(payload.queue, 40),
    status: cleanString(payload.status, 40) || "active",
    note: cleanString(payload.note, 240),
    dispatchRequestId: cleanString(payload.dispatchRequestId, 80),
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };
  await db.collection("shiftStatusEvents").add(event);
  return event;
}

export async function upsertCustomerBillingProfile(db, uid, profile = {}) {
  if (!uid) throw apiError("validation_error", "uid is required for billing profile.", 400);
  const payload = {
    uid: cleanString(uid, 120),
    provider: cleanString(profile.provider, 40) || "stripe_connect",
    customerId: cleanString(profile.customerId, 120),
    email: cleanString(profile.email, 160).toLowerCase(),
    status: cleanString(profile.status, 40) || "active",
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    lastReference: cleanString(profile.lastReference, 120),
  };
  await db.collection("customerBillingProfiles").doc(payload.uid).set(payload, { merge: true });
  return payload;
}

export async function createInvoiceRecord(db, invoice = {}) {
  const payload = {
    uid: cleanString(invoice.uid, 120),
    provider: cleanString(invoice.provider, 40) || "stripe",
    invoiceId: cleanString(invoice.invoiceId, 120) || `wdw-invoice-${Date.now().toString(36)}`,
    customerId: cleanString(invoice.customerId, 120),
    amountCents: cleanNumber(invoice.amountCents),
    currency: cleanString(invoice.currency, 16) || "usd",
    status: cleanString(invoice.status, 40) || "paid",
    category: cleanString(invoice.category, 40) || "general",
    reference: cleanString(invoice.reference, 120),
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    dueAt: invoice.dueAt || null,
  };
  await db.collection("invoiceRecords").doc(payload.invoiceId).set(payload, { merge: true });
  return payload;
}

export function buildPricingQuote(input = {}) {
  const amountCents = cleanNumber(input.amountCents);
  const kind = cleanString(input.kind, 40) || "general";
  const priority = cleanString(input.priority, 24);
  const surchargeCents = priority === "priority" ? Math.round(amountCents * 0.05) : 0;
  return {
    kind,
    amountCents,
    surchargeCents,
    totalCents: amountCents + surchargeCents,
    currency: cleanString(input.currency, 16) || "usd",
    pricingRule: priority === "priority" ? "priority-response" : "standard-response",
  };
}

export async function createBillingNotification(db, uid, type, message, details = {}) {
  const payload = {
    uid: cleanString(uid, 120),
    type: cleanString(type, 60),
    message: cleanString(message, 240),
    details,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    status: "queued",
  };
  await db.collection("billingNotifications").add(payload);
  return payload;
}

export async function handleFailedPaymentRecovery(db, payment = {}) {
  const payload = {
    uid: cleanString(payment.uid, 120),
    provider: cleanString(payment.provider, 40),
    customerId: cleanString(payment.customerId, 120),
    invoiceId: cleanString(payment.invoiceId, 120),
    amountCents: cleanNumber(payment.amountCents),
    reason: cleanString(payment.reason, 240) || "payment_failed",
    status: "queued_recovery",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };
  await db.collection("failedPaymentRecoveries").add(payload);
  await enqueueJob(db, "failed_payment_recovery", payload, { maxAttempts: 8 });
  return payload;
}

export async function createRefundRecord(db, refund = {}) {
  const payload = {
    provider: cleanString(refund.provider, 40) || "stripe",
    refundId: cleanString(refund.refundId, 120) || `wdw-refund-${Date.now().toString(36)}`,
    paymentId: cleanString(refund.paymentId, 120),
    invoiceId: cleanString(refund.invoiceId, 120),
    uid: cleanString(refund.uid, 120),
    amountCents: cleanNumber(refund.amountCents),
    currency: cleanString(refund.currency, 16) || "usd",
    reason: cleanString(refund.reason, 240),
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };
  await db.collection("refundRecords").doc(payload.refundId).set(payload, { merge: true });
  return payload;
}

export async function recordRevenueEvent(db, event = {}) {
  const payload = {
    provider: cleanString(event.provider, 40) || "stripe",
    uid: cleanString(event.uid, 120),
    customerId: cleanString(event.customerId, 120),
    referenceId: cleanString(event.referenceId, 120),
    category: cleanString(event.category, 40) || "general",
    direction: cleanString(event.direction, 24) || "credit",
    amountCents: cleanNumber(event.amountCents),
    currency: cleanString(event.currency, 16) || "usd",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    status: cleanString(event.status, 40) || "posted",
  };
  await db.collection("revenueEvents").add(payload);
  return payload;
}

export async function withThirdPartyCircuitBreaker(db, provider, actionName, runner) {
  const providerKey = cleanString(provider, 40);
  const actionKey = cleanString(actionName, 80);
  const ref = db.collection("systemCircuitBreakers").doc(`${providerKey}:${actionKey}`);
  const snap = await ref.get();
  const state = snap.exists ? (snap.data() || {}) : {};
  const openUntilMs = state.openUntil?.toMillis?.() || 0;
  if (openUntilMs > Date.now()) {
    throw apiError("service_temporarily_unavailable", `${providerKey} ${actionKey} is temporarily paused.`, 503, {
      provider: providerKey,
      action: actionKey,
    });
  }

  try {
    const result = await runner();
    await ref.set({
      provider: providerKey,
      action: actionKey,
      failureCount: 0,
      lastSuccessAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      openUntil: null,
    }, { merge: true });
    return result;
  } catch (error) {
    const failureCount = cleanNumber(state.failureCount, 0) + 1;
    const openUntil = failureCount >= 3
      ? admin.firestore.Timestamp.fromDate(new Date(Date.now() + 5 * 60 * 1000))
      : null;
    await ref.set({
      provider: providerKey,
      action: actionKey,
      failureCount,
      lastFailureAt: admin.firestore.FieldValue.serverTimestamp(),
      lastError: cleanString(error?.message || "Third-party request failed.", 240),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      openUntil,
    }, { merge: true });
    throw error;
  }
}

async function ensureScheduledJob(db, docId, type, payload = {}) {
  const ref = db.collection("systemJobSchedules").doc(docId);
  const snap = await ref.get();
  const currentDay = todayKey();
  if (snap.exists && snap.data()?.lastScheduledDay === currentDay) {
    return false;
  }
  await enqueueJob(db, type, payload, { maxAttempts: 6 });
  await ref.set({
    type,
    payload,
    lastScheduledDay: currentDay,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });
  return true;
}

export async function ensureScheduledReconciliationJobs(db) {
  const queued = await Promise.all([
    ensureScheduledJob(db, "billing-reconciliation", "billing_reconciliation", { scope: "verified_billing" }),
    ensureScheduledJob(db, "subscription-reconciliation", "subscription_reconciliation", { scope: "subscriptions" }),
  ]);
  return { queued: queued.filter(Boolean).length };
}

export async function ensureScheduledCleanupJobs(db) {
  const queued = await Promise.all([
    ensureScheduledJob(db, "stale-session-cleanup", "stale_session_cleanup", { scope: "sessions" }),
    ensureScheduledJob(db, "webhook-cleanup", "processed_webhook_cleanup", { scope: "webhooks" }),
  ]);
  return { queued: queued.filter(Boolean).length };
}
