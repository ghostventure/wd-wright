import React from "react";

function Panel({ title, description, palette, children, tag }) {
  return (
    <section style={{ display: "grid", gap: 12, padding: 20, border: `1px solid ${palette.line}`, borderRadius: "var(--wdw-radius-card, 20px)", background: palette.panel, color: palette.text }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", flexWrap: "wrap", gap: 10 }}>
        <div>
          <h2 style={{ margin: 0, color: palette.dark, fontSize: 19 }}>{title}</h2>
          <p style={{ maxWidth: 720, margin: "6px 0 0", color: palette.muted, fontSize: 13, lineHeight: 1.65 }}>{description}</p>
        </div>
        {tag ? <span style={{ padding: "6px 10px", borderRadius: 999, border: `1px solid ${palette.line}`, color: palette.muted, fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em" }}>{tag}</span> : null}
      </div>
      {children}
    </section>
  );
}

function EmptyState({ palette, children }) {
  return <div style={{ border: `1px dashed ${palette.line}`, borderRadius: 14, padding: 16, color: palette.muted, fontSize: 13, lineHeight: 1.6 }}>{children}</div>;
}

export default function WDWrightPeopleInsightsSuite({ palette, onOpenPublicPage }) {
  const onboardingSteps = [
    "Confirm work authorization and role-specific documents",
    "Review applicable safety orientation and site procedures",
    "Confirm supervisor, dispatch contact, and first-shift details",
    "Complete role training and equipment orientation",
  ];

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <header style={{ display: "grid", gap: 8 }}>
        <div style={{ color: palette.strong, fontSize: 11, fontWeight: 800, letterSpacing: ".14em", textTransform: "uppercase" }}>People and insights</div>
        <h1 style={{ margin: 0, color: palette.dark, fontSize: "clamp(1.8rem, 4vw, 2.8rem)" }}>Hiring and service overview</h1>
        <p style={{ maxWidth: 760, margin: 0, color: palette.muted, fontSize: 14, lineHeight: 1.7 }}>
          These panels are ready for connected recruiting and operations data. They do not contain sample applicants, activity counts, or customer feedback.
        </p>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: 14 }}>
        <Panel palette={palette} title="Candidate pipeline" tag="Backend needed" description="A role-based application queue with received, review, interview, and decision stages.">
          <EmptyState palette={palette}>No connected candidate records. Applications are not being tracked in this workspace yet.</EmptyState>
          <button type="button" onClick={() => onOpenPublicPage?.("/careers")} style={{ justifySelf: "start", minHeight: 42, border: `1px solid ${palette.line}`, borderRadius: 12, padding: "0 14px", background: "transparent", color: palette.dark, fontWeight: 800, cursor: "pointer" }}>View careers page</button>
        </Panel>

        <Panel palette={palette} title="Interview scheduler" tag="Backend needed" description="Coordinate interview windows and notify candidates after recruiting is connected.">
          <EmptyState palette={palette}>Scheduling is not connected. Contact candidates through the approved recruiting process for now.</EmptyState>
          <button type="button" disabled style={{ justifySelf: "start", minHeight: 42, border: "none", borderRadius: 12, padding: "0 14px", background: palette.panelSoft, color: palette.muted, fontWeight: 800, cursor: "not-allowed" }}>Scheduling unavailable</button>
        </Panel>

        <Panel palette={palette} title="New-hire onboarding template" tag="Planning guide" description="A general sequence for preparing a new teammate. This is not an employee record or a completion tracker.">
          <ol style={{ display: "grid", gap: 8, margin: 0, paddingLeft: 22, color: palette.text, fontSize: 13, lineHeight: 1.55 }}>
            {onboardingSteps.map((step) => <li key={step}>{step}</li>)}
          </ol>
          <div style={{ color: palette.muted, fontSize: 12, lineHeight: 1.5 }}>Use role-specific requirements and approved company procedures when onboarding is connected.</div>
        </Panel>

        <Panel palette={palette} title="Service performance and feedback" tag="Backend needed" description="A reporting surface for response times, completed work, and customer feedback once verified data is available.">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10 }}>
            {["Requests", "Response time", "Completed jobs", "Feedback"].map((label) => (
              <div key={label} style={{ display: "grid", gap: 4, padding: 12, border: `1px solid ${palette.line}`, borderRadius: 12, background: palette.panelSoft }}>
                <span style={{ color: palette.muted, fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".06em" }}>{label}</span>
                <span style={{ color: palette.dark, fontSize: 13, fontWeight: 800 }}>No connected data</span>
              </div>
            ))}
          </div>
          <div style={{ color: palette.muted, fontSize: 12, lineHeight: 1.5 }}>No metrics are calculated from placeholder or browser-local records.</div>
        </Panel>
      </div>
    </div>
  );
}
