"use client";

import React, { useMemo, useState } from "react";

const SERVICE_OPTIONS = [
  "Flagging and work-zone support",
  "Traffic control planning",
  "Barricades and channelizing devices",
  "Truck-mounted attenuator support",
  "Special event traffic support",
  "Not sure yet",
];

const PERMIT_PROMPTS = [
  "Ask the road owner which permits or approvals apply to this work.",
  "Confirm application lead times, fees, and any required drawings.",
  "Ask whether police, utility, transit, or emergency-service coordination is needed.",
  "Confirm allowed work hours, notice requirements, and inspection steps.",
  "Keep the approved permit and plan available at the work site.",
];

const UTILITY_PROMPTS = [
  "Identify utilities or public services that may be affected by the work.",
  "Confirm the utility owner’s locate, notice, and access requirements.",
  "Record the utility contact and the agreed coordination date.",
  "Ask the road owner who is responsible for final coordination approval.",
];

const DEFAULT_PALETTE = {
  panel: "var(--wdw-card, #fff)",
  panelSoft: "var(--wdw-card-soft, #f6f8f4)",
  line: "var(--wdw-line, #d7e1db)",
  text: "var(--wdw-text, #334745)",
  muted: "var(--wdw-text-muted, #617571)",
  dark: "var(--wdw-text-strong, #1c3331)",
  accent: "var(--wdw-accent, #2f7473)",
  accentSoft: "var(--wdw-accent-soft, rgba(47,116,115,0.14))",
};

function Panel({ palette, number, title, detail, children, defaultOpen = false }) {
  return (
    <details
      defaultOpen={defaultOpen}
      style={{
        minWidth: 0,
        border: `1px solid ${palette.line}`,
        borderRadius: "var(--wdw-radius-card, 20px)",
        background: palette.panel,
        color: palette.text,
        overflow: "hidden",
      }}
    >
      <summary
        style={{
          display: "grid",
          gridTemplateColumns: "38px minmax(0, 1fr) 24px",
          alignItems: "center",
          gap: 12,
          padding: "16px 18px",
          cursor: "pointer",
          listStyle: "none",
        }}
      >
        <span
          aria-hidden="true"
          style={{
            display: "grid",
            placeItems: "center",
            width: 36,
            height: 36,
            borderRadius: 12,
            background: palette.accentSoft,
            color: palette.dark,
            fontWeight: 850,
          }}
        >
          {number}
        </span>
        <span style={{ minWidth: 0 }}>
          <span style={{ display: "block", color: palette.dark, fontSize: 15, fontWeight: 850 }}>{title}</span>
          <span style={{ display: "block", marginTop: 3, color: palette.muted, fontSize: 12.5, lineHeight: 1.55 }}>{detail}</span>
        </span>
        <span aria-hidden="true" style={{ color: palette.accent, fontSize: 20, textAlign: "center" }}>⌄</span>
      </summary>
      <div style={{ borderTop: `1px solid ${palette.line}`, padding: 18, display: "grid", gap: 14 }}>
        {children}
      </div>
    </details>
  );
}

function Field({ label, value, onChange, palette, type = "text", options, placeholder = "" }) {
  const controlStyle = {
    display: "block",
    width: "100%",
    minHeight: 44,
    marginTop: 6,
    padding: "9px 11px",
    border: `1px solid ${palette.line}`,
    borderRadius: "var(--wdw-radius-control, 14px)",
    background: "var(--wdw-field-bg, #fff)",
    color: "var(--wdw-field-text, #263a38)",
    font: "inherit",
  };

  return (
    <label style={{ display: "block", minWidth: 0, color: palette.dark, fontSize: 12.5, fontWeight: 750 }}>
      {label}
      {options ? (
        <select value={value} onChange={(event) => onChange(event.target.value)} style={controlStyle}>
          {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      ) : (
        <input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} style={controlStyle} />
      )}
    </label>
  );
}

function Notice({ palette, children, tone = "info" }) {
  const background = tone === "warn" ? "rgba(225,177,71,0.14)" : palette.panelSoft;
  return <p style={{ margin: 0, padding: 12, border: `1px solid ${palette.line}`, borderRadius: 13, background, color: palette.muted, fontSize: 12.5, lineHeight: 1.6 }}>{children}</p>;
}

function Button({ palette, onClick, children, secondary = false, disabled = false, type = "button" }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        minHeight: 42,
        padding: "9px 15px",
        border: secondary ? `1px solid ${palette.line}` : "none",
        borderRadius: 999,
        background: secondary ? "transparent" : palette.accent,
        color: secondary ? palette.dark : "#fff",
        font: "inherit",
        fontWeight: 800,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.55 : 1,
      }}
    >
      {children}
    </button>
  );
}

function Checklist({ items, palette }) {
  const [checked, setChecked] = useState({});
  return (
    <div style={{ display: "grid", gap: 8 }}>
      {items.map((item, index) => (
        <label key={item} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "9px 0", borderBottom: `1px solid ${palette.line}`, color: palette.text, fontSize: 13, lineHeight: 1.55 }}>
          <input type="checkbox" checked={Boolean(checked[index])} onChange={(event) => setChecked({ ...checked, [index]: event.target.checked })} />
          <span>{item}</span>
        </label>
      ))}
      <span style={{ color: palette.muted, fontSize: 11.5 }}>Checklist progress stays in this page session and is not submitted or saved.</span>
    </div>
  );
}

/** Public planning helpers. Inputs are temporary and do not submit or persist data. */
export default function WDWrightPreProjectSuite({ palette: suppliedPalette = {}, onNavigate }) {
  const palette = { ...DEFAULT_PALETTE, ...suppliedPalette };
  const [service, setService] = useState("Not sure yet");
  const [projectType, setProjectType] = useState("Lane or road closure");
  const [scopeMarket, setScopeMarket] = useState("");
  const [scopeDate, setScopeDate] = useState("");
  const [duration, setDuration] = useState("One shift");
  const [budgetBand, setBudgetBand] = useState("planning only");
  const [layout, setLayout] = useState("Single lane");
  const [visitMarket, setVisitMarket] = useState("");
  const [visitDate, setVisitDate] = useState("");
  const [coverageMarket, setCoverageMarket] = useState("");
  const [windowDate, setWindowDate] = useState("");
  const [windowTime, setWindowTime] = useState("day");
  const [visitStatus, setVisitStatus] = useState("");
  const [coverageStatus, setCoverageStatus] = useState("");
  const [roadType, setRoadType] = useState("Local or municipal road");

  const scopeSummary = useMemo(() => [projectType, scopeMarket.trim(), scopeDate, duration].filter(Boolean), [projectType, scopeMarket, scopeDate, duration]);
  const layoutLabel = layout === "Shoulder" ? "SHOULDER WORK AREA" : layout === "Intersection" ? "INTERSECTION WORK AREA" : layout === "Detour" ? "DETOUR CONCEPT" : "WORK AREA";
  const trafficLabel = layout === "Detour" ? "DETOUR ROUTE →" : layout === "Intersection" ? "TRAFFIC FLOW ↕" : "TRAFFIC FLOW →";
  const layoutBackground = layout === "Intersection"
    ? "linear-gradient(90deg, transparent 0 35%, var(--wdw-asphalt) 35% 65%, transparent 65%), linear-gradient(180deg, var(--wdw-card-soft) 0 30%, var(--wdw-asphalt) 30% 72%, var(--wdw-card-soft) 72%)"
    : "linear-gradient(180deg, var(--wdw-card-soft) 0 30%, var(--wdw-asphalt) 30% 72%, var(--wdw-card-soft) 72%)";

  function openQuote() {
    if (typeof onNavigate === "function") onNavigate("/quote");
  }

  function submitVisit(event) {
    event.preventDefault();
    setVisitStatus("This page has not sent a site-visit request. Please use Contact or Quote Access to reach the team and confirm availability.");
  }

  function checkCoverage(event) {
    event.preventDefault();
    setCoverageStatus(coverageMarket.trim()
      ? `Coverage for “${coverageMarket.trim()}” is not verified by this tool. Ask the Wright team to confirm service availability for the exact address and requested date.`
      : "Enter a city or ZIP to prepare a coverage question. This tool does not verify service availability.");
  }

  return (
    <section aria-labelledby="wdw-project-planning-title" style={{ margin: "20px 0", display: "grid", gap: 16 }}>
      <header style={{ padding: "22px clamp(18px, 3vw, 28px)", border: `1px solid ${palette.line}`, borderRadius: "var(--wdw-radius-feature, 28px)", background: palette.panel, boxShadow: "0 14px 34px var(--wdw-shadow, rgba(0,0,0,0.08))" }}>
        <div style={{ color: palette.accent, fontSize: 11, fontWeight: 850, letterSpacing: "0.14em", textTransform: "uppercase" }}>Plan a work zone</div>
        <h2 id="wdw-project-planning-title" style={{ margin: "7px 0 0", color: palette.dark, fontSize: "clamp(1.5rem, 3vw, 2.2rem)", lineHeight: 1.1 }}>Project planning tools</h2>
        <p style={{ maxWidth: 760, margin: "9px 0 0", color: palette.muted, fontSize: 13.5, lineHeight: 1.7 }}>Use these guides to prepare questions and project details. They are preliminary planning aids; they do not confirm permits, coverage, pricing, availability, or an approved traffic control plan.</p>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 360px), 1fr))", gap: 12 }}>
        <Panel palette={palette} number="01" title="Find the right service" detail="Choose the closest match to help frame your request." defaultOpen>
          <Field label="What do you need help with?" value={service} onChange={setService} palette={palette} options={SERVICE_OPTIONS.map((value) => ({ value, label: value }))} />
          <Notice palette={palette}>Selected: <strong style={{ color: palette.dark }}>{service}</strong>. A Wright representative will confirm scope and availability.</Notice>
          <Button palette={palette} onClick={openQuote}>Continue to quote request</Button>
        </Panel>

        <Panel palette={palette} number="02" title="Permit preparation guide" detail="A general checklist for questions to ask the road owner.">
          <Notice palette={palette} tone="warn">Requirements vary by road owner and work type. This is a preparation guide, not a permit determination.</Notice>
          <Checklist items={PERMIT_PROMPTS} palette={palette} />
        </Panel>

        <Panel palette={palette} number="03" title="Build a project scope" detail="Collect a concise outline before contacting the team.">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
            <Field label="Work type" value={projectType} onChange={setProjectType} palette={palette} options={["Lane or road closure", "Shoulder work", "Utility work", "Special event", "Other"].map((value) => ({ value, label: value }))} />
            <Field label="City, state, or ZIP" value={scopeMarket} onChange={setScopeMarket} palette={palette} placeholder="Project area" />
            <Field label="Preferred date" value={scopeDate} onChange={setScopeDate} palette={palette} type="date" />
            <Field label="Estimated duration" value={duration} onChange={setDuration} palette={palette} options={["One shift", "Multiple shifts", "Several days", "Not known yet"].map((value) => ({ value, label: value }))} />
          </div>
          <div style={{ borderRadius: 14, border: `1px solid ${palette.line}`, background: palette.panelSoft, padding: 14 }}>
            <strong style={{ color: palette.dark, fontSize: 13 }}>Scope outline</strong>
            <p style={{ margin: "6px 0 0", color: palette.muted, fontSize: 12.5, lineHeight: 1.6 }}>{scopeSummary.length ? scopeSummary.join(" · ") : "Choose project details above."}</p>
          </div>
          <Notice palette={palette}>This outline is temporary and stays in the current page. Use the quote form to send a request.</Notice>
          <Button palette={palette} onClick={openQuote}>Open quote form</Button>
        </Panel>

        <Panel palette={palette} number="04" title="Budget planning guide" detail="Identify cost factors to discuss; this tool does not calculate a price.">
          <Field label="Planning stage" value={budgetBand} onChange={setBudgetBand} palette={palette} options={[
            { value: "planning only", label: "Early planning" },
            { value: "scope set", label: "Scope mostly defined" },
            { value: "date set", label: "Date and hours known" },
            { value: "not sure", label: "Not sure yet" },
          ]} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 8 }}>
            {["Crew size and duration", "Work hours and phasing", "Equipment and devices", "Permits and site access", "Travel and location"].map((factor) => <div key={factor} style={{ padding: 11, border: `1px solid ${palette.line}`, borderRadius: 12, background: palette.panelSoft, color: palette.text, fontSize: 12 }}>{factor}</div>)}
          </div>
          <Notice palette={palette}>No rates or estimate are loaded here. Request a written quote for project-specific pricing.</Notice>
          <p style={{ margin: 0, color: palette.muted, fontSize: 12 }}>Planning stage selected: <strong style={{ color: palette.dark }}>{budgetBand === "planning only" ? "Early planning" : budgetBand === "scope set" ? "Scope mostly defined" : budgetBand === "date set" ? "Date and hours known" : "Not sure yet"}</strong></p>
          <Button palette={palette} onClick={openQuote}>Request a written quote</Button>
        </Panel>

        <Panel palette={palette} number="05" title="Preliminary closure layout" detail="Explore a concept shape, not a traffic control plan.">
          <Field label="Concept type" value={layout} onChange={setLayout} palette={palette} options={["Single lane", "Shoulder", "Intersection", "Detour"].map((value) => ({ value, label: value }))} />
          <div role="img" aria-label={`${layout} work-zone concept illustration, not an approved traffic plan`} style={{ minHeight: 150, position: "relative", overflow: "hidden", display: "grid", placeItems: "center", border: `1px solid ${palette.line}`, borderRadius: 15, background: layoutBackground }}>
            <div style={{ width: "82%", borderTop: "3px dashed #e5d7a0" }} />
            <span style={{ position: "absolute", left: layout === "Shoulder" ? "8%" : "12%", top: layout === "Shoulder" ? "61%" : "42%", padding: "7px 10px", borderRadius: 8, background: "var(--wdw-accent)", color: "#fff", fontSize: 11, fontWeight: 800 }}>{layoutLabel}</span>
            <span style={{ position: "absolute", right: "8%", top: "42%", color: "var(--wdw-text-strong)", fontSize: 12, fontWeight: 800 }}>{trafficLabel}</span>
          </div>
          <Notice palette={palette} tone="warn">Concept only. Device placement, tapers, buffer zones, and traffic routing must come from the approved site-specific plan and qualified review.</Notice>
        </Panel>

        <Panel palette={palette} number="06" title="Request a site visit" detail="Prepare a preferred date and project area for the team.">
          <form onSubmit={submitVisit} style={{ display: "grid", gap: 10 }}>
            <Field label="Project area" value={visitMarket} onChange={setVisitMarket} palette={palette} placeholder="City, state, or ZIP" />
            <Field label="Preferred visit date" value={visitDate} onChange={setVisitDate} palette={palette} type="date" />
            <div><Button palette={palette} type="submit">Prepare site-visit request</Button></div>
          </form>
          {visitStatus ? <><p role="status" style={{ margin: 0, color: palette.muted, fontSize: 12.5, lineHeight: 1.6 }}>{visitStatus}</p><Button palette={palette} secondary onClick={() => onNavigate?.("/contact")}>Open contact page</Button></> : null}
          <Notice palette={palette}>No visit is booked or sent from this page. The team must confirm date and availability.</Notice>
        </Panel>

        <Panel palette={palette} number="07" title="Check a service area" detail="Prepare a location question for the team.">
          <form onSubmit={checkCoverage} style={{ display: "grid", gap: 10 }}>
            <Field label="City, state, or ZIP" value={coverageMarket} onChange={setCoverageMarket} palette={palette} placeholder="Enter a project area" />
            <div><Button palette={palette}>Prepare coverage question</Button></div>
          </form>
          {coverageStatus ? <p role="status" style={{ margin: 0, color: palette.muted, fontSize: 12.5, lineHeight: 1.6 }}>{coverageStatus}</p> : null}
          <Notice palette={palette}>This site does not have an authoritative live coverage lookup. Entering a location does not verify crew availability.</Notice>
        </Panel>

        <Panel palette={palette} number="08" title="Utility coordination checklist" detail="Keep general coordination questions together.">
          <Checklist items={UTILITY_PROMPTS} palette={palette} />
          <Notice palette={palette}>Confirm responsibility, sequence, and approvals with the relevant utility and road owner.</Notice>
        </Panel>

        <Panel palette={palette} number="09" title="Choose a work window" detail="Record a preference for discussion; no schedule is checked.">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10 }}>
            <Field label="Preferred work date" value={windowDate} onChange={setWindowDate} palette={palette} type="date" />
            <Field label="Preferred time" value={windowTime} onChange={setWindowTime} palette={palette} options={[{ value: "day", label: "Daytime" }, { value: "night", label: "Night" }, { value: "weekend", label: "Weekend" }, { value: "flexible", label: "Flexible" }]} />
            <Field label="Estimated duration" value={duration} onChange={setDuration} palette={palette} options={["One shift", "Multiple shifts", "Several days", "Not known yet"].map((value) => ({ value, label: value }))} />
          </div>
          <Notice palette={palette}>This is a planning preference only. Do not treat it as a booking or confirmed work window.</Notice>
          <Button palette={palette} onClick={openQuote}>Open quote request</Button>
        </Panel>

        <Panel palette={palette} number="10" title="Road restriction guidance" detail="Start with the road owner and official local notices.">
          <Field label="Road owner or type" value={roadType} onChange={setRoadType} palette={palette} options={["Local or municipal road", "County road", "State route", "Private property", "Not known yet"].map((value) => ({ value, label: value }))} />
          <div style={{ display: "grid", gap: 8, color: palette.text, fontSize: 13, lineHeight: 1.6 }}>
            <div>• Confirm who controls the road and issues work permits.</div>
            <div>• Check official notices for closures, event restrictions, and work-hour limits.</div>
            <div>• Ask whether the road owner requires a specific traffic plan or notification process.</div>
          </div>
          <Notice palette={palette}>No live road-closure feed is connected. Verify current conditions and restrictions with the responsible authority before scheduling work.</Notice>
          <Button palette={palette} secondary onClick={() => onNavigate?.("/locations")}>Review Wright locations</Button>
        </Panel>
      </div>
    </section>
  );
}
