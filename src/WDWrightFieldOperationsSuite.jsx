"use client";

import React, { useState } from "react";

const DEFAULT_PALETTE = {
  panel: "var(--wdw-card, #fff)",
  panelSoft: "var(--wdw-card-soft, #f6f8f4)",
  line: "var(--wdw-line, #d7e1db)",
  text: "var(--wdw-text, #334745)",
  dark: "var(--wdw-text-strong, #1c3331)",
  muted: "var(--wdw-text-muted, #617571)",
  accent: "var(--wdw-accent, #2f7473)",
  accentSoft: "var(--wdw-accent-soft, rgba(47,116,115,0.14))",
};

function Panel({ title, description, palette, children, badge }) {
  return (
    <section
      style={{
        minWidth: 0,
        border: `1px solid ${palette.line}`,
        borderRadius: "var(--wdw-radius-card, 20px)",
        padding: 20,
        background: palette.panel,
        color: palette.text,
      }}
    >
      <div style={{ display: "flex", alignItems: "start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div style={{ minWidth: 0 }}>
          <h3 style={{ margin: 0, color: palette.dark, fontSize: 18, lineHeight: 1.3 }}>{title}</h3>
          <p style={{ margin: "7px 0 0", color: palette.muted, fontSize: 13, lineHeight: 1.65 }}>{description}</p>
        </div>
        {badge ? <span style={badgeStyle(palette)}>{badge}</span> : null}
      </div>
      <div style={{ display: "grid", gap: 12, marginTop: 16 }}>{children}</div>
    </section>
  );
}

function badgeStyle(palette) {
  return {
    flex: "0 0 auto",
    display: "inline-flex",
    alignItems: "center",
    minHeight: 26,
    padding: "4px 9px",
    border: `1px solid ${palette.line}`,
    borderRadius: 999,
    background: palette.panelSoft,
    color: palette.muted,
    fontSize: 10.5,
    fontWeight: 800,
    letterSpacing: "0.07em",
    textTransform: "uppercase",
  };
}

function Notice({ palette, children, tone = "info" }) {
  const border = tone === "warning" ? "rgba(185,126,35,0.44)" : palette.line;
  const background = tone === "warning" ? "rgba(185,126,35,0.08)" : palette.panelSoft;
  return <div role="note" style={{ border: `1px solid ${border}`, borderRadius: 12, padding: 12, background, color: palette.text, fontSize: 12.5, lineHeight: 1.65 }}>{children}</div>;
}

function BackendEmpty({ palette, children }) {
  return (
    <div style={{ border: `1px dashed ${palette.line}`, borderRadius: 12, padding: 14, background: palette.panelSoft }}>
      <div style={{ color: palette.dark, fontSize: 12, fontWeight: 800 }}>No live records connected</div>
      <p style={{ margin: "5px 0 0", color: palette.muted, fontSize: 12, lineHeight: 1.6 }}>{children}</p>
    </div>
  );
}

function TemporaryChecklist({ palette, items, label = "Temporary planning checklist" }) {
  const [checked, setChecked] = useState({});
  return (
    <div style={{ display: "grid", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <strong style={{ color: palette.dark, fontSize: 12 }}>{label}</strong>
        <button type="button" onClick={() => setChecked({})} style={linkButtonStyle(palette)}>Clear checks</button>
      </div>
      {items.map((item, index) => (
        <label key={item} style={{ display: "flex", alignItems: "start", gap: 9, padding: "8px 10px", border: `1px solid ${palette.line}`, borderRadius: 10, color: palette.text, fontSize: 12.5, lineHeight: 1.55, cursor: "pointer" }}>
          <input type="checkbox" checked={Boolean(checked[index])} onChange={(event) => setChecked((current) => ({ ...current, [index]: event.target.checked }))} />
          <span>{item}</span>
        </label>
      ))}
      <p style={{ margin: 0, color: palette.muted, fontSize: 11.5, lineHeight: 1.55 }}>These checks live only while this page is open. They are not saved, assigned, or accepted as an official inspection or work record.</p>
    </div>
  );
}

function linkButtonStyle(palette) {
  return { border: 0, padding: 0, background: "transparent", color: palette.accent, font: "inherit", fontSize: 11.5, fontWeight: 800, cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 3 };
}

function PrintBrief({ palette }) {
  return (
    <Panel palette={palette} title="Offline field brief template" description="A blank print-friendly prompt sheet for preparing a job briefing through your approved company process." badge="No job data saved">
      <div className="wdw-field-brief-print" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 190px), 1fr))", gap: 10 }}>
        {["Project reference", "Approved work location", "Confirmed work window", "Supervisor / site contact", "Approved plan reference", "Escalation procedure"].map((label) => (
          <div key={label} style={{ minHeight: 54, border: `1px solid ${palette.line}`, borderRadius: 10, padding: 9, color: palette.muted, fontSize: 11.5 }}>{label}<div style={{ borderBottom: `1px solid ${palette.line}`, height: 17 }} /></div>
        ))}
      </div>
      <Notice palette={palette} tone="warning">Use the current approved site-specific plan and supervisor direction. This blank sheet does not assign a crew, authorize work, or replace required safety documents.</Notice>
      <button type="button" onClick={() => window.print()} style={primaryButtonStyle(palette)}>Print blank brief</button>
    </Panel>
  );
}

function primaryButtonStyle(palette) {
  return { justifySelf: "start", minHeight: 40, padding: "0 14px", border: 0, borderRadius: 999, background: palette.accent, color: "#fff", fontSize: 12, fontWeight: 800, cursor: "pointer" };
}

function RequiredBackendPanel({ palette, title, description, detail, badge = "Backend required" }) {
  return (
    <Panel palette={palette} title={title} description={description} badge={badge}>
      <BackendEmpty palette={palette}>{detail || "This workflow is not accepting or displaying live records until secure sign-in, role checks, and the shared backend are connected."}</BackendEmpty>
      <button type="button" disabled aria-disabled="true" style={{ justifySelf: "start", minHeight: 38, padding: "0 13px", border: `1px solid ${palette.line}`, borderRadius: 999, background: palette.panelSoft, color: palette.muted, fontSize: 11.5, fontWeight: 800, cursor: "not-allowed" }}>Unavailable until connected</button>
    </Panel>
  );
}

export default function WDWrightFieldOperationsSuite({ palette: incomingPalette = {} }) {
  const palette = { ...DEFAULT_PALETTE, ...incomingPalette };
  return (
    <section aria-labelledby="wdw-field-operations-title" style={{ display: "grid", gap: 24, color: palette.text }}>
      <header style={{ display: "grid", gap: 10 }}>
        <div style={{ color: palette.accent, fontSize: 11, fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase" }}>Field and dispatch tools</div>
        <h1 id="wdw-field-operations-title" style={{ margin: 0, color: palette.dark, fontSize: "clamp(1.8rem, 4vw, 2.8rem)", lineHeight: 1.05 }}>Field operations</h1>
        <p style={{ maxWidth: 780, margin: 0, color: palette.muted, fontSize: 14, lineHeight: 1.75 }}>A practical starting point for crew preparation and operations planning. Live work assignments, employee data, location, time, and incident records are not connected.</p>
        <Notice palette={palette} tone="warning"><strong>Live operations are not active.</strong> The Firebase backend is not initialized. Do not use this page to check in for work, submit time, report an incident, confirm an assignment, or treat information as a current safety alert.</Notice>
      </header>

      <section aria-labelledby="wdw-field-crew-title" style={{ display: "grid", gap: 14 }}>
        <h2 id="wdw-field-crew-title" style={sectionHeadingStyle(palette)}>Crew schedule and job records</h2>
        <div style={gridStyle}>
          <RequiredBackendPanel palette={palette} title="Shift board and availability" description="View shifts or share availability with scheduling." detail="No crew roster or shift calendar is connected. Do not rely on this page for an assigned shift." />
          <RequiredBackendPanel palette={palette} title="Job check-in and check-out" description="Record arrival and completion at an assigned job." detail="Location and time records require authenticated role checks and an approved retention policy. No check-in is being recorded." />
          <RequiredBackendPanel palette={palette} title="Digital timecard" description="Submit work hours for review." detail="No hours are collected or stored here. Use your employer's designated timekeeping process." />
          <RequiredBackendPanel palette={palette} title="Field completion record" description="Submit a job handoff or completion summary." detail="No job records are connected. Do not treat this page as proof of service completion." />
        </div>
      </section>

      <section aria-labelledby="wdw-field-prep-title" style={{ display: "grid", gap: 14 }}>
        <h2 id="wdw-field-prep-title" style={sectionHeadingStyle(palette)}>Preparation and safety</h2>
        <div style={gridStyle}>
          <Panel palette={palette} title="Vehicle pre-shift prompts" description="General reminders for reviewing the vehicle through your employer's approved inspection process." badge="Temporary">
            <TemporaryChecklist palette={palette} items={["Review the required inspection form for this vehicle.", "Follow company procedures for defects and out-of-service conditions.", "Confirm assigned equipment against the approved job plan."]} />
          </Panel>
          <Panel palette={palette} title="Equipment readiness prompts" description="A non-recordkeeping reminder before checking equipment against the approved assignment." badge="Temporary">
            <TemporaryChecklist palette={palette} items={["Use the approved equipment checklist for this job.", "Report missing or damaged equipment through the designated supervisor.", "Do not substitute equipment without authorization."]} />
          </Panel>
          <Panel palette={palette} title="Toolbox talk topics" description="Topic prompts for a supervisor-led briefing using the approved site-specific plan." badge="Reference only">
            <ul style={{ margin: 0, paddingLeft: 19, display: "grid", gap: 7, color: palette.text, fontSize: 12.5, lineHeight: 1.6 }}>
              {["Roles, communication, and escalation", "Work limits and approved setup", "Site access, staging, and changing conditions", "Emergency response and stop-work procedure"].map((item) => <li key={item}>{item}</li>)}
            </ul>
            <Notice palette={palette} tone="warning">This is not a safety plan or acknowledgement record. Follow the current approved plan and company safety procedures.</Notice>
          </Panel>
          <Panel palette={palette} title="Credential renewal checklist" description="A personal reminder to review training or credentials through the official employer process." badge="Temporary">
            <TemporaryChecklist palette={palette} items={["Check the official source for current credential status.", "Contact the designated training coordinator about renewal timing.", "Submit proof only through an approved secure channel."]} label="Preparation prompts" />
          </Panel>
          <PrintBrief palette={palette} />
        </div>
      </section>

      <section aria-labelledby="wdw-field-reporting-title" style={{ display: "grid", gap: 14 }}>
        <h2 id="wdw-field-reporting-title" style={sectionHeadingStyle(palette)}>Safety reporting</h2>
        <div style={gridStyle}>
          <RequiredBackendPanel palette={palette} title="Hazard report" description="Send a changing site condition to the responsible supervisor." detail="This form is not connected and does not record a report. Follow the immediate stop-work and escalation procedure for your site." />
          <RequiredBackendPanel palette={palette} title="Incident and near-miss report" description="Submit a protected report through the designated company process." detail="Incident details are sensitive and are not collected or saved here. Use your employer's approved reporting channel; use local emergency services for an immediate emergency." />
        </div>
      </section>

      <section aria-labelledby="wdw-dispatch-tools-title" style={{ display: "grid", gap: 14 }}>
        <h2 id="wdw-dispatch-tools-title" style={sectionHeadingStyle(palette)}>Dispatch and manager tools</h2>
        <Notice palette={palette}>These panels are intended for authorized operations staff. Access control is not configured here; no employee or job data is displayed.</Notice>
        <div style={gridStyle}>
          <RequiredBackendPanel palette={palette} title="Dispatch assignment board" description="Review requests and crew assignments." detail="No jobs, crews, or assignments are connected. This page does not grant dispatch authorization." />
          <RequiredBackendPanel palette={palette} title="Map and service-area planning" description="Coordinate jobs against confirmed coverage and travel constraints." detail="No map, verified service territory, or live assignment data is connected. Confirm coverage with operations." />
          <RequiredBackendPanel palette={palette} title="Crew capacity planner" description="Review staffing availability by market and work window." detail="No employee roster or capacity data is connected." />
          <RequiredBackendPanel palette={palette} title="Equipment allocation" description="Coordinate equipment availability across work sites." detail="No equipment inventory or reservation records are connected." />
          <RequiredBackendPanel palette={palette} title="Request response queue" description="Track response targets and requests needing follow-up." detail="No live request queue or service-level timer is connected." />
          <RequiredBackendPanel palette={palette} title="Weather and road-closure risk" description="Review relevant conditions before confirming an assignment." detail="No alert feeds are connected. Check official weather, transportation, and local authority sources before planning work." />
          <RequiredBackendPanel palette={palette} title="Multi-site coordination" description="Coordinate milestones and contacts across related work locations." detail="No project, contact, or schedule records are connected. Do not enter customer or site details here." />
        </div>
      </section>
    </section>
  );
}

const gridStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 290px), 1fr))", gap: 14, alignItems: "start" };
function sectionHeadingStyle(palette) {
  return { margin: 0, color: palette.dark, fontSize: 19, lineHeight: 1.3 };
}
