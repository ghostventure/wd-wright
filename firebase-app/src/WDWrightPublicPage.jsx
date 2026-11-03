"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import WDWrightBrandLockup from "./WDWrightBrandLockup.jsx";
import WDWrightPublicFooter from "./WDWrightPublicFooter.jsx";
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
  "contact",
  "quote",
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
        <main id="wdw-main" className="wdw-shell-main">
          {children}
        </main>
        <WDWrightPublicFooter themeMode={themeMode} onNavigate={onNavigate} />
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
            Availability checker
            <input
              value={availabilityQuery}
              onChange={(event) => setAvailabilityQuery(event.target.value)}
              placeholder="Enter state, city, or region"
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
                  ? `Coverage signs point to ${availabilityMatch.state}. Use the office launcher below to open map routing.`
                  : "No direct match yet. Use the office selector or contact WD Wright for coverage confirmation."
                : `Selected office region: ${selectedRegion.state}.`}
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
            Launch Office Region
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
  const [status, setStatus] = useState("");
  async function handleInterest(role) {
    const result = await submitLead("career-interest", { role, routeContext: "/careers" });
    setStatus(result.message);
  }

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <SectionTitle eyebrow="Careers" title="Recruiting should feel organized, serious, and field-ready." body="WD Wright gives candidates a clearer path into field, dispatch, leadership, and support roles across its coverage areas." />
      <CardGrid columns={2}>
        <Surface>
          <div style={{ borderRadius: 16, overflow: "hidden", marginBottom: 14, background: "#d7dfd9" }}>
            <img src="/wdwright/careers-field-crew.jpg" alt="WD Wright field crew" style={{ width: "100%", height: 220, objectFit: "cover", display: "block" }} />
          </div>
          <div style={{ fontFamily: P.display, fontSize: 28, lineHeight: 1, textTransform: "uppercase", marginBottom: 12 }}>Open roles</div>
          <div style={{ display: "grid", gap: 10 }}>
            {OPEN_ROLES.map(([role, team, market]) => (
              <div key={role} style={{ borderBottom: `1px solid ${P.line}`, paddingBottom: 12 }}>
                <div style={{ fontFamily: P.sans, fontSize: 15, fontWeight: 800 }}>{role}</div>
                <div style={{ fontFamily: P.sans, fontSize: 13, color: P.muted, marginTop: 4 }}>{team} · {market}</div>
                <button type="button" onClick={() => handleInterest(role)} style={{ marginTop: 10, border: "none", background: P.amber, borderRadius: 999, padding: "10px 14px", cursor: "pointer", fontFamily: P.sans, fontWeight: 800 }}>
                  Express Interest
                </button>
              </div>
            ))}
          </div>
        </Surface>
        <Surface tone="soft">
          <div style={{ fontFamily: P.display, fontSize: 28, lineHeight: 1, textTransform: "uppercase", marginBottom: 12 }}>Why work with WD Wright</div>
          <div style={{ display: "grid", gap: 10 }}>
            {CAREER_BENEFITS.map((item) => (
              <div key={item} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span style={{ color: P.amber, fontWeight: 800 }}>•</span>
                <span style={{ fontFamily: P.sans, fontSize: 13.5, lineHeight: 1.7, color: P.muted }}>{item}</span>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => onNavigate("/contact")} style={{ marginTop: 18, border: `1px solid ${P.line}`, background: "#fff", borderRadius: 999, padding: "11px 14px", cursor: "pointer", fontFamily: P.sans, fontWeight: 800 }}>
            Talk To Recruiting
          </button>
        </Surface>
      </CardGrid>
      {status ? <Surface><div style={{ fontFamily: P.sans, fontSize: 13.5, color: P.muted }}>{status}</div></Surface> : null}
    </div>
  );
}

function ContactOrQuoteView({ mode = "contact", firebaseUser = null, onRequireAuth }) {
  const draftKey = `wd-wright-${mode}-draft-v1`;
  const [form, setForm] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    location: "",
    service: "",
    timeline: "",
    details: "",
  });
  const [step, setStep] = useState(0);
  const [status, setStatus] = useState("");
  const [errors, setErrors] = useState({});
  const isQuote = mode === "quote";

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(draftKey);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        setForm((current) => ({ ...current, ...parsed }));
      }
    } catch {
      // Non-blocking.
    }
  }, [draftKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(draftKey, JSON.stringify(form));
    } catch {
      // Non-blocking.
    }
  }, [draftKey, form]);

  function validate(nextStep = step) {
    const nextErrors = {};
    if (nextStep === 0) {
      if (!form.name.trim()) nextErrors.name = "Name is required.";
      if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) nextErrors.email = "A valid email is required.";
      if (!form.phone.trim() && !form.company.trim()) nextErrors.phone = "Add a phone number or company so follow-up is practical.";
    }
    if (nextStep === 1) {
      if (!form.location.trim()) nextErrors.location = "Project location is required.";
      if (!form.service.trim()) nextErrors.service = "Service type is required.";
      if (!form.timeline.trim()) nextErrors.timeline = "Timeline is required.";
    }
    if (nextStep === 2 && form.details.trim().length < 16) {
      nextErrors.details = "Add more project detail so routing is accurate.";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: "" }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!validate(2)) return;
    if (!firebaseUser?.uid) {
      setStatus("Sign in is required before submitting Wright service intake.");
      onRequireAuth?.(isQuote ? "/quote" : "/contact");
      return;
    }

    const result = await submitLead(isQuote ? "quote-request" : "contact-request", {
      ...form,
      routeContext: isQuote ? "/quote" : "/contact",
    }, {
      firebaseUser,
    });
    setStatus(result.message);
    setForm({ name: "", company: "", email: "", phone: "", location: "", service: "", timeline: "", details: "" });
    setErrors({});
    setStep(0);
    try {
      window.localStorage.removeItem(draftKey);
    } catch {
      // Non-blocking.
    }
  }

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <SectionTitle
        eyebrow={isQuote ? "Get A Quote" : "Contact Wright"}
        title={isQuote ? "Request traffic control support with the details that matter." : "Reach WD Wright with clear, direct project information."}
        body={isQuote
          ? "This quote page is built to collect the details Wright actually needs: market, service type, timing, and project context."
          : "Use this page to share project needs, service questions, and coverage details so the right WD Wright team can follow up."}
      />
      <div className="wdw-public-split" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.1fr) minmax(280px, 0.9fr)", gap: 18 }}>
        <Surface>
          <Stepper
            palette={{ line: P.line, accent: P.amber, accentSoft: P.cardSoft, panelSoft: P.cardSoft, muted: P.muted, dark: P.text }}
            activeStep={step}
            steps={[
              { key: "contact", label: "Contact", detail: "Who should Wright reach?" },
              { key: "scope", label: "Scope", detail: "Where and what support?" },
              { key: "details", label: "Details", detail: "Field conditions and notes" },
            ]}
          />
          <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
            {step === 0 ? (
              <>
                {[
                  ["name", "Name"],
                  ["company", "Company"],
                  ["email", "Email"],
                  ["phone", "Phone"],
                ].map(([key, label]) => (
                  <label key={key} style={{ display: "grid", gap: 6, fontFamily: P.sans, fontSize: 12.5, fontWeight: 700, color: P.text }}>
                    {label}
                    <input
                      value={form[key]}
                      onChange={(event) => updateField(key, event.target.value)}
                      style={{ minHeight: 46, borderRadius: 10, border: `1px solid ${errors[key] ? "#c95b4a" : P.line}`, padding: "0 12px", fontFamily: P.sans, fontSize: 14, background: P.fieldBg, color: P.fieldText }}
                    />
                    <InlineFieldMessage message={errors[key]} />
                  </label>
                ))}
              </>
            ) : null}
            {step === 1 ? (
              <>
                {[
                  ["location", "Project Location"],
                  ["service", "Service Type"],
                  ["timeline", "Timeline"],
                ].map(([key, label]) => (
                  <label key={key} style={{ display: "grid", gap: 6, fontFamily: P.sans, fontSize: 12.5, fontWeight: 700, color: P.text }}>
                    {label}
                    <input
                      value={form[key]}
                      onChange={(event) => updateField(key, event.target.value)}
                      style={{ minHeight: 46, borderRadius: 10, border: `1px solid ${errors[key] ? "#c95b4a" : P.line}`, padding: "0 12px", fontFamily: P.sans, fontSize: 14, background: P.fieldBg, color: P.fieldText }}
                    />
                    <InlineFieldMessage message={errors[key]} />
                  </label>
                ))}
              </>
            ) : null}
            {step === 2 ? (
              <label style={{ display: "grid", gap: 6, fontFamily: P.sans, fontSize: 12.5, fontWeight: 700, color: P.text }}>
                Project Details
                <textarea
                  value={form.details}
                  onChange={(event) => updateField("details", event.target.value)}
                  rows={7}
                  style={{ borderRadius: 10, border: `1px solid ${errors.details ? "#c95b4a" : P.line}`, padding: "12px", fontFamily: P.sans, fontSize: 14, background: P.fieldBg, color: P.fieldText, resize: "vertical" }}
                />
                <InlineFieldMessage message={errors.details} />
              </label>
            ) : null}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {step > 0 ? (
                <button type="button" onClick={() => setStep((current) => Math.max(0, current - 1))} style={{ border: `1px solid ${P.line}`, background: "transparent", color: P.text, borderRadius: 999, minHeight: 44, padding: "0 16px", fontFamily: P.sans, fontWeight: 800, cursor: "pointer" }}>
                  Back
                </button>
              ) : null}
              {step < 2 ? (
                <button
                  type="button"
                  onClick={() => {
                    if (!validate(step)) return;
                    setStep((current) => Math.min(2, current + 1));
                  }}
                  style={{ border: "none", background: P.pine, color: "#fff", borderRadius: 999, minHeight: 44, padding: "0 16px", fontFamily: P.sans, fontWeight: 800, cursor: "pointer" }}
                >
                  Continue
                </button>
              ) : null}
            </div>
            <button type="submit" style={{ border: "none", background: P.amber, color: P.text, borderRadius: 999, minHeight: 48, padding: "0 18px", fontFamily: P.sans, fontWeight: 800, cursor: "pointer" }}>
              {firebaseUser?.uid ? (isQuote ? "Submit Quote Request" : "Send Contact Request") : "Sign In To Continue"}
            </button>
          </form>
          {status ? <div style={{ marginTop: 12, fontFamily: P.sans, fontSize: 13.5, lineHeight: 1.7, color: P.muted }}>{status}</div> : null}
        </Surface>
        <Surface tone="soft">
          <div style={{ fontFamily: P.display, fontSize: 28, lineHeight: 1, textTransform: "uppercase", marginBottom: 12 }}>Intake notes</div>
          <div style={{ display: "grid", gap: 10 }}>
            {[
              "Authenticated account access is now required before Wright service-booking or related intake can be submitted.",
              "Your saved account details can help speed up future requests and follow-up.",
              "Use the project details field to include location, lane conditions, scheduling needs, and any permit-related notes.",
              "Approved WD Wright team members can review incoming requests and respond from the right office or support lane.",
            ].map((item) => (
              <div key={item} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span style={{ color: P.amber, fontWeight: 800 }}>•</span>
                <span style={{ fontFamily: P.sans, fontSize: 13.5, lineHeight: 1.7, color: P.muted }}>{item}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 18, fontFamily: P.sans, fontSize: 13.5, lineHeight: 1.8, color: P.text, fontWeight: 700 }}>
            {BRAND.phone}<br />
            {isQuote ? BRAND.quoteEmail : BRAND.email}
          </div>
          <div style={{ marginTop: 18 }}>
            <EmptyPanel
              palette={{ line: P.line, panelSoft: "#fff", panel: P.cardSoft, muted: P.muted, dark: P.text }}
              title="Saved progress"
              body="Your draft stays on this device while you move through the intake steps, so you do not have to restart the request."
            />
          </div>
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
  return (
    <Surface>
      <div style={{ fontFamily: P.display, fontSize: 30, lineHeight: 1, textTransform: "uppercase", marginBottom: 12 }}>WD Wright FAQ</div>
      <div style={{ display: "grid", gap: 10 }}>
        {FAQS.map((item) => (
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
    if (href === "/quote" || href === "/contact" || href === "/resources" || href === "/help") {
      navigateToAuthenticatedFlow(href);
      return;
    }
    router.push(href);
  }

  const isProtectedView = AUTH_REQUIRED_VIEWS.has(view);
  const canAccessProtectedView = !isProtectedView || !!firebaseUser?.uid;

  return (
    <Shell onNavigate={handleNavigate} themeMode={themeMode} onThemeChange={setThemeMode} firebaseUser={firebaseUser} currentView={view}>
      {view === "home" ? <HomeView themeMode={themeMode} onNavigate={(target) => (target === "/quote" ? navigateToAuthenticatedFlow(target) : handleNavigate(target))} /> : null}
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
