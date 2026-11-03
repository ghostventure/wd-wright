"use client";

import React, { useEffect, useMemo, useState } from "react";
import { BRAND } from "./wd-wright-data.js";

const REQUESTS_KEY = "wd-wright-leads-v2";
const CONTACTS_KEY = "wd-wright-project-contacts-v1";
const LOCATIONS_KEY = "wd-wright-saved-locations-v1";
const NOTIFICATIONS_KEY = "wd-wright-notification-preferences-v1";
const FIELD_CHECKLIST_KEY = "wd-wright-field-checklist-v1";

function useDeviceValue(key, initialValue) {
  const [value, setValue] = useState(initialValue);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(key);
      if (saved) setValue(JSON.parse(saved));
    } catch {
      // Keep the page usable if local browser storage is blocked or malformed.
    }
    setReady(true);
  }, [key]);
  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Persistence is a convenience, not a blocker for the form.
    }
  }, [key, ready, value]);
  return [value, setValue];
}

function Panel({ palette, title, description, children, action }) {
  return (
    <section style={{ background: palette.panel, border: `1px solid ${palette.line}`, borderRadius: 22, padding: 20, display: "grid", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h2 style={{ margin: 0, color: palette.dark, fontSize: 20 }}>{title}</h2>
          <p style={{ margin: "6px 0 0", color: palette.muted, fontSize: 13, lineHeight: 1.6 }}>{description}</p>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function DeviceNote({ palette }) {
  return <p style={{ margin: 0, color: palette.muted, fontSize: 12, lineHeight: 1.55 }}>Saved in this browser only. It is not synced to your WD Wright account.</p>;
}

function Field({ label, value, onChange, palette, type = "text", placeholder = "" }) {
  return (
    <label style={{ display: "grid", gap: 6, color: palette.dark, fontSize: 12, fontWeight: 750 }}>
      {label}
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} style={{ minHeight: 42, border: `1px solid ${palette.line}`, borderRadius: 12, padding: "8px 11px", color: palette.dark, background: palette.panelSoft, font: "inherit" }} />
    </label>
  );
}

function ActionButton({ palette, children, onClick, disabled = false, secondary = false, type = "button" }) {
  return <button type={type} disabled={disabled} onClick={onClick} style={{ minHeight: 40, borderRadius: 12, padding: "8px 14px", border: `1px solid ${palette.line}`, background: secondary ? "transparent" : palette.accent, color: secondary ? palette.dark : palette.accentText, fontWeight: 800, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.6 : 1 }}>{children}</button>;
}

export function CustomerRequestPanel({ palette, onOpenQuote }) {
  const [requests] = useDeviceValue(REQUESTS_KEY, []);
  const rows = Array.isArray(requests) ? [...requests].sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || ""))) : [];
  return (
    <Panel palette={palette} title="Your requests" description="See quote and contact requests saved by this browser." action={<ActionButton palette={palette} onClick={onOpenQuote}>Start a request</ActionButton>}>
      <DeviceNote palette={palette} />
      {rows.length ? <div style={{ display: "grid", gap: 9 }}>{rows.map((row) => <article key={row.id} style={{ border: `1px solid ${palette.line}`, background: palette.panelSoft, borderRadius: 14, padding: 14 }}><div style={{ display: "flex", gap: 8, justifyContent: "space-between", flexWrap: "wrap" }}><strong style={{ color: palette.dark }}>{String(row.type || "Request").replaceAll("-", " ")}</strong><span style={{ color: palette.strong, fontSize: 12, fontWeight: 800 }}>{row.status === "queued_local" ? "Saved on this device" : String(row.status || "Saved")}</span></div><div style={{ color: palette.muted, fontSize: 13, marginTop: 5 }}>{row.project?.location || row.contact?.name || "Request details"} · {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "Date unavailable"}</div></article>)}</div> : <div style={{ border: `1px dashed ${palette.line}`, borderRadius: 14, padding: 18, color: palette.muted, fontSize: 13 }}>No requests are saved in this browser. Requests submitted on another device or through an account backend will not appear here yet.</div>}
    </Panel>
  );
}

export function AccountSetupPanel({ user, palette, onOpenProfile }) {
  const steps = useMemo(() => [
    { label: "Add your name", done: String(user?.name || "").trim().length >= 2 },
    { label: "Add a callback number", done: String(user?.phone || "").replace(/\D/g, "").length >= 7 },
    { label: "Choose your preferred contact method", done: Boolean(user?.userDatabase?.preferredContact) },
    { label: "Set your service area", done: Boolean(user?.userDatabase?.targetMarket) },
  ], [user]);
  const completed = steps.filter((item) => item.done).length;
  return <Panel palette={palette} title="Account setup" description={`${completed} of ${steps.length} useful details added.`} action={<ActionButton palette={palette} secondary onClick={onOpenProfile}>Review profile</ActionButton>}><div style={{ height: 8, background: palette.panelSoft, borderRadius: 99, overflow: "hidden" }}><div style={{ width: `${(completed / steps.length) * 100}%`, height: "100%", background: palette.accent }} /></div><ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>{steps.map((step) => <li key={step.label} style={{ color: palette.dark, fontSize: 13 }}>{step.done ? "✓" : "○"} {step.label}</li>)}</ul></Panel>;
}

export function ProjectContactsPanel({ palette }) {
  const [contacts, setContacts] = useDeviceValue(CONTACTS_KEY, []);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  function add(event) {
    event.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setContacts([{ id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, name: name.trim(), role: role.trim(), email: email.trim() }, ...(Array.isArray(contacts) ? contacts : [])].slice(0, 20));
    setName(""); setRole(""); setEmail("");
  }
  return <Panel palette={palette} title="Project contacts" description="Keep key customer-side contacts together for future requests."><DeviceNote palette={palette} /><form onSubmit={add} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, alignItems: "end" }}><Field label="Name" value={name} onChange={setName} palette={palette} placeholder="Project lead" /><Field label="Role" value={role} onChange={setRole} palette={palette} placeholder="Site contact" /><Field label="Email" value={email} onChange={setEmail} palette={palette} type="email" placeholder="name@example.com" /><ActionButton palette={palette} type="submit" disabled={!name.trim() || !email.trim()}>Add contact</ActionButton></form>{contacts?.length ? <div style={{ display: "grid", gap: 8 }}>{contacts.map((contact) => <div key={contact.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, border: `1px solid ${palette.line}`, borderRadius: 12, padding: 12 }}><div style={{ color: palette.dark }}><strong>{contact.name}</strong><div style={{ color: palette.muted, fontSize: 12 }}>{[contact.role, contact.email].filter(Boolean).join(" · ")}</div></div><button type="button" aria-label={`Remove ${contact.name}`} onClick={() => setContacts(contacts.filter((item) => item.id !== contact.id))} style={{ border: 0, background: "transparent", color: palette.strong, cursor: "pointer", fontWeight: 800 }}>Remove</button></div>)}</div> : <p style={{ color: palette.muted, fontSize: 13, margin: 0 }}>No project contacts saved yet.</p>}</Panel>;
}

export function SavedLocationsPanel({ palette }) {
  const [locations, setLocations] = useDeviceValue(LOCATIONS_KEY, []);
  const [label, setLabel] = useState("");
  const [address, setAddress] = useState("");
  function add(event) { event.preventDefault(); if (!label.trim() || !address.trim()) return; setLocations([{ id: `${Date.now()}`, label: label.trim(), address: address.trim() }, ...(Array.isArray(locations) ? locations : [])].slice(0, 20)); setLabel(""); setAddress(""); }
  return <Panel palette={palette} title="Saved project locations" description="Reuse frequent work sites when preparing a request."><DeviceNote palette={palette} /><form onSubmit={add} style={{ display: "grid", gridTemplateColumns: "minmax(130px, 0.8fr) minmax(200px, 1.5fr) auto", gap: 10, alignItems: "end" }}><Field label="Location name" value={label} onChange={setLabel} palette={palette} placeholder="North yard" /><Field label="Address or ZIP" value={address} onChange={setAddress} palette={palette} placeholder="Street, city, state" /><ActionButton palette={palette} type="submit" disabled={!label.trim() || !address.trim()}>Save location</ActionButton></form>{locations?.length ? <div style={{ display: "grid", gap: 8 }}>{locations.map((item) => <div key={item.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, border: `1px solid ${palette.line}`, borderRadius: 12, padding: 12 }}><div style={{ color: palette.dark }}><strong>{item.label}</strong><div style={{ color: palette.muted, fontSize: 12 }}>{item.address}</div></div><button type="button" aria-label={`Remove ${item.label}`} onClick={() => setLocations(locations.filter((location) => location.id !== item.id))} style={{ border: 0, background: "transparent", color: palette.strong, cursor: "pointer", fontWeight: 800 }}>Remove</button></div>)}</div> : <p style={{ color: palette.muted, fontSize: 13, margin: 0 }}>No locations saved yet.</p>}</Panel>;
}

export function NotificationPreferencesPanel({ palette }) {
  const [preferences, setPreferences] = useDeviceValue(NOTIFICATIONS_KEY, { requestUpdates: true, accountSecurity: true, productNews: false });
  const items = [["requestUpdates", "Request updates", "Local reminder preference for quote and contact follow-up."], ["accountSecurity", "Account security", "Sign-in and account security notices."], ["productNews", "Company news", "Occasional company and service updates."]];
  return <Panel palette={palette} title="Notification preferences" description="Choose the kinds of updates you want to receive when account notifications are connected."><DeviceNote palette={palette} />{items.map(([key, label, detail]) => <label key={key} style={{ display: "flex", alignItems: "start", gap: 10, color: palette.dark, padding: "10px 0", borderTop: `1px solid ${palette.line}` }}><input type="checkbox" checked={Boolean(preferences?.[key])} onChange={(event) => setPreferences({ ...preferences, [key]: event.target.checked })} /><span><strong style={{ fontSize: 13 }}>{label}</strong><span style={{ display: "block", color: palette.muted, fontSize: 12, marginTop: 3 }}>{detail}</span></span></label>)}</Panel>;
}

const FIELD_ITEMS = ["Confirm work limits and setup match the approved job plan", "Check required traffic control devices and PPE", "Review site access, staging, and crew contacts", "Record changes or hazards for supervisor review", "Complete end-of-shift handoff and equipment check"];

export function FieldReadinessPanel({ palette }) {
  const [checks, setChecks] = useDeviceValue(FIELD_CHECKLIST_KEY, {});
  const checkedCount = FIELD_ITEMS.filter((_, index) => checks?.[index]).length;
  return <Panel palette={palette} title="Field readiness checklist" description="A reminder list for planning and handoff. Follow the approved job plan and your company safety procedures."><div style={{ padding: 12, borderRadius: 12, background: palette.panelSoft, color: palette.muted, fontSize: 12, lineHeight: 1.6 }}>General prompts only. This checklist is not a traffic control plan, work authorization, or safety approval.</div><div style={{ height: 7, background: palette.panelSoft, borderRadius: 99, overflow: "hidden" }}><div style={{ width: `${(checkedCount / FIELD_ITEMS.length) * 100}%`, height: "100%", background: palette.accent }} /></div>{FIELD_ITEMS.map((item, index) => <label key={item} style={{ display: "flex", gap: 10, alignItems: "start", color: palette.dark, fontSize: 13, padding: "8px 0", borderTop: `1px solid ${palette.line}` }}><input type="checkbox" checked={Boolean(checks?.[index])} onChange={(event) => setChecks({ ...checks, [index]: event.target.checked })} /><span>{item}</span></label>)}<DeviceNote palette={palette} /></Panel>;
}

export function FieldJobBriefPanel({ palette }) {
  const [brief, setBrief] = useDeviceValue("wd-wright-field-brief-v1", { project: "", location: "", date: "", contact: "", notes: "" });
  const update = (key) => (value) => setBrief({ ...brief, [key]: value });
  return <Panel palette={palette} title="Field job brief" description="Prepare a device-local summary for your own reference. No dispatch assignment is connected here."><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}><Field label="Project" value={brief.project || ""} onChange={update("project")} palette={palette} /><Field label="Work location" value={brief.location || ""} onChange={update("location")} palette={palette} /><Field label="Work date" value={brief.date || ""} onChange={update("date")} palette={palette} type="date" /><Field label="Site contact" value={brief.contact || ""} onChange={update("contact")} palette={palette} /></div><label style={{ display: "grid", gap: 6, color: palette.dark, fontSize: 12, fontWeight: 750 }}>Notes<textarea value={brief.notes || ""} onChange={(event) => update("notes")(event.target.value)} rows={3} maxLength={1000} style={{ border: `1px solid ${palette.line}`, borderRadius: 12, padding: 10, color: palette.dark, background: palette.panelSoft, font: "inherit" }} /></label><div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}><DeviceNote palette={palette} /><ActionButton palette={palette} secondary onClick={() => window.print()}>Print brief</ActionButton></div></Panel>;
}

export function SafetyResourcesPanel({ palette, onOpenResources }) {
  const links = [
    ["Request-specific safety plan", "Use the plan approved for the job and work location."],
    ["Pre-shift coordination", "Confirm roles, communication, access, and escalation contacts with the site lead."],
    ["Field issue handoff", "Record a hazard or change through the designated supervisor or company process."],
  ];
  return <Panel palette={palette} title="Safety and field resources" description="Quick reminders for finding the right approved job guidance.">{links.map(([title, body]) => <div key={title} style={{ borderTop: `1px solid ${palette.line}`, paddingTop: 10 }}><strong style={{ color: palette.dark, fontSize: 13 }}>{title}</strong><p style={{ color: palette.muted, fontSize: 12, lineHeight: 1.55, margin: "4px 0 0" }}>{body}</p></div>)}<div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}><a href="tel:911" style={{ color: palette.strong, fontSize: 13, fontWeight: 800 }}>Emergency? Call local emergency services</a><a href={`tel:${BRAND.phone.replace(/[^\d+]/g, "")}`} style={{ color: palette.strong, fontSize: 13, fontWeight: 800 }}>Call Wright: {BRAND.phone}</a><ActionButton palette={palette} secondary onClick={onOpenResources}>Open public resources</ActionButton></div></Panel>;
}

export function DocumentReadinessPanel({ palette, onOpenPublicPage }) {
  const docs = ["Traffic control plan or site drawing", "Permit or jurisdiction notes", "Project schedule and work window", "Site contact and escalation details"];
  return <Panel palette={palette} title="Document center" description="Prepare a packet checklist for the project. Live upload, scan, and review status are not connected in this account yet.">{docs.map((item) => <label key={item} style={{ display: "flex", gap: 10, padding: "8px 0", color: palette.dark, fontSize: 13 }}><input type="checkbox" />{item}</label>)}<div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}><ActionButton palette={palette} onClick={() => onOpenPublicPage("/quote")}>Attach to quote request</ActionButton><ActionButton palette={palette} secondary onClick={() => onOpenPublicPage("/help")}>Document help</ActionButton></div></Panel>;
}
