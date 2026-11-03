"use client";

import React, { useEffect, useMemo, useState } from "react";
import { formatWrightAccountType, formatWrightPlatformId, isPrivilegedWrightUser, readLocalWrightLeads, subscribeToWrightLeads, subscribeToWrightUsers } from "./wd-wright-backend.js";
import WDWrightBrandLockup from "./WDWrightBrandLockup.jsx";
import { WDWRIGHT_THEME } from "./wd-wright-theme.js";

const S = {
  bg: "var(--wdw-bg)",
  card: "var(--wdw-card)",
  soft: "var(--wdw-card-soft)",
  text: "var(--wdw-text)",
  muted: "var(--wdw-text-muted)",
  dark: "var(--wdw-text-strong)",
  pine: "var(--wdw-asphalt)",
  amber: "var(--wdw-accent)",
  lime: "var(--wdw-accent-strong)",
  line: "var(--wdw-line)",
  sans: WDWRIGHT_THEME.sans,
  display: WDWRIGHT_THEME.display,
};

function formatDate(value) {
  if (!value) return "Not available";
  try {
    const date = typeof value?.toDate === "function" ? value.toDate() : new Date(value);
    return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(date);
  } catch {
    return "Not available";
  }
}

function summarizeTags(raw) {
  if (!Array.isArray(raw)) return "";
  return raw.filter(Boolean).join(", ");
}

function parseTags(raw) {
  return String(raw || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .slice(0, 14);
}

function titleCaseLabel(value = "") {
  return String(value || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

const ACCOUNT_PURPOSE_LABELS = {
  unspecified: "Not selected",
  customer: "Traffic control customer",
  contractor: "Contractor or utility partner",
  public_agency: "Public agency or municipality",
  job_seeker: "Job seeker",
  wright_team: "WD Wright team member",
};

function computeProfileDepth(user = {}, form = {}) {
  const fields = [
    Boolean((form.name || user?.name || "").trim()),
    Boolean((user?.email || "").trim()),
    Boolean((form.phone || user?.phone || "").replace(/\D/g, "").length >= 7),
    Boolean(form.preferredContact || user?.userDatabase?.preferredContact),
    ["customer", "contractor", "public_agency", "job_seeker", "wright_team"].includes(form.accountPurpose || user?.userDatabase?.accountPurpose),
    Boolean((form.organizationName || user?.userDatabase?.organizationName || "").trim()),
    Boolean(form.targetMarket || user?.userDatabase?.targetMarket),
    Boolean(form.transactionIntent || user?.userDatabase?.transactionIntent),
    Boolean(form.timelineBand || user?.userDatabase?.timelineBand),
    Boolean(form.budgetBand || user?.userDatabase?.budgetBand),
    Boolean(form.preferredLanguage || user?.userDatabase?.preferredLanguage),
    Boolean(form.timezone || user?.userDatabase?.timezone),
    Boolean((form.tags || "").trim() || (user?.userDatabase?.tags || []).length),
    Boolean((form.notes || "").trim() || user?.userDatabase?.notes),
  ];

  return Math.round((fields.filter(Boolean).length / fields.length) * 100);
}

function buildReadinessChecklist(user = {}, form = {}) {
  return [
    ["Identity on file", Boolean((form.name || user?.name || "").trim() && (user?.email || "").trim())],
    ["Contact route confirmed", Boolean(form.preferredContact || user?.userDatabase?.preferredContact) && (!["phone", "sms"].includes(form.preferredContact || user?.userDatabase?.preferredContact) || (form.phone || user?.phone || "").replace(/\D/g, "").length >= 7)],
    ["Wright use selected", ["customer", "contractor", "public_agency", "job_seeker", "wright_team"].includes(form.accountPurpose || user?.userDatabase?.accountPurpose)],
    ["Organization added (optional)", Boolean((form.organizationName || user?.userDatabase?.organizationName || "").trim())],
    ["Service area added (optional)", Boolean((form.targetMarket || user?.userDatabase?.targetMarket || "").trim())],
    ["Timeline added (optional)", Boolean(form.timelineBand && form.timelineBand !== "undisclosed")],
    ["Extra notes or tags added (optional)", Boolean((form.notes || "").trim() || (form.tags || "").trim())],
  ];
}

function StatCard({ label, value, detail }) {
  return (
    <div style={{ borderRadius: "var(--wdw-radius-card, 20px)", padding: 16, background: S.card, border: `1px solid ${S.line}`, boxShadow: "0 10px 26px var(--wdw-shadow)" }}>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: S.amber, marginBottom: 8 }}>{label}</div>
      <div style={{ fontFamily: S.display, fontSize: 28, lineHeight: 1, textTransform: "uppercase", color: S.dark }}>{value}</div>
      <div style={{ marginTop: 8, fontSize: 13, lineHeight: 1.6, color: S.muted }}>{detail}</div>
    </div>
  );
}

function Surface({ children, tone = "card", style = {} }) {
  return (
    <section
      style={{
        borderRadius: "var(--wdw-radius-card, 20px)",
        padding: 22,
        background: tone === "dark" ? S.dark : tone === "soft" ? S.soft : S.card,
        color: tone === "dark" ? "#f2f6f3" : S.text,
        border: `1px solid ${tone === "dark" ? "rgba(255,255,255,0.08)" : S.line}`,
        boxShadow: tone === "dark" ? "0 22px 54px rgba(9, 26, 28, 0.28)" : "0 16px 40px rgba(20,35,37,0.06)",
        ...style,
      }}
    >
      {children}
    </section>
  );
}

export default function WDWrightWorkspace({ user, onSaveProfile, onLogout, onOpenPublicPage, embedded = false, themeMode = "wright-day" }) {
  const isAdmin = isPrivilegedWrightUser(user);
  const [users, setUsers] = useState([]);
  const [leads, setLeads] = useState([]);
  const [opsError, setOpsError] = useState("");
  const [saveState, setSaveState] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    preferredContact: user?.userDatabase?.preferredContact || "email",
    accountPurpose: user?.userDatabase?.accountPurpose || "unspecified",
    organizationName: user?.userDatabase?.organizationName || "",
    preferredLanguage: user?.userDatabase?.preferredLanguage || "English",
    timezone: user?.userDatabase?.timezone || "America/New_York",
    transactionIntent: user?.userDatabase?.transactionIntent || "service",
    budgetBand: user?.userDatabase?.budgetBand || "undisclosed",
    timelineBand: user?.userDatabase?.timelineBand || "undisclosed",
    targetMarket: user?.userDatabase?.targetMarket || "",
    stageOwner: user?.userDatabase?.stageOwner || "",
    supportTier: user?.userDatabase?.supportTier || "standard",
    marketingOptIn: user?.userDatabase?.marketingOptIn === true,
    notes: user?.userDatabase?.notes || "",
    tags: summarizeTags(user?.userDatabase?.tags),
  });

  useEffect(() => {
    setForm({
      name: user?.name || "",
      phone: user?.phone || "",
      preferredContact: user?.userDatabase?.preferredContact || "email",
      accountPurpose: user?.userDatabase?.accountPurpose || "unspecified",
      organizationName: user?.userDatabase?.organizationName || "",
      preferredLanguage: user?.userDatabase?.preferredLanguage || "English",
      timezone: user?.userDatabase?.timezone || "America/New_York",
      transactionIntent: user?.userDatabase?.transactionIntent || "service",
      budgetBand: user?.userDatabase?.budgetBand || "undisclosed",
      timelineBand: user?.userDatabase?.timelineBand || "undisclosed",
      targetMarket: user?.userDatabase?.targetMarket || "",
      stageOwner: user?.userDatabase?.stageOwner || "",
      supportTier: user?.userDatabase?.supportTier || "standard",
      marketingOptIn: user?.userDatabase?.marketingOptIn === true,
      notes: user?.userDatabase?.notes || "",
      tags: summarizeTags(user?.userDatabase?.tags),
    });
  }, [user]);

  useEffect(() => {
    if (!isAdmin) {
      setUsers([]);
      setLeads([]);
      setOpsError("");
      return undefined;
    }

    const unsubscribeUsers = subscribeToWrightUsers(
      (nextUsers) => {
        setUsers(nextUsers);
        setOpsError("");
      },
      (error) => {
        setOpsError(error instanceof Error ? error.message : "Unable to load Wright user records.");
      }
    );

    const unsubscribeLeads = subscribeToWrightLeads(
      (nextLeads) => {
        setLeads(nextLeads);
        setOpsError("");
      },
      (error) => {
        setOpsError(error instanceof Error ? error.message : "Unable to load Wright intake records.");
      }
    );

    return () => {
      unsubscribeUsers?.();
      unsubscribeLeads?.();
    };
  }, [isAdmin]);

  const metrics = useMemo(() => {
    const localFallbackLeadCount = readLocalWrightLeads().length;
    const activeUsers = users.filter((entry) => ["active", "transacting"].includes(entry?.userDatabase?.status)).length;
    const newLeads = leads.filter((entry) => entry?.status === "new").length;
    return {
      totalUsers: users.length,
      activeUsers,
      totalLeads: leads.length,
      newLeads,
      localFallbackLeadCount,
    };
  }, [leads, users]);

  const profileDepthScore = useMemo(() => computeProfileDepth(user, form), [form, user]);
  const readinessChecklist = useMemo(() => buildReadinessChecklist(user, form), [form, user]);
  const readinessCount = readinessChecklist.filter(([, complete]) => complete).length;
  const memberBenefits = useMemo(() => ([
    {
      title: "Faster quote intake",
      body: "Saved market, service-intent, timeline, and contact details reduce repeat typing when you request Wright services.",
    },
    {
      title: "Better routing",
      body: "A fuller profile gives Wright cleaner account context for dispatch, recruiting, document follow-up, and support handling.",
    },
    {
      title: "Protected documentation path",
      body: "Signed-in access unlocks protected service requests, support pages, and document handling.",
    },
  ]), []);

  async function handleSave(event) {
    event.preventDefault();
    if (saving) return;
    if (form.name.trim().length < 2) {
      setSaveState("Enter your name to save your profile.");
      return;
    }
    if (!["customer", "contractor", "public_agency", "job_seeker", "wright_team"].includes(form.accountPurpose)) {
      setSaveState("Choose how you use WD Wright before saving your profile.");
      return;
    }
    if (["phone", "sms"].includes(form.preferredContact) && form.phone.replace(/\D/g, "").length < 7) {
      setSaveState("Add a valid callback number before choosing phone or text contact.");
      return;
    }
    setSaving(true);
    setSaveState("");

    try {
      const savedProfile = await onSaveProfile({
        ...user,
        name: form.name.trim() || user?.name || "Wright User",
        phone: form.phone.trim(),
        userDatabase: {
          ...user?.userDatabase,
          preferredContact: form.preferredContact,
          accountPurpose: form.accountPurpose,
          organizationName: form.organizationName.trim(),
          preferredLanguage: form.preferredLanguage,
          timezone: form.timezone,
          transactionIntent: form.transactionIntent,
          targetMarket: form.targetMarket.trim(),
          stageOwner: form.stageOwner.trim(),
          supportTier: form.supportTier,
          budgetBand: form.budgetBand,
          timelineBand: form.timelineBand,
          marketingOptIn: form.marketingOptIn,
          marketingConsentMethod: form.marketingOptIn ? "self_service_workspace" : "",
          marketingConsentVersion: form.marketingOptIn ? "wd-wright-v1" : "",
          marketingConsentAt: form.marketingOptIn ? (user?.userDatabase?.marketingConsentAt || new Date()) : null,
          marketingRevokedAt: form.marketingOptIn ? null : (user?.userDatabase?.marketingRevokedAt || new Date()),
          notes: form.notes.trim(),
          tags: parseTags(form.tags),
          profileDepthScore,
          lastContactAt: user?.userDatabase?.lastContactAt || null,
        },
      });
      setSaveState(form.marketingOptIn && savedProfile?.userDatabase?.marketingOptIn !== true
        ? "Profile saved, but the promotional email preference could not be recorded. No marketing opt-in was saved."
        : "Profile saved. You can return to optional details any time.");
    } catch (error) {
      setSaveState(error instanceof Error ? error.message : "Unable to save your account details.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ minHeight: embedded ? "auto" : "100vh", background: embedded ? "transparent" : `linear-gradient(180deg, ${S.bg} 0%, #fafaf7 48%, #d8dad3 100%)`, color: S.text, fontFamily: S.sans, padding: embedded ? 0 : 20 }}>
      <div style={{ width: "min(1220px, 100%)", margin: "0 auto", display: "grid", gap: 18 }}>
        <Surface tone="dark" style={{ overflow: "hidden", position: "relative" }}>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 20% 10%, var(--wdw-accent-soft), transparent 28%), radial-gradient(circle at 100% 0%, rgba(255,255,255,0.08), transparent 26%)" }} />
          <div style={{ position: "relative", display: "grid", gridTemplateColumns: "minmax(0, 1.1fr) auto", gap: 20, alignItems: "start" }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase", color: S.lime, marginBottom: 8 }}>
                Wright Workspace
              </div>
              <div style={{ marginBottom: 14 }}>
                <WDWrightBrandLockup themeMode={themeMode} context="hero" width="min(320px, 62vw)" />
              </div>
              <div style={{ fontFamily: S.display, fontSize: "clamp(2.6rem, 6vw, 4.8rem)", lineHeight: 0.94, textTransform: "uppercase" }}>
                Account details, requests, and profile controls in one place.
              </div>
              <p style={{ margin: "14px 0 0", maxWidth: 720, fontSize: 15, lineHeight: 1.8, color: "rgba(242,246,243,0.82)" }}>
                Use this page to manage your WD Wright account, save request details, keep contact preferences current, and stay ready for future service needs.
              </p>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
              <button type="button" onClick={() => onOpenPublicPage("/quote")} style={{ border: "none", background: S.amber, color: S.dark, borderRadius: 999, padding: "12px 16px", cursor: "pointer", fontFamily: S.sans, fontWeight: 800 }}>
                Quote Intake
              </button>
              {embedded ? (
                <button type="button" onClick={() => onOpenPublicPage("/resources")} style={{ border: "1px solid rgba(255,255,255,0.12)", background: "transparent", color: "#fff", borderRadius: 999, padding: "12px 16px", cursor: "pointer", fontFamily: S.sans, fontWeight: 800 }}>
                  Protected Resources
                </button>
              ) : (
                <>
                  <button type="button" onClick={() => onOpenPublicPage("/")} style={{ border: "1px solid rgba(255,255,255,0.12)", background: "transparent", color: "#fff", borderRadius: 999, padding: "12px 16px", cursor: "pointer", fontFamily: S.sans, fontWeight: 800 }}>
                    Public Site
                  </button>
                  <button type="button" onClick={onLogout} style={{ border: "none", background: "#fff", color: S.dark, borderRadius: 999, padding: "12px 16px", cursor: "pointer", fontFamily: S.sans, fontWeight: 800 }}>
                    Sign Out
                  </button>
                </>
              )}
            </div>
          </div>
        </Surface>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
          <StatCard label="Account ID" value={formatWrightPlatformId(user) || "Pending"} detail="Your WD Wright account reference for support and service records." />
          <StatCard label="Role" value={formatWrightAccountType(user?.accountType)} detail={`Schema version ${user?.schemaVersion || "n/a"} · status ${user?.userDatabase?.status || "onboarding"}`} />
          <StatCard label="Preferred Contact" value={String(user?.userDatabase?.preferredContact || "email").toUpperCase()} detail={`Support tier ${user?.userDatabase?.supportTier || "standard"}`} />
          <StatCard label="Profile Draft" value={`${profileDepthScore}%`} detail={`${readinessCount}/${readinessChecklist.length} draft details present; save to update your account`} />
          <StatCard label="Last Update" value={user?.updatedAt ? "Synced" : "Local"} detail={formatDate(user?.updatedAt || user?.createdAt)} />
        </div>

        <Surface tone="soft" style={{ display: "grid", gap: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: S.amber }}>Profile setup</div>
          <div style={{ fontFamily: S.display, fontSize: 26, lineHeight: 1, textTransform: "uppercase" }}>Pick up where you left off.</div>
          <p style={{ margin: 0, color: S.muted, fontSize: 13.5, lineHeight: 1.7 }}>{user?.profilePersistenceStatus === "unavailable" ? "Your account profile could not be loaded from account storage. Values shown here may be defaults; changes are not confirmed saved until the profile save succeeds." : "Setup progress follows the profile details saved to your account. Save your name, contact route, and how you use Wright first. Organization, service area, timeline, notes, and tags are optional; you can leave them blank and return later."}</p>
        </Surface>

        <div style={{ display: "grid", gridTemplateColumns: "minmax(300px, 0.9fr) minmax(0, 1.1fr)", gap: 18 }}>
          <Surface>
            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: S.amber, marginBottom: 8 }}>Account</div>
            <div style={{ fontFamily: S.display, fontSize: 34, lineHeight: 0.98, textTransform: "uppercase", marginBottom: 16 }}>{user?.name || "Wright User"}</div>
            <div style={{ display: "grid", gap: 10 }}>
              {[
                ["Email", user?.email || "Not available"],
                ["Phone", user?.phone || "Not available"],
                ["Account purpose", ACCOUNT_PURPOSE_LABELS[user?.userDatabase?.accountPurpose] || "Not selected"],
                ["Organization", user?.userDatabase?.organizationName || "Not added"],
                ["Service intent", titleCaseLabel(user?.userDatabase?.transactionIntent || "service")],
                ["Timeline", titleCaseLabel(user?.userDatabase?.timelineBand || "undisclosed")],
                ["Budget", titleCaseLabel(user?.userDatabase?.budgetBand || "undisclosed")],
                ["Target market", user?.userDatabase?.targetMarket || "Not set"],
                ["Language", user?.userDatabase?.preferredLanguage || "English"],
                ["Timezone", user?.userDatabase?.timezone || "America/New_York"],
                ["Tags", summarizeTags(user?.userDatabase?.tags) || "None"],
              ].map(([label, value]) => (
                <div key={label} style={{ paddingBottom: 10, borderBottom: `1px solid ${S.line}` }}>
                  <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: S.muted }}>{label}</div>
                  <div style={{ marginTop: 6, fontSize: 14, lineHeight: 1.6 }}>{value}</div>
                </div>
              ))}
            </div>
          </Surface>

          <Surface>
            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: S.amber, marginBottom: 8 }}>Profile Controls</div>
            <div style={{ fontFamily: S.display, fontSize: 34, lineHeight: 0.98, textTransform: "uppercase", marginBottom: 8 }}>Update your Wright record.</div>
            <div style={{ fontSize: 13.5, lineHeight: 1.7, color: S.muted, marginBottom: 16 }}>
              Keep your contact route and Wright use current. Add organization and project-planning details only when they help a request; optional fields can stay blank.
            </div>
            <form onSubmit={handleSave} style={{ display: "grid", gap: 12 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
                <label style={{ display: "grid", gap: 6, fontSize: 12.5, fontWeight: 700 }}>
                  Full name <span style={{ color: S.muted, fontWeight: 500 }}>Required to save</span>
                  <input value={form.name} maxLength={120} autoComplete="name" required minLength={2} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} style={{ minHeight: 44, borderRadius: 12, border: `1px solid ${S.line}`, padding: "0 12px", fontFamily: S.sans, fontSize: 14 }} />
                </label>
                <label style={{ display: "grid", gap: 6, fontSize: 12.5, fontWeight: 700 }}>
                  Email <span style={{ color: S.muted, fontWeight: 500 }}>From sign-in; contact support to change it</span>
                  <input value={user?.email || ""} disabled readOnly autoComplete="email" style={{ minHeight: 44, borderRadius: 12, border: `1px solid ${S.line}`, padding: "0 12px", fontFamily: S.sans, fontSize: 14, opacity: 0.75 }} />
                </label>
                <label style={{ display: "grid", gap: 6, fontSize: 12.5, fontWeight: 700 }}>
                  Callback number <span style={{ color: S.muted, fontWeight: 500 }}>Optional unless you choose phone or text</span>
                  <input type="tel" value={form.phone} maxLength={30} autoComplete="tel" onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} style={{ minHeight: 44, borderRadius: 12, border: `1px solid ${S.line}`, padding: "0 12px", fontFamily: S.sans, fontSize: 14 }} />
                </label>
                <label style={{ display: "grid", gap: 6, fontSize: 12.5, fontWeight: 700 }}>
                  Preferred contact
                  <select value={form.preferredContact} onChange={(event) => setForm((current) => ({ ...current, preferredContact: event.target.value }))} style={{ minHeight: 44, borderRadius: 12, border: `1px solid ${S.line}`, padding: "0 12px", fontFamily: S.sans, fontSize: 14 }}>
                    <option value="email">Email</option>
                    <option value="phone">Phone call</option>
                    <option value="sms">Text message</option>
                    <option value="in_app">In-app, where available</option>
                  </select>
                  <span style={{ color: S.muted, fontSize: 11.5, fontWeight: 500 }}>Text is a saved preference only. Text delivery and any separate messaging consent are not enabled here.</span>
                </label>
                <label style={{ display: "grid", gap: 6, fontSize: 12.5, fontWeight: 700 }}>
                  How you use WD Wright
                  <select value={form.accountPurpose} onChange={(event) => setForm((current) => ({ ...current, accountPurpose: event.target.value }))} style={{ minHeight: 44, borderRadius: 12, border: `1px solid ${S.line}`, padding: "0 12px", fontFamily: S.sans, fontSize: 14 }}>
                    <option value="unspecified">Choose a purpose</option>
                    <option value="customer">Requesting traffic control services</option>
                    <option value="contractor">Prime contractor, utility, or project partner</option>
                    <option value="public_agency">Public agency or municipality</option>
                    <option value="job_seeker">Looking for traffic-control work</option>
                    <option value="wright_team">WD Wright team member</option>
                  </select>
                  <span style={{ color: S.muted, fontSize: 11.5, fontWeight: 500 }}>This helps route your requests. It does not submit a job application or grant WD Wright team access.</span>
                </label>
                <label style={{ display: "grid", gap: 6, fontSize: 12.5, fontWeight: 700 }}>
                  Organization <span style={{ color: S.muted, fontWeight: 500 }}>Optional</span>
                  <input value={form.organizationName} maxLength={100} autoComplete="organization" onChange={(event) => setForm((current) => ({ ...current, organizationName: event.target.value }))} style={{ minHeight: 44, borderRadius: 12, border: `1px solid ${S.line}`, padding: "0 12px", fontFamily: S.sans, fontSize: 14 }} />
                </label>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
                <label style={{ display: "grid", gap: 6, fontSize: 12.5, fontWeight: 700 }}>
                  Request focus
                  <select value={form.transactionIntent} onChange={(event) => setForm((current) => ({ ...current, transactionIntent: event.target.value }))} style={{ minHeight: 44, borderRadius: 12, border: `1px solid ${S.line}`, padding: "0 12px", fontFamily: S.sans, fontSize: 14 }}>
                    {["service", "browse"].map((option) => (
                      <option key={option} value={option}>
                        {titleCaseLabel(option)}
                      </option>
                    ))}
                  </select>
                </label>
                <label style={{ display: "grid", gap: 6, fontSize: 12.5, fontWeight: 700 }}>
                  Target Market
                  <input value={form.targetMarket} onChange={(event) => setForm((current) => ({ ...current, targetMarket: event.target.value }))} style={{ minHeight: 44, borderRadius: 12, border: `1px solid ${S.line}`, padding: "0 12px", fontFamily: S.sans, fontSize: 14 }} />
                </label>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
                <label style={{ display: "grid", gap: 6, fontSize: 12.5, fontWeight: 700 }}>
                  Project timing <span style={{ color: S.muted, fontWeight: 500 }}>Optional</span>
                  <select value={form.timelineBand} onChange={(event) => setForm((current) => ({ ...current, timelineBand: event.target.value }))} style={{ minHeight: 44, borderRadius: 12, border: `1px solid ${S.line}`, padding: "0 12px", fontFamily: S.sans, fontSize: 14 }}>
                    {["immediate", "30_days", "90_days", "6_months", "12_months_plus", "undisclosed"].map((option) => (
                      <option key={option} value={option}>
                        {titleCaseLabel(option)}
                      </option>
                    ))}
                  </select>
                </label>
                <label style={{ display: "grid", gap: 6, fontSize: 12.5, fontWeight: 700 }}>
                  Planning budget <span style={{ color: S.muted, fontWeight: 500 }}>Optional</span>
                  <select value={form.budgetBand} onChange={(event) => setForm((current) => ({ ...current, budgetBand: event.target.value }))} style={{ minHeight: 44, borderRadius: 12, border: `1px solid ${S.line}`, padding: "0 12px", fontFamily: S.sans, fontSize: 14 }}>
                    {["under_250k", "250k_500k", "500k_1m", "1m_2m", "2m_plus", "undisclosed"].map((option) => (
                      <option key={option} value={option}>
                        {titleCaseLabel(option)}
                      </option>
                    ))}
                  </select>
                </label>
                <label style={{ display: "grid", gap: 6, fontSize: 12.5, fontWeight: 700 }}>
                  Language
                  <input value={form.preferredLanguage} onChange={(event) => setForm((current) => ({ ...current, preferredLanguage: event.target.value }))} style={{ minHeight: 44, borderRadius: 12, border: `1px solid ${S.line}`, padding: "0 12px", fontFamily: S.sans, fontSize: 14 }} />
                </label>
                <label style={{ display: "grid", gap: 6, fontSize: 12.5, fontWeight: 700 }}>
                  Timezone
                  <input value={form.timezone} onChange={(event) => setForm((current) => ({ ...current, timezone: event.target.value }))} style={{ minHeight: 44, borderRadius: 12, border: `1px solid ${S.line}`, padding: "0 12px", fontFamily: S.sans, fontSize: 14 }} />
                </label>
              </div>

              <label style={{ display: "grid", gap: 6, fontSize: 12.5, fontWeight: 700 }}>
                Tags
                <input value={form.tags} onChange={(event) => setForm((current) => ({ ...current, tags: event.target.value }))} style={{ minHeight: 44, borderRadius: 12, border: `1px solid ${S.line}`, padding: "0 12px", fontFamily: S.sans, fontSize: 14 }} />
              </label>
              <label style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 13, lineHeight: 1.6, color: S.text }}>
                <input type="checkbox" checked={form.marketingOptIn} onChange={(event) => setForm((current) => ({ ...current, marketingOptIn: event.target.checked }))} style={{ marginTop: 3 }} />
                <span>
                  Email me occasional promotional updates about Wright services. Optional and unchecked by default; separate from messages about a request I submit. This preference may be unavailable until the consent service is configured.
                </span>
              </label>
              <label style={{ display: "grid", gap: 6, fontSize: 12.5, fontWeight: 700 }}>
                Notes
                <textarea value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} rows={5} style={{ borderRadius: 12, border: `1px solid ${S.line}`, padding: 12, fontFamily: S.sans, fontSize: 14, resize: "vertical" }} />
              </label>

              <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                <button type="submit" disabled={saving} style={{ minHeight: 46, borderRadius: 999, border: "none", background: S.pine, color: "#fff", padding: "0 18px", cursor: saving ? "not-allowed" : "pointer", fontFamily: S.sans, fontWeight: 800 }}>
                  {saving ? "Saving..." : "Save Profile"}
                </button>
                {saveState ? <div style={{ fontSize: 13.5, color: S.muted }}>{saveState}</div> : null}
              </div>
            </form>
          </Surface>
        </div>

        {isAdmin ? (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
              <StatCard label="User Records" value={String(metrics.totalUsers)} detail={`${metrics.activeUsers} active or transacting`} />
              <StatCard label="Lead Queue" value={String(metrics.totalLeads)} detail={`${metrics.newLeads} new intake records`} />
              <StatCard label="Local Fallback" value={String(metrics.localFallbackLeadCount)} detail="Browser-captured leads if Firestore write access is unavailable." />
              <StatCard label="Admin View" value="Enabled" detail="Privileged emails can read both copied user records and Wright intake records." />
            </div>

            {opsError ? <Surface><div style={{ fontSize: 13.5, color: "#a33727" }}>{opsError}</div></Surface> : null}

            <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 18 }}>
              <Surface>
                <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: S.amber, marginBottom: 8 }}>Recent Leads</div>
                <div style={{ fontFamily: S.display, fontSize: 32, lineHeight: 1, textTransform: "uppercase", marginBottom: 16 }}>Wright intake queue.</div>
                <div style={{ display: "grid", gap: 10 }}>
                  {leads.slice(0, 8).map((entry) => (
                    <div key={entry.id} style={{ borderRadius: 16, padding: 14, background: S.soft, border: `1px solid ${S.line}` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                        <div style={{ fontSize: 14, fontWeight: 800 }}>{entry.contact?.name || entry.requester?.name || "Unnamed contact"}</div>
                        <div style={{ fontSize: 12.5, color: S.muted }}>{entry.type}</div>
                      </div>
                      <div style={{ marginTop: 6, fontSize: 13, lineHeight: 1.65, color: S.muted }}>
                        {(entry.contact?.company || "No company")} · {(entry.project?.location || "No location")} · {(entry.project?.service || "General inquiry")}
                      </div>
                      <div style={{ marginTop: 6, fontSize: 12.5, lineHeight: 1.6 }}>{entry.project?.details || "No details submitted."}</div>
                      <div style={{ marginTop: 8, fontSize: 12, color: S.muted }}>{formatDate(entry.createdAtLabel || entry.createdAt)}</div>
                    </div>
                  ))}
                  {!leads.length ? <div style={{ fontSize: 13.5, color: S.muted }}>No Wright intake records yet.</div> : null}
                </div>
              </Surface>

              <Surface>
                <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: S.amber, marginBottom: 8 }}>User Database</div>
                <div style={{ fontFamily: S.display, fontSize: 32, lineHeight: 1, textTransform: "uppercase", marginBottom: 16 }}>Profile records.</div>
                <div style={{ display: "grid", gap: 10 }}>
                  {users.slice(0, 8).map((entry) => (
                    <div key={entry.id} style={{ borderRadius: 16, padding: 14, background: S.soft, border: `1px solid ${S.line}` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                        <div style={{ fontSize: 14, fontWeight: 800 }}>{entry.name || entry.email || entry.id}</div>
                        <div style={{ fontSize: 12.5, color: S.muted }}>{formatWrightAccountType(entry.accountType)}</div>
                      </div>
                      <div style={{ marginTop: 6, fontSize: 13, lineHeight: 1.65, color: S.muted }}>
                        {(entry.userDatabase?.status || "onboarding")} · {(entry.userDatabase?.preferredContact || "email")} · {(entry.userDatabase?.targetMarket || "no market assigned")}
                      </div>
                      <div style={{ marginTop: 6, fontSize: 12.5, lineHeight: 1.6 }}>{entry.email || "No email"} · {entry.phone || "No phone"}</div>
                      <div style={{ marginTop: 8, fontSize: 12, color: S.muted }}>{formatDate(entry.updatedAtLabel || entry.updatedAt)}</div>
                    </div>
                  ))}
                  {!users.length ? <div style={{ fontSize: 13.5, color: S.muted }}>No Wright user profiles are visible yet.</div> : null}
                </div>
              </Surface>
            </div>
          </>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 18 }}>
              <Surface tone="soft">
                <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: S.amber, marginBottom: 8 }}>Member Benefits</div>
                <div style={{ fontFamily: S.display, fontSize: 30, lineHeight: 1, textTransform: "uppercase", marginBottom: 14 }}>A Wright account should save work, not just unlock a form.</div>
                <div style={{ display: "grid", gap: 12 }}>
                  {memberBenefits.map((item) => (
                    <div key={item.title} style={{ paddingBottom: 12, borderBottom: `1px solid ${S.line}` }}>
                      <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: S.dark }}>{item.title}</div>
                      <div style={{ marginTop: 6, fontSize: 13.5, lineHeight: 1.7, color: S.muted }}>{item.body}</div>
                    </div>
                  ))}
                </div>
              </Surface>

              <Surface>
                <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: S.amber, marginBottom: 8 }}>Profile draft</div>
                <div style={{ fontFamily: S.display, fontSize: 30, lineHeight: 1, textTransform: "uppercase", marginBottom: 8 }}>Current setup preview.</div>
                <div style={{ marginBottom: 14, color: S.muted, fontSize: 13, lineHeight: 1.6 }}>This checklist reflects the form above and is not saved progress. Save your profile to update the account record.</div>
                <div style={{ display: "grid", gap: 10 }}>
                  {readinessChecklist.map(([label, complete]) => (
                    <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: 12, paddingBottom: 10, borderBottom: `1px solid ${S.line}` }}>
                      <div style={{ fontSize: 13.5, lineHeight: 1.6 }}>{label}</div>
                      <div style={{ fontSize: 12.5, fontWeight: 800, color: complete ? S.lime : S.muted }}>
                        {complete ? "In draft" : "Not added"}
                      </div>
                    </div>
                  ))}
                </div>
              </Surface>
            </div>

            <Surface tone="soft">
              <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: S.amber, marginBottom: 8 }}>Account benefits</div>
              <div style={{ fontFamily: S.display, fontSize: 30, lineHeight: 1, textTransform: "uppercase", marginBottom: 14 }}>Your account should save time every time you return.</div>
              <div style={{ display: "grid", gap: 10 }}>
                {[
                  "Update contact details, request preferences, and service notes without starting over next time.",
                  "Saved account preferences help speed up quote requests, documents, and support follow-up.",
                  "Your dashboard keeps account details, readiness, and request history aligned in one place.",
                  "Approved WD Wright team members can review customer records and incoming requests from this same account area.",
                ].map((item) => (
                  <div key={item} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <span style={{ color: S.amber, fontWeight: 800 }}>•</span>
                    <span style={{ fontSize: 13.5, lineHeight: 1.7, color: S.muted }}>{item}</span>
                  </div>
                ))}
              </div>
            </Surface>
          </>
        )}
      </div>
    </div>
  );
}
