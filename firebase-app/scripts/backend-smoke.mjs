import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), "utf8");
}

function assertContains(file, pattern, label) {
  const source = read(file);
  if (!pattern.test(source)) {
    throw new Error(`Missing ${label} in ${file}`);
  }
}

assertContains("functions/backend-core.js", /export function validateBody/, "request validation helper");
assertContains("functions/backend-core.js", /export function sendError/, "shared error envelope helper");
assertContains("functions/backend-core.js", /export function requireRole/, "role permission helper");
assertContains("functions/backend-core.js", /export function logEvent/, "structured logging helper");
assertContains("functions/backend-core.js", /export async function enqueueJob/, "job queue helper");
assertContains("functions/backend-core.js", /export async function scheduleRetry/, "retry helper");
assertContains("functions/backend-core.js", /export async function ensureWebhookReplayGuard/, "webhook replay guard");
assertContains("functions/api-router.js", /export const API_VERSION/, "api versioning");
assertContains("functions/api-router.js", /export function createApiRouter/, "central api router");
assertContains("functions/api-router.js", /export async function withIdempotency/, "idempotency middleware");
assertContains("functions/api-router.js", /export async function withTimeout/, "request timeout helper");
assertContains("functions/auth-services.js", /export function assertFreshAuth/, "token freshness checks");
assertContains("functions/auth-services.js", /export async function revokeOwnSessions/, "session revocation service");
assertContains("functions/auth-services.js", /export async function publishSessionEvent/, "cross-device sign-out/session event service");
assertContains("functions/auth-services.js", /export async function syncCustomClaims/, "custom claims sync service");
assertContains("functions/auth-services.js", /export async function createPrivilegedAccessRequest/, "privileged access workflow");
assertContains("functions/auth-services.js", /export async function recordTrustedDevice/, "trusted device registry");
assertContains("functions/auth-services.js", /export async function detectLoginAnomaly/, "login anomaly detection");
assertContains("functions/auth-services.js", /export async function setMfaState/, "mfa enrollment state store");
assertContains("functions/operations-services.js", /export function createDispatchRequest/, "dispatch request model");
assertContains("functions/operations-services.js", /export function resolveCoverageArea/, "coverage area resolver");
assertContains("functions/operations-services.js", /export function routeOffice/, "office routing service");
assertContains("functions/operations-services.js", /export function buildTimelineState/, "timeline state machine");
assertContains("functions/operations-services.js", /export async function publishShiftStatusEvent/, "shift status event feed");
assertContains("functions/operations-services.js", /export function buildJobSchedule/, "job scheduling engine");
assertContains("functions/operations-services.js", /export function forecastCapacity/, "capacity forecasting service");
assertContains("functions/operations-services.js", /export async function upsertCustomerBillingProfile/, "customer billing profile service");
assertContains("functions/operations-services.js", /export async function createInvoiceRecord/, "invoice record model");
assertContains("functions/operations-services.js", /export function buildPricingQuote/, "pricing quote rules engine");
assertContains("functions/operations-services.js", /export async function createBillingNotification/, "billing notification service");
assertContains("functions/operations-services.js", /export async function handleFailedPaymentRecovery/, "failed payment recovery flow");
assertContains("functions/operations-services.js", /export async function createRefundRecord/, "refund workflow");
assertContains("functions/operations-services.js", /export async function recordRevenueEvent/, "revenue event ledger");
assertContains("functions/operations-services.js", /export async function withThirdPartyCircuitBreaker/, "circuit breaker for third-party apis");
assertContains("functions/operations-services.js", /export async function ensureScheduledReconciliationJobs/, "scheduled reconciliation jobs");
assertContains("functions/operations-services.js", /export async function ensureScheduledCleanupJobs/, "scheduled cleanup jobs");
assertContains("functions/data-document-services.js", /export function buildSecureDocumentMetadata/, "secure document metadata service");
assertContains("functions/data-document-services.js", /export function verifyDocumentFileType/, "file type verification");
assertContains("functions/data-document-services.js", /export async function queueVirusScan/, "virus scan hook");
assertContains("functions/data-document-services.js", /export async function registerDocumentVersion/, "versioned document records");
assertContains("functions/data-document-services.js", /export function applyRetentionPolicy/, "retention policy engine");
assertContains("functions/data-document-services.js", /export function buildDocumentAccessPolicy/, "document access policy service");
assertContains("functions/data-document-services.js", /export async function createExpiringShareLink/, "expiring share links");
assertContains("functions/data-document-services.js", /export async function queueOcrExtraction/, "ocr metadata extraction pipeline");
assertContains("functions/data-document-services.js", /export function normalizeLeadRecord/, "lead normalization pipeline");
assertContains("functions/data-document-services.js", /export function attributeLeadSource/, "lead source attribution service");
assertContains("functions/data-document-services.js", /export async function appendLeadComment/, "lead comment thread model");
assertContains("functions/data-document-services.js", /export async function exportLeadIntake/, "intake export endpoint");
assertContains("functions/data-document-services.js", /export function scoreProfileCompleteness/, "profile completeness scorer");
assertContains("functions/data-document-services.js", /export function buildContactPreferenceState/, "contact preference service");
assertContains("functions/data-document-services.js", /export function buildAccountMergePreview/, "account merge service");
assertContains("functions/data-document-services.js", /export async function archiveAccountRecord/, "account archival flow");
assertContains("functions/data-document-services.js", /export async function restoreArchivedAccount/, "soft delete recovery flow");
assertContains("functions/data-document-services.js", /export function buildAccountMergeConflictReview/, "account merge conflict review");
assertContains("functions/data-document-services.js", /export async function recordFirestoreMetric/, "firestore write read monitoring");
assertContains("functions/data-document-services.js", /export async function createSecurityIncidentHook/, "security incident playbook hooks");
assertContains("functions/index.js", /runEndpoint\(req, res, "stripe_api"/, "wrapped stripe endpoint");
assertContains("functions/index.js", /ensureWebhookReplayGuard\(db, "stripe"/, "stripe webhook replay protection");
assertContains("functions/index.js", /scheduleRetry\(db, "stripe_webhook_retry"/, "stripe retry queue");
assertContains("functions/index.js", /createApiRouter\(/, "router integration");
assertContains("functions/index.js", /handleSessionMutation/, "session mutation routes");
assertContains("functions/index.js", /validateBody\(\{[\s\S]*amountCents/, "body validation usage");
assertContains("functions/index.js", /withThirdPartyCircuitBreaker\(db, "stripe"/, "stripe circuit breaker integration");
assertContains("functions/index.js", /createInvoiceRecord\(db/, "invoice integration");
assertContains("functions/index.js", /recordRevenueEvent\(db/, "revenue ledger integration");
assertContains("functions/index.js", /\/api\/session\/document\/register/, "document session route");
assertContains("functions/index.js", /\/api\/session\/intake\/export/, "intake export session route");
assertContains("functions/index.js", /\/api\/session\/account\/archive/, "account archive session route");
assertContains("src/wd-wright-backend.js", /function fingerprintLead/, "lead dedupe fingerprint");
assertContains("src/wd-wright-backend.js", /function resolveLeadAssignment/, "lead assignment helper");
assertContains("src/wd-wright-backend.js", /duplicateSnap/, "lead duplicate lookup");
assertContains("src/wd-wright-backend.js", /dispatch:/, "dispatch request payload");
assertContains("src/wd-wright-backend.js", /capacityForecast/, "capacity forecast payload");
assertContains("src/wd-wright-backend.js", /comments:/, "lead comment seed");
assertContains("src/wd-wright-backend.js", /const attribution =/, "lead attribution payload");
assertContains("src/wd-wright-account-services.js", /export function buildCanonicalWrightProfile/, "canonical account profile service");
assertContains("src/wd-wright-account-services.js", /function validateEditableProfile/, "profile field validation rules");
assertContains("src/wd-wright-account-services.js", /profileChangeHistory/, "profile change history");
assertContains("src/wd-wright-account-services.js", /consentLedger/, "consent ledger");
assertContains("src/wd-wright-account-services.js", /deriveAccountStatus/, "account status lifecycle");
assertContains("src/wd-wright-account-services.js", /buildLeadSla/, "sla timer helper");
assertContains("src/wd-wright-account-services.js", /transitionLeadStatus/, "reopen close state machine");
assertContains("src/wd-wright-account-services.js", /export function scoreProfileCompleteness/, "profile completeness score service");
assertContains("src/wd-wright-account-services.js", /export function buildContactPreferenceState/, "contact preferences state service");
assertContains("src/wd-wright-operations.js", /export function buildShiftStatusFeed/, "frontend shift status feed helper");

console.log("WD Wright backend smoke checks passed.");
