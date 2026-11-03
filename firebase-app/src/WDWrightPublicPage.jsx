"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import WDWrightBrandLockup from "./WDWrightBrandLockup.jsx";
import WDWrightPublicFooter from "./WDWrightPublicFooter.jsx";
import { WrightAccessibilityControls, WrightCareersExperience } from "./WDWrightCareersAccessSuite.jsx";
import { EmptyPanel, HelpDrawer, InlineFieldMessage, QuickActionRail, SegmentedThemeToggle, StatusPill, Stepper } from "./WDWrightUiKit.jsx";
import { useWrightThemeMode, WRIGHT_THEME_OPTIONS } from "./wd-wright-theme-sync.js";
import { WDWRIGHT_THEME } from "./wd-wright-theme.js";
import { subscribeToWrightAuthSignals } from "./wd-wright-auth-sync.js";
import {
  BRAND,
  CAREER_BENEFITS,
  CREDENTIALS,
  FAQS,
  HERO_METRICS,
  HERO_IMAGERY_PANELS,
  INDUSTRIES,
  LOCATION_GROUPS,
  MAP_HIGHLIGHTS,
  NAV_ITEMS,
  OPEN_ROLES,
  CUSTOMER_PATHWAY_COMPONENTS,
  PUBLIC_COMPONENTS,
  RESOURCES,
  ROADMAP,
  SERVICES,
  SERVICE_DECISION_COMPONENTS,
  TECHNOLOGY_ITEMS,
  TECHNOLOGY_VISUALS,
  TRUST_POINTS,
} from "./wd-wright-data.js";
import { submitLead } from "./wd-wright-leads.js";
import { auth } from "./firebase.js";

const P = {
  bg: "var(--wdw-bg)",
  sand: "var(--wdw-bg-alt)",
  asphalt: "var(--wdw-asphalt)",
  card: "var(--wdw-card)",
  cardSoft: "var(--wdw-card-soft)",
  line: "var(--wdw-line)",
  text: "var(--wdw-text)",
  muted: "var(--wdw-text-muted)",
  amber: "var(--wdw-accent)",
  lime: "var(--wdw-accent-strong)",
  pine: "var(--wdw-text-strong)",
  pineSoft: "var(--wdw-bg-alt)",
  fieldBg: "var(--wdw-field-bg)",
  fieldText: "var(--wdw-field-text)",
  shadow: "var(--wdw-shadow)",
  shadowStrong: "var(--wdw-shadow-strong)",
  sans: WDWRIGHT_THEME.sans,
  display: WDWRIGHT_THEME.display,
};

function getBrandLockupStyle(themeMode, context = "header") {
  const isHero = context === "hero";
  if (themeMode === "wright-night") {
    return {
      wrap: {
        display: "inline-flex",
        padding: isHero ? "14px 18px" : "10px 14px",
        borderRadius: isHero ? 24 : 18,
        background: isHero ? "rgba(255,255,255,0.94)" : "rgba(255,255,255,0.92)",
        border: "1px solid rgba(255,255,255,0.18)",
        boxShadow: isHero ? "0 18px 34px rgba(0,0,0,0.24)" : "0 10px 22px rgba(0,0,0,0.16)",
      },
      image: {
        filter: "drop-shadow(0 8px 14px rgba(0,0,0,0.12)) saturate(1.02)",
      },
    };
  }
  if (themeMode === "wright-safety") {
    return {
      wrap: {
        display: "inline-flex",
        padding: isHero ? "14px 18px" : "10px 14px",
        borderRadius: isHero ? 24 : 18,
        background: isHero ? "rgba(252,248,234,0.96)" : "rgba(252,248,234,0.94)",
        border: "1px solid rgba(240,174,47,0.28)",
        boxShadow: isHero ? "0 18px 34px rgba(12,16,5,0.28)" : "0 10px 22px rgba(12,16,5,0.18)",
      },
      image: {
        filter: "drop-shadow(0 8px 14px rgba(0,0,0,0.12)) saturate(1.04) contrast(1.02)",
      },
    };
  }
  return {
    wrap: {
      display: "inline-flex",
      padding: isHero ? "10px 0" : 0,
      borderRadius: isHero ? 18 : 0,
      background: "transparent",
      border: "none",
      boxShadow: "none",
    },
    image: {
      filter: isHero ? "drop-shadow(0 18px 28px rgba(0,0,0,0.24))" : "none",
    },
  };
}

function hrefToView(href = "/") {
  const normalized = String(href || "/").replace(/^\//, "") || "home";
  return normalized === "" ? "home" : normalized;
}

const PUBLIC_VIEWS = {
  home: "Wright Traffic Control",
  about: "About Wright Traffic Control",
  services: "Traffic Control Services",
  technology: "Traffic Control Technology",
  locations: "Wright Locations",
  resources: "Traffic Control Resources",
  careers: "Traffic Control Careers",
  contact: "Contact Wright",
  quote: "Get A Traffic Control Quote",
  faq: "Wright FAQ",
  help: "Wright Help Center",
  press: "Wright Press",
  invest: "Wright Corporate Information",
  privacy: "Wright Privacy",
  terms: "Wright Terms",
  accessibility: "Wright Accessibility",
  dmca: "Wright DMCA Policy",
};
const AUTH_REQUIRED_VIEWS = new Set([
  "resources",
  "help",
]);

function Shell({ children, onNavigate, themeMode, onThemeChange, firebaseUser, currentView }) {
  const [navOpen, setNavOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const currentLabel = PUBLIC_VIEWS[currentView] || "Wright Traffic Control";
  const signedInLabel = firebaseUser?.uid ? "Account active" : "Public mode";
  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(180deg, ${P.bg} 0%, ${P.sand} 42%, ${P.sand} 100%)`, color: P.text, position: "relative" }}>
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(circle at 8% 12%, rgba(91,154,160,0.14), transparent 24%), radial-gradient(circle at 92% 8%, rgba(68,127,133,0.10), transparent 18%), linear-gradient(180deg, rgba(255,255,255,0.05), transparent 28%)" }} />
      <div className="wdw-public-shell-width" style={{ width: "min(1180px, calc(100% - 32px))", margin: "0 auto", paddingTop: 18 }}>
        <header
          style={{
            position: "relative",
            zIndex: 10,
            backdropFilter: "blur(14px)",
            background: P.card,
            border: `1px solid ${P.line}`,
            borderRadius: 18,
            padding: "14px 18px",
            boxShadow: `0 12px 30px ${P.shadow}`,
            marginBottom: 20,
          }}
        >
          <div style={{ display: "grid", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => onNavigate("/")}
                  style={{ border: "none", background: "transparent", cursor: "pointer", padding: 0, textAlign: "left" }}
                >
                  <WDWrightBrandLockup themeMode={themeMode} context="header" width="min(240px, 42vw)" />
                </button>
                <div style={{ display: "grid", gap: 4 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <StatusPill label={signedInLabel} tone="accent" palette={{ line: P.line, panelSoft: P.cardSoft, muted: P.muted, accentSoft: "rgba(91,154,160,0.16)", accent: P.amber, strong: P.pine }} />
                    <StatusPill label={currentLabel} palette={{ line: P.line, panelSoft: P.cardSoft, muted: P.muted }} />
                  </div>
                  <div style={{ fontFamily: P.sans, fontSize: 12.5, color: P.muted, maxWidth: 420 }}>
                    {firebaseUser?.uid
                      ? "Your quote, help, document, and dashboard access stay linked to one WD Wright account."
                      : "Review services, coverage, and company information, then sign in for protected requests and account access."}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setNavOpen((current) => !current)}
                  style={{
                    border: `1px solid ${P.line}`,
                    background: P.cardSoft,
                    color: P.text,
                    padding: "10px 14px",
                    borderRadius: 999,
                    cursor: "pointer",
                    fontFamily: P.sans,
                    fontSize: 12.5,
                    fontWeight: 800,
                  }}
                >
                  {navOpen ? "Close Menu" : "Menu"}
                </button>
                <button
                  type="button"
                  onClick={() => setHelpOpen(true)}
                  style={{
                    border: `1px solid ${P.line}`,
                    background: "transparent",
                    color: P.text,
                    padding: "10px 14px",
                    borderRadius: 999,
                    cursor: "pointer",
                    fontFamily: P.sans,
                    fontSize: 12.5,
                    fontWeight: 800,
                  }}
                >
                  Help
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate(firebaseUser?.uid ? "/home" : "/signin")}
                  style={{
                    border: "none",
                    background: P.amber,
                    color: "#fff",
                    padding: "10px 14px",
                    borderRadius: 999,
                    cursor: "pointer",
                    fontFamily: P.sans,
                    fontSize: 12.5,
                    fontWeight: 800,
                    boxShadow: `0 14px 28px ${P.shadow}`,
                  }}
                >
                  {firebaseUser?.uid ? "Dashboard" : "Sign In"}
                </button>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
              <SegmentedThemeToggle
                options={WRIGHT_THEME_OPTIONS.map((option) => ({ key: option.key, label: option.label.replace("Wright ", "") }))}
                value={themeMode}
                onChange={onThemeChange}
                compact
                palette={{ line: P.line, panelSoft: P.cardSoft, dark: P.pine, accentText: P.card, text: P.text }}
              />
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                {[
                  ["Coverage", "/locations"],
                  ["Services", "/services"],
                  [firebaseUser?.uid ? "Protected Quote" : "Quote Access", "/quote"],
                ].map(([label, href]) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => onNavigate(href)}
                    style={{
                      border: `1px solid ${P.line}`,
                      background: "transparent",
                      color: P.text,
                      padding: "10px 12px",
                      borderRadius: 999,
                      cursor: "pointer",
                      fontFamily: P.sans,
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            {navOpen ? (
              <nav style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, paddingTop: 6 }}>
                {NAV_ITEMS.map(([label, href]) => {
                  const active = hrefToView(href) === currentView || (href === "/" && currentView === "home");
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => {
                        setNavOpen(false);
                        onNavigate(href);
                      }}
                      style={{
                        border: `1px solid ${active ? P.amber : P.line}`,
                        background: active ? P.cardSoft : "transparent",
                        color: active ? P.pine : P.text,
                        padding: "12px 14px",
                        borderRadius: 16,
                        cursor: "pointer",
                        fontFamily: P.sans,
                        fontSize: 12.5,
                        fontWeight: 800,
                        textAlign: "left",
                        boxShadow: active ? `0 12px 22px ${P.shadow}` : "none",
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </nav>
            ) : null}
          </div>
        </header>
        <main id="main-content" className="wdw-shell-main" tabIndex={-1}>
          {children}
        </main>
        <WDWrightPublicFooter themeMode={themeMode} onNavigate={onNavigate} />
        <WrightAccessibilityControls />
        <div
          style={{
            position: "relative",
            zIndex: 9,
            marginTop: 18,
            padding: "14px 16px",
            borderRadius: 18,
            border: `1px solid ${P.line}`,
            background: P.card,
            boxShadow: `0 14px 30px ${P.shadow}`,
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: P.sans, fontSize: 11, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: P.amber }}>
              Quote Access
            </div>
            <div style={{ marginTop: 4, fontFamily: P.sans, fontSize: 13.5, lineHeight: 1.65, color: P.muted }}>
              Move from public browsing into protected quote intake, account-linked documents, and follow-up.
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => onNavigate("/quote")}
              style={{ border: "none", background: P.amber, color: "#fff", minHeight: 42, padding: "0 14px", borderRadius: 999, cursor: "pointer", fontFamily: P.sans, fontWeight: 800 }}
            >
              Open Quote
            </button>
            <button
              type="button"
              onClick={() => onNavigate(firebaseUser?.uid ? "/home" : "/signin")}
              style={{ border: `1px solid ${P.line}`, background: "transparent", color: P.text, minHeight: 42, padding: "0 14px", borderRadius: 999, cursor: "pointer", fontFamily: P.sans, fontWeight: 800 }}
            >
              {firebaseUser?.uid ? "Open Dashboard" : "Sign In"}
            </button>
          </div>
        </div>
      </div>
      <HelpDrawer
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        title={currentLabel}
        body="Use the public site to review services, coverage, planning guidance, and recruiting, then move into protected quote and account areas when you are ready."
        items={[
          { title: "Need a quote?", body: "Use the protected quote flow once you are signed in so WD Wright can connect project details to your account." },
          { title: "Need coverage confirmation?", body: "Use the locations page to review office regions, Google Maps launch links, and market availability." },
          { title: "Need account access?", body: "Sign in once to connect documents, booking, resources, and dashboard settings." },
        ]}
        palette={{ line: P.line, panel: P.card, panelSoft: P.cardSoft, muted: P.muted, dark: P.text, strong: P.amber }}
      />
    </div>
  );
}

function SectionTitle({ eyebrow, title, body }) {
  return (
    <div style={{ marginBottom: 18 }}>
      {eyebrow ? (
        <div style={{ fontFamily: P.sans, fontSize: 11, fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase", color: P.amber, marginBottom: 8 }}>
          {eyebrow}
        </div>
      ) : null}
      <h1 style={{ margin: 0, fontFamily: P.display, fontSize: "clamp(2rem, 5vw, 3.5rem)", lineHeight: 1.02, letterSpacing: "0.02em", textTransform: "uppercase", color: P.text }}>
        {title}
      </h1>
      {body ? <p style={{ margin: "12px 0 0", fontFamily: P.sans, fontSize: 15, lineHeight: 1.8, color: P.muted, maxWidth: 760 }}>{body}</p> : null}
    </div>
  );
}

function CardGrid({ children, columns = 3 }) {
  const minWidth = Math.max(180, Math.floor(860 / columns));
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, ${minWidth}px), 1fr))`, gap: 16 }}>
      {children}
    </div>
  );
}

function Surface({ children, tone = "card", style = {} }) {
  return (
    <div
      style={{
        borderRadius: 18,
        border: `1px solid ${P.line}`,
        background: tone === "dark" ? P.asphalt : tone === "soft" ? P.cardSoft : P.card,
        color: tone === "dark" ? "#fff" : P.text,
        padding: 20,
        boxShadow: "none",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function TrafficSceneGraphic({ accent = P.amber, style = {} }) {
  return (
    <div
      style={{
        borderRadius: 18,
        minHeight: 220,
        overflow: "hidden",
        background: "linear-gradient(180deg, #f3f3f3 0%, #ffffff 34%, #efefef 35%, #d9d9d9 100%)",
        position: "relative",
        ...style,
      }}
    >
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 80% 15%, rgba(91,154,160,0.18), transparent 24%), radial-gradient(circle at 20% 14%, rgba(0,0,0,0.06), transparent 18%)" }} />
      <div style={{ position: "absolute", left: "-8%", right: "-8%", bottom: 16, height: 86, background: "#272727", borderRadius: "999px / 52px" }} />
      <div style={{ position: "absolute", left: "6%", right: "6%", bottom: 56, height: 6, background: "repeating-linear-gradient(90deg, #f6f2d4 0 24px, transparent 24px 42px)", opacity: 0.8 }} />
      <div style={{ position: "absolute", left: "14%", bottom: 82, width: 28, height: 100, background: accent, borderRadius: 10, boxShadow: "54px 0 0 0 #fff, 108px 0 0 0 #fff" }} />
      <div style={{ position: "absolute", left: "12%", bottom: 170, width: 32, height: 14, background: "#fff", transform: "skewX(-12deg)", boxShadow: "54px 0 0 0 #fff, 108px 0 0 0 #fff" }} />
      <div style={{ position: "absolute", right: "18%", bottom: 84, width: 132, height: 62, background: "#5b9aa0", borderRadius: 14 }} />
      <div style={{ position: "absolute", right: "28%", bottom: 126, width: 82, height: 38, background: "#447f85", borderRadius: "12px 12px 8px 8px" }} />
      <div style={{ position: "absolute", right: "16%", bottom: 70, width: 18, height: 18, borderRadius: 999, background: "#111", boxShadow: "-90px 0 0 0 #111" }} />
      <div style={{ position: "absolute", right: "16.5%", bottom: 73.5, width: 11, height: 11, borderRadius: 999, background: "#d8d8d8", boxShadow: "-90px 0 0 0 #d8d8d8" }} />
      <div style={{ position: "absolute", left: "40%", bottom: 84, width: 54, height: 54, borderRadius: 999, border: `10px solid ${accent}` }} />
      <div style={{ position: "absolute", left: "43.8%", bottom: 106, width: 44, height: 10, background: accent, transform: "rotate(-32deg)", transformOrigin: "left center" }} />
    </div>
  );
}

function ComponentCard({ label, title, body }) {
  return (
    <Surface style={{ minHeight: "100%" }}>
      {label ? (
        <div style={{ fontFamily: P.sans, fontSize: 11, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: P.amber, marginBottom: 8 }}>
          {label}
        </div>
      ) : null}
      <div style={{ fontFamily: P.display, fontSize: 23, lineHeight: 1, textTransform: "uppercase", marginBottom: 10 }}>
        {title}
      </div>
      <div style={{ fontFamily: P.sans, fontSize: 13.5, lineHeight: 1.75, color: P.muted }}>
        {body}
      </div>
    </Surface>
  );
}

function OperationalComponentGrid({ items = PUBLIC_COMPONENTS }) {
  return (
    <CardGrid columns={3}>
      {items.map((item) => (
        <ComponentCard key={`${item.label}-${item.title}`} label={item.label} title={item.title} body={item.body} />
      ))}
    </CardGrid>
  );
}

function CustomerPathway() {
  return (
    <Surface tone="soft">
      <SectionTitle
        eyebrow="Customer Path"
        title="Make the next step obvious before the form opens."
        body="The public site now does more of the sorting work before a customer reaches protected intake."
      />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 190px), 1fr))", gap: 12 }}>
        {CUSTOMER_PATHWAY_COMPONENTS.map(([label, body]) => (
          <div key={label} style={{ borderRadius: 18, border: `1px solid ${P.line}`, background: P.card, padding: 16 }}>
            <div style={{ fontFamily: P.sans, fontSize: 11, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: P.amber, marginBottom: 8 }}>{label}</div>
            <div style={{ fontFamily: P.sans, fontSize: 13.5, lineHeight: 1.7, color: P.muted }}>{body}</div>
          </div>
        ))}
      </div>
    </Surface>
  );
}

function VisualFeatureRail() {
  return (
    <CardGrid columns={3}>
      {HERO_IMAGERY_PANELS.map((panel) => {
        return (
          <Surface key={panel.title} style={{ padding: 14 }}>
            <div style={{ borderRadius: 16, overflow: "hidden", minHeight: 180, marginBottom: 14, background: "#d7dfd9" }}>
              <img src={panel.image} alt={panel.title} style={{ width: "100%", height: 180, objectFit: "cover", display: "block" }} />
            </div>
            <div style={{ fontFamily: P.display, fontSize: 22, lineHeight: 1, textTransform: "uppercase", marginBottom: 8 }}>{panel.title}</div>
            <div style={{ fontFamily: P.sans, fontSize: 13.5, lineHeight: 1.7, color: P.muted }}>{panel.body}</div>
          </Surface>
        );
      })}
    </CardGrid>
  );
}

function CredentialBand() {
  return (
    <CardGrid columns={4}>
      {CREDENTIALS.map(([title, body, image]) => (
        <Surface key={title} style={{ background: P.asphalt, color: "#fff", padding: 18 }}>
          {image ? (
            <div style={{ marginBottom: 12, borderRadius: 12, background: "rgba(255,255,255,0.08)", padding: 12, display: "grid", placeItems: "center", minHeight: 84 }}>
              <img src={image} alt={title} style={{ maxWidth: "100%", maxHeight: 56, objectFit: "contain", display: "block" }} />
            </div>
          ) : null}
          <div style={{ fontFamily: P.display, fontSize: 30, lineHeight: 1, textTransform: "uppercase", color: P.amber, marginBottom: 8 }}>{title}</div>
          <div style={{ fontFamily: P.sans, fontSize: 13.5, lineHeight: 1.7, color: "rgba(255,255,255,0.78)" }}>{body}</div>
        </Surface>
      ))}
    </CardGrid>
  );
}

function GoogleMapEmbed({ query, title }) {
  const src = `https://www.google.com/maps?q=${encodeURIComponent(query)}&z=8&output=embed`;
  return (
    <div style={{ borderRadius: 18, overflow: "hidden", border: `1px solid ${P.line}`, boxShadow: "0 12px 28px rgba(18,25,26,0.06)" }}>
      <iframe
        title={title}
        src={src}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        style={{ width: "100%", height: 320, border: 0, display: "block", background: "#dde6df" }}
      />
    </div>
  );
}

function HomeView({ onNavigate, themeMode }) {
  const regionCount = LOCATION_GROUPS.length;
  const cityCount = LOCATION_GROUPS.reduce((count, group) => count + group.cities.length, 0);
  const prepChecklist = [
    "Project location or corridor",
    "Service type and traffic conditions",
    "Expected start date and work window",
    "Lane-closure, detour, or permit notes",
  ];
  const engagementSteps = [
    ["1", "Review coverage", "Confirm region support, office presence, and service fit before intake."],
    ["2", "Prepare scope", "Bring lane conditions, timing, closure details, and traffic-plan needs into one request."],
    ["3", "Submit protected quote", "Use the signed-in quote path so WD Wright can route the request with account context."],
    ["4", "Coordinate delivery", "Move from planning into scheduling, support follow-up, and field execution."],
  ];
  return (
    <div style={{ display: "grid", gap: 20 }}>
      <Surface tone="dark" style={{ padding: 28, overflow: "hidden", position: "relative" }}>
        <img src="/wdwright/hero-road-signal.jpg" alt="WD Wright traffic control roadway setup" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(10,18,19,0.88) 0%, rgba(10,18,19,0.72) 46%, rgba(10,18,19,0.42) 100%)" }} />
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 15% 20%, rgba(91,154,160,0.18), transparent 25%), radial-gradient(circle at 85% 10%, rgba(255,255,255,0.06), transparent 28%)" }} />
        <div className="wdw-public-hero-grid" style={{ position: "relative", display: "grid", gridTemplateColumns: "minmax(0, 1.2fr) minmax(280px, 0.8fr)", gap: 22, alignItems: "start" }}>
          <div>
            <div style={{ marginBottom: 14 }}>
              <WDWrightBrandLockup themeMode={themeMode} context="hero" width="min(420px, 72vw)" />
            </div>
            <div style={{ fontFamily: P.sans, fontSize: 11, fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase", color: P.amber, marginBottom: 10 }}>
              {BRAND.heroTag}
            </div>
            <div style={{ fontFamily: P.display, fontSize: "clamp(2rem, 5vw, 4rem)", lineHeight: 0.97, textTransform: "uppercase", color: "#fff", marginBottom: 14 }}>
              Work zones, closures, and traffic support built for field reality.
            </div>
            <div style={{ fontFamily: P.sans, fontSize: 15, lineHeight: 1.8, color: "rgba(237,243,241,0.82)", maxWidth: 640, marginBottom: 18 }}>
              WD Wright supports work zones, closures, and traffic operations across multiple regions with service pages, coverage details, quote access, careers, and customer resources built around real field needs.
            </div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button type="button" onClick={() => onNavigate("/quote")} style={{ border: "none", background: P.amber, color: P.text, borderRadius: 999, padding: "13px 18px", fontFamily: P.sans, fontWeight: 800, cursor: "pointer" }}>
                Sign In To Request A Quote
              </button>
              <button type="button" onClick={() => onNavigate("/services")} style={{ border: "1px solid rgba(255,255,255,0.16)", background: "transparent", color: "#fff", borderRadius: 999, padding: "13px 18px", fontFamily: P.sans, fontWeight: 800, cursor: "pointer" }}>
                Explore Services
              </button>
            </div>
            <div style={{ marginTop: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
              <StatusPill label="Protected quote intake" tone="accent" palette={{ line: "rgba(255,255,255,0.14)", panelSoft: "rgba(255,255,255,0.06)", muted: "#fff", accentSoft: "rgba(91,154,160,0.16)", accent: P.amber, strong: "#fff" }} />
              <StatusPill label="One account access" palette={{ line: "rgba(255,255,255,0.14)", panelSoft: "rgba(255,255,255,0.06)", muted: "#e5ece9" }} />
              <StatusPill label="Regional coverage" palette={{ line: "rgba(255,255,255,0.14)", panelSoft: "rgba(255,255,255,0.06)", muted: "#e5ece9" }} />
            </div>
          </div>
          <div style={{ display: "grid", gap: 12 }}>
            {HERO_METRICS.map(([label, value]) => (
              <div key={label} style={{ borderRadius: 14, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.06)", padding: "14px 16px" }}>
                <div style={{ fontFamily: P.sans, fontSize: 11, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: P.amber }}>{label}</div>
                <div style={{ marginTop: 6, fontFamily: P.sans, fontSize: 13.5, lineHeight: 1.6, color: "#fff", fontWeight: 700 }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      </Surface>

      <Surface>
        <SectionTitle
          eyebrow="Operations Components"
          title="More practical signals before quote intake."
          body="These components help customers understand what WD Wright needs, where the request fits, and why protected account access matters."
        />
        <OperationalComponentGrid />
      </Surface>

      <CardGrid columns={3}>
        {SERVICES.slice(0, 3).map((service) => (
          <Surface key={service.slug}>
            <div style={{ borderRadius: 14, overflow: "hidden", marginBottom: 12, background: "#d7dfd9" }}>
              <img
                src={service.slug === "flagging" ? "/wdwright/flagging-services.jpg" : service.slug === "plans" ? "/wdwright/advanced-road-safety.jpg" : "/wdwright/hero-road-signal.jpg"}
                alt={service.title}
                style={{ width: "100%", height: 170, objectFit: "cover", display: "block" }}
              />
            </div>
            <div style={{ fontFamily: P.sans, fontSize: 11, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: P.amber, marginBottom: 8 }}>Service</div>
            <div style={{ fontFamily: P.display, fontSize: 24, lineHeight: 1.02, textTransform: "uppercase", marginBottom: 10 }}>{service.title}</div>
            <div style={{ fontFamily: P.sans, fontSize: 14, lineHeight: 1.75, color: P.muted }}>{service.body}</div>
          </Surface>
        ))}
      </CardGrid>

      <CustomerPathway />

      <Surface tone="soft">
        <div style={{ display: "grid", gap: 16 }}>
          <SectionTitle
            eyebrow="How It Works"
            title="A clearer path from first review to field support."
            body="The landing page should help buyers understand what to check first, what to prepare, and how WD Wright moves a project from request to execution."
          />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 12 }}>
            {engagementSteps.map(([step, title, body]) => (
              <div key={step} style={{ borderRadius: 18, border: `1px solid ${P.line}`, background: "#fff", padding: 18 }}>
                <div style={{ width: 42, height: 42, borderRadius: 14, display: "grid", placeItems: "center", background: P.asphalt, color: "#fff", fontFamily: P.sans, fontSize: 14, fontWeight: 800, marginBottom: 12 }}>
                  {step}
                </div>
                <div style={{ fontFamily: P.display, fontSize: 21, lineHeight: 1.05, textTransform: "uppercase", marginBottom: 8 }}>{title}</div>
                <div style={{ fontFamily: P.sans, fontSize: 13.5, lineHeight: 1.7, color: P.muted }}>{body}</div>
              </div>
            ))}
          </div>
        </div>
      </Surface>

      <VisualFeatureRail />
      <CredentialBand />

      <Surface>
        <div className="wdw-public-split" style={{ display: "grid", gridTemplateColumns: "minmax(0, 0.95fr) minmax(320px, 1.05fr)", gap: 22, alignItems: "start" }}>
          <div style={{ display: "grid", gap: 14 }}>
            <SectionTitle
              eyebrow="Coverage Snapshot"
              title="Regional presence should feel immediate, not buried."
              body="The homepage now surfaces the scale of Wright’s footprint earlier so contractors, utilities, municipalities, and event operators can self-qualify faster."
            />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
              {[
                ["Regions", `${regionCount} active groups`],
                ["Cities", `${cityCount}+ market points`],
                ["Coverage fit", "Roadway, utility, telecom, event"],
              ].map(([label, value]) => (
                <div key={label} style={{ borderRadius: 18, border: `1px solid ${P.line}`, background: P.cardSoft, padding: 16 }}>
                  <div style={{ fontFamily: P.sans, fontSize: 11, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: P.amber, marginBottom: 8 }}>{label}</div>
                  <div style={{ fontFamily: P.display, fontSize: 20, lineHeight: 1.08, textTransform: "uppercase" }}>{value}</div>
                </div>
              ))}
            </div>
            <button type="button" onClick={() => onNavigate("/locations")} style={{ justifySelf: "start", border: "none", background: P.amber, color: P.text, borderRadius: 999, padding: "12px 16px", fontFamily: P.sans, fontWeight: 800, cursor: "pointer" }}>
              Explore Coverage
            </button>
          </div>
          <div style={{ display: "grid", gap: 12 }}>
            <div style={{ fontFamily: P.sans, fontSize: 11, fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase", color: P.amber }}>Industry Alignment</div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {INDUSTRIES.map((item) => (
                <span key={item} style={{ borderRadius: 999, padding: "9px 13px", background: P.cardSoft, border: `1px solid ${P.line}`, fontFamily: P.sans, fontSize: 12.5, fontWeight: 700, color: P.pine }}>
                  {item}
                </span>
              ))}
            </div>
            <div style={{ borderRadius: 18, border: `1px solid ${P.line}`, background: P.card, padding: 18 }}>
              <div style={{ fontFamily: P.display, fontSize: 20, lineHeight: 1.08, textTransform: "uppercase", marginBottom: 10 }}>Why that matters</div>
              <div style={{ fontFamily: P.sans, fontSize: 13.5, lineHeight: 1.75, color: P.muted }}>
                Buyers do not need to guess whether Wright fits roadway maintenance, emergency utility work, fiber deployment, public-works operations, or temporary event routing. The goal is to make that fit visible immediately.
              </div>
            </div>
          </div>
        </div>
      </Surface>

      <QuickActionRail
        palette={{ line: P.line, panelSoft: P.cardSoft, dark: P.pine, muted: P.muted, strong: P.amber }}
        items={[
          { kicker: "Plan", label: "Review coverage", body: "Check market presence and regional support before requesting service.", onClick: () => onNavigate("/locations") },
          { kicker: "Prepare", label: "Readiness resources", body: "Use guides and FAQs to prepare project scope, timing, and access details.", onClick: () => onNavigate("/resources") },
          { kicker: "Request", label: "Protected quote", body: "Move from public browsing into WD Wright’s signed-in request flow.", onClick: () => onNavigate("/quote") },
        ]}
      />

      <Surface tone="dark">
        <div className="wdw-public-split" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(280px, 0.9fr)", gap: 22, alignItems: "start" }}>
          <div>
            <div style={{ fontFamily: P.sans, fontSize: 11, fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase", color: P.amber, marginBottom: 10 }}>
              Quote Preparation
            </div>
            <div style={{ fontFamily: P.display, fontSize: "clamp(1.65rem, 3vw, 2.45rem)", lineHeight: 1, textTransform: "uppercase", color: "#fff", marginBottom: 12 }}>
              Better requests lead to faster routing and cleaner field delivery.
            </div>
            <div style={{ fontFamily: P.sans, fontSize: 14.5, lineHeight: 1.8, color: "rgba(237,243,241,0.78)", maxWidth: 680 }}>
              The homepage now sets expectations earlier: the best quote requests include location, timing, lane or closure conditions, and any plan or permit context that affects how the work should be staffed.
            </div>
          </div>
          <div style={{ display: "grid", gap: 10 }}>
            {prepChecklist.map((item) => (
              <div key={item} style={{ borderRadius: 16, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.06)", padding: "14px 16px", display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span style={{ color: P.amber, fontWeight: 800 }}>•</span>
                <span style={{ fontFamily: P.sans, fontSize: 13.5, lineHeight: 1.65, color: "#fff" }}>{item}</span>
              </div>
            ))}
            <button type="button" onClick={() => onNavigate("/quote")} style={{ justifySelf: "start", marginTop: 4, border: "none", background: P.amber, color: P.text, borderRadius: 999, padding: "12px 16px", fontFamily: P.sans, fontWeight: 800, cursor: "pointer" }}>
              Open Protected Quote
            </button>
          </div>
        </div>
      </Surface>

      <Surface>
        <div className="wdw-public-split" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(320px, 0.9fr)", gap: 22, alignItems: "start" }}>
          <div>
            <SectionTitle eyebrow="Why WD Wright" title="Built to show the company clearly, confidently, and with the right field focus." body="The goal is to give customers, crews, and partners a cleaner way to understand services, coverage, technology, hiring, and account access across WD Wright." />
          </div>
          <div style={{ display: "grid", gap: 10 }}>
            {TRUST_POINTS.map((point) => (
              <div key={point} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "10px 0", borderBottom: `1px solid ${P.line}` }}>
                <span style={{ color: P.amber, fontWeight: 800 }}>•</span>
                <span style={{ fontFamily: P.sans, fontSize: 13.5, lineHeight: 1.7, color: P.muted }}>{point}</span>
              </div>
            ))}
          </div>
        </div>
      </Surface>
    </div>
  );
}

function AboutView() {
  return (
    <div style={{ display: "grid", gap: 18 }}>
      <SectionTitle eyebrow="About Wright" title="A traffic control company should look organized, dependable, and ready before the first call." body="WD Wright presents its services, coverage, and customer support in a way that reflects the discipline required in active work zones and field operations." />
      <CardGrid columns={3}>
        {[
          ["Safety posture", "Trust and work-zone clarity should be visible on the site, not buried in a sales call."],
          ["Operational scale", "Multi-state service coverage should be organized cleanly so buyers can self-qualify faster."],
          ["Customer readiness", "Customers should be able to understand services, request support, and manage their account without confusion."],
        ].map(([title, body]) => (
          <Surface key={title}>
            <div style={{ fontFamily: P.display, fontSize: 24, lineHeight: 1, textTransform: "uppercase", marginBottom: 10 }}>{title}</div>
            <div style={{ fontFamily: P.sans, fontSize: 14, lineHeight: 1.75, color: P.muted }}>{body}</div>
          </Surface>
        ))}
      </CardGrid>
    </div>
  );
}

function ServicesView() {
  return (
    <div style={{ display: "grid", gap: 18 }}>
      <SectionTitle eyebrow="Services" title="Traffic control services organized around project needs and field conditions." body="WD Wright’s services are presented clearly so customers can quickly understand where flagging, planning, closures, barricading, and TMA support fit." />
      <Surface tone="soft">
        <SectionTitle
          eyebrow="Service Decision Components"
          title="Choose the right service lane faster."
          body="This service layer gives customers plain-language fit guidance before they submit a quote request."
        />
        <CardGrid columns={4}>
          {SERVICE_DECISION_COMPONENTS.map((item) => (
            <ComponentCard key={item.title} label="Best fit" title={item.title} body={item.fit} />
          ))}
        </CardGrid>
      </Surface>
      <CardGrid columns={2}>
        {SERVICES.map((service) => (
          <Surface key={service.slug}>
            <div style={{ fontFamily: P.display, fontSize: 28, lineHeight: 1, textTransform: "uppercase", marginBottom: 10 }}>{service.title}</div>
            <div style={{ fontFamily: P.sans, fontSize: 14, lineHeight: 1.75, color: P.muted, marginBottom: 12 }}>{service.body}</div>
            <div style={{ display: "grid", gap: 8 }}>
              {service.bullets.map((bullet) => (
                <div key={bullet} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <span style={{ color: P.amber, fontWeight: 800 }}>•</span>
                  <span style={{ fontFamily: P.sans, fontSize: 13.5, lineHeight: 1.65, color: P.text }}>{bullet}</span>
                </div>
              ))}
            </div>
          </Surface>
        ))}
      </CardGrid>
      <Surface tone="soft">
        <div style={{ fontFamily: P.display, fontSize: 28, lineHeight: 1, textTransform: "uppercase", marginBottom: 12 }}>Service comparison</div>
        <div style={{ display: "grid", gap: 10 }}>
          {[
            ["Flagging", "Best for live traffic flow control", "Single-lane alternating traffic, intersections, daily work zones"],
            ["Traffic plans", "Best for project prep and permit readiness", "Detours, phasing, lane configurations, pre-field coordination"],
            ["Barricading / TMA", "Best for closure hardware and protection", "Higher-risk roadways, truck protection, longer closure support"],
          ].map(([name, fit, examples]) => (
            <div key={name} className="wdw-public-comparison-row" style={{ display: "grid", gridTemplateColumns: "minmax(180px, 0.7fr) minmax(200px, 0.8fr) minmax(0, 1fr)", gap: 12, padding: "12px 0", borderBottom: `1px solid ${P.line}` }}>
              <div style={{ fontFamily: P.sans, fontSize: 13.5, fontWeight: 800, color: P.text }}>{name}</div>
              <div style={{ fontFamily: P.sans, fontSize: 13, lineHeight: 1.6, color: P.pine }}>{fit}</div>
              <div style={{ fontFamily: P.sans, fontSize: 13.5, lineHeight: 1.65, color: P.muted }}>{examples}</div>
            </div>
          ))}
        </div>
      </Surface>
    </div>
  );
}

function TechnologyView() {
  return (
    <div style={{ display: "grid", gap: 18 }}>
      <SectionTitle eyebrow="Technology" title="Traffic control technology should improve safety, visibility, and response." body="WD Wright uses technology to support clearer work zones, stronger crew protection, better dispatch visibility, and more reliable service delivery." />
      <CardGrid columns={3}>
        {TECHNOLOGY_VISUALS.map((item, index) => (
          <Surface key={item.title} style={{ padding: 14 }}>
            <div style={{ borderRadius: 16, overflow: "hidden", minHeight: 170, marginBottom: 14, background: "#d7dfd9" }}>
              <img src={item.image} alt={item.title} style={{ width: "100%", height: 170, objectFit: "cover", display: "block" }} />
            </div>
            <div style={{ fontFamily: P.display, fontSize: 22, lineHeight: 1, textTransform: "uppercase", marginBottom: 8 }}>{item.title}</div>
            <div style={{ fontFamily: P.sans, fontSize: 13.5, lineHeight: 1.7, color: P.muted }}>{item.detail}</div>
          </Surface>
        ))}
      </CardGrid>
      <CardGrid columns={2}>
        {TECHNOLOGY_ITEMS.map((item) => (
          <Surface key={item.title}>
            <div style={{ fontFamily: P.display, fontSize: 26, lineHeight: 1, textTransform: "uppercase", marginBottom: 10 }}>{item.title}</div>
            <div style={{ fontFamily: P.sans, fontSize: 14, lineHeight: 1.75, color: P.muted }}>{item.body}</div>
          </Surface>
        ))}
      </CardGrid>
    </div>
  );
}

function LocationsView() {
  const [selectedState, setSelectedState] = useState(LOCATION_GROUPS[0]?.state || "");
  const [availabilityQuery, setAvailabilityQuery] = useState("");
  const featuredRegion = LOCATION_GROUPS[0];
  const selectedRegion = LOCATION_GROUPS.find((group) => group.state === selectedState) || featuredRegion;
  const availabilityMatch = LOCATION_GROUPS.find((group) => {
    const q = availabilityQuery.trim().toLowerCase();
    if (!q) return false;
    return group.state.toLowerCase().includes(q) || group.cities.some((city) => city.toLowerCase().includes(q));
  });
  return (
    <div style={{ display: "grid", gap: 18 }}>
      <SectionTitle eyebrow="Locations" title="Multi-state coverage should be easy to review and easy to trust." body="WD Wright’s regional coverage is organized by market so customers can quickly confirm where support is available." />
      <div className="wdw-public-split" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.1fr) minmax(280px, 0.9fr)", gap: 18 }}>
        <GoogleMapEmbed query={selectedRegion.mapQuery || selectedRegion.state} title={`${selectedRegion.state} coverage map`} />
        <Surface tone="soft">
          <div style={{ fontFamily: P.display, fontSize: 28, lineHeight: 1, textTransform: "uppercase", marginBottom: 12 }}>Google Maps coverage</div>
          <label style={{ display: "grid", gap: 6, fontFamily: P.sans, fontSize: 12.5, fontWeight: 700, color: P.text, marginBottom: 12 }}>
            Office or region
            <select value={selectedState} onChange={(event) => setSelectedState(event.target.value)} style={{ minHeight: 44, borderRadius: 10, border: `1px solid ${P.line}`, padding: "0 12px", fontFamily: P.sans, fontSize: 14, background: P.fieldBg, color: P.fieldText }}>
              {LOCATION_GROUPS.map((group) => (
                <option key={group.state} value={group.state}>
                  {group.state}
                </option>
              ))}
            </select>
          </label>
          <label style={{ display: "grid", gap: 6, fontFamily: P.sans, fontSize: 12.5, fontWeight: 700, color: P.text, marginBottom: 12 }}>
            Find a listed market
            <input
              value={availabilityQuery}
              onChange={(event) => setAvailabilityQuery(event.target.value)}
              placeholder="Enter a city or state"
              style={{ minHeight: 44, borderRadius: 10, border: `1px solid ${P.line}`, padding: "0 12px", fontFamily: P.sans, fontSize: 14, background: P.fieldBg, color: P.fieldText }}
            />
          </label>
          <div style={{ borderRadius: 14, border: `1px solid ${P.line}`, background: "#fff", padding: 14, marginBottom: 12 }}>
            <div style={{ fontFamily: P.sans, fontSize: 11, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: P.amber }}>
              Availability
            </div>
            <div style={{ marginTop: 6, fontFamily: P.sans, fontSize: 13.5, lineHeight: 1.65, color: P.muted }}>
              {availabilityQuery.trim()
                ? availabilityMatch
                  ? `${availabilityMatch.state} is listed on this site. This directory does not confirm crew availability for a specific project; contact the office for confirmation.`
                  : /^\d{5}$/.test(availabilityQuery.trim())
                    ? `ZIP ${availabilityQuery.trim()} needs office confirmation. The online directory does not verify ZIP-level service availability.`
                    : "No listed city or state matched. Contact WD Wright and the team can confirm your project location."
                : `Selected market: ${selectedRegion.state}. Search a city or state to find a listed market.`}
            </div>
          </div>
          <div style={{ display: "grid", gap: 10 }}>
            {MAP_HIGHLIGHTS.map(([title, body]) => (
              <div key={title}>
                <div style={{ fontFamily: P.sans, fontSize: 13, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: WDWRIGHT_THEME.textStrong }}>{title}</div>
                <div style={{ marginTop: 4, fontFamily: P.sans, fontSize: 13.5, lineHeight: 1.7, color: P.muted }}>{body}</div>
              </div>
            ))}
          </div>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedRegion.mapQuery || selectedRegion.state)}`}
            target="_blank"
            rel="noreferrer"
            style={{ display: "inline-flex", marginTop: 18, borderRadius: 999, background: P.amber, color: P.text, textDecoration: "none", padding: "11px 16px", fontFamily: P.sans, fontWeight: 800 }}
          >
            Open Region Map
          </a>
        </Surface>
      </div>
      <CardGrid columns={2}>
        {LOCATION_GROUPS.map((group) => (
          <Surface key={group.state}>
            <div style={{ fontFamily: P.display, fontSize: 24, lineHeight: 1, textTransform: "uppercase", marginBottom: 12 }}>{group.state}</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {group.cities.map((city) => (
                <span key={city} style={{ borderRadius: 999, padding: "7px 11px", background: P.pineSoft, color: P.pine, fontFamily: P.sans, fontSize: 12.5, fontWeight: 700 }}>
                  {city}
                </span>
              ))}
            </div>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(group.mapQuery || group.state)}`}
              target="_blank"
              rel="noreferrer"
              style={{ display: "inline-flex", marginTop: 14, borderRadius: 999, border: `1px solid ${P.line}`, background: "#fff", color: P.pine, textDecoration: "none", padding: "10px 14px", fontFamily: P.sans, fontWeight: 800, fontSize: 12.5 }}
            >
              View In Google Maps
            </a>
          </Surface>
        ))}
      </CardGrid>
    </div>
  );
}

function ResourcesView() {
  return (
    <div style={{ display: "grid", gap: 18 }}>
      <SectionTitle eyebrow="Resources" title="Useful guidance helps customers prepare before the work begins." body="WD Wright resources explain services, technology, planning needs, and request preparation so customers can move faster with better information." />
      <CardGrid columns={2}>
        {RESOURCES.map((resource) => (
          <Surface key={resource.title}>
            <div style={{ fontFamily: P.sans, fontSize: 11, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: P.amber, marginBottom: 8 }}>{resource.category}</div>
            <div style={{ fontFamily: P.display, fontSize: 24, lineHeight: 1, textTransform: "uppercase", marginBottom: 10 }}>{resource.title}</div>
            <div style={{ fontFamily: P.sans, fontSize: 14, lineHeight: 1.75, color: P.muted }}>{resource.summary}</div>
          </Surface>
        ))}
      </CardGrid>
      <Surface tone="soft">
        <div style={{ fontFamily: P.display, fontSize: 28, lineHeight: 1, textTransform: "uppercase", marginBottom: 10 }}>Industry fit</div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {INDUSTRIES.map((item) => (
            <span key={item} style={{ borderRadius: 999, padding: "8px 12px", background: "#fff", fontFamily: P.sans, fontSize: 12.5, fontWeight: 700, color: P.pine }}>
              {item}
            </span>
          ))}
        </div>
      </Surface>
    </div>
  );
}

function CareersView({ onNavigate }) {
  return <WrightCareersExperience
    roles={OPEN_ROLES}
    benefits={CAREER_BENEFITS}
    onInterest={async (role) => submitLead("career-interest", { role, routeContext: "/careers" })}
    onContactRecruiting={() => onNavigate("/contact")}
  />;
}

function ContactOrQuoteView({ mode = "contact", firebaseUser = null, onRequireAuth }) {
  const draftKey = `wd-wright-${mode}-draft-v2`;
  const blankForm = {
    name: "", company: "", email: "", phone: "", location: "", postalCode: "", service: "",
    timeline: "", startDate: "", endDate: "", workHours: "", projectRole: "", closure: "",
    permits: "", details: "",
  };
  const [form, setForm] = useState(blankForm);
  const [step, setStep] = useState(0);
  const [status, setStatus] = useState(null);
  const [errors, setErrors] = useState({});
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const isQuote = mode === "quote";
  const steps = [
    { key: "contact", label: "Contact", detail: "Who should Wright reach?" },
    { key: "scope", label: "Project", detail: "Where and what support?" },
    { key: "schedule", label: "Schedule", detail: "When and what conditions?" },
    { key: "review", label: "Review", detail: "Check before sending" },
  ];

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const legacyDraftKey = `wd-wright-${mode}-draft-v1`;
      const parsed = JSON.parse(window.localStorage.getItem(draftKey) || window.localStorage.getItem(legacyDraftKey) || "null");
      if (parsed && typeof parsed === "object") setForm((current) => ({ ...current, ...parsed }));
    } catch {
      window.localStorage.removeItem(draftKey);
    }
    setDraftLoaded(true);
  }, [draftKey]);

  useEffect(() => {
    if (!draftLoaded || typeof window === "undefined") return;
    try {
      window.localStorage.setItem(draftKey, JSON.stringify(form));
    } catch {
      // Storage can be unavailable in private browsing; the form still works in memory.
    }
  }, [draftKey, draftLoaded, form]);

  useEffect(() => {
    if (!draftLoaded || !firebaseUser) return;
    setForm((current) => ({
      ...current,
      name: current.name || firebaseUser.displayName || "",
      email: current.email || firebaseUser.email || "",
    }));
  }, [draftLoaded, firebaseUser]);

  function validate(nextStep) {
    const nextErrors = {};
    if (nextStep === 0) {
      if (form.name.trim().length < 2) nextErrors.name = "Enter your name.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) nextErrors.email = "Enter a valid email address.";
      if (form.phone && form.phone.replace(/\D/g, "").length < 7) nextErrors.phone = "Enter a valid phone number or clear this field.";
    }
    if (nextStep === 1) {
      if (form.location.trim().length < 3) nextErrors.location = "Add a city, state, or project address.";
      if (form.postalCode && !/^\d{5}(-\d{4})?$/.test(form.postalCode.trim())) nextErrors.postalCode = "Enter a 5-digit ZIP code, optionally followed by 4 digits.";
      if (!form.service) nextErrors.service = "Choose the service that best fits.";
    }
    if (nextStep === 2) {
      if (!form.timeline) nextErrors.timeline = "Choose when support is needed.";
      if (form.startDate && form.endDate && form.endDate < form.startDate) nextErrors.endDate = "End date must be on or after the start date.";
    }
    if (nextStep === 3 && form.details.trim().length < 12) nextErrors.details = "Add a short project note so the team has useful context.";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: "" }));
    setStatus(null);
  }

  function control(key, label, options = {}) {
    const { type = "text", hint = "", required = false, placeholder = "" } = options;
    return (
      <label key={key} htmlFor={`${mode}-${key}`} style={{ display: "grid", gap: 6, fontFamily: P.sans, fontSize: 13, fontWeight: 750, color: P.text }}>
        <span>{label}{required ? " *" : ""}</span>
        <input
          id={`${mode}-${key}`} name={key} type={type} required={required} value={form[key]} placeholder={placeholder}
          list={key === "location" ? `${mode}-market-options` : undefined}
          onChange={(event) => updateField(key, event.target.value)} aria-invalid={!!errors[key]}
          aria-describedby={errors[key] ? `${mode}-${key}-error` : hint ? `${mode}-${key}-hint` : undefined}
          style={{ minHeight: 46, borderRadius: 10, border: `1px solid ${errors[key] ? "#b64231" : P.line}`, padding: "0 12px", fontFamily: P.sans, fontSize: 14, background: P.fieldBg, color: P.fieldText }}
        />
        {key === "location" ? <datalist id={`${mode}-market-options`}>{LOCATION_GROUPS.flatMap((group) => [group.state, ...group.cities.map((city) => `${city}, ${group.state}`)]).map((market) => <option key={market} value={market} />)}</datalist> : null}
        {errors[key] ? <span id={`${mode}-${key}-error`} role="alert" style={{ color: "#9a3027", fontSize: 12 }}>{errors[key]}</span> : hint ? <span id={`${mode}-${key}-hint`} style={{ color: P.muted, fontSize: 12, fontWeight: 500 }}>{hint}</span> : null}
      </label>
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();
    for (let requiredStep = 0; requiredStep <= 3; requiredStep += 1) {
      if (!validate(requiredStep)) {
        setStep(requiredStep);
        return;
      }
    }
    if (!firebaseUser?.uid) {
      setStatus({ kind: "info", text: "Your draft is saved on this device. Sign in to send it to WD Wright." });
      return;
    }
    setSubmitting(true);
    try {
      const result = await submitLead(isQuote ? "quote-request" : "contact-request", {
        ...form,
        location: [form.location, form.postalCode && `ZIP ${form.postalCode}`].filter(Boolean).join(", "),
        details: [form.details, form.closure && `Closure conditions: ${form.closure}`, form.permits && `Plan or permit status: ${form.permits}`].filter(Boolean).join("\n"),
        timeline: [form.timeline, form.startDate && `Start: ${form.startDate}`, form.endDate && `End: ${form.endDate}`, form.workHours && `Hours: ${form.workHours}`].filter(Boolean).join("; "),
        role: form.projectRole,
        routeContext: isQuote ? "/quote" : "/contact",
      }, { firebaseUser });
      setStatus({
        kind: result.persisted === "firestore" ? "success" : "warning",
        text: result.persisted === "firestore"
          ? `Your request was received by WD Wright${result.entry?.id ? ` (reference ${result.entry.id})` : ""}. Keep this confirmation for your records.`
          : "This browser saved a local copy, but WD Wright has not received the request. Please contact the team directly to make sure it reaches them.",
      });
      if (result.persisted === "firestore") {
        setForm(blankForm);
        setErrors({});
        setStep(0);
        try { window.localStorage.removeItem(draftKey); } catch { /* storage is optional */ }
      }
    } catch (error) {
      setStatus({ kind: "error", text: error?.message || "We could not send the request. Your draft is still saved here." });
    } finally {
      setSubmitting(false);
    }
  }

  function clearDraft() {
    setForm(blankForm);
    setErrors({});
    setStatus({ kind: "info", text: "The saved draft was cleared from this device." });
    setStep(0);
    try { window.localStorage.removeItem(draftKey); } catch { /* local storage unavailable */ }
  }

  const selectStyle = { minHeight: 46, borderRadius: 10, border: `1px solid ${errors.service || errors.timeline ? "#b64231" : P.line}`, padding: "0 12px", fontFamily: P.sans, fontSize: 14, background: P.fieldBg, color: P.fieldText };
  const calloutStyle = { marginTop: 12, borderRadius: 12, border: `1px solid ${status?.kind === "error" ? "#b64231" : P.line}`, background: status?.kind === "success" ? "#edf6ef" : status?.kind === "warning" ? "#fff4e5" : P.cardSoft, padding: 13, color: P.text, fontFamily: P.sans, fontSize: 13.5, lineHeight: 1.65 };

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <SectionTitle eyebrow={isQuote ? "Get A Quote" : "Contact Wright"} title={isQuote ? "Tell us about your work zone." : "Send a clear project question."} body="A few project details help route your request. You can save this draft and return on the same device." />
      <div className="wdw-public-split" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.1fr) minmax(280px, 0.9fr)", gap: 18 }}>
        <Surface>
          <Stepper palette={{ line: P.line, accent: P.amber, accentSoft: P.cardSoft, panelSoft: P.cardSoft, muted: P.muted, dark: P.text }} activeStep={step} steps={steps} />
          <form onSubmit={handleSubmit} style={{ display: "grid", gap: 14 }}>
            {step === 0 ? <>
              {control("name", "Your name", { required: true, placeholder: "Name" })}
              {control("company", "Organization", { placeholder: "Company or agency (optional)" })}
              {control("email", "Email", { required: true, type: "email", placeholder: "you@example.com" })}
              {control("phone", "Phone", { type: "tel", placeholder: "Optional" })}
              <p style={{ margin: 0, fontFamily: P.sans, fontSize: 12.5, color: P.muted }}>Email is required so the team can follow up. A phone number is optional.</p>
            </> : null}
            {step === 1 ? <>
              {control("location", "Project address, city, or state", { required: true, placeholder: "Where will the work take place?" })}
              {control("postalCode", "ZIP code", { type: "text", placeholder: "Optional", hint: "ZIP codes help identify a market; they do not confirm crew availability." })}
              <label htmlFor={`${mode}-service`} style={{ display: "grid", gap: 6, fontFamily: P.sans, fontSize: 13, fontWeight: 750, color: P.text }}>
                Service needed *
                <select id={`${mode}-service`} name="service" value={form.service} onChange={(event) => updateField("service", event.target.value)} style={selectStyle} aria-invalid={!!errors.service}>
                  <option value="">Choose a service</option>
                  {SERVICES.map((service) => <option key={service.slug} value={service.title}>{service.title}</option>)}
                </select>
                {errors.service ? <span role="alert" style={{ color: "#9a3027", fontSize: 12 }}>{errors.service}</span> : null}
              </label>
              {form.service ? <div role="status" style={{ borderRadius: 12, padding: 12, border: `1px solid ${P.line}`, background: P.cardSoft, color: P.muted, fontFamily: P.sans, fontSize: 13, lineHeight: 1.6 }}>
                {SERVICES.find((service) => service.title === form.service)?.body} For area confirmation, call {BRAND.phone}.
              </div> : null}
              {control("projectRole", "Your role on the project", { placeholder: "Owner, contractor, utility, municipality…" })}
            </> : null}
            {step === 2 ? <>
              <label htmlFor={`${mode}-timeline`} style={{ display: "grid", gap: 6, fontFamily: P.sans, fontSize: 13, fontWeight: 750, color: P.text }}>
                When do you need support? *
                <select id={`${mode}-timeline`} value={form.timeline} onChange={(event) => updateField("timeline", event.target.value)} style={selectStyle}>
                  <option value="">Choose a timeframe</option>
                  {["Emergency / within 24 hours", "Within 1 week", "Within 2–4 weeks", "More than a month away", "Dates not set yet"].map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
                {errors.timeline ? <span role="alert" style={{ color: "#9a3027", fontSize: 12 }}>{errors.timeline}</span> : null}
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
                {control("startDate", "Start date", { type: "date" })}
                {control("endDate", "End date", { type: "date" })}
              </div>
              {errors.endDate ? <span role="alert" style={{ color: "#9a3027", fontSize: 12 }}>{errors.endDate}</span> : null}
              {control("workHours", "Work hours", { placeholder: "e.g. weekdays, 7 a.m.–5 p.m." })}
              <label htmlFor={`${mode}-closure`} style={{ display: "grid", gap: 6, fontFamily: P.sans, fontSize: 13, fontWeight: 750, color: P.text }}>
                Lane or closure conditions
                <select id={`${mode}-closure`} value={form.closure} onChange={(event) => updateField("closure", event.target.value)} style={selectStyle}>
                  <option value="">Choose if known</option>
                  {["Shoulder or roadside work", "Single-lane alternating traffic", "Lane closure", "Road closure or detour", "Intersection or event", "Not sure yet"].map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </label>
              {control("permits", "Traffic plan or permit status", { placeholder: "Have a plan, need help, or not sure" })}
              <label htmlFor={`${mode}-details`} style={{ display: "grid", gap: 6, fontFamily: P.sans, fontSize: 13, fontWeight: 750, color: P.text }}>
                Project notes *
                <textarea id={`${mode}-details`} value={form.details} onChange={(event) => updateField("details", event.target.value)} rows={5} maxLength={2000} placeholder="Describe the work, site access, traffic conditions, and anything else the team should know." aria-invalid={!!errors.details} style={{ borderRadius: 10, border: `1px solid ${errors.details ? "#b64231" : P.line}`, padding: 12, font: `14px ${P.sans}`, background: P.fieldBg, color: P.fieldText, resize: "vertical" }} />
                <span style={{ color: P.muted, fontWeight: 500, fontSize: 12 }}>{form.details.length}/2000 characters. Plans and permits are not uploaded through this form yet.</span>
                {errors.details ? <span role="alert" style={{ color: "#9a3027", fontSize: 12 }}>{errors.details}</span> : null}
              </label>
            </> : null}
            {step === 3 ? <>
              <div style={{ display: "grid", gap: 10, borderRadius: 14, background: P.cardSoft, padding: 16 }}>
                {[ ["Contact", `${form.name} · ${form.email}${form.phone ? ` · ${form.phone}` : ""}`], ["Organization", form.company || "Not provided"], ["Location", `${form.location}${form.postalCode ? ` · ${form.postalCode}` : ""}`], ["Service", form.service], ["Timing", [form.timeline, form.startDate, form.endDate].filter(Boolean).join(" · ")], ["Work conditions", [form.closure, form.workHours].filter(Boolean).join(" · ") || "Not provided"], ["Notes", form.details] ].map(([label, value]) => <div key={label} style={{ display: "grid", gridTemplateColumns: "minmax(90px, .3fr) 1fr", gap: 10 }}><strong style={{ fontFamily: P.sans, fontSize: 12, color: P.pine }}>{label}</strong><span style={{ fontFamily: P.sans, fontSize: 13.5, color: P.text, lineHeight: 1.55, overflowWrap: "anywhere" }}>{value}</span></div>)}
              </div>
              <div style={{ fontFamily: P.sans, fontSize: 12.5, lineHeight: 1.6, color: P.muted }}>Check these details before sending. This request is not a confirmed booking or service availability commitment.</div>
            </> : null}
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {step > 0 ? <button type="button" onClick={() => { setErrors({}); setStep((current) => Math.max(0, current - 1)); }} style={{ border: `1px solid ${P.line}`, background: "transparent", color: P.text, borderRadius: 999, minHeight: 44, padding: "0 16px", fontFamily: P.sans, fontWeight: 800, cursor: "pointer" }}>Back</button> : null}
                {step < 3 ? <button type="button" onClick={() => { if (validate(step)) setStep((current) => Math.min(3, current + 1)); }} style={{ border: "none", background: P.pine, color: "#fff", borderRadius: 999, minHeight: 44, padding: "0 16px", fontFamily: P.sans, fontWeight: 800, cursor: "pointer" }}>Continue</button> : <button type="submit" disabled={submitting} style={{ border: "none", background: P.amber, color: P.text, borderRadius: 999, minHeight: 48, padding: "0 18px", fontFamily: P.sans, fontWeight: 800, cursor: submitting ? "wait" : "pointer", opacity: submitting ? 0.7 : 1 }}>{submitting ? "Sending…" : firebaseUser?.uid ? (isQuote ? "Send Quote Request" : "Send Contact Request") : "Sign In To Send"}</button>}
              </div>
              <button type="button" onClick={clearDraft} style={{ border: 0, background: "transparent", color: P.muted, padding: "8px 4px", fontFamily: P.sans, fontSize: 12.5, textDecoration: "underline", cursor: "pointer" }}>Clear saved draft</button>
            </div>
          </form>
          {status ? <div role="status" aria-live="polite" style={calloutStyle}>{status.text}{status.kind === "info" && !firebaseUser?.uid ? <button type="button" onClick={() => onRequireAuth?.(isQuote ? "/quote" : "/contact")} style={{ display: "block", marginTop: 8, border: 0, background: "transparent", padding: 0, color: P.pine, textDecoration: "underline", font: "inherit", cursor: "pointer" }}>Sign in and return to this draft</button> : null}</div> : null}
        </Surface>
        <Surface tone="soft">
          <div style={{ fontFamily: P.display, fontSize: 28, lineHeight: 1, textTransform: "uppercase", marginBottom: 12 }}>Before you send</div>
          <div style={{ display: "grid", gap: 10 }}>
            {["Choose the closest service; the Wright team can confirm the exact setup.", "Add the work address or nearest city and the schedule if known.", "The form saves a draft on this device. Clear it before sharing the device.", "This form cannot attach plan files yet. Call or email the team to share plans and permits."].map((item) => <div key={item} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}><span aria-hidden="true" style={{ color: P.amber, fontWeight: 800 }}>•</span><span style={{ fontFamily: P.sans, fontSize: 13.5, lineHeight: 1.7, color: P.muted }}>{item}</span></div>)}
          </div>
          <div style={{ marginTop: 18, fontFamily: P.sans, fontSize: 13.5, lineHeight: 1.8, color: P.text, fontWeight: 700 }}>{BRAND.phone}<br />{isQuote ? BRAND.quoteEmail : BRAND.email}</div>
          <div style={{ marginTop: 18 }}><EmptyPanel palette={{ line: P.line, panelSoft: "#fff", panel: P.cardSoft, muted: P.muted, dark: P.text }} title="Saved on this device" body="This draft stays in this browser only; it is not sent to WD Wright until you sign in and submit it." /></div>
        </Surface>
      </div>
    </div>
  );
}

function RoadmapView() {
  return (
    <Surface>
      <div style={{ fontFamily: P.display, fontSize: 30, lineHeight: 1, textTransform: "uppercase", marginBottom: 12 }}>WD Wright roadmap</div>
      <div style={{ display: "grid", gap: 10 }}>
        {ROADMAP.map(([phase, detail]) => (
          <div key={phase} className="wdw-public-roadmap-row" style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 14, padding: "10px 0", borderBottom: `1px solid ${P.line}` }}>
            <div style={{ fontFamily: P.sans, fontSize: 12, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: P.amber }}>{phase}</div>
            <div style={{ fontFamily: P.sans, fontSize: 13.5, lineHeight: 1.7, color: P.muted }}>{detail}</div>
          </div>
        ))}
      </div>
    </Surface>
  );
}

function FAQView() {
  const [openQuestion, setOpenQuestion] = useState(FAQS[0]?.q || "");
  const [query, setQuery] = useState("");
  const filteredFaqs = FAQS.filter((item) => `${item.q} ${item.a}`.toLowerCase().includes(query.trim().toLowerCase()));
  return (
    <Surface>
      <div style={{ fontFamily: P.display, fontSize: 30, lineHeight: 1, textTransform: "uppercase", marginBottom: 12 }}>WD Wright FAQ</div>
      <label htmlFor="wright-faq-search" style={{ display: "grid", gap: 6, marginBottom: 14, fontFamily: P.sans, fontSize: 13, fontWeight: 750, color: P.text }}>
        Search questions
        <input id="wright-faq-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try ‘quote’, ‘coverage’, or a service name" style={{ minHeight: 46, borderRadius: 10, border: `1px solid ${P.line}`, padding: "0 12px", fontFamily: P.sans, fontSize: 14, background: P.fieldBg, color: P.fieldText }} />
      </label>
      <div style={{ display: "grid", gap: 10 }}>
        {filteredFaqs.map((item) => (
          <button
            key={item.q}
            type="button"
            onClick={() => setOpenQuestion((current) => (current === item.q ? "" : item.q))}
            style={{ borderRadius: 14, border: `1px solid ${P.line}`, padding: "14px 16px", background: P.cardSoft, textAlign: "left", cursor: "pointer" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "start" }}>
              <div style={{ fontFamily: P.sans, fontSize: 13.5, fontWeight: 800, marginBottom: 6, color: P.text }}>{item.q}</div>
              <div style={{ fontFamily: P.sans, fontSize: 12, fontWeight: 800, color: P.amber }}>{openQuestion === item.q ? "Close" : "Open"}</div>
            </div>
            {openQuestion === item.q ? <div style={{ fontFamily: P.sans, fontSize: 13.5, lineHeight: 1.7, color: P.muted }}>{item.a}</div> : null}
          </button>
        ))}
        {!filteredFaqs.length ? <div role="status" style={{ borderRadius: 12, padding: 14, background: P.cardSoft, fontFamily: P.sans, color: P.muted }}>No matching FAQ. Try a different phrase or contact the team.</div> : null}
      </div>
    </Surface>
  );
}

function HelpView() {
  return (
    <div style={{ display: "grid", gap: 18 }}>
      <SectionTitle eyebrow="Help Center" title="Support content should answer common questions before the work begins." body="Use the help center for service guidance, quote preparation, coverage questions, and recruiting information." />
      <CardGrid columns={2}>
        {[
          ["Getting a quote", "Prepare service type, location, date range, expected closure conditions, and any traffic-plan requirements before submitting intake."],
          ["Finding the right office", "Use the locations page to review market coverage and identify the region that best matches your project."],
          ["Careers questions", "Use the careers page to express interest in field, dispatch, leadership, and support opportunities."],
          ["Technology questions", "Use the technology page to review AFAD, smart work zone systems, and safety-focused traffic control tools."],
        ].map(([title, body]) => (
          <Surface key={title}>
            <div style={{ fontFamily: P.display, fontSize: 24, lineHeight: 1, textTransform: "uppercase", marginBottom: 10 }}>{title}</div>
            <div style={{ fontFamily: P.sans, fontSize: 14, lineHeight: 1.75, color: P.muted }}>{body}</div>
          </Surface>
        ))}
      </CardGrid>
    </div>
  );
}

function PressView() {
  return (
    <div style={{ display: "grid", gap: 18 }}>
      <SectionTitle eyebrow="Press" title="Company updates should reinforce trust with customers, crews, and partners." body="Use this section for regional growth, safety updates, company announcements, and workforce milestones." />
      <CardGrid columns={2}>
        {[
          ["Regional growth coverage", "Use this section for office launches, new market support, and operational expansion updates."],
          ["Technology and safety updates", "Share AFAD, SmartFlagger, and work-zone safety updates in a clear company format."],
          ["Project and partnership highlights", "Show how Wright supports roadway, utility, telecom, and infrastructure work across markets."],
          ["Recruiting and workforce growth", "Highlight hiring, training, and workforce growth across WD Wright markets."],
        ].map(([title, body]) => (
          <Surface key={title}>
            <div style={{ fontFamily: P.display, fontSize: 24, lineHeight: 1, textTransform: "uppercase", marginBottom: 10 }}>{title}</div>
            <div style={{ fontFamily: P.sans, fontSize: 14, lineHeight: 1.75, color: P.muted }}>{body}</div>
          </Surface>
        ))}
      </CardGrid>
    </div>
  );
}

function InvestView() {
  return (
    <div style={{ display: "grid", gap: 18 }}>
      <SectionTitle eyebrow="Corporate" title="Corporate information can live here when WD Wright needs it." body="Use this page for company materials, leadership information, or broader corporate updates if they are needed later." />
      <Surface>
        <div style={{ display: "grid", gap: 10 }}>
          {[
            "This route can hold company overview material, growth positioning, strategic-partner content, or board-ready summaries later.",
            "It also gives Wright a clean place for capital, acquisition, or strategic-partnership conversations if those ever become relevant.",
            "For now, it remains a company-information page rather than a public fundraising page.",
          ].map((item) => (
            <div key={item} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <span style={{ color: P.amber, fontWeight: 800 }}>•</span>
              <span style={{ fontFamily: P.sans, fontSize: 13.5, lineHeight: 1.7, color: P.muted }}>{item}</span>
            </div>
          ))}
        </div>
      </Surface>
    </div>
  );
}

function LegalView({ title, sections }) {
  return (
    <div style={{ display: "grid", gap: 18 }}>
      <SectionTitle eyebrow="Policy" title={title} body="These policy pages are ready for final company-approved language and public review." />
      <div style={{ display: "grid", gap: 12 }}>
        {sections.map(([sectionTitle, body]) => (
          <Surface key={sectionTitle}>
            <div style={{ fontFamily: P.display, fontSize: 22, lineHeight: 1, textTransform: "uppercase", marginBottom: 8 }}>{sectionTitle}</div>
            <div style={{ fontFamily: P.sans, fontSize: 13.5, lineHeight: 1.8, color: P.muted }}>{body}</div>
          </Surface>
        ))}
      </div>
    </div>
  );
}

function AuthGateView({ title, body, onContinue }) {
  return (
    <div style={{ display: "grid", gap: 18 }}>
      <SectionTitle
        eyebrow="Protected Access"
        title={title}
        body={body}
      />
      <Surface tone="soft">
        <div style={{ display: "grid", gap: 10 }}>
          {[
            "Authentication is required before opening WD Wright service-booking, payment-related, or document-related pages.",
            "This protects request details, account information, and any related billing or document activity.",
            "After sign-in, Wright will return you to the page you were trying to open.",
          ].map((item) => (
            <div key={item} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <span style={{ color: P.amber, fontWeight: 800 }}>•</span>
              <span style={{ fontFamily: P.sans, fontSize: 13.5, lineHeight: 1.7, color: P.muted }}>{item}</span>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={onContinue}
          style={{ marginTop: 18, border: "none", background: P.amber, color: P.text, borderRadius: 999, minHeight: 46, padding: "0 18px", fontFamily: P.sans, fontWeight: 800, cursor: "pointer" }}
        >
          Sign In To Continue
        </button>
      </Surface>
    </div>
  );
}

export default function WDWrightPublicPage({ initialView = "home" }) {
  const router = useRouter();
  const [view, setView] = useState(initialView);
  const [firebaseUser, setFirebaseUser] = useState(() => auth.currentUser);
  const [themeMode, setThemeMode] = useWrightThemeMode();

  useEffect(() => {
    setView(initialView);
  }, [initialView]);

  useEffect(() => {
    return onAuthStateChanged(auth, (nextUser) => {
      setFirebaseUser(nextUser);
    });
  }, []);

  useEffect(() => {
    return subscribeToWrightAuthSignals((signal) => {
      if (signal?.type === "sign_out") {
        setFirebaseUser(null);
        return;
      }
      if (signal?.type === "sign_in") {
        setFirebaseUser(auth.currentUser || null);
      }
    });
  }, []);

  useEffect(() => {
    document.title = PUBLIC_VIEWS[view] || "Wright Traffic Control";
  }, [view]);

  function buildSignInHref(target) {
    return `/signin?next=${encodeURIComponent(target)}`;
  }

  function navigateToAuthenticatedFlow(target) {
    const href = target === "/" ? "/" : target.startsWith("/") ? target : `/${target}`;
    if (!firebaseUser?.uid) {
      router.push(buildSignInHref(href));
      return;
    }
    router.push(href);
  }

  function handleNavigate(target) {
    const href = target === "/" ? "/" : target.startsWith("/") ? target : `/${target}`;
    if (href === "/resources" || href === "/help") {
      navigateToAuthenticatedFlow(href);
      return;
    }
    router.push(href);
  }

  const isProtectedView = AUTH_REQUIRED_VIEWS.has(view);
  const canAccessProtectedView = !isProtectedView || !!firebaseUser?.uid;

  return (
    <Shell onNavigate={handleNavigate} themeMode={themeMode} onThemeChange={setThemeMode} firebaseUser={firebaseUser} currentView={view}>
      {view === "home" ? <HomeView themeMode={themeMode} onNavigate={handleNavigate} /> : null}
      {view === "about" ? <AboutView /> : null}
      {view === "services" ? <ServicesView /> : null}
      {view === "technology" ? <TechnologyView /> : null}
      {view === "locations" ? <LocationsView /> : null}
      {view === "resources" && canAccessProtectedView ? <ResourcesView /> : null}
      {view === "careers" ? <CareersView onNavigate={handleNavigate} /> : null}
      {view === "contact" && canAccessProtectedView ? <ContactOrQuoteView mode="contact" firebaseUser={firebaseUser} onRequireAuth={navigateToAuthenticatedFlow} /> : null}
      {view === "quote" && canAccessProtectedView ? <ContactOrQuoteView mode="quote" firebaseUser={firebaseUser} onRequireAuth={navigateToAuthenticatedFlow} /> : null}
      {view === "faq" ? <FAQView /> : null}
      {view === "help" && canAccessProtectedView ? <HelpView /> : null}
      {view === "press" ? <PressView /> : null}
      {view === "invest" ? <InvestView /> : null}
      {isProtectedView && !canAccessProtectedView ? (
        <AuthGateView
          title="Sign in required for this Wright page."
          body="This page is part of WD Wright’s signed-in service, payment-related, or document-related experience."
          onContinue={() => navigateToAuthenticatedFlow(`/${view}`)}
        />
      ) : null}
      {view === "privacy" ? <LegalView title="Privacy" sections={[
        ["Information collected", "WD Wright may collect contact details, project information, account details, and recruiting submissions when you use its forms, quote requests, and account pages."],
        ["Use of information", "Information is used for quote response, recruiting follow-up, service communication, document follow-up, scheduling support, and operational review tied to your interaction with WD Wright."],
        ["Data handling", `Questions about privacy or data handling can be directed to ${BRAND.email} or ${BRAND.phone}.`],
      ]} /> : null}
      {view === "terms" ? <LegalView title="Terms" sections={[
        ["Service information", "Public-site content is informational and does not, by itself, create a service agreement or work order."],
        ["Quotes and scope", "Final project scope, timing, coverage, and billing should be confirmed through Wright’s actual service and dispatch process."],
        ["Operational boundaries", `Technology, content, and public marketing pages should not be treated as substitutes for signed commercial terms or site-specific field planning. Contact ${BRAND.email} or ${BRAND.phone} for formal commercial follow-up.`],
      ]} /> : null}
      {view === "accessibility" ? <LegalView title="Accessibility" sections={[
        ["Commitment", "WD Wright should provide clear navigation, readable content, and responsive access across device sizes."],
        ["Ongoing improvements", "Accessibility can be improved further as final content, imagery, and forms are approved and tested."],
        ["Contact", `Use the contact page or reach out to ${BRAND.email} or ${BRAND.phone} to report an accessibility issue or request an alternative format.`],
      ]} /> : null}
      {view === "dmca" ? <LegalView title="DMCA Policy" sections={[
        ["Reporting content issues", "If copyrighted material appears on the site without authorization, submit a written notice with the material location, your contact details, and the basis for the claim."],
        ["Review process", `DMCA-related notices can be directed to ${BRAND.email} while Wright finalizes any separate legal-review channel.`],
        ["Next step", `For urgent legal follow-up, use ${BRAND.phone} in addition to written notice.`],
      ]} /> : null}
      {view !== "home" && canAccessProtectedView ? <RoadmapView /> : null}
      {view !== "home" && view !== "faq" && canAccessProtectedView ? <div style={{ height: 18 }} /> : null}
      {view !== "home" && view !== "faq" && canAccessProtectedView ? <FAQView /> : null}
    </Shell>
  );
}
