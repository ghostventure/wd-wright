"use client";

import React, { useState } from "react";
import { EmptyPanel, StatusPill } from "./WDWrightUiKit.jsx";

const PORTAL_FEATURES = [
  {
    id: "quote-status",
    number: 11,
    title: "Quote status",
    summary: "Follow a request from intake through review and response.",
    emptyTitle: "No connected quote requests",
    emptyBody: "Quote status will appear here after request records are connected to your WD Wright account. This view has no project records to show yet.",
  },
  {
    id: "quote-history",
    number: 12,
    title: "Quote history",
    summary: "Review saved quote versions and see what changed.",
    emptyTitle: "No quote versions available",
    emptyBody: "When quotes are linked to this account, you will be able to compare their scope, schedule, and revision dates here.",
  },
  {
    id: "approvals",
    number: 13,
    title: "Quote approval",
    summary: "Record approval against the exact quote version.",
    emptyTitle: "Approval is not connected",
    emptyBody: "An approval action needs a verified quote version and a server-recorded audit trail. Nothing can be approved from this portal yet.",
  },
  {
    id: "change-requests",
    number: 14,
    title: "Change requests",
    summary: "Request a change to an active project's scope or timing.",
    emptyTitle: "No active projects connected",
    emptyBody: "Change requests will be enabled after authenticated project records are available. Call WD Wright to discuss a time-sensitive change.",
  },
  {
    id: "calendar",
    number: 15,
    title: "Project calendar",
    summary: "See confirmed work dates and upcoming milestones.",
    emptyTitle: "No confirmed dates to display",
    emptyBody: "This calendar will show dates confirmed by the WD Wright team. It does not currently contain schedule or availability data.",
  },
  {
    id: "file-exchange",
    number: 16,
    title: "Secure file exchange",
    summary: "Share traffic plans, permits, and project documents.",
    emptyTitle: "Secure uploads are not connected",
    emptyBody: "File uploads and access controls are not active. Do not submit sensitive plans or permits through this portal yet. Contact WD Wright to arrange a secure transfer.",
  },
  {
    id: "notifications",
    number: 17,
    title: "Project notifications",
    summary: "Choose how to receive project and schedule updates.",
    emptyTitle: "Notification preferences are not saved",
    emptyBody: "Email and text preferences will be available when account notifications are connected. No preferences have been changed here.",
  },
  {
    id: "briefing",
    number: 18,
    title: "Service-day briefing",
    summary: "Review a confirmed job plan and customer-side contacts.",
    emptyTitle: "No confirmed service briefing",
    emptyBody: "Briefings must come from a confirmed work order. This portal does not create or imply dispatch assignments.",
  },
  {
    id: "completion",
    number: 19,
    title: "Completion record",
    summary: "Review a service summary after work is complete.",
    emptyTitle: "No completion records connected",
    emptyBody: "Service completion records will appear after job closeout is linked to your account. No completed work is being represented here.",
  },
  {
    id: "billing",
    number: 20,
    title: "Invoices and receipts",
    summary: "View billing documents tied to your account.",
    emptyTitle: "Billing records are not connected",
    emptyBody: "No invoice, receipt, payment status, or balance is available in this portal. Billing access will require a secure account and payment integration.",
  },
];

function PortalFeatureButton({ feature, selected, onSelect, palette }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      aria-controls="wdw-project-portal-detail"
      style={{
        display: "grid",
        gap: 8,
        minHeight: 118,
        padding: 16,
        borderRadius: 16,
        border: `1px solid ${selected ? palette.accent : palette.line}`,
        background: selected ? (palette.accentSoft || palette.panelSoft) : palette.panel,
        color: palette.dark,
        textAlign: "left",
        cursor: "pointer",
        font: "inherit",
      }}
    >
      <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <span style={{ color: palette.strong || palette.accent, fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase" }}>
          Portal tool {feature.number}
        </span>
        <span aria-hidden="true" style={{ color: palette.muted, fontSize: 18 }}>{selected ? "−" : "+"}</span>
      </span>
      <strong style={{ fontSize: 15 }}>{feature.title}</strong>
      <span style={{ color: palette.muted, fontSize: 12.5, lineHeight: 1.55 }}>{feature.summary}</span>
    </button>
  );
}

export default function WDWrightProjectPortalSuite({ palette, onNavigate }) {
  const [selectedId, setSelectedId] = useState(PORTAL_FEATURES[0].id);
  const selectedFeature = PORTAL_FEATURES.find((feature) => feature.id === selectedId) || PORTAL_FEATURES[0];

  return (
    <section aria-labelledby="wdw-project-portal-title" style={{ display: "grid", gap: 16 }}>
      <header style={{ display: "grid", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <StatusPill label="Customer project portal" tone="accent" palette={palette} />
          <StatusPill label="Backend not connected" palette={palette} />
        </div>
        <div>
          <h2 id="wdw-project-portal-title" style={{ margin: 0, color: palette.dark, fontSize: "clamp(1.5rem, 3vw, 2rem)" }}>
            Your project tools
          </h2>
          <p style={{ margin: "8px 0 0", maxWidth: 760, color: palette.muted, fontSize: 14, lineHeight: 1.7 }}>
            The portal layout is ready, but quote records, schedules, files, notifications, and billing are not connected. It shows no sample customer data and does not save project or payment information in this browser.
          </p>
        </div>
      </header>

      <nav aria-label="Customer project portal tools" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))", gap: 10 }}>
        {PORTAL_FEATURES.map((feature) => (
          <PortalFeatureButton
            key={feature.id}
            feature={feature}
            selected={feature.id === selectedId}
            onSelect={() => setSelectedId(feature.id)}
            palette={palette}
          />
        ))}
      </nav>

      <div
        id="wdw-project-portal-detail"
        aria-live="polite"
        style={{ display: "grid", gap: 14, padding: 18, borderRadius: 18, border: `1px solid ${palette.line}`, background: palette.panel }}
      >
        <div style={{ display: "flex", alignItems: "start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ color: palette.strong || palette.accent, fontSize: 11, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase" }}>
              Feature {selectedFeature.number} of 40
            </div>
            <h3 style={{ margin: "6px 0 0", color: palette.dark, fontSize: 20 }}>{selectedFeature.title}</h3>
          </div>
          <StatusPill label="Waiting for backend" palette={palette} />
        </div>
        <EmptyPanel title={selectedFeature.emptyTitle} body={selectedFeature.emptyBody} palette={palette} />
        {selectedFeature.id === "change-requests" || selectedFeature.id === "file-exchange" ? (
          <p style={{ margin: 0, color: palette.muted, fontSize: 12.5, lineHeight: 1.6 }}>
            {selectedFeature.id === "change-requests" ? "For urgent or same-day changes, contact the Wright office directly." : "Secure file exchange must be enabled before uploading customer documents."}
          </p>
        ) : null}
        {onNavigate ? (
          <div>
            <button
              type="button"
              onClick={() => onNavigate("/contact")}
              style={{ minHeight: 40, padding: "0 14px", borderRadius: 999, border: `1px solid ${palette.line}`, background: "transparent", color: palette.dark, fontWeight: 800, cursor: "pointer" }}
            >
              Contact WD Wright
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
