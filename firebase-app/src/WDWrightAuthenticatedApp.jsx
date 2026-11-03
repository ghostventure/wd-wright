"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  AdminWorkbenchView,
  ConfirmDialog,
  DocumentVaultView,
  NotificationCenterView,
  ToastHost,
  TransactionMilestonesView,
} from "./GuiFeatureViews.jsx";
import WDWrightBrandLockup from "./WDWrightBrandLockup.jsx";
import { AmbientSection, BreadcrumbTrail, EmptyPanel, FilePreviewModal, HelpDrawer, QuickActionRail, ResponsiveDataList, SegmentedThemeToggle, StatusPill } from "./WDWrightUiKit.jsx";
import WDWrightWorkspace from "./WDWrightWorkspace.jsx";
import {
  AccountSetupPanel,
  CustomerRequestPanel,
  DocumentReadinessPanel,
  FieldJobBriefPanel,
  FieldReadinessPanel,
  NotificationPreferencesPanel,
  ProjectContactsPanel,
  SafetyResourcesPanel,
  SavedLocationsPanel,
} from "./WDWrightAccountExperience.jsx";
import { getOneWrightId, isPrivilegedWrightUser } from "./wd-wright-backend.js";
import { useWrightThemeMode, WRIGHT_THEME_OPTIONS } from "./wd-wright-theme-sync.js";
import { WDWRIGHT_THEME } from "./wd-wright-theme.js";

const THEMES = {
  "wright-day": {
    background: "linear-gradient(180deg, #eef2e8 0%, #f8faf5 44%, #daddcf 100%)",
    shell: "rgba(252, 252, 248, 0.9)",
    shellBorder: "rgba(18, 30, 28, 0.1)",
    panel: "rgba(255,255,255,0.96)",
    panelSoft: "#f1f4ec",
    dark: "#111d1d",
    text: "#243233",
    muted: "#5c6c6d",
    line: "#d5ddd4",
    accent: WDWRIGHT_THEME.accent,
    accentText: "#ffffff",
    accentSoft: "rgba(91, 154, 160, 0.16)",
    strong: "#315e63",
    badge: "rgba(49, 94, 99, 0.1)",
  },
  "wright-night": {
    background: "linear-gradient(180deg, #081012 0%, #111d21 50%, #1b2629 100%)",
    shell: "rgba(8, 16, 18, 0.86)",
    shellBorder: "rgba(255,255,255,0.08)",
    panel: "rgba(16, 26, 29, 0.94)",
    panelSoft: "rgba(26, 38, 41, 0.96)",
    dark: "#f3f5f1",
    text: "#dce6e1",
    muted: "#97aba6",
    line: "rgba(255,255,255,0.1)",
    accent: WDWRIGHT_THEME.accent,
    accentText: "#ffffff",
    accentSoft: "rgba(91, 154, 160, 0.16)",
    strong: "#8ec1c5",
    badge: "rgba(142, 193, 197, 0.12)",
  },
  "wright-safety": {
    background: "linear-gradient(180deg, #1c200f 0%, #2a3018 48%, #101407 100%)",
    shell: "rgba(20, 24, 10, 0.9)",
    shellBorder: "rgba(240, 174, 47, 0.18)",
    panel: "rgba(28, 32, 15, 0.95)",
    panelSoft: "rgba(40, 44, 20, 0.97)",
    dark: "#fcf8ea",
    text: "#efe7c8",
    muted: "#c8bf98",
    line: "rgba(240, 174, 47, 0.16)",
    accent: WDWRIGHT_THEME.accent,
    accentText: "#ffffff",
    accentSoft: "rgba(91, 154, 160, 0.18)",
    strong: "#d7c775",
    badge: "rgba(215, 199, 117, 0.14)",
  },
};

function pageButton(isActive, palette) {
  return {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    textAlign: "left",
    padding: "12px 14px",
    borderRadius: 16,
    border: `1px solid ${isActive ? palette.accent : palette.line}`,
    background: isActive ? palette.accentSoft : "transparent",
    color: palette.dark,
    cursor: "pointer",
    fontFamily: WDWRIGHT_THEME.sans,
  };
}

function createToast(title, message = "", tone = "info") {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title,
    message,
    tone,
  };
}

function cleanEmail(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function hasWrightCompanyEmail(user = {}) {
  return cleanEmail(user?.email).endsWith("@wdwright.com");
}

function getManagerAccessSource(user = {}) {
  const accountType = String(user?.accountType || "").toLowerCase();
  if (isPrivilegedWrightUser(user)) return "Privileged WD Wright account";
  if (accountType === "agent") return "Company rep account";
  if (hasWrightCompanyEmail(user)) return "WD Wright work email";
  return "Standard account";
}

function sectionTitle(label, title, body, palette) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase", color: palette.strong, marginBottom: 8 }}>
        {label}
      </div>
      <h2 style={{ margin: 0, fontFamily: WDWRIGHT_THEME.display, fontSize: "clamp(2rem, 4vw, 3rem)", lineHeight: 0.96, textTransform: "uppercase", color: palette.dark }}>
        {title}
      </h2>
      <p style={{ margin: "10px 0 0", maxWidth: 760, fontSize: 14, lineHeight: 1.7, color: palette.muted, fontFamily: WDWRIGHT_THEME.sans }}>
        {body}
      </p>
    </div>
  );
}

function surface(children, palette, style = {}) {
  return (
    <section
      style={{
        background: palette.panel,
        border: `1px solid ${palette.line}`,
        borderRadius: 24,
        padding: 22,
        boxShadow: "0 20px 56px rgba(12, 20, 18, 0.12)",
        ...style,
      }}
    >
      {children}
    </section>
  );
}

function metricCard(label, value, detail, palette) {
  return (
    <div style={{ borderRadius: 20, border: `1px solid ${palette.line}`, background: palette.panelSoft, padding: 18 }}>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase", color: palette.strong }}>
        {label}
      </div>
      <div style={{ marginTop: 10, fontFamily: WDWRIGHT_THEME.display, fontSize: 30, lineHeight: 0.98, textTransform: "uppercase", color: palette.dark }}>
        {value}
      </div>
      <div style={{ marginTop: 8, fontSize: 13, lineHeight: 1.6, color: palette.muted, fontFamily: WDWRIGHT_THEME.sans }}>
        {detail}
      </div>
    </div>
  );
}

function isManagerDeskUser(user = {}) {
  const accountType = String(user?.accountType || "").toLowerCase();
  return isPrivilegedWrightUser(user) || accountType === "agent" || hasWrightCompanyEmail(user);
}

function WrightOverviewView({ user, palette, onNavigate, onOpenPublicPage, onLogout, isAdmin, isManager }) {
  const oneId = getOneWrightId(user) || "Pending";
  const profileDepth = Number(user?.userDatabase?.profileDepthScore || 0);
  const protectedSurfaces = [
    "Quote intake",
    "Contact intake",
    "Resources",
    "Help",
    "Document vault",
    "Account dashboard",
  ];
  const featureCards = [
    ["Booking & Intake", "Protected quote and service-request entry with saved account context.", "Booking", () => onOpenPublicPage("/quote")],
    ["Scheduling & Timeline", "Keep milestones, timing, and next steps together in one signed-in area.", "Scheduling", () => onNavigate("scheduling")],
    ["Profile Management", "Update service intent, contact preferences, tags, and account readiness.", "Profile", () => onNavigate("profile")],
    ["Security & Sign-In", "Review account identity, session status, and sign-in protections.", "Security", () => onNavigate("security")],
    ["Documents", "Keep protected files and future packets inside your WD Wright account.", "Documents", () => onNavigate("documents")],
    ["Notifications", "Track updates, reminders, and account activity.", "Alerts", () => onNavigate("notifications")],
    ["Account Settings", "Theme, session, support preferences, and account controls.", "Settings", () => onNavigate("settings")],
    ["Help & Resources", "Signed-in help, reference content, and support access.", "Support", () => onNavigate("resources")],
  ];
  if (isAdmin) {
    featureCards.push(["Admin Review", "Approved review tools for records, transactions, and protected operations.", "Admin", () => onNavigate("admin-workbench")]);
  }
  if (isManager) {
    featureCards.push(["Manager's Desk", "Regional operations, dispatch posture, desk ownership, and active management signals.", "Manager", () => onNavigate("manager-desk")]);
  }

  return (
    <div style={{ display: "grid", gap: 18 }}>
      {surface(
        <>
          {sectionTitle(
            "Dashboard",
            `Welcome to WD Wright, ${user?.name?.split?.(" ")?.[0] || "Operator"}.`,
            "This dashboard brings booking, scheduling, profile management, security, documents, notifications, and account settings together for your WD Wright account.",
            palette
          )}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
            {metricCard("WD Wright ID", oneId, "Your shared account identifier across signed-in WD Wright pages.", palette)}
            {metricCard("Profile Depth", `${profileDepth}%`, "A fuller account speeds quote intake, documentation routing, and support handling.", palette)}
            {metricCard("Account Reach", `${protectedSurfaces.length} areas`, "Quote, help, documents, and account pages stay connected to one sign-in.", palette)}
            {metricCard("Theme State", "Synced", "Theme mode stays consistent across WD Wright pages.", palette)}
          </div>
        </>,
        palette
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))", gap: 14 }}>
        <CustomerRequestPanel palette={palette} onOpenQuote={() => onOpenPublicPage("/quote")} />
        <AccountSetupPanel user={user} palette={palette} onOpenProfile={() => onNavigate("profile")} />
      </div>
      {surface(
        <>
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: palette.strong, marginBottom: 12 }}>
            Available Features
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
            {featureCards.map(([title, body, badge, action]) => (
              <button
                key={title}
                type="button"
                onClick={action}
                style={{ border: `1px solid ${palette.line}`, background: palette.panelSoft, borderRadius: 18, padding: 18, textAlign: "left", cursor: "pointer" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "start" }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: palette.dark, fontFamily: WDWRIGHT_THEME.sans }}>{title}</div>
                  <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: palette.strong, fontFamily: WDWRIGHT_THEME.sans }}>{badge}</div>
                </div>
                <div style={{ marginTop: 8, fontSize: 13, lineHeight: 1.65, color: palette.muted, fontFamily: WDWRIGHT_THEME.sans }}>{body}</div>
              </button>
            ))}
          </div>
        </>,
        palette
      )}
      <QuickActionRail
        palette={{ line: palette.line, panelSoft: palette.panelSoft, dark: palette.dark, muted: palette.muted, strong: palette.strong }}
        items={[
          { kicker: "Request", label: "Protected quote", body: "Move directly into signed-in service intake with saved account context.", onClick: () => onOpenPublicPage("/quote") },
          { kicker: "Prepare", label: "Update profile", body: "Tighten readiness, timeline, and contact preferences before follow-up.", onClick: () => onNavigate("profile") },
          { kicker: "Review", label: "Open documents", body: "Jump into protected files, uploads, and related account paperwork.", onClick: () => onNavigate("documents") },
        ]}
      />
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.05fr) minmax(300px, 0.95fr)", gap: 18 }}>
        {surface(
          <>
            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: palette.strong, marginBottom: 10 }}>
              Quick Actions
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
              {[
                ["Open Profile", "Update profile, readiness, tags, and account preferences.", () => onNavigate("profile")],
                ["Open Account Settings", "Review theme, session, and account controls.", () => onNavigate("settings")],
                ["Review Document Vault", "Upload protected packets and keep supporting files in one place.", () => onNavigate("documents")],
                ["Open Scheduling", "Use the scheduling shell for transaction and milestone tracking.", () => onNavigate("scheduling")],
                ["Protected Booking", "Open the signed-in quote and booking page with saved account details.", () => onOpenPublicPage("/quote")],
              ].map(([title, body, action]) => (
                <button
                  key={title}
                  type="button"
                  onClick={action}
                  style={{ border: `1px solid ${palette.line}`, background: palette.panelSoft, borderRadius: 18, padding: 16, textAlign: "left", cursor: "pointer" }}
                >
                  <div style={{ fontSize: 14, fontWeight: 800, color: palette.dark, fontFamily: WDWRIGHT_THEME.sans }}>{title}</div>
                  <div style={{ marginTop: 8, fontSize: 13, lineHeight: 1.65, color: palette.muted, fontFamily: WDWRIGHT_THEME.sans }}>{body}</div>
                </button>
              ))}
            </div>
          </>,
          palette
        )}
        {surface(
          <>
            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: palette.strong, marginBottom: 10 }}>
              Account Coverage
            </div>
            <div style={{ display: "grid", gap: 10 }}>
              {protectedSurfaces.map((item) => (
                <div key={item} style={{ display: "flex", justifyContent: "space-between", gap: 12, paddingBottom: 10, borderBottom: `1px solid ${palette.line}` }}>
                  <div style={{ fontSize: 13.5, lineHeight: 1.6, color: palette.text, fontFamily: WDWRIGHT_THEME.sans }}>{item}</div>
                  <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: palette.strong, fontFamily: WDWRIGHT_THEME.sans }}>
                    Active
                  </div>
                </div>
              ))}
            </div>
            <button type="button" onClick={() => onLogout?.()} style={{ marginTop: 16, border: "none", background: palette.accent, color: palette.accentText, borderRadius: 14, minHeight: 44, padding: "0 14px", cursor: "pointer", fontWeight: 800, fontFamily: WDWRIGHT_THEME.sans }}>
              Sign Out Everywhere
            </button>
          </>,
          palette
        )}
      </div>
    </div>
  );
}

function WrightManagersDeskView({ user, palette, onNavigate, isAdmin }) {
  const [deskMarket, setDeskMarket] = useState(user?.userDatabase?.targetMarket || "");
  const oneId = getOneWrightId(user) || "Pending";
  const managerAccessSource = getManagerAccessSource(user);
  const managerProfileRows = [
    { id: "mgr-1", field: "Desk owner", value: user?.name || user?.email || "Manager", note: "Current signed-in manager account" },
    { id: "mgr-2", field: "Signed-in email", value: user?.email || "Pending", note: "This email anchors manager access and sign-in recovery" },
    { id: "mgr-3", field: "Access source", value: managerAccessSource, note: "Manager visibility is resolved from this account identity" },
    { id: "mgr-4", field: "WD Wright OneID", value: oneId, note: "Shared identity across protected WD Wright pages" },
    { id: "mgr-5", field: "Sign-in scope", value: "OneID, all of WD Wright", note: "Sign-in and sign-out propagate across the protected shell" },
    { id: "mgr-6", field: "Department", value: user?.employeeProfile?.department || "Operations", note: "Structured company profile field" },
    { id: "mgr-7", field: "Office", value: user?.employeeProfile?.office || "Not set", note: "Structured office assignment for the manager account" },
    { id: "mgr-8", field: "Title", value: user?.employeeProfile?.title || "Manager", note: "Current company title on the account" },
    { id: "mgr-9", field: "Manager level", value: user?.employeeProfile?.managerLevel || "none", note: "Company hierarchy level for this profile" },
    { id: "mgr-10", field: "Market", value: user?.userDatabase?.targetMarket || "Not set", note: "Market saved in this account profile" },
    { id: "mgr-11", field: "Support tier", value: user?.userDatabase?.supportTier || "standard", note: "Account servicing posture" },
    { id: "mgr-12", field: "Stage owner", value: user?.userDatabase?.stageOwner || "Not assigned", note: "Current desk owner label" },
  ];
  const dispatchRows = [];
  const timelineRows = [];
  const feedRows = [];
  const crewRows = [];
  const escalationRows = [];
  const activeJobRows = [];
  const taskInboxRows = [];
  const documentApprovalRows = [];
  const urgentAlerts = [];
  const handoffRows = [];
  const managerActions = [
    { kicker: "Review", label: "Open jobs", body: "Move from desk posture into active jobs and scheduled work.", onClick: () => onNavigate("jobs") },
    { kicker: "Route", label: "Open booking", body: "Review intake, support tickets, and service follow-up from the desk.", onClick: () => onNavigate("booking") },
    { kicker: "Protect", label: "Open documents", body: "Check protected packets, release status, and share controls.", onClick: () => onNavigate("documents") },
  ];
  if (isAdmin) {
    managerActions.push({ kicker: "Escalate", label: "Open admin workbench", body: "Move into privileged review queues and bulk operations.", onClick: () => onNavigate("admin-workbench") });
  }

  return (
    <div style={{ display: "grid", gap: 18 }}>
      {surface(
        <>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", marginBottom: 14 }}>
            <StatusPill label={managerAccessSource} tone="accent" palette={{ line: palette.line, panelSoft: palette.panelSoft, muted: palette.muted, accentSoft: palette.accentSoft, accent: palette.accent, strong: palette.strong }} />
            <StatusPill label="OneID active" palette={{ line: palette.line, panelSoft: palette.panelSoft, muted: palette.muted, strong: palette.strong }} />
            <StatusPill label={user?.email || "Email pending"} palette={{ line: palette.line, panelSoft: palette.panelSoft, muted: palette.muted, strong: palette.strong }} />
          </div>
          {sectionTitle(
            "Manager's Desk",
            "Operational desk posture, routing signals, and management context.",
            "This desk profile gives WD Wright managers a clearer operating view across dispatch, timeline state, crew posture, capacity, and desk ownership, all tied to the signed-in work account.",
            palette
          )}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
            {metricCard("Office Desk", user?.employeeProfile?.office || "Not set", "Office assignment saved on this account profile.", palette)}
            {metricCard("Market", deskMarket || "Not set", "Selected market is a local view preference only.", palette)}
            {metricCard("Dispatch Feed", "Not connected", "Live queues and capacity are unavailable.", palette)}
            {metricCard("Crew Ready", crew.availableNow ? "Yes" : "Watch", `${crew.region || "general"} coverage status`, palette)}
          </div>
          <div style={{ marginTop: 16, display: "grid", gap: 6 }}>
            <label style={{ display: "grid", gap: 6, fontSize: 12.5, fontWeight: 700, color: palette.text, fontFamily: WDWRIGHT_THEME.sans }}>
              Office coverage selector
              <select value={deskMarket} onChange={(event) => setDeskMarket(event.target.value)} style={{ minHeight: 44, borderRadius: 12, border: `1px solid ${palette.line}`, padding: "0 12px", fontFamily: WDWRIGHT_THEME.sans, fontSize: 14, background: palette.panelSoft, color: palette.dark }}>
                {["North Carolina", "Florida", "Pennsylvania", "Virginia", "Ohio", "Indiana", "General Coverage"].map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </>,
        palette
      )}
      {surface(
        <>
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: palette.strong, marginBottom: 10 }}>
            OneID Manager Access
          </div>
          <div style={{ display: "grid", gap: 10 }}>
            {[
              `Manager access is bound to ${user?.email || "the current signed-in account"}.`,
              `WD Wright OneID: ${oneId}.`,
              "The same OneID opens the protected dashboard, booking, documents, settings, and manager surfaces.",
              "Signing out from this desk signs out the protected WD Wright shell everywhere this account is active.",
            ].map((item) => (
              <div key={item} style={{ borderRadius: 16, border: `1px solid ${palette.line}`, background: palette.panelSoft, padding: 14, fontSize: 13.5, lineHeight: 1.65, color: palette.text, fontFamily: WDWRIGHT_THEME.sans }}>
                {item}
              </div>
            ))}
          </div>
        </>,
        palette
      )}
      {surface(
        <>
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: palette.strong, marginBottom: 10 }}>
            Urgent Alerts
          </div>
          <div style={{ display: "grid", gap: 10 }}>
              {urgentAlerts.length ? urgentAlerts.map((item) => (
              <div key={item} style={{ borderRadius: 16, border: `1px solid ${palette.accent}`, background: palette.accentSoft, padding: 14, fontSize: 13.5, lineHeight: 1.65, color: palette.dark, fontFamily: WDWRIGHT_THEME.sans }}>
                {item}
              </div>
              )) : <div style={{ color: palette.muted, fontSize: 13 }}>No live dispatch alerts are connected.</div>}
          </div>
        </>,
        palette
      )}
      {surface(
        <>
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: palette.strong, marginBottom: 10 }}>
            Desk Profile
          </div>
          <ResponsiveDataList
            palette={palette}
            columns={[
              { key: "field", label: "Field" },
              { key: "value", label: "Value" },
              { key: "note", label: "Note" },
            ]}
            rows={managerProfileRows}
          />
        </>,
        palette
      )}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 18 }}>
        {surface(
          <>
            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: palette.strong, marginBottom: 10 }}>
              Dispatch Posture
            </div>
            <ResponsiveDataList
              palette={palette}
              columns={[
                { key: "queue", label: "Queue" },
                { key: "priority", label: "Priority" },
                { key: "office", label: "Office" },
                { key: "score", label: "Signal" },
              ]}
              rows={dispatchRows}
              emptyTitle="No dispatch connection"
              emptyBody="Live queue and assignment data are unavailable."
            />
          </>,
          palette
        )}
        {surface(
          <>
            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: palette.strong, marginBottom: 10 }}>
              Timeline Review
            </div>
            <ResponsiveDataList
              palette={palette}
              columns={[
                { key: "stage", label: "Stage" },
                { key: "status", label: "Status" },
                { key: "owner", label: "Owner" },
              ]}
              rows={timelineRows}
              emptyTitle="No live timeline"
              emptyBody="Job milestones will appear when an operations feed is connected."
            />
          </>,
          palette
        )}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 18 }}>
        {surface(
          <>
            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: palette.strong, marginBottom: 10 }}>
              Crew Availability
            </div>
            <ResponsiveDataList
              palette={palette}
              columns={[
                { key: "region", label: "Region" },
                { key: "available", label: "Availability" },
                { key: "queue", label: "Queue" },
                { key: "desk", label: "Desk" },
              ]}
              rows={crewRows}
              emptyTitle="No crew feed"
              emptyBody="Crew availability is not connected."
            />
          </>,
          palette
        )}
        {surface(
          <>
            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: palette.strong, marginBottom: 10 }}>
              Escalation Queue
            </div>
            <ResponsiveDataList
              palette={palette}
              columns={[
                { key: "queue", label: "Queue" },
                { key: "trigger", label: "Trigger" },
                { key: "sla", label: "SLA" },
                { key: "owner", label: "Owner" },
              ]}
              rows={escalationRows}
              emptyTitle="No escalation queue"
              emptyBody="Escalation data is not connected."
            />
          </>,
          palette
        )}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 18 }}>
        {surface(
          <>
            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: palette.strong, marginBottom: 10 }}>
              Shift Feed
            </div>
            <ResponsiveDataList
              palette={palette}
              columns={[
                { key: "type", label: "Type" },
                { key: "office", label: "Office" },
                { key: "detail", label: "Detail" },
              ]}
              rows={feedRows}
              emptyTitle="No shift feed"
              emptyBody="Shift updates are not connected."
            />
          </>,
          palette
        )}
        {surface(
          <>
            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: palette.strong, marginBottom: 10 }}>
              Desk Guidance
            </div>
            <div style={{ display: "grid", gap: 10 }}>
              {[
                `Selected market: ${deskMarket || "Not set"}`,
                `Department: ${user?.employeeProfile?.department || "Not set"}`,
                `Support tier: ${user?.userDatabase?.supportTier || "Not set"}`,
                "Live scheduling and escalation are not connected.",
              ].map((item) => (
                <div key={item} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <span style={{ color: palette.accent, fontWeight: 800 }}>•</span>
                  <span style={{ fontSize: 13.5, lineHeight: 1.7, color: palette.text, fontFamily: WDWRIGHT_THEME.sans }}>{item}</span>
                </div>
              ))}
            </div>
          </>,
          palette
        )}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 18 }}>
        {surface(
          <>
            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: palette.strong, marginBottom: 10 }}>
              Active Jobs
            </div>
            <ResponsiveDataList
              palette={palette}
              columns={[
                { key: "job", label: "Job" },
                { key: "phase", label: "Phase" },
                { key: "owner", label: "Owner" },
                { key: "next", label: "Next step" },
              ]}
              rows={activeJobRows}
              emptyTitle="No connected jobs"
              emptyBody="Active jobs are not available in the current account feed."
            />
          </>,
          palette
        )}
        {surface(
          <>
            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: palette.strong, marginBottom: 10 }}>
              Manager Task Inbox
            </div>
            <ResponsiveDataList
              palette={palette}
              columns={[
                { key: "task", label: "Task" },
                { key: "due", label: "Due" },
                { key: "owner", label: "Owner" },
                { key: "status", label: "Status" },
              ]}
              rows={taskInboxRows}
              emptyTitle="No manager tasks"
              emptyBody="Manager tasks are not connected."
            />
          </>,
          palette
        )}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 18 }}>
        {surface(
          <>
            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: palette.strong, marginBottom: 10 }}>
              Document Approval Queue
            </div>
            <ResponsiveDataList
              palette={palette}
              columns={[
                { key: "packet", label: "Packet" },
                { key: "status", label: "Status" },
                { key: "reviewer", label: "Reviewer" },
                { key: "next", label: "Next step" },
              ]}
              rows={documentApprovalRows}
              emptyTitle="No approval queue"
              emptyBody="Document approvals are not connected."
            />
          </>,
          palette
        )}
        {surface(
          <>
            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: palette.strong, marginBottom: 10 }}>
              Cross-Office Handoffs
            </div>
            <ResponsiveDataList
              palette={palette}
              columns={[
                { key: "from", label: "From" },
                { key: "to", label: "To" },
                { key: "reason", label: "Reason" },
                { key: "window", label: "Window" },
              ]}
              rows={handoffRows}
              emptyTitle="No handoffs"
              emptyBody="Cross-office handoff data is not connected."
            />
          </>,
          palette
        )}
      </div>
      <QuickActionRail palette={{ line: palette.line, panelSoft: palette.panelSoft, dark: palette.dark, muted: palette.muted, strong: palette.strong }} items={managerActions} />
    </div>
  );
}

function WrightPassportView({ user, palette }) {
  const fields = [
    ["Name", user?.name || "Pending"],
    ["Email", user?.email || "Pending"],
    ["Phone", user?.phone || "Pending"],
    ["WD Wright ID", getOneWrightId(user) || "Pending"],
    ["Preferred Contact", user?.userDatabase?.preferredContact || "email"],
    ["Service Intent", user?.userDatabase?.transactionIntent || "service"],
    ["Target Market", user?.userDatabase?.targetMarket || "Not set"],
    ["Timezone", user?.userDatabase?.timezone || "America/New_York"],
  ];
  const accountBenefits = [
    "Reusable intake data for faster future quote requests",
    "Protected document and support access behind the same account",
    "One sign-in across the WD Wright public site and dashboard",
    "Shared theme state and account details on signed-in pages",
  ];
  const securityChecks = [
    ["Signed in", Boolean(user?.email)],
    ["Contact method saved", Boolean(user?.phone || user?.userDatabase?.preferredContact)],
    ["Profile updated", Boolean(user?.updatedAt || user?.createdAt)],
    ["Protected pages available", true],
  ];
  const trustedDevices = user?.security?.trustedDevice
    ? [{ id: "current", device: "Current browser", status: "Trusted", access: "Persistent" }]
    : [];

  return (
    <div style={{ display: "grid", gap: 18 }}>
      {surface(
        <>
          {sectionTitle(
            "Account Security",
            "One sign-in for your WD Wright account",
            "Review the account details tied to your protected pages, documents, requests, and dashboard access.",
            palette
          )}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
            {fields.map(([label, value]) => metricCard(label, String(value), "Saved on your WD Wright account.", palette))}
          </div>
        </>,
        palette
      )}
      {surface(
        <>
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: palette.strong, marginBottom: 10 }}>
            Security Status
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
            {securityChecks.map(([label, complete]) => (
              <div key={label} style={{ borderRadius: 18, border: `1px solid ${palette.line}`, background: palette.panelSoft, padding: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: palette.dark, fontFamily: WDWRIGHT_THEME.sans }}>{label}</div>
                <div style={{ marginTop: 8, fontSize: 13, lineHeight: 1.65, color: palette.muted, fontFamily: WDWRIGHT_THEME.sans }}>
                  {complete ? "Ready" : "Needs attention"}
                </div>
              </div>
            ))}
          </div>
        </>,
        palette
      )}
      {surface(
        <>
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: palette.strong, marginBottom: 10 }}>
            Trusted Devices
          </div>
          <ResponsiveDataList
            palette={palette}
            columns={[
              { key: "device", label: "Device" },
              { key: "status", label: "Status" },
              { key: "access", label: "Access" },
            ]}
            rows={trustedDevices}
            emptyTitle="No trusted devices"
            emptyBody="Trusted-device state will appear here as account security matures."
          />
        </>,
        palette
      )}
      {surface(
        <>
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: palette.strong, marginBottom: 10 }}>
            Why the account matters
          </div>
          <div style={{ display: "grid", gap: 10 }}>
            {accountBenefits.map((item) => (
              <div key={item} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span style={{ color: palette.accent, fontWeight: 800 }}>•</span>
                <span style={{ fontSize: 13.5, lineHeight: 1.7, color: palette.text, fontFamily: WDWRIGHT_THEME.sans }}>{item}</span>
              </div>
            ))}
          </div>
        </>,
        palette
      )}
    </div>
  );
}

function WrightSupportDeskView({ palette, onNavigate, onOpenPublicPage }) {
  const cards = [
    ["Protected Booking", "Authenticated quote and booking access with account-linked intake context.", () => onOpenPublicPage("/quote")],
    ["Protected Resources", "Authenticated resource access for payment-adjacent, service-adjacent, and documentation-adjacent guidance.", () => onOpenPublicPage("/resources")],
    ["Document Vault", "Queue uploads and keep document handling inside the Wright account shell.", () => onNavigate("documents")],
    ["Scheduling", "Keep operations milestones and timeline handling inside the signed-in shell.", () => onNavigate("scheduling")],
    ["Profile", "Deepen the account record so later requests become faster and cleaner.", () => onNavigate("profile")],
  ];
  const dispatchRows = [];
  const crewRows = [];
  const ticketRows = [];
  const commentRows = [];

  return (
    <div style={{ display: "grid", gap: 18 }}>
      {surface(
        <>
          {sectionTitle(
            "Booking & Support",
            "Protected routing for quote, support, and service follow-up.",
            "Use this area for signed-in quote requests, support follow-up, documents, and account-based service coordination.",
            palette
          )}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
            {cards.map(([title, body, action]) => (
              <button
                key={title}
                type="button"
                onClick={action}
                style={{ border: `1px solid ${palette.line}`, background: palette.panelSoft, borderRadius: 18, padding: 18, textAlign: "left", cursor: "pointer" }}
              >
                <div style={{ fontSize: 14, fontWeight: 800, color: palette.dark, fontFamily: WDWRIGHT_THEME.sans }}>{title}</div>
                <div style={{ marginTop: 8, fontSize: 13, lineHeight: 1.65, color: palette.muted, fontFamily: WDWRIGHT_THEME.sans }}>{body}</div>
              </button>
            ))}
          </div>
        </>,
        palette
      )}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 18 }}>
        {surface(
          <>
            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: palette.strong, marginBottom: 10 }}>
              Dispatch Status
            </div>
            {dispatchRows.length ? <ResponsiveDataList
              palette={palette}
              columns={[
                { key: "queue", label: "Queue" },
                { key: "status", label: "Priority" },
                { key: "office", label: "Office" },
                { key: "eta", label: "First Touch" },
              ]}
              rows={dispatchRows}
            /> : <p style={{ color: palette.muted, fontSize: 13 }}>Dispatch is not connected to this account yet. No priority or response-time estimate is available.</p>}
          </>,
          palette
        )}
        {surface(
          <>
            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: palette.strong, marginBottom: 10 }}>
              Crew Availability
            </div>
            {crewRows.length ? <ResponsiveDataList
              palette={palette}
              columns={[
                { key: "region", label: "Region" },
                { key: "availability", label: "Availability" },
                { key: "band", label: "Crew Band" },
              ]}
              rows={crewRows}
            /> : <p style={{ color: palette.muted, fontSize: 13 }}>Live crew availability is not connected.</p>}
          </>,
          palette
        )}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 18 }}>
        {surface(
          <>
            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: palette.strong, marginBottom: 10 }}>
              Support Tickets
            </div>
            <ResponsiveDataList
              palette={palette}
              columns={[
                { key: "subject", label: "Subject" },
                { key: "owner", label: "Owner" },
                { key: "status", label: "Status" },
                { key: "updated", label: "Updated" },
              ]}
              rows={ticketRows}
              emptyTitle="No support tickets"
              emptyBody="Support ticket history is not connected to this account yet."
            />
          </>,
          palette
        )}
        {surface(
          <>
            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: palette.strong, marginBottom: 10 }}>
              Comment Thread
            </div>
            <ResponsiveDataList
              palette={palette}
              columns={[
                { key: "by", label: "By" },
                { key: "note", label: "Note" },
                { key: "time", label: "Time" },
              ]}
              rows={commentRows}
              emptyTitle="No comments"
              emptyBody="Request comments will appear here when account messaging is enabled."
            />
          </>,
          palette
        )}
      </div>
    </div>
  );
}

function WrightSettingsView({ user, palette, themeMode, setThemeMode, onLogout }) {
  const settingsGroups = [
    ["Profile Defaults", "Saved contact preferences, service intent, and account details stay with your WD Wright account."],
    ["Security", "Your sign-in controls access to requests, documents, help, and dashboard pages."],
    ["Interface Theme", "Theme choice stays consistent across public and signed-in WD Wright pages."],
    ["Notifications & Support", "Alerts, document handling, and support activity remain tied to the same account."],
  ];
  const billingRows = [];

  return (
    <div style={{ display: "grid", gap: 18 }}>
      {surface(
        <>
          {sectionTitle(
            "Account Settings",
            "Settings, security, and account controls.",
            "Use this page to manage the environment around your WD Wright account, not just the profile fields inside it.",
            palette
          )}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
            {metricCard("Theme Mode", themeMode.replace("wright-", "").replace("-", " "), "Shared across the public site, sign-in, and dashboard.", palette)}
            {metricCard("Security", "Protected", "One sign-in controls access to WD Wright account pages.", palette)}
            {metricCard("Account Email", user?.email || "Pending", "Primary sign-in address on your WD Wright account.", palette)}
            {metricCard("Profile State", `${Number(user?.userDatabase?.profileDepthScore || 0)}%`, "Profile completion supports faster booking and support handling.", palette)}
          </div>
        </>,
        palette
      )}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(280px, 0.8fr)", gap: 18 }}>
        {surface(
          <>
            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: palette.strong, marginBottom: 10 }}>
              Account settings
            </div>
            <div style={{ display: "grid", gap: 10 }}>
              {settingsGroups.map(([title, body]) => (
                <div key={title} style={{ borderRadius: 18, border: `1px solid ${palette.line}`, background: palette.panelSoft, padding: 16 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: palette.dark, fontFamily: WDWRIGHT_THEME.sans }}>{title}</div>
                  <div style={{ marginTop: 6, fontSize: 13, lineHeight: 1.65, color: palette.muted, fontFamily: WDWRIGHT_THEME.sans }}>{body}</div>
                </div>
              ))}
            </div>
          </>,
          palette
        )}
        {surface(
          <>
            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: palette.strong, marginBottom: 10 }}>
              Controls
            </div>
            <label style={{ display: "grid", gap: 6, fontSize: 12.5, fontWeight: 700, color: palette.text, fontFamily: WDWRIGHT_THEME.sans }}>
              Theme
              <SegmentedThemeToggle
                options={WRIGHT_THEME_OPTIONS}
                value={themeMode}
                onChange={setThemeMode}
                compact
                palette={{ line: palette.line, panelSoft: palette.panelSoft, dark: palette.dark, accentText: themeMode === "wright-day" ? "#fff" : "#071013", text: palette.text }}
              />
            </label>
            <button type="button" onClick={() => onLogout?.()} style={{ marginTop: 14, borderRadius: 16, border: "none", background: palette.accent, color: palette.accentText, minHeight: 46, cursor: "pointer", fontWeight: 800, fontFamily: WDWRIGHT_THEME.sans }}>
              Sign Out Everywhere
            </button>
          </>,
          palette
        )}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 0.9fr) minmax(0, 1.1fr)", gap: 18 }}>
        {surface(
          <>
            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: palette.strong, marginBottom: 10 }}>
              Billing Summary
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
              {metricCard("Verified Billing", "Setup", "Protected billing state follows the account shell.", palette)}
              {metricCard("Payment History", "Not connected", "Invoice and charge records are unavailable until billing is connected.", palette)}
              {metricCard("Account Scope", user?.email || "Pending", "Billing remains tied to the same WD Wright account.", palette)}
            </div>
          </>,
          palette
        )}
        {surface(
          <>
            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: palette.strong, marginBottom: 10 }}>
              Invoice & Payment History
            </div>
            <ResponsiveDataList
              palette={palette}
              columns={[
                { key: "invoice", label: "Invoice" },
                { key: "amount", label: "Amount" },
                { key: "status", label: "Status" },
                { key: "date", label: "Date" },
              ]}
              rows={billingRows}
              emptyTitle="No billing records"
              emptyBody="Billing and invoice history are not connected to this account yet."
            />
          </>,
          palette
        )}
      </div>
      <NotificationPreferencesPanel palette={palette} />
    </div>
  );
}

function WrightAccountView({ user, palette, onNavigate, onLogout }) {
  const accountRows = [
    { id: "account-1", field: "Primary email", value: user?.email || "Pending", note: "Main sign-in address" },
    { id: "account-2", field: "Phone", value: user?.phone || "Pending", note: "Contact and support routing" },
    { id: "account-3", field: "WD Wright ID", value: getOneWrightId(user) || "Pending", note: "Shared account identifier" },
    { id: "account-4", field: "Account status", value: user?.userDatabase?.status || "onboarding", note: "Account lifecycle state" },
  ];

  return (
    <div style={{ display: "grid", gap: 18 }}>
      {surface(
        <>
          {sectionTitle(
            "Account",
            "Identity, status, and primary account controls.",
            "This area keeps the core account record visible apart from profile preferences, billing, and document workflows.",
            palette
          )}
          <ResponsiveDataList
            palette={palette}
            columns={[
              { key: "field", label: "Field" },
              { key: "value", label: "Value" },
              { key: "note", label: "Use" },
            ]}
            rows={accountRows}
          />
        </>,
        palette
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))", gap: 14 }}>
        <ProjectContactsPanel palette={palette} />
        <SavedLocationsPanel palette={palette} />
      </div>
      <QuickActionRail
        palette={{ line: palette.line, panelSoft: palette.panelSoft, dark: palette.dark, muted: palette.muted, strong: palette.strong }}
        items={[
          { kicker: "Edit", label: "Open profile controls", body: "Update contact preferences, service intent, and readiness fields.", onClick: () => onNavigate("profile") },
          { kicker: "Protect", label: "Review security", body: "Check trusted devices, sign-in state, and OneID access.", onClick: () => onNavigate("security") },
          { kicker: "Exit", label: "Sign out everywhere", body: "Close the current account session across active WD Wright pages.", onClick: () => onLogout?.() },
        ]}
      />
    </div>
  );
}

function WrightPaymentsView({ user, palette }) {
  return (
    <div style={{ display: "grid", gap: 18 }}>
      {surface(
        <>
          {sectionTitle(
            "Payment Information",
            "Billing is not connected yet.",
            "No payment method is stored in this account, and no billing provider is connected to this view.",
            palette
          )}
          <div style={{ border: `1px dashed ${palette.line}`, borderRadius: 14, padding: 16, color: palette.muted, fontSize: 13 }}>Payment setup and transaction history will appear here after a billing provider is configured and connected to your account.</div>
        </>,
        palette
      )}
    </div>
  );
}

function WrightReceiptsView({ palette }) {
  const receiptRows = [];
  return (
    <div style={{ display: "grid", gap: 18 }}>
      {surface(
        <>
          {sectionTitle(
            "Receipts",
            "Receipt history and recorded billing outputs.",
            "This page separates receipts from payment methods so users can review recorded charges without digging through settings.",
            palette
          )}
          <ResponsiveDataList
            palette={palette}
            columns={[
              { key: "receipt", label: "Receipt" },
              { key: "category", label: "Category" },
              { key: "amount", label: "Amount" },
              { key: "date", label: "Date" },
            ]}
            rows={receiptRows}
            emptyTitle="No receipts available"
            emptyBody="Receipt history will appear after billing is connected and a charge is recorded."
          />
        </>,
        palette
      )}
    </div>
  );
}

function WrightJobsView({ palette, onNavigate, onOpenPublicPage }) {
  return (
    <div style={{ display: "grid", gap: 18 }}>
      {surface(
        <>
          {sectionTitle(
            "Jobs",
            "Field readiness and job notes.",
            "No dispatch assignments are connected to this account yet. Prepare a device-local brief or checklist for reference.",
            palette
          )}
          <div style={{ border: `1px dashed ${palette.line}`, borderRadius: 14, padding: 16, color: palette.muted, fontSize: 13 }}>Live jobs and schedule changes will appear here when the WD Wright operations feed is connected.</div>
        </>,
        palette
      )}
      <FieldJobBriefPanel palette={palette} />
      <FieldReadinessPanel palette={palette} />
      <SafetyResourcesPanel palette={palette} onOpenResources={() => onOpenPublicPage("/resources")} />
      <QuickActionRail
        palette={{ line: palette.line, panelSoft: palette.panelSoft, dark: palette.dark, muted: palette.muted, strong: palette.strong }}
        items={[
          { kicker: "Schedule", label: "Open scheduling", body: "Move into the full calendar and milestone view for active jobs.", onClick: () => onNavigate("scheduling") },
          { kicker: "Support", label: "Open booking", body: "Review related tickets, comments, and support routing.", onClick: () => onNavigate("booking") },
        ]}
      />
    </div>
  );
}

function WrightMessagesView({ palette, onNavigate }) {
  return (
    <div style={{ display: "grid", gap: 18 }}>
      {surface(
        <>
          {sectionTitle(
            "Messages",
            "Follow-up and request conversations.",
            "There are no connected messages yet. Use booking to send a request; account messaging will appear here when the backend conversation feed is enabled.",
            palette
          )}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap", border: `1px dashed ${palette.line}`, borderRadius: 14, padding: 16 }}><span style={{ color: palette.muted, fontSize: 13 }}>No sample conversations are shown.</span><button type="button" onClick={() => onNavigate("booking")} style={{ border: 0, borderRadius: 12, padding: "10px 14px", background: palette.accent, color: palette.accentText, fontWeight: 800, cursor: "pointer" }}>Open booking</button></div>
        </>,
        palette
      )}
    </div>
  );
}

function WrightFeedbackView({ palette, onOpenPublicPage }) {
  return (
    <div style={{ display: "grid", gap: 18 }}>
      {surface(
        <>
          {sectionTitle(
            "Feedback",
            "User feedback, requests, and experience follow-up.",
            "Feedback history is not connected to this account yet. Send a note through the contact page instead.",
            palette
          )}
          <div style={{ border: `1px dashed ${palette.line}`, borderRadius: 14, padding: 16, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}><span style={{ color: palette.muted, fontSize: 13 }}>No submitted feedback is linked to this account.</span><button type="button" onClick={() => onOpenPublicPage("/contact")} style={{ border: 0, borderRadius: 12, padding: "10px 14px", background: palette.accent, color: palette.accentText, fontWeight: 800, cursor: "pointer" }}>Contact WD Wright</button></div>
        </>,
        palette
      )}
    </div>
  );
}

function WrightSchedulingView({ palette, onNavigate }) {
  return (
    <div style={{ display: "grid", gap: 18 }}>
      {surface(
        <>
          {sectionTitle(
            "Scheduling",
            "Upcoming work and schedule changes.",
            "No live work schedule is connected to this account yet. Submitted requests are not job assignments; confirmed dates will appear here once the operations feed is available.",
            palette
          )}
          <div style={{ border: `1px dashed ${palette.line}`, borderRadius: 14, padding: 16, color: palette.muted, fontSize: 13 }}>Schedule and change notifications are unavailable until an operations schedule is linked to your account.</div>
        </>,
        palette
      )}
      {surface(
        <>
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: palette.strong, marginBottom: 10 }}>
            Schedule actions
          </div>
          <QuickActionRail
            palette={{ line: palette.line, panelSoft: palette.panelSoft, dark: palette.dark, muted: palette.muted, strong: palette.strong }}
            items={[
              { kicker: "Track", label: "View milestones", body: "Keep active handoffs, timing, and checkpoints visible.", onClick: () => onNavigate("scheduling") },
              { kicker: "Prepare", label: "Open booking", body: "Move back to quote and intake routing for new work.", onClick: () => onNavigate("booking") },
              { kicker: "Secure", label: "Review documents", body: "Keep supporting files aligned with timing changes.", onClick: () => onNavigate("documents") },
            ]}
          />
        </>,
        palette
      )}
      <FieldReadinessPanel palette={palette} />
    </div>
  );
}

function WrightCommandPalette({ open, palette, commands, onClose, onExecute }) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (open) setQuery("");
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);

  if (!open) return null;

  const q = query.trim().toLowerCase();
  const visible = commands.filter((command) => `${command.label} ${command.meta}`.toLowerCase().includes(q));

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(7, 12, 12, 0.42)", zIndex: 300 }} />
      <div style={{ position: "fixed", left: "50%", top: "13vh", transform: "translateX(-50%)", width: "min(720px, calc(100vw - 28px))", background: palette.panel, border: `1px solid ${palette.line}`, borderRadius: 24, zIndex: 301, boxShadow: "0 32px 90px rgba(7, 12, 12, 0.3)", overflow: "hidden" }}>
        <input
          autoFocus
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Jump to a WD Wright dashboard area..."
          style={{ width: "100%", border: "none", outline: "none", padding: "18px 20px", background: "transparent", color: palette.dark, fontSize: 15, fontFamily: WDWRIGHT_THEME.sans }}
        />
        <div style={{ borderTop: `1px solid ${palette.line}`, maxHeight: "60vh", overflowY: "auto" }}>
          {visible.length === 0 ? (
            <div style={{ padding: 18, color: palette.muted, fontSize: 13.5, fontFamily: WDWRIGHT_THEME.sans }}>No matching Wright command.</div>
          ) : (
            visible.map((command) => (
              <button
                key={command.id}
                type="button"
                onClick={() => {
                  onExecute(command);
                  onClose();
                }}
                style={{ width: "100%", border: "none", borderTop: `1px solid ${palette.line}`, background: "transparent", textAlign: "left", padding: "14px 20px", cursor: "pointer" }}
              >
                <div style={{ fontSize: 14, fontWeight: 800, color: palette.dark, fontFamily: WDWRIGHT_THEME.sans }}>{command.label}</div>
                <div style={{ marginTop: 4, fontSize: 12.5, color: palette.muted, fontFamily: WDWRIGHT_THEME.sans }}>{command.meta}</div>
              </button>
            ))
          )}
        </div>
      </div>
    </>
  );
}

function WrightResourcesView({ palette, onNavigate, onOpenPublicPage }) {
  const cards = [
    ["Protected Resources", "Authenticated access to WD Wright resource content and documentation-adjacent guidance.", () => onOpenPublicPage("/resources")],
    ["Help Center", "Open the protected help page for request prep, service questions, and account guidance.", () => onOpenPublicPage("/help")],
    ["Document Vault", "Jump directly into protected files, uploads, and future account packet handling.", () => onNavigate("documents")],
    ["Profile Readiness", "Tighten your account data so future requests and support routing move faster.", () => onNavigate("profile")],
  ];

  return (
    <div style={{ display: "grid", gap: 18 }}>
      {surface(
        <>
          {sectionTitle(
            "Resources",
            "Protected help, guidance, and account-linked reference material.",
            "This area keeps WD Wright resources, help content, and document-related guidance together in one place.",
            palette
          )}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
            {cards.map(([title, body, action]) => (
              <button
                key={title}
                type="button"
                onClick={action}
                style={{ border: `1px solid ${palette.line}`, background: palette.panelSoft, borderRadius: 18, padding: 18, textAlign: "left", cursor: "pointer" }}
              >
                <div style={{ fontSize: 14, fontWeight: 800, color: palette.dark, fontFamily: WDWRIGHT_THEME.sans }}>{title}</div>
                <div style={{ marginTop: 8, fontSize: 13, lineHeight: 1.65, color: palette.muted, fontFamily: WDWRIGHT_THEME.sans }}>{body}</div>
              </button>
            ))}
          </div>
        </>,
        palette
      )}
    </div>
  );
}

function WrightDocumentsView({ palette, onOpenPublicPage }) {
  return <div style={{ display: "grid", gap: 18 }}><DocumentReadinessPanel palette={palette} onOpenPublicPage={onOpenPublicPage} /><SafetyResourcesPanel palette={palette} onOpenResources={() => onOpenPublicPage("/resources")} /></div>;
}

function WrightAdminQueueView({ palette, isAdmin }) {
  if (!isAdmin) {
    return <EmptyPanel title="Admin queue unavailable" body="This queue is only available to approved WD Wright admin accounts." palette={palette} />;
  }
  return (
    <ResponsiveDataList
      palette={palette}
      columns={[
        { key: "queue", label: "Queue" },
        { key: "priority", label: "Priority" },
        { key: "owner", label: "Owner" },
        { key: "sla", label: "SLA" },
      ]}
      rows={[
        { id: "admin-1", queue: "Lead review", priority: "High", owner: "Operations admin", sla: "2h" },
        { id: "admin-2", queue: "Document release", priority: "Medium", owner: "Verification desk", sla: "Same day" },
      ]}
    />
  );
}

export default function WDWrightAuthenticatedApp({ initialUser, onLogout, onSaveProfile, onOpenPublicPage }) {
  const [user, setUser] = useState(initialUser);
  const [view, setView] = useState("dashboard");
  const [commandOpen, setCommandOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [themeMode, setThemeMode] = useWrightThemeMode();
  const [toasts, setToasts] = useState([]);
  const [confirmRequest, setConfirmRequest] = useState(null);
  const isAdmin = isPrivilegedWrightUser(user);
  const isManager = isManagerDeskUser(user);
  const palette = THEMES[themeMode] || THEMES["wright-day"];

  useEffect(() => {
    setUser(initialUser);
  }, [initialUser]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen((current) => !current);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const navItems = useMemo(() => {
    const base = [
      { id: "dashboard", label: "Dashboard", detail: "Feature overview and quick access" },
      { id: "booking", label: "Booking", detail: "Quotes, intake, and support routing" },
      { id: "scheduling", label: "Scheduling", detail: "Milestones and status" },
      { id: "profile", label: "Profile", detail: "Profile and account controls" },
      { id: "account", label: "Account", detail: "Identity, account state, and core controls" },
      { id: "payments", label: "Payments", detail: "Payment methods and billing instruments" },
      { id: "receipts", label: "Receipts", detail: "Recorded billing outputs and receipt history" },
      { id: "jobs", label: "Jobs", detail: "Active work and job-level status" },
      { id: "messages", label: "Messages", detail: "Inbox and account follow-up" },
      { id: "security", label: "Security", detail: "Sign-in, identity, and account access" },
      { id: "documents", label: "Documents", detail: "Protected vault" },
      { id: "notifications", label: "Notifications", detail: "Alerts and tasks" },
      { id: "feedback", label: "Feedback", detail: "Requests, comments, and product follow-up" },
      { id: "settings", label: "Settings", detail: "Theme, session, and controls" },
      { id: "resources", label: "Resources", detail: "Protected help and guidance" },
    ];
    const managerItems = isManager ? [{ id: "manager-desk", label: "Manager's Desk", detail: "Operational desk, routing, and capacity posture" }] : [];
    const adminItems = isAdmin ? [{ id: "admin-workbench", label: "Admin", detail: "Record review tools" }] : [];
    return [...base, ...managerItems, ...adminItems];
  }, [isAdmin, isManager]);

  const commands = useMemo(() => {
    const routeCommands = navItems.map((item) => ({
      id: item.id,
      label: item.label,
      meta: item.detail,
      action: () => setView(item.id),
    }));
    return [
      ...routeCommands,
      { id: "public-home", label: "Open Public Site", meta: "Return to the public Wright homepage", action: () => onOpenPublicPage("/") },
      { id: "public-quote", label: "Open Protected Quote", meta: "Jump to the signed-in quote page", action: () => onOpenPublicPage("/quote") },
      { id: "settings-open", label: "Open Account Settings", meta: "Theme, security posture, and session controls", action: () => setView("settings") },
      { id: "help-open", label: "Open Help Drawer", meta: "Context for the current account area", action: () => setHelpOpen(true) },
      { id: "sign-out", label: "Sign Out Everywhere", meta: "Sign out across open WD Wright pages", action: () => onLogout?.() },
    ];
  }, [navItems, onLogout, onOpenPublicPage]);

  function notify(toast) {
    const nextToast = createToast(toast?.title || "Wright", toast?.message || "", toast?.tone || "info");
    setToasts((current) => [...current, nextToast].slice(-4));
  }

  function dismissToast(id) {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }

  function requestConfirm(config = {}) {
    setConfirmRequest({
      ...config,
      onConfirm: () => {
        setConfirmRequest(null);
        config.onConfirm?.();
      },
    });
  }

  function closeConfirm() {
    setConfirmRequest(null);
  }

  function navigate(nextView) {
    const fallbackMap = {
      overview: "dashboard",
      workspace: "profile",
      account_center: "account",
      manager: "manager-desk",
      manager_profile: "manager-desk",
      manager_desk: "manager-desk",
      billing: "payments",
      payment_history: "receipts",
      operations: "jobs",
      inbox: "messages",
      passport: "security",
      support: "booking",
      timeline: "scheduling",
      comments: "feedback",
      help: "resources",
      offer: "profile",
      tours: "scheduling",
      compare: "dashboard",
      browse: "dashboard",
      detail: "dashboard",
      transaction: "scheduling",
    };
    setView(fallbackMap[nextView] || nextView || "dashboard");
  }

  async function handleSaveProfile(profile) {
    const saved = await onSaveProfile(profile);
    setUser(saved);
    notify({ title: "Profile saved", message: "Your WD Wright account changes have been saved.", tone: "success" });
    return saved;
  }

  return (
    <div style={{ minHeight: "100vh", background: palette.background, color: palette.text, fontFamily: WDWRIGHT_THEME.sans }}>
      <div className="wdw-auth-shell-width" style={{ width: "min(1440px, 100%)", margin: "0 auto", padding: 18 }}>
        <AmbientSection palette={{ line: palette.shellBorder, panel: palette.shell }} style={{ padding: 18, marginBottom: 18, backdropFilter: "blur(18px)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <div style={{ display: "grid", gap: 8 }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <StatusPill label="WD Wright account center" tone="accent" palette={{ line: palette.line, panelSoft: palette.panelSoft, muted: palette.muted, accentSoft: palette.accentSoft, accent: palette.accent, strong: palette.strong }} />
                <StatusPill label={navItems.find((item) => item.id === view)?.label || "Dashboard"} palette={{ line: palette.line, panelSoft: palette.panelSoft, muted: palette.muted }} />
              </div>
              <div style={{ fontFamily: WDWRIGHT_THEME.display, fontSize: "clamp(2rem, 3vw, 3rem)", lineHeight: 0.94, textTransform: "uppercase", color: palette.dark }}>
                One shell for every protected WD Wright flow.
              </div>
              <div style={{ maxWidth: 820, fontSize: 14, lineHeight: 1.7, color: palette.muted }}>
                Booking, scheduling, profile management, security, documents, notifications, and settings now sit inside one clearer account shell with shared theme and access controls.
              </div>
            </div>
            <SegmentedThemeToggle
              options={WRIGHT_THEME_OPTIONS}
              value={themeMode}
              onChange={setThemeMode}
              compact
              palette={{ line: palette.line, panelSoft: palette.panelSoft, dark: palette.dark, accentText: themeMode === "wright-day" ? "#fff" : "#071013", text: palette.text }}
            />
          </div>
          <div style={{ marginTop: 14, display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <StatusPill label={isAdmin ? "Admin access approved" : "Standard access"} tone="accent" palette={{ line: palette.line, panelSoft: palette.panelSoft, muted: palette.muted, accentSoft: palette.accentSoft, accent: palette.accent, strong: palette.strong }} />
              <StatusPill label="Role-based access active" palette={{ line: palette.line, panelSoft: palette.panelSoft, muted: palette.muted }} />
            </div>
            <button type="button" onClick={() => setHelpOpen(true)} style={{ borderRadius: 999, border: `1px solid ${palette.line}`, background: "transparent", color: palette.dark, minHeight: 40, padding: "0 14px", cursor: "pointer", fontWeight: 800, fontFamily: WDWRIGHT_THEME.sans }}>
              View Help
            </button>
          </div>
        </AmbientSection>
        <div className="wdw-auth-shell-grid" style={{ display: "grid", gridTemplateColumns: "280px minmax(0, 1fr)", gap: 18, alignItems: "start" }}>
          <aside className="wdw-auth-sidebar" style={{ position: "sticky", top: 18 }}>
            <div style={{ background: palette.shell, border: `1px solid ${palette.shellBorder}`, borderRadius: 28, padding: 18, backdropFilter: "blur(18px)", boxShadow: "0 20px 56px rgba(12, 20, 18, 0.12)" }}>
              <div style={{ paddingBottom: 16, borderBottom: `1px solid ${palette.line}` }}>
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", color: palette.strong }}>
                  WD Wright Dashboard
                </div>
                <div style={{ marginTop: 10 }}>
                  <WDWrightBrandLockup themeMode={themeMode} context="header" width={220} />
                </div>
                <div style={{ marginTop: 10, fontFamily: WDWRIGHT_THEME.display, fontSize: 32, lineHeight: 0.94, textTransform: "uppercase", color: palette.dark }}>
                  Account center.
                </div>
                <div style={{ marginTop: 10, fontSize: 13, lineHeight: 1.7, color: palette.muted }}>
                  One account, protected access, theme controls, and shared account details across WD Wright.
                </div>
              </div>
              <div style={{ marginTop: 16, display: "grid", gap: 10 }}>
                <div style={{ borderRadius: 18, background: palette.panelSoft, border: `1px solid ${palette.line}`, padding: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: palette.strong }}>
                    Signed in as
                  </div>
                  <div style={{ marginTop: 6, fontSize: 14, fontWeight: 800, color: palette.dark }}>{user?.name || user?.email || "Wright User"}</div>
                  <div style={{ marginTop: 4, fontSize: 12.5, color: palette.muted }}>{getOneWrightId(user) || "Account ID pending"}</div>
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: 6, fontSize: 11, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: palette.strong }}>
                    Theme
                  </label>
                  <SegmentedThemeToggle
                    options={WRIGHT_THEME_OPTIONS}
                    value={themeMode}
                    onChange={setThemeMode}
                    compact
                    palette={{ line: palette.line, panelSoft: palette.panelSoft, dark: palette.dark, accentText: themeMode === "wright-day" ? "#fff" : "#071013", text: palette.text }}
                  />
                </div>
              </div>
              <nav style={{ display: "grid", gap: 10, marginTop: 18 }}>
                {navItems.map((item) => (
                  <button key={item.id} type="button" onClick={() => setView(item.id)} style={pageButton(view === item.id, palette)}>
                    <span>
                      <span style={{ display: "block", fontSize: 13.5, fontWeight: 800 }}>{item.label}</span>
                      <span style={{ display: "block", marginTop: 4, fontSize: 11.5, color: palette.muted }}>{item.detail}</span>
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: view === item.id ? palette.strong : palette.muted }}>
                      Open
                    </span>
                  </button>
                ))}
              </nav>
              <div style={{ display: "grid", gap: 10, marginTop: 18 }}>
                <div style={{ borderRadius: 18, background: palette.panelSoft, border: `1px solid ${palette.line}`, padding: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: palette.strong }}>
                    Activity Feed
                  </div>
                  <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                    <div style={{ padding: 10, color: palette.muted, fontSize: 11.5, lineHeight: 1.55 }}>Live activity is not connected yet. Account actions will appear here when the backend activity feed is enabled.</div>
                  </div>
                </div>
                <button type="button" onClick={() => setCommandOpen(true)} style={{ borderRadius: 16, border: `1px solid ${palette.line}`, background: "transparent", color: palette.dark, minHeight: 46, cursor: "pointer", fontWeight: 800, fontFamily: WDWRIGHT_THEME.sans }}>
                  Quick Jump
                </button>
                <button type="button" onClick={() => onOpenPublicPage("/")} style={{ borderRadius: 16, border: `1px solid ${palette.line}`, background: "transparent", color: palette.dark, minHeight: 46, cursor: "pointer", fontWeight: 800, fontFamily: WDWRIGHT_THEME.sans }}>
                  Public Site
                </button>
                <button type="button" onClick={() => onLogout?.()} style={{ borderRadius: 16, border: "none", background: palette.accent, color: palette.accentText, minHeight: 46, cursor: "pointer", fontWeight: 800, fontFamily: WDWRIGHT_THEME.sans }}>
                  Sign Out Everywhere
                </button>
              </div>
            </div>
          </aside>

          <main style={{ minWidth: 0 }}>
            <div style={{ marginBottom: 14 }}>
              <BreadcrumbTrail
                palette={{ dark: palette.dark, muted: palette.muted }}
                items={[
                  { label: "Dashboard", href: "dashboard" },
                  { label: navItems.find((item) => item.id === view)?.label || "Dashboard", href: view },
                ]}
                onNavigate={navigate}
              />
            </div>
            {view === "dashboard" ? <WrightOverviewView user={user} palette={palette} onNavigate={navigate} onOpenPublicPage={onOpenPublicPage} onLogout={onLogout} isAdmin={isAdmin} isManager={isManager} /> : null}
            {view === "profile" ? <WDWrightWorkspace user={user} onSaveProfile={handleSaveProfile} onLogout={onLogout} onOpenPublicPage={onOpenPublicPage} embedded themeMode={themeMode} /> : null}
            {view === "account" ? <WrightAccountView user={user} palette={palette} onNavigate={navigate} onLogout={onLogout} /> : null}
            {view === "payments" ? <WrightPaymentsView user={user} palette={palette} /> : null}
            {view === "receipts" ? <WrightReceiptsView palette={palette} /> : null}
            {view === "jobs" ? <WrightJobsView palette={palette} onNavigate={navigate} onOpenPublicPage={onOpenPublicPage} /> : null}
            {view === "messages" ? <WrightMessagesView palette={palette} onNavigate={navigate} /> : null}
            {view === "manager-desk" && isManager ? <WrightManagersDeskView user={user} palette={palette} onNavigate={navigate} isAdmin={isAdmin} /> : null}
            {view === "security" ? <WrightPassportView user={user} palette={palette} /> : null}
            {view === "booking" ? <WrightSupportDeskView palette={palette} onNavigate={navigate} onOpenPublicPage={onOpenPublicPage} /> : null}
            {view === "documents" ? <WrightDocumentsView palette={palette} onOpenPublicPage={onOpenPublicPage} /> : null}
            {view === "scheduling" ? <WrightSchedulingView palette={palette} onNavigate={navigate} /> : null}
            {view === "notifications" ? <NotificationCenterView onNavigate={navigate} notify={notify} /> : null}
            {view === "feedback" ? <WrightFeedbackView palette={palette} onOpenPublicPage={onOpenPublicPage} /> : null}
            {view === "settings" ? <WrightSettingsView user={user} palette={palette} themeMode={themeMode} setThemeMode={setThemeMode} onLogout={onLogout} /> : null}
            {view === "resources" ? <WrightResourcesView palette={palette} onNavigate={navigate} onOpenPublicPage={onOpenPublicPage} /> : null}
            {view === "admin-workbench" && isAdmin ? (
              <div style={{ display: "grid", gap: 18 }}>
                {surface(
                  <>
                    <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: palette.strong, marginBottom: 10 }}>
                      Admin Review Queue
                    </div>
                    <WrightAdminQueueView palette={palette} isAdmin={isAdmin} />
                  </>,
                  palette
                )}
                <AdminWorkbenchView notify={notify} confirmAction={requestConfirm} docs={[]} flags={[]} transactions={[]} />
              </div>
            ) : null}
          </main>
        </div>
      </div>
      <WrightCommandPalette open={commandOpen} palette={palette} commands={commands} onClose={() => setCommandOpen(false)} onExecute={(command) => command.action?.()} />
      <HelpDrawer
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        title={navItems.find((item) => item.id === view)?.label || "Dashboard"}
        body="Each protected WD Wright area is grouped to keep booking, profile management, scheduling, documents, and settings easier to locate from one account shell."
        items={[
          { title: "Booking", body: "Use booking for quote requests, support routing, tickets, and comment history." },
          { title: "Documents", body: "Use documents for vault status, previews, expiring links, and protected file handling." },
          { title: "Settings", body: "Use settings for theme, billing summary, and account controls." },
        ]}
        palette={{ line: palette.line, panel: palette.panel, panelSoft: palette.panelSoft, muted: palette.muted, dark: palette.dark, strong: palette.strong, accent: palette.accent }}
      />
      <ToastHost toasts={toasts} onDismiss={dismissToast} />
      <ConfirmDialog request={confirmRequest} onCancel={closeConfirm} onConfirm={() => confirmRequest?.onConfirm?.()} />
    </div>
  );
}
