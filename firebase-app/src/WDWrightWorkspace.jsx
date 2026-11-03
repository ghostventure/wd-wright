"use client";

import React, { useEffect, useMemo, useState } from "react";
import { formatWrightAccountType, formatWrightPlatformId, isPrivilegedWrightUser, readLocalWrightLeads, subscribeToWrightLeads, subscribeToWrightUsers } from "./wd-wright-backend.js";
import WDWrightBrandLockup from "./WDWrightBrandLockup.jsx";
import { WDWRIGHT_THEME } from "./wd-wright-theme.js";

const S = {
  bg: WDWRIGHT_THEME.bg,
  card: WDWRIGHT_THEME.card,
  soft: WDWRIGHT_THEME.bgAlt,
  text: WDWRIGHT_THEME.textBody,
  muted: WDWRIGHT_THEME.textMuted,
  dark: WDWRIGHT_THEME.dark,
  pine: WDWRIGHT_THEME.darkSoft,
  amber: WDWRIGHT_THEME.accent,
  lime: WDWRIGHT_THEME.accentStrong,
  line: WDWRIGHT_THEME.border,
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

function computeProfileDepth(user = {}, form = {}) {
  const fields = [
    Boolean((form.name || user?.name || "").trim()),
    Boolean((user?.email || "").trim()),
    Boolean((form.phone || user?.phone || "").trim()),
    Boolean(form.preferredContact || user?.userDatabase?.preferredContact),
    Boolean(form.targetMarket || user?.userDatabase?.targetMarket),
    Boolean(form.transactionIntent || user?.userDatabase?.transactionIntent),
    Boolean(form.timelineBand || user?.userDatabase?.timelineBand),
    Boolean(form.budgetBand || user?.userDatabase?.budgetBand),
    Boolean(form.preferredLanguage || user?.userDatabase?.preferredLanguage),
    Boolean(form.timezone || user?.userDatabase?.timezone),
    Boolean((form.tags || "").trim() || (user?.userDatabase?.tags || []).length),
    Boolean((form.notes || "").trim() || user?.userDatabase?.notes),
    form.marketingOptIn === true || user?.userDatabase?.marketingOptIn === true,
  ];

  return Math.round((fields.filter(Boolean).length / fields.length) * 100);
}

function buildReadinessChecklist(user = {}, form = {}) {
  return [
    ["Identity on file", Boolean((form.name || user?.name || "").trim() && (user?.email || "").trim())],
    ["Direct contact method saved", Boolean((form.phone || user?.phone || "").trim() || form.preferredContact === "email")],
    ["Service intent selected", Boolean(form.transactionIntent || user?.userDatabase?.transactionIntent)],
    ["Target market saved", Boolean((form.targetMarket || user?.userDatabase?.targetMarket || "").trim())],
    ["Timeline captured", Boolean(form.timelineBand || user?.userDatabase?.timelineBand)],
    ["Budget guidance saved", Boolean(form.budgetBand || user?.userDatabase?.budgetBand)],
    ["Language and timezone set", Boolean((form.preferredLanguage || user?.userDatabase?.preferredLanguage) && (form.timezone || user?.userDatabase?.timezone))],
    ["Routing notes or tags added", Boolean((form.notes || "").trim() || (form.tags || "").trim() || user?.userDatabase?.notes || (user?.userDatabase?.tags || []).length)],
  ];
}

function StatCard({ label, value, detail }) {
  return (
    <div style={{ borderRadius: 18, padding: 16, background: S.card, border: `1px solid ${S.line}`, boxShadow: "0 10px 26px rgba(20,35,37,0.05)" }}>
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
        borderRadius: 22,
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
    setSaving(true);
    setSaveState("");

    try {
      await onSaveProfile({
        ...user,
        name: form.name.trim() || user?.name || "Wright User",
        phone: form.phone.trim(),
        userDatabase: {
          ...user?.userDatabase,
          preferredContact: form.preferredContact,
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
      setSaveState("Account details saved.");
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
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 20% 10%, rgba(91,154,160,0.18), transparent 28%), radial-gradient(circle at 100% 0%, rgba(255,255,255,0.08), transparent 26%)" }} />
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
          <StatCard label="Profile Depth" value={`${profileDepthScore}%`} detail={`${readinessCount}/${readinessChecklist.length} readiness signals saved`} />
          <StatCard label="Last Update" value={user?.updatedAt ? "Synced" : "Local"} detail={formatDate(user?.updatedAt || user?.createdAt)} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "minmax(300px, 0.9fr) minmax(0, 1.1fr)", gap: 18 }}>
          <Surface>
            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: S.amber, marginBottom: 8 }}>Account</div>
            <div style={{ fontFamily: S.display, fontSize: 34, lineHeight: 0.98, textTransform: "uppercase", marginBottom: 16 }}>{user?.name || "Wright User"}</div>
            <div style={{ display: "grid", gap: 10 }}>
              {[
                ["Email", user?.email || "Not available"],
                ["Phone", user?.phone || "Not available"],
                ["Intent", titleCaseLabel(user?.userDatabase?.transactionIntent || "service")],
                ["Timeline", titleCaseLabel(user?.userDatabase?.timelineBand || "undisclosed")],
                ["Budget", titleCaseLabel(user?.userDatabase?.budgetBand || "undisclosed")],
                ["Target market", user?.userDatabase?.targetMarket || "Not set"],
                ["Language", user?.userDatabase?.preferredLanguage || "English"],
                ["Timezone", user?.userDatabase?.timezone || "America/New_York"],
                ["Stage owner", user?.userDatabase?.stageOwner || "Not assigned"],
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
              The fuller this record gets, the faster Wright can route service requests, preserve your documentation preferences, and prefill future intake.
            </div>
            <form onSubmit={handleSave} style={{ display: "grid", gap: 12 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
                <label style={{ display: "grid", gap: 6, fontSize: 12.5, fontWeight: 700 }}>
                  Name
                  <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} style={{ minHeight: 44, borderRadius: 12, border: `1px solid ${S.line}`, padding: "0 12px", fontFamily: S.sans, fontSize: 14 }} />
                </label>
                <label style={{ display: "grid", gap: 6, fontSize: 12.5, fontWeight: 700 }}>
                  Phone
                  <input value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} style={{ minHeight: 44, borderRadius: 12, border: `1px solid ${S.line}`, padding: "0 12px", fontFamily: S.sans, fontSize: 14 }} />
                </label>
                <label style={{ display: "grid", gap: 6, fontSize: 12.5, fontWeight: 700 }}>
                  Preferred Contact
                  <select value={form.preferredContact} onChange={(event) => setForm((current) => ({ ...current, preferredContact: event.target.value }))} style={{ minHeight: 44, borderRadius: 12, border: `1px solid ${S.line}`, padding: "0 12px", fontFamily: S.sans, fontSize: 14 }}>
                    {["email", "phone", "sms", "in_app"].map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
                <label style={{ display: "grid", gap: 6, fontSize: 12.5, fontWeight: 700 }}>
                  Support Tier
                  <select value={form.supportTier} onChange={(event) => setForm((current) => ({ ...current, supportTier: event.target.value }))} style={{ minHeight: 44, borderRadius: 12, border: `1px solid ${S.line}`, padding: "0 12px", fontFamily: S.sans, fontSize: 14 }}>
                    {["standard", "priority", "white_glove"].map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
                <label style={{ display: "grid", gap: 6, fontSize: 12.5, fontWeight: 700 }}>
                  Service Intent
                  <select value={form.transactionIntent} onChange={(event) => setForm((current) => ({ ...current, transactionIntent: event.target.value }))} style={{ minHeight: 44, borderRadius: 12, border: `1px solid ${S.line}`, padding: "0 12px", fontFamily: S.sans, fontSize: 14 }}>
                    {["service", "browse", "buy", "sell", "buy_sell", "invest"].map((option) => (
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
                <label style={{ display: "grid", gap: 6, fontSize: 12.5, fontWeight: 700 }}>
                  Stage Owner
                  <input value={form.stageOwner} onChange={(event) => setForm((current) => ({ ...current, stageOwner: event.target.value }))} style={{ minHeight: 44, borderRadius: 12, border: `1px solid ${S.line}`, padding: "0 12px", fontFamily: S.sans, fontSize: 14 }} />
                </label>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
                <label style={{ display: "grid", gap: 6, fontSize: 12.5, fontWeight: 700 }}>
                  Timeline
                  <select value={form.timelineBand} onChange={(event) => setForm((current) => ({ ...current, timelineBand: event.target.value }))} style={{ minHeight: 44, borderRadius: 12, border: `1px solid ${S.line}`, padding: "0 12px", fontFamily: S.sans, fontSize: 14 }}>
                    {["immediate", "30_days", "90_days", "6_months", "12_months_plus", "undisclosed"].map((option) => (
                      <option key={option} value={option}>
                        {titleCaseLabel(option)}
                      </option>
                    ))}
                  </select>
                </label>
                <label style={{ display: "grid", gap: 6, fontSize: 12.5, fontWeight: 700 }}>
                  Budget Band
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
                  Send Wright account updates about quote progress, documentation follow-up, recruiting responses, and service availability.
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
                <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: S.amber, marginBottom: 8 }}>Readiness</div>
                <div style={{ fontFamily: S.display, fontSize: 30, lineHeight: 1, textTransform: "uppercase", marginBottom: 14 }}>Your account is {profileDepthScore >= 75 ? "intake-ready" : "still gaining value"}.</div>
                <div style={{ display: "grid", gap: 10 }}>
                  {readinessChecklist.map(([label, complete]) => (
                    <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: 12, paddingBottom: 10, borderBottom: `1px solid ${S.line}` }}>
                      <div style={{ fontSize: 13.5, lineHeight: 1.6 }}>{label}</div>
                      <div style={{ fontSize: 12.5, fontWeight: 800, color: complete ? S.lime : S.muted }}>
                        {complete ? "Ready" : "Missing"}
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
