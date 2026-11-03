"use client";

import React, { useEffect, useMemo, useState } from "react";

const palette = {
  text: "var(--wdw-text, #243436)",
  muted: "var(--wdw-text-muted, #5d6b6d)",
  card: "var(--wdw-card, #fff)",
  soft: "var(--wdw-card-soft, #f2f3ed)",
  line: "var(--wdw-line, #dce1db)",
  accent: "var(--wdw-accent, #2f7473)",
  display: "var(--wdw-display-font, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif)",
  sans: "var(--wdw-sans-font, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif)",
};

const controlStyle = {
  width: "100%",
  minHeight: 44,
  border: `1px solid ${palette.line}`,
  borderRadius: 12,
  padding: "10px 12px",
  background: palette.card,
  color: palette.text,
  font: `600 14px ${palette.sans}`,
};

function safeRead(key, fallback) {
  if (typeof window === "undefined") return fallback;
  try {
    const value = window.localStorage.getItem(key);
    return value === null ? fallback : JSON.parse(value);
  } catch {
    return fallback;
  }
}
/** Searchable, filterable openings plus a private-on-device preparation checklist. */
export function WrightCareersExperience({ roles = [], benefits = [], onInterest = () => {}, onContactRecruiting = () => {} }) {
  const [query, setQuery] = useState("");
  const [market, setMarket] = useState("all");
  const [team, setTeam] = useState("all");
  const [checklist, setChecklist] = useState(() => safeRead("wdw-career-prep-v1", {}));
  const [status, setStatus] = useState("");
  const [busyRole, setBusyRole] = useState("");

  const markets = useMemo(() => [...new Set(roles.map((role) => role[2]).filter(Boolean))].sort(), [roles]);
  const teams = useMemo(() => [...new Set(roles.map((role) => role[1]).filter(Boolean))].sort(), [roles]);
  const filteredRoles = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return roles.filter(([title, group, location]) =>
      (market === "all" || location === market) &&
      (team === "all" || group === team) &&
      (!needle || `${title} ${group} ${location}`.toLowerCase().includes(needle))
    );
  }, [roles, query, market, team]);

  useEffect(() => {
    try { window.localStorage.setItem("wdw-career-prep-v1", JSON.stringify(checklist)); } catch { /* Local checklist is optional. */ }
  }, [checklist]);

  async function expressInterest(role) {
    setBusyRole(role);
    setStatus("");
    try {
      const result = await onInterest(role);
      setStatus(result?.message || "Your interest request was sent. Check the contact details for follow-up options.");
    } catch (error) {
      setStatus(error?.message || "We could not send that request. Please contact recruiting directly.");
    } finally {
      setBusyRole("");
    }
  }

  const prepItems = [
    ["availability", "Know the days and shifts you can work"],
    ["market", "Choose the locations you can reach"],
    ["credentials", "Gather any current traffic-control or safety credentials"],
    ["contact", "Have a reliable phone number and email ready"],
  ];

  return (
    <section aria-labelledby="wright-careers-title" style={{ display: "grid", gap: 18, color: palette.text }}>
      <div>
        <p style={{ margin: "0 0 7px", color: palette.accent, font: `800 11px ${palette.sans}`, letterSpacing: ".14em", textTransform: "uppercase" }}>Careers</p>
        <h2 id="wright-careers-title" style={{ margin: 0, font: `clamp(28px, 5vw, 42px)/1 ${palette.display}`, textTransform: "uppercase" }}>Find a role that fits your next shift.</h2>
        <p style={{ maxWidth: 760, color: palette.muted, font: `15px/1.7 ${palette.sans}` }}>Filter the listed opportunities by role and location. Your preparation checklist is saved only in this browser; it is not an application.</p>
        <p style={{ maxWidth: 760, color: palette.muted, font: `13px/1.65 ${palette.sans}` }}>The roles shown are starting points for interest and may not reflect current vacancies. Confirm openings, location, qualifications, schedule, and application steps with recruiting. “Express interest” sends an inquiry; it is not a formal job application or offer.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))", gap: 10 }}>
        <label style={{ display: "grid", gap: 6, font: `700 12px ${palette.sans}` }}>
          Search openings
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Role, team, or location" style={controlStyle} />
        </label>
        <label style={{ display: "grid", gap: 6, font: `700 12px ${palette.sans}` }}>
          Location
          <select value={market} onChange={(event) => setMarket(event.target.value)} style={controlStyle}>
            <option value="all">All listed locations</option>
            {markets.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label style={{ display: "grid", gap: 6, font: `700 12px ${palette.sans}` }}>
          Team
          <select value={team} onChange={(event) => setTeam(event.target.value)} style={controlStyle}>
            <option value="all">All teams</option>
            {teams.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
      </div>

      <p aria-live="polite" style={{ margin: 0, color: palette.muted, font: `13px ${palette.sans}` }}>{filteredRoles.length} {filteredRoles.length === 1 ? "opening" : "openings"} match your filters.</p>
      {filteredRoles.length ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))", gap: 12 }}>
          {filteredRoles.map(([title, group, location]) => (
            <article key={`${title}-${location}`} style={{ padding: 18, border: `1px solid ${palette.line}`, borderRadius: 18, background: palette.card }}>
              <p style={{ margin: "0 0 6px", color: palette.accent, font: `800 11px ${palette.sans}`, textTransform: "uppercase" }}>{group}</p>
              <h3 style={{ margin: "0 0 5px", font: `22px/1.1 ${palette.display}` }}>{title}</h3>
              <p style={{ margin: "0 0 14px", color: palette.muted, font: `13px ${palette.sans}` }}>{location}</p>
              <button type="button" disabled={busyRole === title} onClick={() => expressInterest(title)} style={{ minHeight: 44, border: 0, borderRadius: 999, padding: "0 16px", background: palette.accent, color: "#1e2929", font: `800 13px ${palette.sans}`, cursor: "pointer", opacity: busyRole === title ? .65 : 1 }}>
                {busyRole === title ? "Sending…" : "Express interest"}
              </button>
            </article>
          ))}
        </div>
      ) : <div role="status" style={{ border: `1px solid ${palette.line}`, borderRadius: 16, padding: 18, background: palette.soft, font: `14px/1.6 ${palette.sans}` }}>No listed openings match. Try clearing a filter or contact recruiting about future opportunities.</div>}
      {status ? <div role="status" aria-live="polite" style={{ borderLeft: `4px solid ${palette.accent}`, borderRadius: 10, padding: 14, background: palette.soft, font: `14px/1.6 ${palette.sans}` }}>{status}</div> : null}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 270px), 1fr))", gap: 14 }}>
        <section aria-labelledby="wright-application-prep" style={{ padding: 18, border: `1px solid ${palette.line}`, borderRadius: 18, background: palette.soft }}>
          <h3 id="wright-application-prep" style={{ margin: "0 0 12px", font: `23px/1.1 ${palette.display}`, textTransform: "uppercase" }}>Application prep</h3>
          {prepItems.map(([key, label]) => (
            <label key={key} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "8px 0", font: `14px/1.5 ${palette.sans}` }}>
              <input type="checkbox" checked={checklist[key] === true} onChange={(event) => setChecklist((current) => ({ ...current, [key]: event.target.checked }))} style={{ marginTop: 3, accentColor: "#b97712" }} />
              <span>{label}</span>
            </label>
          ))}
        </section>
        <section aria-labelledby="wright-career-benefits" style={{ padding: 18, border: `1px solid ${palette.line}`, borderRadius: 18, background: palette.card }}>
          <h3 id="wright-career-benefits" style={{ margin: "0 0 12px", font: `23px/1.1 ${palette.display}`, textTransform: "uppercase" }}>Working at Wright</h3>
          <ul style={{ display: "grid", gap: 9, margin: 0, paddingLeft: 20, color: palette.muted, font: `14px/1.6 ${palette.sans}` }}>
            {benefits.map((benefit) => <li key={benefit}>{benefit}</li>)}
          </ul>
        </section>
      </div>
      <button type="button" onClick={onContactRecruiting} style={{ justifySelf: "start", minHeight: 44, border: `1px solid ${palette.line}`, borderRadius: 999, padding: "0 16px", background: palette.card, color: palette.text, font: `800 13px ${palette.sans}`, cursor: "pointer" }}>Contact recruiting</button>
    </section>
  );
}

/** Site-wide keyboard shortcut, text-size, contrast, and motion preferences. */
export function WrightAccessibilityControls() {
  const [preferences, setPreferences] = useState(() => safeRead("wdw-accessibility-v1", { text: false, contrast: false, motion: false }));

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.wdwTextLarge = preferences.text ? "true" : "false";
    root.dataset.wdwHighContrast = preferences.contrast ? "true" : "false";
    root.dataset.wdwReduceMotion = preferences.motion ? "true" : "false";
    try { window.localStorage.setItem("wdw-accessibility-v1", JSON.stringify(preferences)); } catch { /* Preference saving is optional. */ }
  }, [preferences]);

  const toggle = (key) => setPreferences((current) => ({ ...current, [key]: !current[key] }));
  const buttonStyle = (active) => ({ minHeight: 42, border: `1px solid ${active ? "#5a7778" : palette.line}`, borderRadius: 999, background: active ? "#e4efed" : palette.card, color: palette.text, padding: "0 12px", font: `700 12px ${palette.sans}`, cursor: "pointer" });

  return (
    <>
      <style>{`
        html[data-wdw-text-large="true"] body :is(p, li, label, button, input, textarea, select, summary) { font-size: calc(1em + 1px) !important; }
        html[data-wdw-high-contrast="true"] { --wdw-text: #101b1d; --wdw-text-muted: #26383a; --wdw-line: #526567; --wdw-bg: #fff; --wdw-bg-alt: #f7f7f3; --wdw-card: #fff; --wdw-card-soft: #f2f3ee; }
        html[data-wdw-high-contrast="true"] :focus-visible { outline: 3px solid #8a4b00 !important; outline-offset: 3px !important; }
        html[data-wdw-reduce-motion="true"] *, html[data-wdw-reduce-motion="true"] *::before, html[data-wdw-reduce-motion="true"] *::after { scroll-behavior: auto !important; animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; }
      `}</style>
      <details style={{ position: "fixed", zIndex: 1000, right: 14, bottom: 14, maxWidth: "calc(100vw - 28px)", color: palette.text, fontFamily: palette.sans }}>
        <summary style={{ minHeight: 44, display: "flex", alignItems: "center", padding: "0 15px", listStyle: "none", border: `1px solid ${palette.line}`, borderRadius: 999, background: palette.card, boxShadow: "0 8px 28px rgba(0,0,0,.15)", fontWeight: 800, fontSize: 12, cursor: "pointer" }} aria-label="Open accessibility preferences">Accessibility</summary>
        <div aria-label="Accessibility preferences" style={{ display: "grid", gap: 8, width: 230, marginBottom: 8, padding: 12, border: `1px solid ${palette.line}`, borderRadius: 16, background: palette.card, boxShadow: "0 8px 28px rgba(0,0,0,.15)" }}>
          <button type="button" aria-pressed={preferences.text} onClick={() => toggle("text")} style={buttonStyle(preferences.text)}>Larger text {preferences.text ? "✓" : ""}</button>
          <button type="button" aria-pressed={preferences.contrast} onClick={() => toggle("contrast")} style={buttonStyle(preferences.contrast)}>Higher contrast {preferences.contrast ? "✓" : ""}</button>
          <button type="button" aria-pressed={preferences.motion} onClick={() => toggle("motion")} style={buttonStyle(preferences.motion)}>Reduce motion {preferences.motion ? "✓" : ""}</button>
          <p style={{ margin: 0, color: palette.muted, fontSize: 11, lineHeight: 1.45 }}>Preferences are saved in this browser only.</p>
        </div>
      </details>
    </>
  );
}
