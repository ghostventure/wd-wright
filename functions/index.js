import admin from "firebase-admin";
import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import crypto from "node:crypto";
import {
  apiError,
  assertMethod,
  createRequestContext,
  completeWebhookReplayGuard,
  ensureWebhookReplayGuard,
  logEvent,
  requireRole,
  releaseWebhookReplayGuard,
  scheduleRetry,
  sendError,
  validateBody,
} from "./backend-core.js";
import { API_VERSION, createApiRouter } from "./api-router.js";
import {
  assertFreshAuth,
  createPrivilegedAccessRequest,
  detectLoginAnomaly,
  getMfaState,
  publishSessionEvent,
  recordTrustedDevice,
  reviewPrivilegedAccessRequest,
  revokeOwnSessions,
  setMfaState,
  syncCustomClaims,
} from "./auth-services.js";
import {
  buildCrewAvailability,
  buildJobSchedule,
  buildPricingQuote,
  buildTimelineState,
  createBillingNotification,
  createDispatchRequest,
  createInvoiceRecord,
  createRefundRecord,
  ensureScheduledCleanupJobs,
  ensureScheduledReconciliationJobs,
  forecastCapacity,
  handleFailedPaymentRecovery,
  recordRevenueEvent,
  upsertCustomerBillingProfile,
  withThirdPartyCircuitBreaker,
} from "./operations-services.js";
import {
  appendLeadComment,
  archiveAccountRecord,
  buildAccountMergeConflictReview,
  buildAccountMergePreview,
  buildContactPreferenceState,
  createExpiringShareLink,
  createSecurityIncidentHook,
  exportLeadIntake,
  queueOcrExtraction,
  queueVirusScan,
  recordFirestoreMetric,
  registerDocumentVersion,
  restoreArchivedAccount,
  scoreProfileCompleteness,
} from "./data-document-services.js";

const stripeSecretKey = defineSecret("STRIPE_SECRET_KEY");
const stripeWebhookSecret = defineSecret("STRIPE_WEBHOOK_SECRET");
const stripeVerifiedProfilePriceId = defineSecret("STRIPE_VERIFIED_PROFILE_PRICE_ID");
const squareAccessToken = defineSecret("SQUARE_ACCESS_TOKEN");
const squareLocationId = defineSecret("SQUARE_LOCATION_ID");
const squareVerifiedProfilePlanVariationId = defineSecret("SQUARE_VERIFIED_PROFILE_PLAN_VARIATION_ID");
const squareWebhookSignatureKey = defineSecret("SQUARE_WEBHOOK_SIGNATURE_KEY");
const squareWebhookNotificationUrl = defineSecret("SQUARE_WEBHOOK_NOTIFICATION_URL");

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const DEFAULT_APP_URL = "https://wd-wright-traffic.web.app";
function normalizeWebOrigin(value) {
  try {
    const parsed = new URL(String(value || "").trim());
    if (!["http:", "https:"].includes(parsed.protocol) || parsed.username || parsed.password) return "";
    return parsed.origin;
  } catch {
    return "";
  }
}

const APP_URL = normalizeWebOrigin(process.env.APP_URL) || DEFAULT_APP_URL;
const CORS_ALLOWED_ORIGINS = new Set([
  APP_URL,
  "https://wd-wright-traffic.web.app",
  "https://wd-wright-traffic.firebaseapp.com",
  "https://localhost",
  "capacitor://localhost",
  ...(process.env.CORS_ALLOWED_ORIGINS || "").split(",").map(normalizeWebOrigin),
]);
if (process.env.FUNCTIONS_EMULATOR === "true") {
  CORS_ALLOWED_ORIGINS.add("http://localhost:3000");
  CORS_ALLOWED_ORIGINS.add("http://127.0.0.1:3000");
}
const STRIPE_API_PREFIX = "/api/stripe";
const SQUARE_API_PREFIX = "/api/square";
const LISTING_API_PREFIX = "/api/listings";
const SQUARE_BASE_URL = "https://connect.squareup.com/v2";
const FEATURED_PLACEMENT_DAYS = 30;
const FEATURED_PLACEMENT_PRICES = {
  listing: {
    amountCents: 9900,
    name: "EstateHat Featured Listing",
    description: "30-day featured placement for a seller's listing submission.",
  },
  service: {
    amountCents: 5900,
    name: "EstateHat Featured Service Spotlight",
    description: "30-day featured placement for an EstateHat service provider.",
  },
};
const FEATURED_SERVICE_ACCOUNT_TYPES = new Set(["agent", "inspector", "lender"]);
const PRIVILEGED_EMAILS = new Set([
  "administrator@wdwright.com",
  "admin@wdwright.com",
  "webmaster@wdwright.com",
  "dispatch@wdwright.com",
  "it@wdwright.com",
]);

function json(res, status, body) {
  res.status(status).set("Content-Type", "application/json").send(JSON.stringify(body));
}

async function runEndpoint(req, res, scope, handler) {
  const context = createRequestContext(req, scope);
  logEvent("info", "request_started", context);
  try {
    await handler(context);
    logEvent("info", "request_completed", context);
  } catch (error) {
    logEvent("error", "request_failed", context, {
      code: error?.code || "internal_error",
      message: error?.message || "Request failed.",
      statusCode: error?.statusCode || 500,
    });
    sendError(res, error, context);
  }
}

function setCors(req, res) {
  res.set("Vary", "Origin");
  const origin = String(req.headers.origin || "");
  if (origin && CORS_ALLOWED_ORIGINS.has(origin)) {
    res.set("Access-Control-Allow-Origin", origin);
    res.set("Access-Control-Expose-Headers", "X-WD-Wright-API-Version, X-Request-Id");
  }
  res.set("Access-Control-Allow-Headers", "Authorization, Content-Type, X-Idempotency-Key, X-Request-Id");
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.set("Access-Control-Max-Age", "600");
}

function getAppUrl(req) {
  const origin = normalizeWebOrigin(req.headers.origin);
  return origin && CORS_ALLOWED_ORIGINS.has(origin) ? origin : APP_URL;
}

let stripeConstructorPromise;
async function getStripe() {
  stripeConstructorPromise ||= import("stripe").then((stripeModule) => stripeModule.default);
  const Stripe = await stripeConstructorPromise;
  return new Stripe(stripeSecretKey.value());
}

function buildIdempotencyKey(prefix = "jdwright") {
  return `${prefix}-${crypto.randomUUID()}`.slice(0, 44);
}

function cleanMetaString(value = "", max = 120) {
  return String(value || "").trim().replace(/\s+/g, " ").slice(0, max);
}

async function squareRequest(pathname, { method = "POST", body } = {}) {
  return withThirdPartyCircuitBreaker(db, "square", pathname || "request", async () => {
    const response = await fetch(`${SQUARE_BASE_URL}${pathname}`, {
      method,
      headers: {
        Authorization: `Bearer ${squareAccessToken.value()}`,
        "Square-Version": "2026-01-22",
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload?.errors?.length) {
      const message = payload?.errors?.map((item) => item.detail || item.code).filter(Boolean).join("; ")
        || payload?.error
        || `Square request failed (${response.status}).`;
      throw new Error(message);
    }

    return payload;
  });
}

function getRequestPath(req) {
  const pathname = new URL(req.originalUrl, `${req.protocol}://${req.headers.host}`).pathname;
  return pathname
    .replace(/^\/stripeApi(?=\/|$)/, "")
    .replace(/^\/squareApi(?=\/|$)/, "")
    .replace(/^\/apiListingOps(?=\/|$)/, "")
    .replace(/^\/apiHealth(?=\/|$)/, "")
    .replace(/^\/apiSessionBootstrap(?=\/|$)/, "") || "/";
}

function timestampToIso(value) {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (typeof value?.toDate === "function") return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  return null;
}

function timestampToMillis(value) {
  if (!value) return 0;
  if (typeof value?.toMillis === "function") return value.toMillis();
  if (typeof value === "string" || value instanceof Date) {
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function isPrivilegedEmailValue(email = "") {
  return PRIVILEGED_EMAILS.has(String(email || "").toLowerCase());
}

function buildBootstrapSummary(profile = {}, operations = {}) {
  const trust = profile?.trust || {};
  const verification = profile?.verification || {};
  const payoutFramework = profile?.payoutFramework || {};
  const verifiedBilling = profile?.verifiedBilling || {};
  const userDatabase = profile?.userDatabase || {};
  const payoutAccounts = payoutFramework.accounts || {};
  const payoutCompliance = payoutFramework.compliance || {};
  const billingCompliance = verifiedBilling.compliance || {};

  return {
    schemaVersion: Number(profile?.schemaVersion || 0),
    verifiedProfileActive: trust.verifiedProfileActive === true,
    verifiedProfileEligible: billingCompliance.profileEligible !== false,
    verifiedBillingReady: billingCompliance.legalReady === true && billingCompliance.paymentMethodSaved === true,
    homeownerVerified: verification.homeownerVerified === true,
    connectAccountAttached: !!payoutAccounts.stripeConnectAccountId,
    connectOnboardingComplete: payoutAccounts.stripeOnboardingComplete === true,
    stripeCustomerAttached: !!verifiedBilling.customerId,
    payoutsEnabled: payoutFramework.stripeStatus?.payoutsEnabled === true,
    legalReady: profile?.legal?.identityAttestationAccepted === true,
    securityTrustedDevice: profile?.security?.trustedDevice === true,
    payoutStatus: payoutFramework.status || "setup",
    verifiedBillingStatus: verifiedBilling.status || "setup",
    userDatabaseStatus: userDatabase.status || "onboarding",
    userDatabaseIntent: userDatabase.transactionIntent || "browse",
    complianceChecks: {
      bankAccountLinked: payoutCompliance.bankAccountLinked === true,
      kycComplete: payoutCompliance.kycComplete === true,
      riskReviewComplete: payoutCompliance.riskReviewComplete === true,
      fraudReviewClear: billingCompliance.fraudReviewClear === true,
    },
    listingSubmissionCounts: operations?.listingSubmissions?.counts || {
      total: 0,
      pending_review: 0,
      approved: 0,
      rejected: 0,
      needs_info: 0,
    },
    recentPlatformFeePaymentCount: Number(operations?.platformFees?.count || 0),
  };
}

async function verifyUser(req) {
  const header = req.headers.authorization || "";
  const match = header.match(/^Bearer (.+)$/);
  if (!match) {
    throw new Error("Missing bearer token.");
  }

  const decoded = await admin.auth().verifyIdToken(match[1]);
  const snap = await db.collection("users").doc(decoded.uid).get();
  const profile = snap.exists ? snap.data() : {};
  return { uid: decoded.uid, auth: decoded, profile, ref: snap.ref };
}

function requirePrivilegedUser(userRecord) {
  const email = userRecord?.auth?.email || userRecord?.profile?.email || "";
  const privilegedByRole = (() => {
    try {
      requireRole(userRecord, ["privileged"]);
      return true;
    } catch {
      return false;
    }
  })();
  if (!isPrivilegedEmailValue(email) && !privilegedByRole) {
    const error = new Error("This action requires a privileged Wright account.");
    error.statusCode = 403;
    throw error;
  }
}

function buildSubmissionPreview(docSnap) {
  const data = docSnap.data() || {};
  return {
    id: docSnap.id,
    listingId: data.listingId || "",
    status: data.status || "pending_review",
    reviewStatus: data.reviewStatus || "queued",
    title: data.title || "",
    address: data.address || "",
    city: data.city || "",
    state: data.state || "",
    price: Number(data.price || 0),
    sellerName: data.sellerName || "",
    sellerAccountType: data.sellerAccountType || "",
    submittedAt: timestampToIso(data.submittedAt),
    reviewedAt: timestampToIso(data.reviewedAt),
    reviewNotes: data.reviewNotes || "",
    publishedListingId: data.publishedListingId || "",
    exteriorPhotoCount: Number(data.exteriorPhotoCount || 0),
    interiorPhotoCount: Number(data.interiorPhotoCount || 0),
    documentCount: Number(data.documentCount || 0),
    targetMarket: data.targetMarket || "",
  };
}

function buildListingRecordFromSubmission(submission = {}, userProfile = {}) {
  const accountType = submission.sellerAccountType || userProfile.accountType || "seller";
  const emojiByType = {
    House: "🏡",
    Condo: "🏢",
    Townhome: "🏘️",
    "Multi-Family": "🏚️",
    Land: "🌳",
  };
  const photoBadges = [];
  if (Number(submission.exteriorPhotoCount || 0) > 0) photoBadges.push("Verified exterior set");
  if (Number(submission.interiorPhotoCount || 0) > 0) photoBadges.push("Verified interior set");
  if (Number(submission.documentCount || 0) > 0) photoBadges.push("Disclosure packet");

  return {
    title: submission.title || "Untitled Property",
    address: submission.address || "",
    city: submission.city || "",
    state: submission.state || "",
    county: submission.county || "",
    municipality: submission.municipality || "",
    zip: submission.zip || "",
    price: Number(submission.price || 0),
    beds: Number(submission.beds || 0),
    baths: Number(submission.baths || 0),
    sqft: Number(submission.sqft || 0),
    type: submission.type || "House",
    description: submission.description || "",
    seller: submission.sellerName || userProfile.name || "Wright seller",
    sellerType: accountType,
    sellerDeals: Number(userProfile.reputation?.reviewCount || 0),
    sellerRating: Math.max(3.5, Math.min(5, Number(userProfile.reputation?.score || 80) / 20)),
    reputation: userProfile.reputation || {
      grade: "B",
      score: 80,
      reviewCount: 0,
      testimonialCount: 0,
      feedback: [],
    },
    verified: true,
    daysListed: 0,
    img: emojiByType[submission.type] || "🏡",
    features: [
      ...(photoBadges.length ? photoBadges : ["Reviewed submission"]),
      ...(submission.targetMarket ? [`Market: ${submission.targetMarket}`] : []),
    ].slice(0, 5),
    sellerFeeLines: Array.isArray(submission.sellerFeeLines) ? submission.sellerFeeLines : [],
    reviewSubmissionId: submission.listingId || "",
    publishedAt: admin.firestore.FieldValue.serverTimestamp(),
    status: "published",
    source: "listing_submission",
  };
}

async function buildUserOperationsSnapshot(userRecord) {
  const uid = userRecord.uid;
  const [submissionsSnap, paymentsSnap, invoiceSnap, revenueSnap, documentsSnap] = await Promise.all([
    db.collection("listingSubmissions").where("userId", "==", uid).limit(25).get(),
    db.collection("stripePlatformFeePayments").where("uid", "==", uid).limit(25).get(),
    db.collection("invoiceRecords").where("uid", "==", uid).limit(25).get().catch(() => ({ docs: [], size: 0 })),
    db.collection("revenueEvents").where("uid", "==", uid).limit(25).get().catch(() => ({ docs: [], size: 0 })),
    db.collection("documentRecords").where("ownerUid", "==", uid).limit(25).get().catch(() => ({ docs: [], size: 0 })),
  ]);

  const submissionCounts = {
    total: 0,
    pending_review: 0,
    approved: 0,
    rejected: 0,
    needs_info: 0,
  };

  const recentSubmissions = submissionsSnap.docs
    .map((docSnap) => {
      const preview = buildSubmissionPreview(docSnap);
      submissionCounts.total += 1;
      if (Object.prototype.hasOwnProperty.call(submissionCounts, preview.status)) {
        submissionCounts[preview.status] += 1;
      }
      return preview;
    })
    .sort((a, b) => timestampToMillis(b.submittedAt) - timestampToMillis(a.submittedAt))
    .slice(0, 5);

  const recentPayments = paymentsSnap.docs
    .map((docSnap) => {
      const data = docSnap.data() || {};
      return {
        id: docSnap.id,
        amountTotal: Number(data.amountTotal || 0),
        currency: data.currency || "usd",
        reference: data.reference || "",
        status: data.status || "paid",
        createdAt: timestampToIso(data.createdAt),
      };
    })
    .sort((a, b) => timestampToMillis(b.createdAt) - timestampToMillis(a.createdAt))
    .slice(0, 5);

  return {
    listingSubmissions: {
      counts: submissionCounts,
      recent: recentSubmissions,
    },
    platformFees: {
      count: paymentsSnap.size,
      recent: recentPayments,
    },
    invoices: {
      count: Number(invoiceSnap.size || 0),
    },
    revenue: {
      count: Number(revenueSnap.size || 0),
    },
    documents: {
      count: Number(documentsSnap.size || 0),
      recent: (documentsSnap.docs || []).slice(0, 5).map((docSnap) => {
        const data = docSnap.data() || {};
        return {
          id: docSnap.id,
          title: data.title || "WD Wright Document",
          category: data.category || "general",
          currentVersionId: data.currentVersionId || "",
        };
      }),
    },
  };
}

async function listOwnListingSubmissions(userRecord) {
  const snap = await db.collection("listingSubmissions").where("userId", "==", userRecord.uid).limit(25).get();
  return snap.docs
    .map((docSnap) => buildSubmissionPreview(docSnap))
    .sort((a, b) => timestampToMillis(b.submittedAt) - timestampToMillis(a.submittedAt));
}

async function listAdminListingQueue() {
  const snap = await db.collection("listingSubmissions").limit(50).get();
  return snap.docs
    .map((docSnap) => buildSubmissionPreview(docSnap))
    .filter((item) => ["pending_review", "needs_info"].includes(item.status) || ["queued", "needs_info"].includes(item.reviewStatus))
    .sort((a, b) => timestampToMillis(b.submittedAt) - timestampToMillis(a.submittedAt))
    .slice(0, 25);
}

async function reviewListingSubmission(req, userRecord) {
  requirePrivilegedUser(userRecord);

  const submissionId = String(req.body?.submissionId || "").trim();
  const decision = String(req.body?.decision || "").trim();
  const reviewNotes = String(req.body?.reviewNotes || "").trim().slice(0, 400);

  if (!submissionId) {
    const error = new Error("Missing submissionId.");
    error.statusCode = 400;
    throw error;
  }
  if (!["approved", "rejected", "needs_info"].includes(decision)) {
    const error = new Error("Decision must be approved, rejected, or needs_info.");
    error.statusCode = 400;
    throw error;
  }

  const submissionRef = db.collection("listingSubmissions").doc(submissionId);
  const submissionSnap = await submissionRef.get();
  if (!submissionSnap.exists) {
    const error = new Error("Listing submission not found.");
    error.statusCode = 404;
    throw error;
  }

  const submission = submissionSnap.data() || {};
  const sellerProfileSnap = submission.userId ? await db.collection("users").doc(submission.userId).get() : null;
  const sellerProfile = sellerProfileSnap?.exists ? sellerProfileSnap.data() : {};
  const reviewerEmail = userRecord.auth.email || userRecord.profile?.email || "";

  const updatePayload = {
    status: decision,
    reviewStatus: decision,
    reviewNotes,
    reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
    reviewedBy: reviewerEmail,
  };

  let publishedListingId = submission.publishedListingId || "";

  if (decision === "approved") {
    publishedListingId = submission.listingId || submissionId;
    const listingRef = db.collection("listings").doc(publishedListingId);
    await listingRef.set(buildListingRecordFromSubmission(submission, sellerProfile), { merge: true });
    updatePayload.publishedListingId = publishedListingId;
  }

  await submissionRef.set(updatePayload, { merge: true });
  const refreshed = await submissionRef.get();
  return {
    ok: true,
    submission: buildSubmissionPreview(refreshed),
    publishedListingId,
  };
}

function normalizeSubscriptionStatus(status) {
  switch (status) {
    case "active":
    case "trialing":
      return "active";
    case "past_due":
      return "past_due";
    case "unpaid":
      return "unpaid";
    case "canceled":
      return "cancelled";
    case "paused":
      return "paused";
    default:
      return "setup";
  }
}

async function ensureStripeCustomer(stripe, userRecord) {
  const existingCustomerId = userRecord.profile?.verifiedBilling?.customerId || "";
  if (existingCustomerId) {
    await upsertCustomerBillingProfile(db, userRecord.uid, {
      provider: "stripe_connect",
      customerId: existingCustomerId,
      email: userRecord.profile?.email || userRecord.auth.email || "",
      status: userRecord.profile?.verifiedBilling?.status || "active",
    }).catch(() => null);
    return existingCustomerId;
  }

  const customer = await withThirdPartyCircuitBreaker(db, "stripe", "customers.create", () => stripe.customers.create({
    email: userRecord.profile?.email || userRecord.auth.email || undefined,
    name: userRecord.profile?.name || undefined,
    metadata: {
      firebaseUid: userRecord.uid,
    },
  }));

  await userRecord.ref.set({
    verifiedBilling: {
      ...(userRecord.profile?.verifiedBilling || {}),
      customerId: customer.id,
    },
  }, { merge: true });

  await upsertCustomerBillingProfile(db, userRecord.uid, {
    provider: "stripe_connect",
    customerId: customer.id,
    email: userRecord.profile?.email || userRecord.auth.email || "",
    status: "active",
  });

  return customer.id;
}

async function findUserRefBySquareCustomerId(customerId) {
  if (!customerId) return null;
  const snap = await db.collection("users").where("verifiedBilling.customerId", "==", customerId).limit(1).get();
  if (snap.empty) return null;
  return snap.docs[0].ref;
}

async function ensureSquareCustomer(userRecord) {
  const existingCustomerId = userRecord.profile?.verifiedBilling?.customerId || "";
  if (existingCustomerId) {
    await upsertCustomerBillingProfile(db, userRecord.uid, {
      provider: "square",
      customerId: existingCustomerId,
      email: userRecord.profile?.email || userRecord.auth.email || "",
      status: userRecord.profile?.verifiedBilling?.status || "active",
    }).catch(() => null);
    return existingCustomerId;
  }

  const payload = await squareRequest("/customers", {
    body: {
      given_name: userRecord.profile?.name?.split(" ")?.[0] || undefined,
      family_name: userRecord.profile?.name?.split(" ").slice(1).join(" ") || undefined,
      email_address: userRecord.profile?.email || userRecord.auth.email || undefined,
      phone_number: userRecord.profile?.phone || undefined,
      reference_id: userRecord.uid,
      note: "Wright verified user billing customer",
      idempotency_key: buildIdempotencyKey("sqcust"),
    },
  });

  const customerId = payload?.customer?.id || "";
  if (!customerId) {
    throw new Error("Square customer creation did not return a customer ID.");
  }

  await userRecord.ref.set({
    verifiedBilling: {
      ...(userRecord.profile?.verifiedBilling || {}),
      provider: "square",
      customerId,
    },
  }, { merge: true });

  await upsertCustomerBillingProfile(db, userRecord.uid, {
    provider: "square",
    customerId,
    email: userRecord.profile?.email || userRecord.auth.email || "",
    status: "active",
  });

  return customerId;
}

function normalizeSquareSubscriptionStatus(status) {
  switch (String(status || "").toUpperCase()) {
    case "ACTIVE":
      return "active";
    case "PENDING":
      return "setup";
    case "CANCELED":
      return "cancelled";
    case "PAUSED":
      return "paused";
    case "DEACTIVATED":
      return "paused";
    default:
      return "setup";
  }
}

async function updateSquareSubscriptionState(subscription) {
  const customerId = subscription?.customer_id || "";
  const userRef = await findUserRefBySquareCustomerId(customerId);
  if (!userRef) return;
  const userSnap = await userRef.get();
  const uid = userRef.id;

  const normalizedStatus = normalizeSquareSubscriptionStatus(subscription?.status);
  const active = normalizedStatus === "active";
  const nextInvoiceAt = subscription?.charged_through_date || subscription?.start_date || null;
  const planVariationId = subscription?.plan_variation_id || squareVerifiedProfilePlanVariationId.value();

  await userRef.set({
    trust: {
      verifiedProfileActive: active,
      verifiedProfilePlan: "verified_profile_square",
      verifiedProfilePriceCents: 2000,
      verifiedProfileBadgeColor: "green",
      verifiedProfileSince: active ? new Date().toISOString() : null,
    },
    verifiedBilling: {
      provider: "square",
      interval: "monthly",
      planId: planVariationId,
      priceCents: 2000,
      status: normalizedStatus,
      autoRenew: normalizedStatus !== "cancelled",
      customerId,
      subscriptionId: subscription?.id || "",
      lastChargeAt: subscription?.created_at || null,
      nextChargeAt: nextInvoiceAt,
      compliance: {
        profileEligible: true,
        legalReady: true,
        paymentMethodSaved: false,
        fraudReviewClear: true,
        lastCheckedAt: new Date().toISOString(),
      },
    },
  }, { merge: true });

  await upsertCustomerBillingProfile(db, uid, {
    provider: "square",
    customerId,
    email: userSnap.data()?.email || "",
    status: normalizedStatus,
    lastReference: subscription?.id || "",
  }).catch(() => null);
  await createInvoiceRecord(db, {
    uid,
    provider: "square",
    invoiceId: subscription?.id || "",
    customerId,
    amountCents: 2000,
    currency: "usd",
    status: normalizedStatus,
    category: "verified_subscription",
    reference: subscription?.id || "",
    dueAt: nextInvoiceAt,
  }).catch(() => null);
  await recordRevenueEvent(db, {
    provider: "square",
    uid,
    customerId,
    referenceId: subscription?.id || "",
    category: "verified_subscription",
    direction: active ? "credit" : "hold",
    amountCents: 2000,
    currency: "usd",
    status: normalizedStatus,
  }).catch(() => null);
}

function verifySquareWebhookSignature(req) {
  const signatureHeader = req.headers["x-square-hmacsha256-signature"] || req.headers["x-square-signature"];
  if (!signatureHeader) return false;
  const rawBody = Buffer.isBuffer(req.rawBody) ? req.rawBody.toString("utf8") : JSON.stringify(req.body || {});
  const hmac = crypto.createHmac("sha256", squareWebhookSignatureKey.value());
  hmac.update(squareWebhookNotificationUrl.value());
  hmac.update(rawBody);
  const expected = hmac.digest("base64");
  const provided = String(signatureHeader);
  if (expected.length !== provided.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(provided));
}

async function ensureConnectAccount(stripe, userRecord) {
  const existingAccountId = userRecord.profile?.payoutFramework?.accounts?.stripeConnectAccountId || "";
  if (existingAccountId) {
    return existingAccountId;
  }

  const account = await stripe.accounts.create({
    type: "express",
    country: "US",
    email: userRecord.profile?.email || userRecord.auth.email || undefined,
    business_type: ["corp_buyer", "corp_seller"].includes(userRecord.profile?.accountType) ? "company" : "individual",
    capabilities: {
      transfers: { requested: true },
    },
    metadata: {
      firebaseUid: userRecord.uid,
      accountType: userRecord.profile?.accountType || "",
    },
  });

  await userRecord.ref.set({
    payoutFramework: {
      ...(userRecord.profile?.payoutFramework || {}),
      accounts: {
        ...(userRecord.profile?.payoutFramework?.accounts || {}),
        stripeConnectAccountId: account.id,
      },
    },
  }, { merge: true });

  return account.id;
}

async function updateConnectAccountState(account) {
  const uid = account.metadata?.firebaseUid;
  if (!uid) return;

  await db.collection("users").doc(uid).set({
    payoutFramework: {
      providerPrimary: "stripe_connect",
      accounts: {
        stripeConnectAccountId: account.id,
        stripeOnboardingComplete: !!account.details_submitted,
      },
      compliance: {
        bankAccountLinked: !!account.external_accounts?.data?.length,
        kycComplete: !!account.details_submitted,
        riskReviewComplete: !!account.payouts_enabled,
        lastCheckedAt: new Date().toISOString(),
      },
      status: account.payouts_enabled ? "active" : "setup",
      stripeStatus: {
        chargesEnabled: !!account.charges_enabled,
        payoutsEnabled: !!account.payouts_enabled,
        detailsSubmitted: !!account.details_submitted,
      },
    },
  }, { merge: true });
}

async function updateVerifiedSubscriptionState(stripe, subscription) {
  const uid = subscription.metadata?.uid;
  if (!uid) return;

  const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id || "";
  const priceCents = subscription.items?.data?.[0]?.price?.unit_amount || 2000;
  const currentPeriodEnd = subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : null;
  const normalizedStatus = normalizeSubscriptionStatus(subscription.status);
  const active = normalizedStatus === "active";

  await db.collection("users").doc(uid).set({
    trust: {
      verifiedProfileActive: active,
      verifiedProfilePlan: "verified_profile_stripe",
      verifiedProfilePriceCents: priceCents,
      verifiedProfileBadgeColor: "green",
      verifiedProfileSince: active ? new Date().toISOString() : null,
    },
    verifiedBilling: {
      provider: "stripe_connect",
      interval: subscription.items?.data?.[0]?.price?.recurring?.interval || "monthly",
      planId: subscription.items?.data?.[0]?.price?.id || stripeVerifiedProfilePriceId.value(),
      priceCents,
      status: normalizedStatus,
      autoRenew: !subscription.cancel_at_period_end,
      customerId,
      subscriptionId: subscription.id,
      nextChargeAt: currentPeriodEnd,
      compliance: {
        profileEligible: true,
        legalReady: true,
        paymentMethodSaved: true,
        fraudReviewClear: true,
        lastCheckedAt: new Date().toISOString(),
      },
    },
  }, { merge: true });

  await upsertCustomerBillingProfile(db, uid, {
    provider: "stripe_connect",
    customerId,
    status: normalizedStatus,
    lastReference: subscription.id,
  }).catch(() => null);
  await createInvoiceRecord(db, {
    uid,
    provider: "stripe",
    invoiceId: subscription.id,
    customerId,
    amountCents: priceCents,
    currency: "usd",
    status: normalizedStatus,
    category: "verified_subscription",
    reference: subscription.id,
    dueAt: currentPeriodEnd,
  }).catch(() => null);
  await recordRevenueEvent(db, {
    provider: "stripe",
    uid,
    customerId,
    referenceId: subscription.id,
    category: "verified_subscription",
    direction: active ? "credit" : "hold",
    amountCents: priceCents,
    currency: "usd",
    status: normalizedStatus,
  }).catch(() => null);
}

async function recordPlatformFeePayment(checkoutSession) {
  const uid = checkoutSession.metadata?.uid;
  if (!uid) return;
  const customerId = typeof checkoutSession.customer === "string" ? checkoutSession.customer : checkoutSession.customer?.id || "";
  const amountTotal = checkoutSession.amount_total || 0;
  const status = checkoutSession.payment_status || "paid";

  await db.collection("stripePlatformFeePayments").add({
    uid,
    amountTotal,
    currency: checkoutSession.currency || "usd",
    checkoutSessionId: checkoutSession.id,
    paymentIntentId: typeof checkoutSession.payment_intent === "string" ? checkoutSession.payment_intent : checkoutSession.payment_intent?.id || "",
    customerId,
    reference: checkoutSession.metadata?.reference || "",
    description: checkoutSession.metadata?.description || "",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    status,
  });

  await createInvoiceRecord(db, {
    uid,
    provider: "stripe",
    invoiceId: checkoutSession.id,
    customerId,
    amountCents: amountTotal,
    currency: checkoutSession.currency || "usd",
    status,
    category: "platform_fee",
    reference: checkoutSession.metadata?.reference || checkoutSession.id,
  }).catch(() => null);
  await recordRevenueEvent(db, {
    provider: "stripe",
    uid,
    customerId,
    referenceId: checkoutSession.id,
    category: "platform_fee",
    direction: "credit",
    amountCents: amountTotal,
    currency: checkoutSession.currency || "usd",
    status,
  }).catch(() => null);
  await createBillingNotification(db, uid, "platform_fee_paid", "WD Wright platform fee payment recorded.", {
    amountCents: amountTotal,
    reference: checkoutSession.metadata?.reference || "",
  }).catch(() => null);
}

async function recordFeaturedPlacementPayment(checkoutSession) {
  const uid = checkoutSession.metadata?.uid;
  const placementType = cleanMetaString(checkoutSession.metadata?.placementType, 24);
  if (!uid || !["listing", "service"].includes(placementType)) return;

  const userSnap = await db.collection("users").doc(uid).get();
  const userProfile = userSnap.exists ? userSnap.data() || {} : {};
  const startsAt = admin.firestore.Timestamp.now();
  const endsAt = admin.firestore.Timestamp.fromDate(new Date(Date.now() + FEATURED_PLACEMENT_DAYS * 24 * 60 * 60 * 1000));
  const basePayload = {
    uid,
    placementType,
    status: "active",
    source: "stripe_checkout",
    amountTotal: checkoutSession.amount_total || 0,
    currency: checkoutSession.currency || "usd",
    startsAt,
    endsAt,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    paidAt: admin.firestore.FieldValue.serverTimestamp(),
    ownerName: cleanMetaString(userProfile.name || "", 120),
    ownerAccountType: cleanMetaString(userProfile.accountType || "", 40),
  };
  await createInvoiceRecord(db, {
    uid,
    provider: "stripe",
    invoiceId: checkoutSession.id,
    customerId: typeof checkoutSession.customer === "string" ? checkoutSession.customer : checkoutSession.customer?.id || "",
    amountCents: checkoutSession.amount_total || 0,
    currency: checkoutSession.currency || "usd",
    status: "paid",
    category: "featured_placement",
    reference: checkoutSession.id,
  }).catch(() => null);
  await recordRevenueEvent(db, {
    provider: "stripe",
    uid,
    customerId: typeof checkoutSession.customer === "string" ? checkoutSession.customer : checkoutSession.customer?.id || "",
    referenceId: checkoutSession.id,
    category: "featured_placement",
    direction: "credit",
    amountCents: checkoutSession.amount_total || 0,
    currency: checkoutSession.currency || "usd",
    status: "paid",
  }).catch(() => null);

  if (placementType === "listing") {
    const submissionId = cleanMetaString(checkoutSession.metadata?.submissionId, 80);
    if (!submissionId) return;
    const submissionSnap = await db.collection("listingSubmissions").doc(submissionId).get();
    if (!submissionSnap.exists) {
      await db.collection("featuredPlacements").doc(checkoutSession.id).set({
        ...basePayload,
        status: "orphaned",
        targetSubmissionId: submissionId,
        title: cleanMetaString(checkoutSession.metadata?.titleSnapshot || "Featured listing", 140),
        subtitle: cleanMetaString(checkoutSession.metadata?.subtitleSnapshot || "", 180),
        market: cleanMetaString(checkoutSession.metadata?.marketSnapshot || "", 120),
      }, { merge: true });
      return;
    }
    const submission = submissionSnap.exists ? submissionSnap.data() || {} : {};
    const publishedListingId = cleanMetaString(submission.publishedListingId || "", 80);
    const listingPayload = {
      ...basePayload,
      status: submission.status === "rejected" ? "blocked" : "active",
      targetSubmissionId: submissionId,
      targetListingId: publishedListingId,
      title: cleanMetaString(submission.title || checkoutSession.metadata?.titleSnapshot || "Featured listing", 140),
      subtitle: cleanMetaString(submission.address || checkoutSession.metadata?.subtitleSnapshot || "", 180),
      description: cleanMetaString(submission.description || "", 360),
      market: cleanMetaString([submission.city, submission.state].filter(Boolean).join(", ") || checkoutSession.metadata?.marketSnapshot || "", 120),
      propertyType: cleanMetaString(submission.type || "House", 40),
      askingPrice: Number(submission.price || 0),
      exteriorPhotoCount: Number(submission.exteriorPhotoCount || 0),
      interiorPhotoCount: Number(submission.interiorPhotoCount || 0),
    };
    await db.collection("featuredPlacements").doc(checkoutSession.id).set(listingPayload, { merge: true });

    if (publishedListingId) {
      await db.collection("listings").doc(publishedListingId).set({
        featuredPlacement: {
          active: true,
          placementId: checkoutSession.id,
          startsAt,
          endsAt,
        },
      }, { merge: true });
    }
    return;
  }

  if (!FEATURED_SERVICE_ACCOUNT_TYPES.has(userProfile.accountType || "")) {
    await db.collection("featuredPlacements").doc(checkoutSession.id).set({
      ...basePayload,
      status: "blocked",
      title: cleanMetaString(checkoutSession.metadata?.serviceHeadline || `${userProfile.name || "EstateHat Pro"} Spotlight`, 140),
      market: cleanMetaString(checkoutSession.metadata?.serviceMarket || userProfile.userDatabase?.targetMarket || "", 120),
      serviceRole: cleanMetaString(userProfile.accountType || "", 40),
    }, { merge: true });
    return;
  }

  const servicePayload = {
    ...basePayload,
    title: cleanMetaString(checkoutSession.metadata?.serviceHeadline || `${userProfile.name || "EstateHat Pro"} Spotlight`, 140),
    subtitle: cleanMetaString(checkoutSession.metadata?.serviceCompany || "", 120),
    description: cleanMetaString(checkoutSession.metadata?.serviceNote || "", 360),
    market: cleanMetaString(checkoutSession.metadata?.serviceMarket || userProfile.userDatabase?.targetMarket || "", 120),
    serviceRole: cleanMetaString(userProfile.accountType || "", 40),
    company: cleanMetaString(checkoutSession.metadata?.serviceCompany || "", 120),
  };
  await db.collection("featuredPlacements").doc(checkoutSession.id).set(servicePayload, { merge: true });
}

async function handleWebhook(req, res) {
  const signature = req.headers["stripe-signature"];
  if (!signature) {
    return json(res, 400, { error: "Missing Stripe signature." });
  }

  let event;
  try {
    const stripe = await getStripe();
    event = stripe.webhooks.constructEvent(req.rawBody, signature, stripeWebhookSecret.value());
  } catch (error) {
    return json(res, 400, { error: error.message || "Invalid webhook signature." });
  }

  let replayClaim = null;
  try {
    const replay = await ensureWebhookReplayGuard(db, "stripe", event.id, {
      type: event.type || "",
    });
    if (replay.duplicate) {
      return json(res, 200, { ok: true, duplicate: true, received: true });
    }
    replayClaim = replay;

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        if (session.mode === "payment" && session.metadata?.kind === "platform_fee") {
          await recordPlatformFeePayment(session);
        }
        if (session.mode === "payment" && session.metadata?.kind === "featured_placement") {
          await recordFeaturedPlacementPayment(session);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        await updateVerifiedSubscriptionState(await getStripe(), event.data.object);
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object;
        const uid = invoice?.metadata?.uid || invoice?.lines?.data?.[0]?.metadata?.uid || "";
        await handleFailedPaymentRecovery(db, {
          uid,
          provider: "stripe",
          customerId: typeof invoice?.customer === "string" ? invoice.customer : invoice?.customer?.id || "",
          invoiceId: invoice?.id || "",
          amountCents: invoice?.amount_due || 0,
          reason: invoice?.last_finalization_error?.message || "invoice.payment_failed",
        }).catch(() => null);
        if (uid) {
          await createBillingNotification(db, uid, "payment_failed", "WD Wright billing needs attention.", {
            invoiceId: invoice?.id || "",
            amountCents: invoice?.amount_due || 0,
          }).catch(() => null);
        }
        break;
      }
      case "charge.refunded":
      case "refund.created": {
        const refund = event.data.object;
        const amountCents = refund?.amount_refunded || refund?.amount || 0;
        const paymentId = refund?.payment_intent || refund?.charge || "";
        await createRefundRecord(db, {
          provider: "stripe",
          refundId: refund?.id || event.id,
          paymentId,
          amountCents,
          currency: refund?.currency || "usd",
          reason: refund?.reason || event.type,
        }).catch(() => null);
        await recordRevenueEvent(db, {
          provider: "stripe",
          referenceId: refund?.id || event.id,
          category: "refund",
          direction: "debit",
          amountCents,
          currency: refund?.currency || "usd",
          status: "refunded",
        }).catch(() => null);
        break;
      }
      case "account.updated": {
        await updateConnectAccountState(event.data.object);
        break;
      }
      default:
        break;
    }
    await completeWebhookReplayGuard(db, replayClaim);
  } catch (error) {
    console.error("Stripe webhook processing failed", error);
    await releaseWebhookReplayGuard(db, replayClaim).catch(() => false);
    await scheduleRetry(db, "stripe_webhook_retry", {
      eventId: event?.id || "",
      eventType: event?.type || "",
    }, {
      errorMessage: error?.message || "Stripe webhook processing failed.",
    }).catch(() => {});
    return json(res, 500, { error: "Webhook processing failed." });
  }

  await ensureScheduledReconciliationJobs(db).catch(() => null);
  await ensureScheduledCleanupJobs(db).catch(() => null);

  return json(res, 200, { received: true });
}

async function handleSquareWebhook(req, res) {
  if (!verifySquareWebhookSignature(req)) {
    return json(res, 403, { error: "Invalid Square signature." });
  }

  const event = req.body || {};
  const eventType = String(event.type || "");
  const subscription = event?.data?.object?.subscription || event?.data?.object || null;

  let replayClaim = null;
  try {
    const replay = await ensureWebhookReplayGuard(db, "square", event.event_id || event.id || crypto.createHash("sha256").update(JSON.stringify(event)).digest("hex"), {
      type: eventType,
    });
    if (replay.duplicate) {
      return json(res, 200, { ok: true, duplicate: true, received: true });
    }
    replayClaim = replay;

    if (eventType.startsWith("subscription.") && subscription?.customer_id) {
      await updateSquareSubscriptionState(subscription);
    }
    await completeWebhookReplayGuard(db, replayClaim);
    await ensureScheduledReconciliationJobs(db).catch(() => null);
    await ensureScheduledCleanupJobs(db).catch(() => null);
  } catch (error) {
    console.error("Square webhook processing failed", error);
    await releaseWebhookReplayGuard(db, replayClaim).catch(() => false);
    await scheduleRetry(db, "square_webhook_retry", {
      eventId: event?.event_id || event?.id || "",
      eventType,
    }, {
      errorMessage: error?.message || "Square webhook processing failed.",
    }).catch(() => {});
    return json(res, 500, { error: "Webhook processing failed." });
  }

  return json(res, 200, { received: true });
}

async function handleHealth(req, res) {
  let firestoreReachable = false;
  let listingSubmissionReachable = false;

  try {
    await db.doc("_meta/backendHealth").get();
    firestoreReachable = true;
  } catch (error) {
    console.error("Backend health Firestore probe failed", error);
  }

  try {
    await db.collection("listingSubmissions").limit(1).get();
    listingSubmissionReachable = true;
  } catch (error) {
    console.error("Backend health listing submission probe failed", error);
  }

  return json(res, 200, {
    ok: true,
    service: "wd-wright-backend",
    timestamp: new Date().toISOString(),
    projectId: process.env.GCLOUD_PROJECT || admin.app().options.projectId || "wd-wright-traffic",
    routes: {
      health: "/api/health",
      sessionBootstrap: "/api/session/bootstrap",
      listingOps: "/api/listings/*",
      stripeApi: "/api/stripe/*",
      squareApi: "/api/square/*",
    },
    checks: {
      firestoreReachable,
      listingSubmissionReachable,
      authAdminReady: true,
    },
    notes: [
      "Listing review and publication mechanics now live in apiListingOps for authenticated submission and privileged review flows.",
      "Stripe actions still require the stripeApi function plus configured Stripe secrets.",
      "Square actions require the squareApi function plus configured Square secrets and webhook subscription.",
    ],
  });
}

async function handleSessionBootstrap(req, res) {
  const userRecord = await verifyUser(req);
  const profile = userRecord.profile || {};
  const operations = await buildUserOperationsSnapshot(userRecord);
  const profileCompleteness = scoreProfileCompleteness(profile);
  const contactPreferences = buildContactPreferenceState(profile);
  const dispatchProfile = createDispatchRequest("account-home", {
    location: profile?.userDatabase?.targetMarket || "",
    service: profile?.userDatabase?.transactionIntent || "",
  });
  const anomaly = await detectLoginAnomaly(db, userRecord.uid, req).catch(() => ({ anomalous: false, fingerprint: "", knownDeviceCount: 0 }));
  const device = await recordTrustedDevice(db, userRecord.uid, req, { trusted: profile?.security?.trustedDevice === true }).catch(() => null);
  const mfaState = await getMfaState(db, userRecord.uid).catch(() => ({ enrolled: false, methods: [] }));
  await syncCustomClaims(db, userRecord).catch(() => null);
  await recordFirestoreMetric(db, {
    scope: "session_bootstrap",
    action: "read",
    target: `users/${userRecord.uid}`,
    uid: userRecord.uid,
    requestId: req.headers["x-request-id"] || "",
  }).catch(() => null);

  return {
    timestamp: new Date().toISOString(),
    apiVersion: API_VERSION,
    uid: userRecord.uid,
    email: userRecord.auth.email || profile.email || "",
    oneEstateHatId: profile.oneEstateHatId || profile.oneWrightId || "",
    oneWrightId: String(profile.oneWrightId || profile.oneEstateHatId || "").startsWith("EH-")
      ? `WR-${String(profile.oneWrightId || profile.oneEstateHatId || "").slice(3)}`
      : (profile.oneWrightId || profile.oneEstateHatId || ""),
    profile,
    profileInsights: {
      completenessScore: profileCompleteness,
      contactPreferences,
    },
    summary: buildBootstrapSummary(profile, operations),
    operations: {
      ...operations,
      controlCenter: {
        dispatch: dispatchProfile,
        timeline: buildTimelineState("account-home", dispatchProfile),
        crewAvailability: buildCrewAvailability(dispatchProfile),
        schedule: buildJobSchedule("account-home", dispatchProfile),
        capacityForecast: forecastCapacity(dispatchProfile),
      },
    },
    session: {
      deviceFingerprint: device?.fingerprint || anomaly.fingerprint || "",
      anomaly,
      mfaState,
    },
  };
}

async function handleSessionMutation(req) {
  const pathname = getRequestPath(req).replace(/^\/api\/session/, "") || "/";
  const userRecord = await verifyUser(req);

  if (pathname === "/revoke-self") {
    assertFreshAuth(userRecord, 15);
    const revoked = await revokeOwnSessions(userRecord.uid);
    await publishSessionEvent(db, userRecord.uid, "revoke_self", revoked);
    return { message: "WD Wright sessions revoked.", ...revoked };
  }

  if (pathname === "/trusted-device") {
    const payload = validateBody({
      label: { type: "string", max: 80 },
      trusted: { type: "boolean", required: true },
    }, req.body || {});
    const device = await recordTrustedDevice(db, userRecord.uid, req, payload);
    await publishSessionEvent(db, userRecord.uid, "trusted_device_update", {
      trusted: payload.trusted === true,
      fingerprint: device.fingerprint,
    });
    return { message: "Trusted device state updated.", fingerprint: device.fingerprint, trusted: payload.trusted === true };
  }

  if (pathname === "/mfa-state") {
    const state = await setMfaState(db, userRecord.uid);
    return { message: "MFA enrollment was checked against Firebase Authentication.", state };
  }

  if (pathname === "/sync-claims") {
    const synced = await syncCustomClaims(db, userRecord);
    return { message: "Custom claims synced.", synced };
  }

  if (pathname === "/privileged-access/request") {
    const payload = validateBody({
      justification: { type: "string", required: true, min: 12, max: 500 },
    }, req.body || {});
    const requestRecord = await createPrivilegedAccessRequest(db, userRecord, payload.justification);
    return { message: "Privileged access request submitted.", request: requestRecord };
  }

  if (pathname === "/privileged-access/review") {
    requirePrivilegedUser(userRecord);
    const payload = validateBody({
      requestId: { type: "string", required: true, max: 120 },
      decision: { type: "string", required: true, enum: ["approved", "rejected"], max: 20 },
    }, req.body || {});
    const result = await reviewPrivilegedAccessRequest(db, payload.requestId, userRecord.uid, payload.decision);
    return { message: "Privileged access request reviewed.", ...result };
  }

  if (pathname === "/document/register") {
    assertFreshAuth(userRecord, 30);
    const payload = validateBody({
      documentId: { type: "string", max: 120 },
      title: { type: "string", required: true, min: 2, max: 160 },
      description: { type: "string", max: 320 },
      bucketPath: { type: "string", required: true, min: 4, max: 240 },
      mimeType: { type: "string", required: true, max: 80 },
      extension: { type: "string", max: 16 },
      category: { type: "string", max: 40 },
      sensitivity: { type: "string", max: 24 },
      byteSize: { type: "number", required: true, min: 1, max: 25000000 },
      versionNumber: { type: "number", min: 1, max: 1000 },
    }, req.body || {});
    if (payload.documentId) {
      const existingDocument = await db.collection("documentRecords").doc(payload.documentId).get();
      if (existingDocument.exists && existingDocument.data()?.ownerUid !== userRecord.uid) {
        throw apiError("forbidden", "You cannot add versions to another user's document.", 403);
      }
    }
    const documentRecord = await registerDocumentVersion(db, {
      ...payload,
      ownerUid: userRecord.uid,
      tags: Array.isArray(req.body?.tags) ? req.body.tags : [],
      sharedWith: Array.isArray(req.body?.sharedWith) ? req.body.sharedWith : [],
      roleScope: Array.isArray(req.body?.roleScope) ? req.body.roleScope : [],
      hash: String(req.body?.hash || "").trim(),
    });
    await queueVirusScan(db, documentRecord.documentId, documentRecord.versionId, documentRecord).catch(() => null);
    await queueOcrExtraction(db, documentRecord.documentId, documentRecord.versionId, documentRecord).catch(() => null);
    await recordFirestoreMetric(db, {
      scope: "document_register",
      action: "write",
      target: `documentRecords/${documentRecord.documentId}`,
      uid: userRecord.uid,
      requestId: req.headers["x-request-id"] || "",
    }).catch(() => null);
    return { message: "Protected document registered.", document: documentRecord };
  }

  if (pathname === "/document/share-link") {
    const payload = validateBody({
      documentId: { type: "string", required: true, max: 120 },
      versionId: { type: "string", required: true, max: 120 },
      purpose: { type: "string", max: 120 },
      ttlHours: { type: "number", min: 1, max: 168 },
    }, req.body || {});
    const documentRef = db.collection("documentRecords").doc(payload.documentId);
    const [documentSnap, versionSnap] = await Promise.all([
      documentRef.get(),
      documentRef.collection("versions").doc(payload.versionId).get(),
    ]);
    if (!documentSnap.exists || !versionSnap.exists) {
      throw apiError("not_found", "The requested document version was not found.", 404);
    }
    const documentRecord = documentSnap.data() || {};
    const isOwner = documentRecord.ownerUid === userRecord.uid;
    const canOverride = documentRecord.accessPolicy?.allowPrivilegedOverride === true;
    if (!isOwner && !(canOverride && isPrivilegedEmailValue(userRecord.auth.email || userRecord.profile?.email || ""))) {
      throw apiError("forbidden", "Only the document owner may create a share link.", 403);
    }
    const link = await createExpiringShareLink(db, {
      ...payload,
      ownerUid: documentRecord.ownerUid,
      createdBy: userRecord.uid,
    });
    return { message: "Expiring share link created.", shareLink: link };
  }

  if (pathname === "/lead/comment") {
    const payload = validateBody({
      leadId: { type: "string", required: true, max: 120 },
      body: { type: "string", required: true, min: 2, max: 800 },
      visibility: { type: "string", enum: ["internal", "requester"], max: 24 },
    }, req.body || {});
    const leadSnap = await db.collection("jdwrightLeads").doc(payload.leadId).get();
    if (!leadSnap.exists) throw apiError("not_found", "Lead record not found.", 404);
    const privileged = isPrivilegedEmailValue(userRecord.auth.email || userRecord.profile?.email || "");
    const visibility = payload.visibility || "internal";
    if (visibility === "internal") {
      if (!privileged) requirePrivilegedUser(userRecord);
    } else if (!privileged && leadSnap.data()?.requester?.uid !== userRecord.uid) {
      throw apiError("forbidden", "Only the lead requester may add a requester-visible comment.", 403);
    }
    const comment = await appendLeadComment(db, payload.leadId, {
      authorUid: userRecord.uid,
      authorLabel: userRecord.profile?.name || userRecord.auth.email || "WD Wright User",
      body: payload.body,
      visibility,
    });
    return { message: "Lead comment added.", comment };
  }

  if (pathname === "/intake/export") {
    const exported = await exportLeadIntake(db, {
      uid: userRecord.uid,
      privileged: isPrivilegedEmailValue(userRecord.auth.email || userRecord.profile?.email || ""),
    });
    return { message: "Lead intake export prepared.", export: exported };
  }

  if (pathname === "/account/archive") {
    assertFreshAuth(userRecord, 15);
    const archived = await archiveAccountRecord(db, userRecord.uid, userRecord.profile || {}, userRecord.uid);
    await createSecurityIncidentHook(db, {
      type: "account_archive_requested",
      severity: "watch",
      uid: userRecord.uid,
      requestId: req.headers["x-request-id"] || "",
      details: { email: userRecord.auth.email || "" },
    }).catch(() => null);
    return { message: "Account archived.", archive: archived };
  }

  if (pathname === "/account/recover") {
    requirePrivilegedUser(userRecord);
    const payload = validateBody({
      uid: { type: "string", required: true, max: 120 },
    }, req.body || {});
    const restored = await restoreArchivedAccount(db, payload.uid, userRecord.uid);
    return { message: "Archived account restored.", restore: restored };
  }

  if (pathname === "/account/merge-preview") {
    requirePrivilegedUser(userRecord);
    const payload = validateBody({
      primaryUid: { type: "string", required: true, max: 120 },
      secondaryUid: { type: "string", required: true, max: 120 },
    }, req.body || {});
    const [primarySnap, secondarySnap] = await Promise.all([
      db.collection("users").doc(payload.primaryUid).get(),
      db.collection("users").doc(payload.secondaryUid).get(),
    ]);
    if (!primarySnap.exists || !secondarySnap.exists) {
      throw apiError("not_found", "Both accounts must exist for merge preview.", 404);
    }
    const preview = buildAccountMergePreview(primarySnap.data() || {}, secondarySnap.data() || {});
    const review = buildAccountMergeConflictReview(primarySnap.data() || {}, secondarySnap.data() || {});
    await createSecurityIncidentHook(db, {
      type: "account_merge_preview",
      severity: "watch",
      uid: userRecord.uid,
      requestId: req.headers["x-request-id"] || "",
      details: {
        primaryUid: payload.primaryUid,
        secondaryUid: payload.secondaryUid,
        conflictCount: review.conflictCount,
      },
    }).catch(() => null);
    return { message: "Account merge preview prepared.", preview, review };
  }

  throw apiError("not_found", "Unknown session endpoint.", 404);
}

async function handleListingOps(req, res) {
  const pathname = getRequestPath(req).replace(/^\/api\/listings/, "") || "/";
  const userRecord = await verifyUser(req);

  if (req.method === "GET" && pathname === "/submissions") {
    const submissions = await listOwnListingSubmissions(userRecord);
    return json(res, 200, { ok: true, submissions });
  }

  if (req.method === "GET" && pathname === "/submissions/queue") {
    requirePrivilegedUser(userRecord);
    const submissions = await listAdminListingQueue();
    return json(res, 200, { ok: true, submissions });
  }

  if (req.method === "POST" && pathname === "/submissions/review") {
    const result = await reviewListingSubmission(req, userRecord);
    return json(res, 200, result);
  }

  return json(res, 404, { error: "Unknown listing operations endpoint." });
}

async function handleApi(req, res) {
  const pathname = getRequestPath(req).replace(/^\/api\/stripe/, "");
  const stripe = await getStripe();
  const userRecord = await verifyUser(req);
  const appUrl = getAppUrl(req);

  if (pathname === "/verified-checkout") {
    const customerId = await ensureStripeCustomer(stripe, userRecord);
    const session = await withThirdPartyCircuitBreaker(db, "stripe", "checkout.verified", () => stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      client_reference_id: userRecord.uid,
      line_items: [
        {
          price: stripeVerifiedProfilePriceId.value(),
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/home?stripe=verified-success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/home?stripe=verified-cancel`,
      metadata: {
        uid: userRecord.uid,
        kind: "verified_profile",
      },
      subscription_data: {
        metadata: {
          uid: userRecord.uid,
          kind: "verified_profile",
        },
      },
      allow_promotion_codes: true,
    }));
    await createBillingNotification(db, userRecord.uid, "verified_checkout_started", "Verified billing checkout started.", {
      provider: "stripe",
      customerId,
    }).catch(() => null);

    return json(res, 200, { url: session.url });
  }

  if (pathname === "/billing-portal") {
    const customerId = userRecord.profile?.verifiedBilling?.customerId;
    if (!customerId) {
      return json(res, 400, { error: "No Stripe customer is attached to this profile yet." });
    }

    const session = await withThirdPartyCircuitBreaker(db, "stripe", "billing.portal", () => stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${appUrl}/home?stripe=portal-return`,
    }));

    return json(res, 200, { url: session.url });
  }

  if (pathname === "/connect/onboarding") {
    const accountId = await ensureConnectAccount(stripe, userRecord);
    const accountLink = await withThirdPartyCircuitBreaker(db, "stripe", "connect.onboarding", () => stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${appUrl}/home?stripe=connect-refresh`,
      return_url: `${appUrl}/home?stripe=connect-return`,
      type: "account_onboarding",
    }));

    return json(res, 200, { url: accountLink.url, accountId });
  }

  if (pathname === "/connect/refresh") {
    const accountId = userRecord.profile?.payoutFramework?.accounts?.stripeConnectAccountId;
    if (!accountId) {
      return json(res, 400, { error: "No Stripe Connect account is attached to this profile yet." });
    }

    const account = await withThirdPartyCircuitBreaker(db, "stripe", "connect.refresh", () => stripe.accounts.retrieve(accountId));
    await updateConnectAccountState(account);

    return json(res, 200, {
      accountId,
      chargesEnabled: !!account.charges_enabled,
      payoutsEnabled: !!account.payouts_enabled,
      detailsSubmitted: !!account.details_submitted,
    });
  }

  if (pathname === "/platform-fee-checkout") {
    const payload = validateBody({
      amountCents: { type: "number", required: true, min: 50, max: 5000000 },
      reference: { type: "string", max: 80 },
      description: { type: "string", max: 160 },
      acknowledged: { type: "boolean", required: true },
    }, req.body || {});
    const amountCents = Math.round(Number(payload.amountCents || 0));
    const reference = String(payload.reference || "").trim().slice(0, 80);
    const description = String(payload.description || "").trim().slice(0, 160);
    const acknowledged = payload.acknowledged === true;

    if (!acknowledged) {
      return json(res, 400, { error: "Platform fee disclosure must be acknowledged before checkout." });
    }
    if (!Number.isFinite(amountCents) || amountCents < 50 || amountCents > 5000000) {
      return json(res, 400, { error: "Platform fee amount must be between $0.50 and $50,000." });
    }

    const quote = buildPricingQuote({
      kind: "platform_fee",
      amountCents,
      currency: "usd",
      priority: String(reference || "").toLowerCase().includes("urgent") ? "priority" : "standard",
    });
    const customerId = await ensureStripeCustomer(stripe, userRecord);
    const session = await withThirdPartyCircuitBreaker(db, "stripe", "checkout.platform_fee", () => stripe.checkout.sessions.create({
      mode: "payment",
      customer: customerId,
      client_reference_id: userRecord.uid,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Wright Platform Fee",
              description: description || "Documented Wright platform surcharge / fee payment.",
            },
            unit_amount: quote.totalCents,
          },
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/home?stripe=platform-fee-success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/home?stripe=platform-fee-cancel`,
      metadata: {
        uid: userRecord.uid,
        kind: "platform_fee",
        reference,
        description,
        pricingRule: quote.pricingRule,
      },
    }));
    await createBillingNotification(db, userRecord.uid, "platform_fee_checkout_started", "Platform fee checkout started.", {
      amountCents: quote.totalCents,
      pricingRule: quote.pricingRule,
    }).catch(() => null);

    return json(res, 200, { url: session.url });
  }

  if (pathname === "/featured-placement-checkout") {
    const payload = validateBody({
      placementType: { type: "string", required: true, enum: ["listing", "service"], max: 24 },
      acknowledged: { type: "boolean", required: true },
      submissionId: { type: "string", max: 80 },
      listingSubmissionId: { type: "string", max: 80 },
      headline: { type: "string", max: 140 },
      company: { type: "string", max: 120 },
      market: { type: "string", max: 120 },
      note: { type: "string", max: 360 },
    }, req.body || {});
    const placementType = cleanMetaString(payload.placementType, 24);
    const acknowledged = payload.acknowledged === true;
    if (!acknowledged) {
      return json(res, 400, { error: "Featured placement disclosure must be acknowledged before checkout." });
    }
    if (!["listing", "service"].includes(placementType)) {
      return json(res, 400, { error: "Placement type must be listing or service." });
    }

    const pricing = FEATURED_PLACEMENT_PRICES[placementType];
    const customerId = await ensureStripeCustomer(stripe, userRecord);

    if (placementType === "listing") {
      const submissionId = cleanMetaString(payload.submissionId || payload.listingSubmissionId, 80);
      if (!submissionId) {
        return json(res, 400, { error: "Listing submission is required for featured placement." });
      }

      const submissionSnap = await db.collection("listingSubmissions").doc(submissionId).get();
      if (!submissionSnap.exists) {
        return json(res, 404, { error: "Listing submission not found." });
      }
      const submission = submissionSnap.data() || {};
      if (submission.userId !== userRecord.uid) {
        return json(res, 403, { error: "You can only feature your own listing submissions." });
      }

      const quote = buildPricingQuote({
        kind: "featured_placement",
        amountCents: pricing.amountCents,
        currency: "usd",
        priority: "priority",
      });
      const session = await withThirdPartyCircuitBreaker(db, "stripe", "checkout.featured_listing", () => stripe.checkout.sessions.create({
        mode: "payment",
        customer: customerId,
        client_reference_id: userRecord.uid,
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: pricing.name,
                description: `${pricing.description} Placement activates for ${FEATURED_PLACEMENT_DAYS} days.`,
              },
              unit_amount: quote.totalCents,
            },
            quantity: 1,
          },
        ],
        success_url: `${appUrl}/home?stripe=featured-placement-success&placement=listing&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${appUrl}/home?stripe=featured-placement-cancel&placement=listing`,
        metadata: {
          uid: userRecord.uid,
          kind: "featured_placement",
          placementType: "listing",
          submissionId,
          titleSnapshot: cleanMetaString(submission.title || "", 120),
          subtitleSnapshot: cleanMetaString(submission.address || "", 120),
          marketSnapshot: cleanMetaString([submission.city, submission.state].filter(Boolean).join(", "), 80),
          pricingRule: quote.pricingRule,
        },
      }));

      return json(res, 200, { url: session.url });
    }

    if (!FEATURED_SERVICE_ACCOUNT_TYPES.has(userRecord.profile?.accountType || "")) {
      return json(res, 403, { error: "Only service-provider accounts can buy a featured service spotlight." });
    }

    const serviceHeadline = cleanMetaString(payload.headline || "", 140);
    const serviceCompany = cleanMetaString(payload.company || "", 120);
    const serviceMarket = cleanMetaString(payload.market || "", 120);
    const serviceNote = cleanMetaString(payload.note || "", 360);
    if (!serviceHeadline || !serviceMarket) {
      return json(res, 400, { error: "Service headline and market are required for a featured spotlight." });
    }

    const quote = buildPricingQuote({
      kind: "featured_placement",
      amountCents: pricing.amountCents,
      currency: "usd",
      priority: "priority",
    });
    const session = await withThirdPartyCircuitBreaker(db, "stripe", "checkout.featured_service", () => stripe.checkout.sessions.create({
      mode: "payment",
      customer: customerId,
      client_reference_id: userRecord.uid,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: pricing.name,
              description: `${pricing.description} Placement activates for ${FEATURED_PLACEMENT_DAYS} days.`,
            },
            unit_amount: quote.totalCents,
          },
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/home?stripe=featured-placement-success&placement=service&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/home?stripe=featured-placement-cancel&placement=service`,
      metadata: {
        uid: userRecord.uid,
        kind: "featured_placement",
        placementType: "service",
        serviceHeadline,
        serviceCompany,
        serviceMarket,
        serviceNote,
        pricingRule: quote.pricingRule,
      },
    }));

    return json(res, 200, { url: session.url });
  }

  return json(res, 404, { error: "Unknown Stripe endpoint." });
}

async function handleSquareApi(req, res) {
  const pathname = getRequestPath(req).replace(/^\/api\/square/, "");
  const userRecord = await verifyUser(req);
  const appUrl = getAppUrl(req);

  if (pathname === "/verified-subscription/start") {
    const customerId = await ensureSquareCustomer(userRecord);
    const subscriptionPayload = await squareRequest("/subscriptions", {
      body: {
        idempotency_key: buildIdempotencyKey("sqsub"),
        location_id: squareLocationId.value(),
        plan_variation_id: squareVerifiedProfilePlanVariationId.value(),
        customer_id: customerId,
      },
    });

    const subscription = subscriptionPayload?.subscription;
    await updateSquareSubscriptionState(subscription);
    await createBillingNotification(db, userRecord.uid, "verified_subscription_started", "Square verified subscription started.", {
      provider: "square",
      customerId,
      subscriptionId: subscription?.id || "",
    }).catch(() => null);

    return json(res, 200, {
      ok: true,
      subscriptionId: subscription?.id || "",
      status: subscription?.status || "PENDING",
      message: "Square verified subscription started. Square will handle recurring invoicing for this customer.",
    });
  }

  if (pathname === "/verified-subscription/refresh") {
    const subscriptionId = userRecord.profile?.verifiedBilling?.subscriptionId || "";
    if (!subscriptionId) {
      return json(res, 400, { error: "No Square subscription is attached to this profile yet." });
    }

    const payload = await squareRequest(`/subscriptions/${subscriptionId}`, { method: "GET" });
    await updateSquareSubscriptionState(payload?.subscription);
    return json(res, 200, {
      ok: true,
      status: payload?.subscription?.status || "UNKNOWN",
      subscriptionId,
    });
  }

  if (pathname === "/verified-subscription/cancel") {
    const subscriptionId = userRecord.profile?.verifiedBilling?.subscriptionId || "";
    if (!subscriptionId) {
      return json(res, 400, { error: "No Square subscription is attached to this profile yet." });
    }

    await squareRequest(`/subscriptions/${subscriptionId}/cancel`, {
      body: {
        idempotency_key: buildIdempotencyKey("sqcancel"),
      },
    });

    const payload = await squareRequest(`/subscriptions/${subscriptionId}`, { method: "GET" });
    await updateSquareSubscriptionState(payload?.subscription);
    await createBillingNotification(db, userRecord.uid, "verified_subscription_cancelled", "Square verified subscription cancelled.", {
      provider: "square",
      subscriptionId,
    }).catch(() => null);
    return json(res, 200, {
      ok: true,
      status: payload?.subscription?.status || "CANCELED",
      subscriptionId,
    });
  }

  if (pathname === "/platform-fee-checkout") {
    const payload = validateBody({
      amountCents: { type: "number", required: true, min: 50, max: 5000000 },
      reference: { type: "string", max: 80 },
      description: { type: "string", max: 160 },
      acknowledged: { type: "boolean", required: true },
    }, req.body || {});
    const amountCents = Math.round(Number(payload.amountCents || 0));
    const reference = String(payload.reference || "").trim().slice(0, 80);
    const description = String(payload.description || "").trim().slice(0, 160);
    const acknowledged = payload.acknowledged === true;

    if (!acknowledged) {
      return json(res, 400, { error: "Platform fee disclosure must be acknowledged before checkout." });
    }
    if (!Number.isFinite(amountCents) || amountCents < 50 || amountCents > 5000000) {
      return json(res, 400, { error: "Platform fee amount must be between $0.50 and $50,000." });
    }

    const quote = buildPricingQuote({
      kind: "platform_fee",
      amountCents,
      currency: "usd",
      priority: String(reference || "").toLowerCase().includes("urgent") ? "priority" : "standard",
    });
    const paymentLinkPayload = await squareRequest("/online-checkout/payment-links", {
      body: {
        idempotency_key: buildIdempotencyKey("sqlink"),
        quick_pay: {
          name: "Wright Platform Fee",
          price_money: {
            amount: quote.totalCents,
            currency: "USD",
          },
          location_id: squareLocationId.value(),
        },
        description: description || "Documented Wright platform surcharge / fee payment.",
        checkout_options: {
          redirect_url: `${appUrl}/home?square=platform-fee-success`,
        },
        pre_populated_data: {
          buyer_email: userRecord.profile?.email || userRecord.auth.email || undefined,
          reference_id: reference || userRecord.uid,
        },
      },
    });

    return json(res, 200, {
      ok: true,
      url: paymentLinkPayload?.payment_link?.url || "",
    });
  }

  return json(res, 404, { error: "Unknown Square endpoint." });
}

export const stripeApi = onRequest(
  {
    cors: false,
    region: "us-central1",
    memory: "256MiB",
    timeoutSeconds: 60,
    secrets: [stripeSecretKey, stripeWebhookSecret, stripeVerifiedProfilePriceId],
  },
  async (req, res) => {
    setCors(req, res);

    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    await runEndpoint(req, res, "stripe_api", async () => {
      assertMethod(req, ["POST"]);
      const pathname = getRequestPath(req);
      if (pathname === `${STRIPE_API_PREFIX}/webhook`) {
        await handleWebhook(req, res);
        return;
      }

      await handleApi(req, res);
    });
  }
);

export const squareApi = onRequest(
  {
    cors: false,
    region: "us-central1",
    memory: "256MiB",
    timeoutSeconds: 60,
    secrets: [
      squareAccessToken,
      squareLocationId,
      squareVerifiedProfilePlanVariationId,
      squareWebhookSignatureKey,
      squareWebhookNotificationUrl,
    ],
  },
  async (req, res) => {
    setCors(req, res);

    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    await runEndpoint(req, res, "square_api", async () => {
      assertMethod(req, ["POST"]);
      const pathname = getRequestPath(req);
      if (pathname === `${SQUARE_API_PREFIX}/webhook`) {
        await handleSquareWebhook(req, res);
        return;
      }

      await handleSquareApi(req, res);
    });
  }
);

export const apiHealth = onRequest(
  {
    cors: false,
    region: "us-central1",
    memory: "256MiB",
    timeoutSeconds: 30,
  },
  async (req, res) => {
    setCors(req, res);

    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    await runEndpoint(req, res, "api_health", async () => {
      assertMethod(req, ["GET"]);
      await handleHealth(req, res);
    });
  }
);

export const apiSessionBootstrap = onRequest(
  {
    cors: false,
    region: "us-central1",
    memory: "256MiB",
    timeoutSeconds: 30,
  },
  async (req, res) => {
    setCors(req, res);

    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    await runEndpoint(req, res, "session_bootstrap", async (context) => {
      assertMethod(req, ["GET", "POST"]);
      const router = createApiRouter({
        db,
        req,
        res,
        context,
        routes: [
          {
            method: "GET",
            path: "/api/session/bootstrap",
            handler: () => handleSessionBootstrap(req, res),
            timeoutMs: 15000,
          },
          {
            method: "POST",
            path: "/api/session/revoke-self",
            handler: () => handleSessionMutation(req),
            timeoutMs: 15000,
          },
          {
            method: "POST",
            path: "/api/session/trusted-device",
            handler: () => handleSessionMutation(req),
            timeoutMs: 15000,
            idempotent: true,
            scope: "trusted-device",
          },
          {
            method: "POST",
            path: "/api/session/mfa-state",
            handler: () => handleSessionMutation(req),
            timeoutMs: 15000,
            idempotent: true,
            scope: "mfa-state",
          },
          {
            method: "POST",
            path: "/api/session/sync-claims",
            handler: () => handleSessionMutation(req),
            timeoutMs: 15000,
          },
          {
            method: "POST",
            path: "/api/session/privileged-access/request",
            handler: () => handleSessionMutation(req),
            timeoutMs: 15000,
            idempotent: true,
            scope: "privileged-request",
          },
          {
            method: "POST",
            path: "/api/session/privileged-access/review",
            handler: () => handleSessionMutation(req),
            timeoutMs: 15000,
          },
          {
            method: "GET",
            path: "/api/session/intake/export",
            handler: () => handleSessionMutation(req),
            timeoutMs: 15000,
          },
          {
            method: "POST",
            path: "/api/session/document/register",
            handler: () => handleSessionMutation(req),
            timeoutMs: 15000,
            idempotent: true,
            scope: "document-register",
          },
          {
            method: "POST",
            path: "/api/session/document/share-link",
            handler: () => handleSessionMutation(req),
            timeoutMs: 15000,
            idempotent: true,
            scope: "document-share-link",
          },
          {
            method: "POST",
            path: "/api/session/lead/comment",
            handler: () => handleSessionMutation(req),
            timeoutMs: 15000,
          },
          {
            method: "POST",
            path: "/api/session/account/archive",
            handler: () => handleSessionMutation(req),
            timeoutMs: 15000,
            idempotent: true,
            scope: "account-archive",
          },
          {
            method: "POST",
            path: "/api/session/account/recover",
            handler: () => handleSessionMutation(req),
            timeoutMs: 15000,
          },
          {
            method: "POST",
            path: "/api/session/account/merge-preview",
            handler: () => handleSessionMutation(req),
            timeoutMs: 15000,
          },
        ],
      });
      await router.dispatch();
    });
  }
);

export const apiListingOps = onRequest(
  {
    cors: false,
    region: "us-central1",
    memory: "256MiB",
    timeoutSeconds: 30,
  },
  async (req, res) => {
    setCors(req, res);

    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    await runEndpoint(req, res, "listing_ops", async () => {
      assertMethod(req, ["GET", "POST"]);
      await handleListingOps(req, res);
    });
  }
);
