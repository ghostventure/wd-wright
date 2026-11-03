"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import WDWrightBrandLockup from "./WDWrightBrandLockup.jsx";
import WDWrightPublicFooter from "./WDWrightPublicFooter.jsx";
import WDWrightPreProjectSuite from "./WDWrightPreProjectSuite.jsx";
import { WrightAccessibilityControls, WrightCareersExperience } from "./WDWrightCareersAccessSuite.jsx";
import { EmptyPanel, HelpDrawer, InlineFieldMessage, SegmentedThemeToggle, StatusPill, Stepper } from "./WDWrightUiKit.jsx";
import { useWrightThemeMode, WRIGHT_THEME_OPTIONS } from "./wd-wright-theme-sync.js";
import { WDWRIGHT_THEME } from "./wd-wright-theme.js";
import { subscribeToWrightAuthSignals } from "./wd-wright-auth-sync.js";
import {
  BRAND,
  CAREER_BENEFITS,
  INDUSTRIES,
  LOCATION_GROUPS,
  MAP_HIGHLIGHTS,
  NAV_ITEMS,
  OPEN_ROLES,
  RESOURCES,
  SERVICES,
  SERVICE_DECISION_COMPONENTS,
  TECHNOLOGY_ITEMS,
  TECHNOLOGY_VISUALS,
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
  "project-tools": "Project Planning Tools",
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
  dmca: "Wright Copyright Contact",
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
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(circle at 8% 12%, var(--wdw-accent-soft), transparent 24%), radial-gradient(circle at 92% 8%, var(--wdw-accent-soft), transparent 18%), linear-gradient(180deg, rgba(255,255,255,0.05), transparent 28%)" }} />
      <div className="wdw-public-shell-width" style={{ width: "min(var(--wdw-content-width, 1180px), calc(100% - 32px))", margin: "0 auto", paddingTop: 18 }}>
        <header
          style={{
            position: "relative",
            zIndex: 10,
            backdropFilter: "blur(14px)",
            background: P.card,
            border: `1px solid ${P.line}`,
            borderRadius: "var(--wdw-radius-card, 20px)",
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
                    <StatusPill label={signedInLabel} tone="accent" palette={{ line: P.line, panelSoft: P.cardSoft, muted: P.muted, accentSoft: "var(--wdw-accent-soft)", accent: P.amber, strong: P.pine }} />
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
              Share the work location, service, schedule, and traffic conditions so the team can review your request.
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
        body="Find traffic control services, check listed markets, and prepare a quote request. Sign in to access account tools."
        items={[
          { title: "Request traffic control", body: "Sign in, then share the location, service, timing, and traffic conditions for your project." },
          { title: "Check service markets", body: "Review listed offices and markets on the locations page, then contact Wright to confirm availability for your project." },
          { title: "Open your account", body: "Sign in to access the quote request and the account tools currently available." },
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
        borderRadius: "var(--wdw-radius-card, 20px)",
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
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 80% 15%, var(--wdw-accent-soft), transparent 24%), radial-gradient(circle at 20% 14%, rgba(0,0,0,0.06), transparent 18%)" }} />
      <div style={{ position: "absolute", left: "-8%", right: "-8%", bottom: 16, height: 86, background: "#272727", borderRadius: "999px / 52px" }} />
      <div style={{ position: "absolute", left: "6%", right: "6%", bottom: 56, height: 6, background: "repeating-linear-gradient(90deg, #f6f2d4 0 24px, transparent 24px 42px)", opacity: 0.8 }} />
      <div style={{ position: "absolute", left: "14%", bottom: 82, width: 28, height: 100, background: accent, borderRadius: 10, boxShadow: "54px 0 0 0 #fff, 108px 0 0 0 #fff" }} />
      <div style={{ position: "absolute", left: "12%", bottom: 170, width: 32, height: 14, background: "#fff", transform: "skewX(-12deg)", boxShadow: "54px 0 0 0 #fff, 108px 0 0 0 #fff" }} />
      <div style={{ position: "absolute", right: "18%", bottom: 84, width: 132, height: 62, background: "var(--wdw-accent)", borderRadius: 14 }} />
      <div style={{ position: "absolute", right: "28%", bottom: 126, width: 82, height: 38, background: "var(--wdw-accent-strong)", borderRadius: "12px 12px 8px 8px" }} />
      <div style={{ position: "absolute", right: "16%", bottom: 70, width: 18, height: 18, borderRadius: 999, background: "#111", boxShadow: "-90px 0 0 0 #111" }} />
      <div style={{ position: "absolute", right: "16.5%", bottom: 73.5, width: 11, height: 11, borderRadius: 999, background: "#d8d8d8", boxShadow: "-90px 0 0 0 #d8d8d8" }} />
      <div style={{ position: "absolute", left: "40%", bottom: 84, width: 54, height: 54, borderRadius: 999, border: `10px solid ${accent}` }} />
      <div style={{ position: "absolute", left: "43.8%", bottom: 106, width: 44, height: 10, background: accent, transform: "rotate(-32deg)", transformOrigin: "left center" }} />
    </div>
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
  return (
    <div style={{ display: "grid", gap: 18 }}>
      <Surface tone="dark" style={{ padding: 0, overflow: "hidden", position: "relative" }}>
        <img src="/wdwright/hero-road-signal.jpg" alt="Traffic control setup along an active roadway" fetchPriority="high" decoding="async" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        <div aria-hidden="true" style={{ position: "absolute", inset: 0, background: "linear-gradient(95deg, rgba(10,18,19,0.91), rgba(10,18,19,0.62))" }} />
        <div style={{ position: "relative", maxWidth: 840, padding: "clamp(24px, 4vw, 40px)" }}>
          <div style={{ marginBottom: 14 }}><WDWrightBrandLockup themeMode={themeMode} context="hero" width="min(340px, 70vw)" /></div>
          <div style={{ fontFamily: P.sans, fontSize: 11, fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase", color: P.amber, marginBottom: 9 }}>{BRAND.heroTag}</div>
          <h1 style={{ maxWidth: 760, margin: 0, fontFamily: P.display, fontSize: "clamp(2rem, 4vw, 3.35rem)", lineHeight: 1, letterSpacing: "-0.02em", textTransform: "uppercase", color: "#fff" }}>Traffic control for active work zones.</h1>
          <p style={{ maxWidth: 650, margin: "14px 0 18px", fontFamily: P.sans, fontSize: 15, lineHeight: 1.75, color: "rgba(237,243,241,0.84)" }}>Explore services and listed markets, then share your project location, timing, and traffic conditions for review.</p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button type="button" onClick={() => onNavigate("/quote")} style={{ minHeight: 46, border: 0, borderRadius: 999, padding: "0 18px", background: P.amber, color: P.pine, fontFamily: P.sans, fontWeight: 850, cursor: "pointer" }}>Request a quote</button>
            <button type="button" onClick={() => onNavigate("/services")} style={{ minHeight: 46, border: "1px solid rgba(255,255,255,0.32)", borderRadius: 999, padding: "0 18px", background: "rgba(255,255,255,0.06)", color: "#fff", fontFamily: P.sans, fontWeight: 800, cursor: "pointer" }}>Explore services</button>
          </div>
        </div>
      </Surface>

      <Surface>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", gap: 16, flexWrap: "wrap", marginBottom: 16 }}>
          <SectionTitle eyebrow="Services" title="Start with the work you need done." body="Review the listed service areas. Wright can confirm project fit and availability." />
          <button type="button" onClick={() => onNavigate("/services")} style={{ minHeight: 42, border: `1px solid ${P.line}`, borderRadius: 999, padding: "0 15px", background: P.card, color: P.text, fontFamily: P.sans, fontWeight: 800, cursor: "pointer" }}>All services <span aria-hidden="true">→</span></button>
        </div>
        <CardGrid columns={3}>
          {SERVICES.slice(0, 3).map((service) => (
            <div key={service.slug} style={{ border: `1px solid ${P.line}`, borderRadius: 18, overflow: "hidden", background: P.card }}>
              <img src={service.slug === "flagging" ? "/wdwright/flagging-services.jpg" : service.slug === "plans" ? "/wdwright/advanced-road-safety.jpg" : "/wdwright/hero-road-signal.jpg"} alt="" loading="lazy" decoding="async" style={{ width: "100%", height: 150, objectFit: "cover", display: "block" }} />
              <div style={{ padding: 16 }}>
                <h2 style={{ margin: "0 0 8px", fontFamily: P.display, fontSize: 21, lineHeight: 1.08, textTransform: "uppercase", color: P.text }}>{service.title}</h2>
                <p style={{ margin: 0, fontFamily: P.sans, fontSize: 13.5, lineHeight: 1.7, color: P.muted }}>{service.body}</p>
              </div>
            </div>
          ))}
        </CardGrid>
      </Surface>

      <Surface tone="soft">
        <SectionTitle eyebrow="How to get started" title="Three details help move a request forward." body="A quote request begins a review; it does not confirm service, schedule, or price." />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 190px), 1fr))", gap: 12 }}>
          {[
            ["01", "Where", "Share the work location or nearest city."],
            ["02", "When", "Add the expected dates and work hours, if known."],
            ["03", "What", "Describe the service, lane conditions, or closure needs."],
          ].map(([number, title, body]) => (
            <div key={number} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: 16, borderRadius: 16, border: `1px solid ${P.line}`, background: P.card }}>
              <span aria-hidden="true" style={{ display: "grid", placeItems: "center", flex: "0 0 34px", height: 34, borderRadius: 11, background: P.asphalt, color: P.amber, fontFamily: P.sans, fontSize: 11, fontWeight: 850 }}>{number}</span>
              <div><h3 style={{ margin: "1px 0 5px", fontFamily: P.display, fontSize: 18, lineHeight: 1.1, textTransform: "uppercase", color: P.text }}>{title}</h3><p style={{ margin: 0, fontFamily: P.sans, fontSize: 13, lineHeight: 1.65, color: P.muted }}>{body}</p></div>
            </div>
          ))}
        </div>
      </Surface>

      <Surface>
        <div className="wdw-public-split" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(260px, 0.8fr)", gap: 20, alignItems: "center" }}>
          <div>
            <SectionTitle eyebrow="Coverage" title="Check the listed markets." body="Use the locations page to review Wright’s listed regions and cities. Contact the team to confirm availability for your project." />
            <button type="button" onClick={() => onNavigate("/locations")} style={{ minHeight: 44, marginTop: 14, border: 0, borderRadius: 999, padding: "0 17px", background: P.amber, color: P.pine, fontFamily: P.sans, fontWeight: 850, cursor: "pointer" }}>View locations <span aria-hidden="true">→</span></button>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {INDUSTRIES.map((item) => <span key={item} style={{ borderRadius: 999, padding: "9px 12px", background: P.cardSoft, border: `1px solid ${P.line}`, fontFamily: P.sans, fontSize: 12, fontWeight: 700, color: P.pine }}>{item}</span>)}
          </div>
        </div>
      </Surface>
    </div>
  );
}

function AboutView() {
  return (
    <div style={{ display: "grid", gap: 18 }}>
      <SectionTitle eyebrow="About Wright" title="Traffic control for work zones and roadway projects." body="WD Wright provides traffic control services for projects that affect roads and public access. Review the listed services and markets, then contact the team about your project." />
      <CardGrid columns={3}>
        {[
          ["Work-zone safety", "Traffic control helps guide drivers and protect access around active work areas."],
          ["Regional service", "Review the listed markets and contact Wright to confirm coverage for your project."],
          ["Project coordination", "Share the location, timing, and work-zone conditions when requesting service."],
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

function ServicesView({ onNavigate }) {
  const laneGuidance = {
    "Daily traffic support": "Consider flagging or crew support when vehicles need direction through an active work area.",
    "Planned closures": "Start here when the project needs advance discussion about phases, detours, or lane configurations.",
    "Protection hardware": "Ask about signs, cones, drums, barricades, or TMA support that may fit the planned setup.",
    "Advanced work zones": "Discuss automated flagger-assistance or remote-operated options and whether they fit the site.",
  };
  const serviceSummaries = {
    flagging: "Flagging and traffic-direction support for roadway, utility, and construction work.",
    plans: "Planning support for work-zone phases, detours, and lane configurations. Permit requirements depend on the project and jurisdiction.",
    barricading: "Barricade setup, maintenance, and retrieval for temporary traffic-control work.",
    tma: "Ask the team about truck-mounted attenuator and shadow-vehicle support for your work-zone setup.",
    smartflagger: "Discuss AFAD and remote-operated system options; site suitability and configuration need review.",
    events: "Traffic-management support for event, civic, emergency, or other specialty closure requests, subject to scope and availability.",
  };
  const serviceBullets = {
    flagging: ["Lane closures", "Single-lane alternating traffic", "Intersection support"],
    plans: ["Work-zone phasing", "Detour discussion", "Lane configuration planning"],
    barricading: ["Cones and drums", "Sign packages", "Temporary closure equipment"],
    tma: ["Truck-mounted attenuator support", "Shadow-vehicle discussion", "Mobile work zones"],
    smartflagger: ["AFAD options", "Remote-operated systems", "Site-fit discussion"],
    events: ["Ingress and egress", "Temporary closures", "Special routing conditions"],
  };
  const serviceImages = {
    flagging: "/wdwright/flagging-services.jpg",
    plans: "/wdwright/advanced-road-safety.jpg",
    barricading: "/wdwright/advanced-road-safety.jpg",
    tma: "/wdwright/hero-road-signal.jpg",
    smartflagger: "/wdwright/guardian-smartflagger.jpg",
    events: "/wdwright/hero-road-signal.jpg",
  };

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <Surface tone="dark" style={{ padding: 0, overflow: "hidden", position: "relative" }}>
        <img src="/wdwright/hero-road-signal.jpg" alt="Traffic-control setup along an active roadway" fetchPriority="high" decoding="async" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        <div aria-hidden="true" style={{ position: "absolute", inset: 0, background: "linear-gradient(100deg, rgba(10,20,21,0.94) 0%, rgba(10,20,21,0.78) 58%, rgba(10,20,21,0.48) 100%), radial-gradient(circle at 14% 10%, var(--wdw-accent-soft), transparent 31%)" }} />
        <div style={{ position: "relative", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: 24, alignItems: "end", padding: "clamp(24px, 4vw, 42px)" }}>
          <div>
            <div style={{ fontFamily: P.sans, color: P.amber, fontSize: 11, fontWeight: 850, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 12 }}>Services · Work-zone support</div>
            <h1 style={{ margin: 0, maxWidth: 780, fontFamily: P.display, color: "#fff", fontSize: "clamp(2.1rem, 4.6vw, 3.5rem)", lineHeight: 0.98, letterSpacing: "-0.025em", textTransform: "uppercase" }}>The right traffic-control mix starts with the work.</h1>
            <p style={{ maxWidth: 700, margin: "15px 0 0", color: "rgba(244,248,245,0.84)", fontFamily: P.sans, fontSize: 15, lineHeight: 1.75 }}>Compare the service areas, note your work location and conditions, then send a quote inquiry. The Wright team confirms service fit, availability, and scope for each project.</p>
          </div>
          <div style={{ display: "grid", gap: 12, justifyItems: "start" }}>
            <div style={{ borderLeft: `3px solid ${P.amber}`, padding: "2px 0 2px 14px", color: "rgba(244,248,245,0.82)", fontFamily: P.sans, fontSize: 13, lineHeight: 1.65 }}><strong style={{ display: "block", color: "#fff", fontSize: 13.5, marginBottom: 3 }}>Six service areas</strong>Flagging, plans, barricades, TMA, work-zone technology, and specialty closures.</div>
            <button type="button" onClick={() => onNavigate?.("/quote")} style={{ minHeight: 48, border: 0, borderRadius: 999, padding: "0 19px", background: P.amber, color: P.pine, fontFamily: P.sans, fontWeight: 850, cursor: "pointer" }}>Start a quote request <span aria-hidden="true">→</span></button>
          </div>
        </div>
      </Surface>

      <Surface>
        <SectionTitle eyebrow="Choose a starting point" title="What does the project need most?" body="These are service categories, not a final work plan. A request can involve more than one; the team can review the project details with you." />
        <CardGrid columns={4}>
          {SERVICE_DECISION_COMPONENTS.map((item) => (
            <div key={item.title} style={{ minHeight: "100%", borderRadius: 18, border: `1px solid ${P.line}`, background: P.cardSoft, padding: 18 }}>
              <div style={{ color: P.amber, fontFamily: P.sans, fontSize: 10.5, fontWeight: 850, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 8 }}>Project fit</div>
              <div style={{ color: P.text, fontFamily: P.display, fontSize: 21, lineHeight: 1.05, textTransform: "uppercase", marginBottom: 9 }}>{item.title}</div>
              <div style={{ color: P.muted, fontFamily: P.sans, fontSize: 13, lineHeight: 1.65 }}>{laneGuidance[item.title]}</div>
            </div>
          ))}
        </CardGrid>
      </Surface>

      <div id="service-options" style={{ display: "grid", gap: 14, scrollMarginTop: 18 }}>
        <SectionTitle eyebrow="Service comparison" title="Compare the options side by side." body="Use the examples to describe what you need. Specific equipment, setup, permitting, and scheduling are confirmed after project review." />
        <CardGrid columns={3}>
          {SERVICES.map((service, index) => (
            <Surface key={service.slug} style={{ padding: 0, overflow: "hidden", minHeight: "100%" }}>
              <div style={{ position: "relative", height: 148, background: P.cardSoft, overflow: "hidden" }}>
                <img src={serviceImages[service.slug] || "/wdwright/hero-road-signal.jpg"} alt="" loading="lazy" decoding="async" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                <span style={{ position: "absolute", left: 14, top: 14, display: "grid", placeItems: "center", width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.94)", color: P.pine, fontFamily: P.sans, fontSize: 11, fontWeight: 850 }}>{String(index + 1).padStart(2, "0")}</span>
              </div>
              <div style={{ padding: 19 }}>
                <div style={{ fontFamily: P.display, fontSize: 23, lineHeight: 1.03, textTransform: "uppercase", color: P.text, marginBottom: 9 }}>{service.title}</div>
                <div style={{ fontFamily: P.sans, fontSize: 13.5, lineHeight: 1.7, color: P.muted, minHeight: 68, marginBottom: 14 }}>{serviceSummaries[service.slug]}</div>
                <div style={{ paddingTop: 12, borderTop: `1px solid ${P.line}` }}>
                  <div style={{ fontFamily: P.sans, fontSize: 10.5, fontWeight: 850, letterSpacing: "0.12em", textTransform: "uppercase", color: P.pine, marginBottom: 8 }}>Common scope details</div>
                  <div style={{ display: "grid", gap: 7 }}>{(serviceBullets[service.slug] || []).map((bullet) => <div key={bullet} style={{ display: "flex", gap: 8, alignItems: "flex-start", fontFamily: P.sans, fontSize: 12.5, lineHeight: 1.55, color: P.text }}><span aria-hidden="true" style={{ color: P.amber, fontWeight: 900 }}>•</span>{bullet}</div>)}</div>
                </div>
              </div>
            </Surface>
          ))}
        </CardGrid>
      </div>

      <Surface tone="soft" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))", gap: 22, alignItems: "center" }}>
        <div>
          <div style={{ color: P.amber, fontFamily: P.sans, fontSize: 10.5, fontWeight: 850, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 7 }}>Before the request</div>
          <div style={{ color: P.pine, fontFamily: P.display, fontSize: 29, lineHeight: 1, textTransform: "uppercase", marginBottom: 9 }}>Bring the field details.</div>
          <div style={{ color: P.muted, fontFamily: P.sans, fontSize: 13.5, lineHeight: 1.7 }}>A city or address, expected work window, lane or closure conditions, and any known plan or permit context help describe the project.</div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-start" }}>
          <button type="button" onClick={() => onNavigate?.("/quote")} style={{ minHeight: 46, border: 0, borderRadius: 999, padding: "0 18px", background: P.asphalt, color: "#fff", fontFamily: P.sans, fontWeight: 850, cursor: "pointer" }}>Request a quote</button>
          <button type="button" onClick={() => onNavigate?.("/locations")} style={{ minHeight: 46, border: `1px solid ${P.line}`, borderRadius: 999, padding: "0 18px", background: P.card, color: P.text, fontFamily: P.sans, fontWeight: 800, cursor: "pointer" }}>Review listed markets</button>
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
              <img src={item.image} alt={item.title} loading="lazy" decoding="async" style={{ width: "100%", height: 170, objectFit: "cover", display: "block" }} />
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
      <SectionTitle eyebrow="Locations" title="Find Wright offices and listed service markets." body="Browse the regions and cities shown here, then contact the team to confirm whether service is available for your project." />
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
            style={{ display: "inline-flex", marginTop: 18, borderRadius: 999, background: P.amber, color: "#fff", textDecoration: "none", padding: "11px 16px", fontFamily: P.sans, fontWeight: 800 }}
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
      <SectionTitle eyebrow="Resources" title="Plan for traffic control before work begins." body="Review service, equipment, and project-planning information before you request a quote." />
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
  const quoteStepCopy = [
    ["Start with a contact", "Give the team one reliable way to follow up about this project."],
    ["Describe the work zone", "Share where the work is happening and which traffic-control service best fits."],
    ["Add timing and conditions", "Include dates, work hours, and lane or closure details if you know them."],
    ["Review before sending", "Check the request. The team must confirm service fit, availability, and final scope."],
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
  const currentQuoteStep = quoteStepCopy[Math.min(step, quoteStepCopy.length - 1)];

  return (
    <div style={{ display: "grid", gap: 18 }}>
      {isQuote ? (
        <Surface tone="dark" style={{ padding: 0, overflow: "hidden", position: "relative" }}>
          <div aria-hidden="true" style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 8% 5%, var(--wdw-accent-soft), transparent 28%), linear-gradient(112deg, transparent 48%, rgba(255,255,255,0.045) 48%, transparent 72%)" }} />
          <div style={{ position: "relative", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))", gap: 24, alignItems: "end", padding: "clamp(22px, 4vw, 38px)" }}>
            <div>
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, marginBottom: 15 }}>
                <StatusPill label="Traffic control quote intake" tone="accent" palette={{ line: "rgba(255,255,255,0.18)", panelSoft: "rgba(255,255,255,0.08)", muted: "#f4f7f4", accentSoft: "var(--wdw-accent-soft)", accent: P.amber, strong: "#fff" }} />
                <span style={{ fontFamily: P.sans, color: "rgba(242,246,243,0.68)", fontSize: 12 }}>4 short steps · about the project, not a confirmed booking</span>
              </div>
              <h1 style={{ margin: 0, maxWidth: 760, fontFamily: P.display, fontSize: "clamp(2.1rem, 4.6vw, 3.5rem)", lineHeight: 0.98, letterSpacing: "-0.025em", textTransform: "uppercase", color: "#fff" }}>Build a clear quote request.</h1>
              <p style={{ margin: "14px 0 0", maxWidth: 680, fontFamily: P.sans, fontSize: 15, lineHeight: 1.75, color: "rgba(242,246,243,0.82)" }}>Tell us where the work is, what traffic-control support you need, and when you expect to start. Wright will review the details and confirm service fit and next steps.</p>
            </div>
            <div style={{ display: "grid", gap: 12, justifyItems: "start" }}>
              <div style={{ borderLeft: `3px solid ${P.amber}`, paddingLeft: 14 }}>
                <div style={{ color: P.amber, fontFamily: P.sans, fontSize: 11, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase" }}>Your request</div>
                <div style={{ marginTop: 5, color: "#fff", fontFamily: P.sans, fontSize: 13.5, lineHeight: 1.6 }}>A quote inquiry gives the team project context. It does not reserve a crew or confirm availability.</div>
              </div>
              <button type="button" onClick={() => document.getElementById("wdw-quote-form")?.scrollIntoView({ behavior: "smooth", block: "start" })} style={{ border: "none", borderRadius: 999, minHeight: 46, padding: "0 18px", background: P.amber, color: P.pine, fontFamily: P.sans, fontWeight: 850, cursor: "pointer" }}>Start quote request <span aria-hidden="true">↓</span></button>
            </div>
          </div>
        </Surface>
      ) : <SectionTitle eyebrow="Contact Wright" title="Send a clear project question." body="Share a few details and choose a contact route. You can save this draft and return on the same device." />}
      <div className="wdw-public-split" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.1fr) minmax(280px, 0.9fr)", gap: 18 }}>
        <Surface style={isQuote ? { scrollMarginTop: 20, borderTop: `4px solid ${P.amber}` } : undefined}>
          {isQuote ? <div id="wdw-quote-form" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", alignItems: "start", gap: 12, marginBottom: 16 }}>
            <div>
              <div style={{ fontFamily: P.display, fontSize: 25, lineHeight: 1.05, textTransform: "uppercase", color: P.text }}>{currentQuoteStep[0]}</div>
              <div style={{ marginTop: 5, fontFamily: P.sans, fontSize: 13, lineHeight: 1.6, color: P.muted }}>{currentQuoteStep[1]}</div>
            </div>
            <div aria-live="polite" style={{ borderRadius: 999, padding: "7px 11px", background: P.cardSoft, color: P.pine, fontFamily: P.sans, fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase" }}>Step {step + 1} of {steps.length}</div>
          </div> : null}
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
                {step < 3 ? <button type="button" onClick={() => { if (validate(step)) setStep((current) => Math.min(3, current + 1)); }} style={{ border: "none", background: P.asphalt, color: "#fff", borderRadius: 999, minHeight: 44, padding: "0 16px", fontFamily: P.sans, fontWeight: 800, cursor: "pointer" }}>Continue</button> : <button type="submit" disabled={submitting} style={{ border: "none", background: P.amber, color: "#fff", borderRadius: 999, minHeight: 48, padding: "0 18px", fontFamily: P.sans, fontWeight: 800, cursor: submitting ? "wait" : "pointer", opacity: submitting ? 0.7 : 1 }}>{submitting ? "Sending…" : firebaseUser?.uid ? (isQuote ? "Send Quote Request" : "Send Contact Request") : "Sign In To Send"}</button>}
              </div>
              <button type="button" onClick={clearDraft} style={{ border: 0, background: "transparent", color: P.muted, padding: "8px 4px", fontFamily: P.sans, fontSize: 12.5, textDecoration: "underline", cursor: "pointer" }}>Clear saved draft</button>
            </div>
          </form>
          {status ? <div role="status" aria-live="polite" style={calloutStyle}>{status.text}{status.kind === "info" && !firebaseUser?.uid ? <button type="button" onClick={() => onRequireAuth?.(isQuote ? "/quote" : "/contact")} style={{ display: "block", marginTop: 8, border: 0, background: "transparent", padding: 0, color: P.pine, textDecoration: "underline", font: "inherit", cursor: "pointer" }}>Sign in and return to this draft</button> : null}</div> : null}
        </Surface>
        <Surface tone="soft">
          {isQuote ? <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
              <div style={{ fontFamily: P.display, fontSize: 28, lineHeight: 1, textTransform: "uppercase" }}>Scope snapshot</div>
              <span style={{ borderRadius: 999, padding: "6px 9px", background: P.card, border: `1px solid ${P.line}`, color: P.muted, fontFamily: P.sans, fontSize: 10.5, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase" }}>Step {step + 1}/4</span>
            </div>
            <div style={{ display: "grid", gap: 8, marginBottom: 16 }}>
              {[
                ["01", "Project contact", "Name and a working reply route"],
                ["02", "Work location", "City, state, address, or ZIP"],
                ["03", "Traffic conditions", "Service, timing, and closure context"],
                ["04", "Review and send", "Confirm the details before submission"],
              ].map(([number, title, detail], index) => <div key={number} style={{ display: "grid", gridTemplateColumns: "30px 1fr", gap: 10, alignItems: "start", borderRadius: 12, padding: 10, background: index === step ? P.card : "transparent", border: `1px solid ${index === step ? P.line : "transparent"}` }}>
                <span style={{ display: "grid", placeItems: "center", width: 27, height: 27, borderRadius: "50%", background: index < step ? P.amber : P.cardSoft, color: P.pine, fontFamily: P.sans, fontSize: 10, fontWeight: 850 }}>{index < step ? "✓" : number}</span>
                <span><strong style={{ display: "block", fontFamily: P.sans, fontSize: 12.5, color: P.text }}>{title}</strong><span style={{ display: "block", marginTop: 2, fontFamily: P.sans, fontSize: 11.5, lineHeight: 1.5, color: P.muted }}>{detail}</span></span>
              </div>)}
            </div>
            <div style={{ borderTop: `1px solid ${P.line}`, paddingTop: 14 }}>
              <div style={{ fontFamily: P.sans, fontSize: 12, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: P.pine, marginBottom: 8 }}>Helpful to include</div>
              <div style={{ display: "grid", gap: 7 }}>{["Nearest city or work address", "Expected dates and work hours", "Lane closure, detour, or shoulder conditions", "Traffic plan or permit status, if known"].map((item) => <div key={item} style={{ display: "flex", gap: 8, alignItems: "start", fontFamily: P.sans, fontSize: 12.5, lineHeight: 1.55, color: P.muted }}><span aria-hidden="true" style={{ color: P.amber, fontWeight: 900 }}>+</span>{item}</div>)}</div>
            </div>
            <div style={{ marginTop: 16, borderRadius: 12, padding: 13, background: "rgba(255,255,255,0.72)", border: `1px solid ${P.line}` }}>
              <div style={{ fontFamily: P.sans, fontSize: 12, fontWeight: 800, color: P.text }}>Draft storage stays in this browser, when available</div>
              <div style={{ marginTop: 4, fontFamily: P.sans, fontSize: 12, lineHeight: 1.6, color: P.muted }}>Your unsent details stay in this browser’s local storage. Avoid adding sensitive personal information. Use “Clear saved draft” before sharing this device.</div>
            </div>
            <div style={{ marginTop: 16, borderRadius: 12, padding: 13, background: "#fff4e5", color: P.text, fontFamily: P.sans, fontSize: 12, lineHeight: 1.6 }}>Plans and permits cannot be attached here yet. Contact the team if you need to share project documents. A submitted request is an inquiry; service, timing, and scope require Wright confirmation.</div>
            <div style={{ marginTop: 16, fontFamily: P.sans, fontSize: 13.5, lineHeight: 1.8, color: P.text, fontWeight: 700 }}>{BRAND.phone}<br />{BRAND.quoteEmail}</div>
          </> : <>
            <div style={{ fontFamily: P.display, fontSize: 28, lineHeight: 1, textTransform: "uppercase", marginBottom: 12 }}>Before you send</div>
            <div style={{ display: "grid", gap: 10 }}>
              {["Choose the closest service; the Wright team can confirm the exact setup.", "Add the work address or nearest city and the schedule if known.", "The form saves a draft on this device. Clear it before sharing the device.", "This form cannot attach plan files yet. Call or email the team to share plans and permits."].map((item) => <div key={item} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}><span aria-hidden="true" style={{ color: P.amber, fontWeight: 800 }}>•</span><span style={{ fontFamily: P.sans, fontSize: 13.5, lineHeight: 1.7, color: P.muted }}>{item}</span></div>)}
            </div>
            <div style={{ marginTop: 18, fontFamily: P.sans, fontSize: 13.5, lineHeight: 1.8, color: P.text, fontWeight: 700 }}>{BRAND.phone}<br />{BRAND.email}</div>
            <div style={{ marginTop: 18 }}><EmptyPanel palette={{ line: P.line, panelSoft: "#fff", panel: P.cardSoft, muted: P.muted, dark: P.text }} title="Saved on this device" body="This draft stays in this browser only; it is not sent to WD Wright until you sign in and submit it." /></div>
          </>}
        </Surface>
      </div>
    </div>
  );
}

const WRIGHT_FAQ_CATEGORIES = ["All questions", "Services", "Quotes", "Coverage & scheduling", "Plans & field work", "Accounts & privacy", "Careers & access"];

const WRIGHT_FAQS = [
  { category: "Services", q: "What traffic control services can I ask about?", a: "The site describes flagging, traffic control plans, barricading, truck-mounted attenuator (TMA) support, smart work-zone technology, and event or specialty closures. The team must confirm which services fit your location and project." },
  { category: "Services", q: "Can you help with lane closures or alternating traffic?", a: "Lane closures and single-lane alternating traffic are listed as examples of flagging and traffic-control work. Share the roadway, work area, dates, and traffic conditions so Wright can review the request." },
  { category: "Services", q: "What is a TMA truck?", a: "TMA means truck-mounted attenuator. Wright lists TMA truck support for work-zone protection needs. Availability and suitability depend on the project and roadway conditions." },
  { category: "Services", q: "Do you provide automated flagging or smart work-zone equipment?", a: "The site describes AFAD and SmartFlagger-style technology. Ask the team to confirm the equipment and support available for your project; the website does not reserve or dispatch equipment." },
  { category: "Services", q: "Can you help with an event or a temporary road closure?", a: "Event and specialty closures are listed services. Send the event location, expected attendance or traffic context, timing, and requested routing support for review." },
  { category: "Services", q: "Are traffic-control crews certified?", a: "Crew qualifications and any certifications depend on the work and applicable requirements. Contact Wright to confirm the qualifications for a specific project; this FAQ does not certify an individual or crew." },
  { category: "Quotes", q: "How do I request a quote?", a: "Use the quote form and provide a contact route, work location, service need, expected timing, and lane or closure conditions. Sign-in is required to submit the protected quote request." },
  { category: "Quotes", q: "What information helps Wright review my request?", a: "Include the nearest city or work address, requested service, expected dates and work hours, traffic conditions, closure type, and the status of any traffic plan or permit." },
  { category: "Quotes", q: "Can I request a quote if my dates are not final?", a: "Yes. The form lets you select that dates are not set yet. Provide the best timing estimate you have; Wright still needs to confirm availability and scope." },
  { category: "Quotes", q: "Can I get a price before the project scope is final?", a: "The website does not publish project pricing. Share the known scope and ask the team what additional details it needs; final pricing must be confirmed with Wright for the project." },
  { category: "Quotes", q: "Does submitting the form book a crew or confirm service?", a: "No. A submitted request is an inquiry, not a booking or availability commitment. Wright must confirm service fit, schedule, scope, and price." },
  { category: "Quotes", q: "Can I attach plans, permits, or other files to the quote form?", a: "No. The current quote form does not accept file attachments. Contact Wright by phone or email to ask how to share project documents." },
  { category: "Quotes", q: "Why does the quote form ask me to sign in?", a: "Quote requests use the protected account flow so the request can be associated with the signed-in account. If sign-in or account setup is unavailable, contact Wright by phone or email." },
  { category: "Quotes", q: "Where is an unsent quote draft saved?", a: "An unfinished quote or contact draft is saved in this browser's local storage when available. It is not sent until you sign in and submit it. Use Clear saved draft before sharing the device, and avoid entering sensitive personal or payment information." },
  { category: "Quotes", q: "What does it mean if my request is saved to a local intake queue?", a: "It means the browser saved the request locally because the connected database path was unavailable. That message does not confirm Wright received it. Contact the team directly to make sure the request reaches them." },
  { category: "Coverage & scheduling", q: "Which locations do you serve?", a: "The Locations page lists regions and cities as a starting point. A listing is not a promise that a crew or service is available there; contact Wright to confirm current coverage for your project." },
  { category: "Coverage & scheduling", q: "Do you provide service in every city shown on the map?", a: "The map and city list provide geographic context only. Confirm current service availability, travel requirements, and project fit directly with Wright." },
  { category: "Coverage & scheduling", q: "How soon can a crew start?", a: "The quote form asks when support is needed, including urgent timing, but the website does not promise response or start times. Call Wright to discuss urgent work; availability must be confirmed." },
  { category: "Coverage & scheduling", q: "Can I change the requested dates or work hours?", a: "If you have not submitted the request, update the saved draft before sending. For a request already sent or an active project, contact Wright directly; the website does not confirm a schedule change." },
  { category: "Coverage & scheduling", q: "Does the site provide 24/7 dispatch?", a: "The website does not confirm dispatch hours or guarantee around-the-clock availability. Contact Wright using the listed phone or email to ask about current support." },
  { category: "Plans & field work", q: "Do I need a traffic-control plan before asking for service?", a: "You can submit a request with the plan status you know, including that you need help or are unsure. Wright can review the request, but permit requirements and plan approval depend on the project and responsible authorities." },
  { category: "Plans & field work", q: "Can Wright obtain a road-use permit or approve a traffic plan?", a: "The site describes traffic-plan and permit-ready support, but it does not promise permit issuance or approval. Confirm the requested work, responsible agency, and each party's role with Wright." },
  { category: "Plans & field work", q: "What should I include about traffic conditions?", a: "If known, note the road or work-area location, speed or lane context, shoulder work, alternating traffic, closure or detour needs, intersections, access points, and work hours. The field team must review site-specific conditions." },
  { category: "Plans & field work", q: "Can this website determine whether my work zone meets traffic-control rules?", a: "No. Website guidance is general and cannot determine site-specific legal or engineering requirements. Confirm applicable requirements with the responsible road authority and qualified project professionals." },
  { category: "Plans & field work", q: "What should change if the site conditions differ from the request?", a: "Tell the Wright contact coordinating the project before the work proceeds. The request form is for intake; it is not a field change-approval or emergency-response system." },
  { category: "Accounts & privacy", q: "What can I do in a WD Wright account?", a: "The site presents account areas for profiles, requests, resources, and related tools. Some functions depend on Firebase authentication and backend services that may not be available. Contact Wright if a sign-in or account action fails." },
  { category: "Accounts & privacy", q: "Will my profile details be saved?", a: "Profile changes should show a save result. If the page reports that account storage is unavailable or a profile could not be saved, treat those values as unconfirmed and try again later or contact Wright." },
  { category: "Accounts & privacy", q: "How do I update my contact preference?", a: "After signing in, use Profile to edit your contact route and callback number. Selecting phone or text does not enroll you in automated messages, and text delivery is not enabled by this preference alone." },
  { category: "Accounts & privacy", q: "Does choosing text message mean I consent to marketing texts?", a: "No. It records a preferred way to contact you; the current account setup does not enroll you in text marketing or turn on text delivery." },
  { category: "Accounts & privacy", q: "What information should I avoid putting in a quote or profile note?", a: "Do not enter passwords, payment-card details, government identification numbers, medical information, or other sensitive personal data in free-text fields." },
  { category: "Accounts & privacy", q: "How do I ask about a privacy concern or saved data?", a: "Contact Wright using the published email or phone number and describe your question. This website does not currently describe a complete data-retention or deletion process." },
  { category: "Accounts & privacy", q: "Can I share files through the website?", a: "The quote form does not accept attachments. Other document areas may require sign-in and backend setup; do not assume a document upload is available unless the page confirms the upload completed." },
  { category: "Careers & access", q: "Are the listed jobs guaranteed to be open?", a: "The careers page shows roles and locations for interest, but listings may need confirmation. Contact recruiting to verify that a role is currently open, its requirements, and the application process." },
  { category: "Careers & access", q: "Does Express Interest submit a job application?", a: "No. It sends an interest request for follow-up; the page's preparation checklist is stored in your browser and is not an application. Confirm current openings and the formal application process with recruiting." },
  { category: "Careers & access", q: "How can I request an accommodation or report an access barrier?", a: "Use the published contact information to describe the barrier or request another way to access information. The site includes larger-text, higher-contrast, reduced-motion, and skip-navigation controls, but does not claim that every workflow conforms to an accessibility standard." },
  { category: "Careers & access", q: "Where do I report a copyright concern?", a: "Use the contact details on the Copyright Contact page for a general inquiry. That page does not identify a registered designated agent or establish a formal notice process." },
  { category: "Careers & access", q: "How do I get help with a service request?", a: "Call 1 (724) 847-0234 or email wdwrightinc@wdwright.com. Include the request location and any reference you received; avoid sending sensitive information." },
];

function FAQView() {
  const [openQuestion, setOpenQuestion] = useState(WRIGHT_FAQS[0]?.q || "");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All questions");
  const normalizedQuery = query.trim().toLowerCase();
  const filteredFaqs = WRIGHT_FAQS.filter((item) => (
    (category === "All questions" || item.category === category) &&
    (!normalizedQuery || `${item.q} ${item.a} ${item.category}`.toLowerCase().includes(normalizedQuery))
  ));
  const categories = WRIGHT_FAQ_CATEGORIES.filter((item) => item === "All questions" || WRIGHT_FAQS.some((faq) => faq.category === item));

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <Surface tone="dark" style={{ overflow: "hidden", position: "relative" }}>
        <div style={{ position: "relative", display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", gap: 20, alignItems: "end" }}>
          <div>
            <div style={{ fontFamily: P.sans, fontSize: 11, fontWeight: 850, letterSpacing: "0.16em", textTransform: "uppercase", color: P.amber, marginBottom: 10 }}>Wright Help Desk</div>
            <h1 style={{ margin: 0, fontFamily: P.display, fontSize: "clamp(2rem, 4.5vw, 3.5rem)", lineHeight: 0.98, textTransform: "uppercase", color: "#fff" }}>Clear answers for your work zone.</h1>
            <p style={{ margin: "12px 0 0", maxWidth: 680, fontFamily: P.sans, fontSize: 14, lineHeight: 1.7, color: "rgba(242,246,243,0.82)" }}>Search by service, quote, schedule, account, or field condition. Availability and project scope always need confirmation from Wright.</p>
          </div>
          <div style={{ alignSelf: "end", minWidth: 110, padding: "12px 14px", borderRadius: 14, border: "1px solid rgba(255,255,255,0.14)", background: "rgba(255,255,255,0.06)", color: "#fff", textAlign: "center" }}>
            <div style={{ fontFamily: P.display, fontSize: 28, lineHeight: 1 }}>{WRIGHT_FAQS.length}</div>
            <div style={{ marginTop: 5, fontFamily: P.sans, fontSize: 10, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(242,246,243,0.75)" }}>Answers</div>
          </div>
        </div>
      </Surface>

      <Surface>
        <label htmlFor="wright-faq-search" style={{ display: "grid", gap: 6, marginBottom: 14, fontFamily: P.sans, fontSize: 13, fontWeight: 750, color: P.text }}>
          Search questions and answers
          <input id="wright-faq-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try “lane closure”, “permit”, “saved draft”, or “coverage”" style={{ minHeight: 48, borderRadius: 12, border: `1px solid ${P.line}`, padding: "0 14px", fontFamily: P.sans, fontSize: 14, background: P.fieldBg, color: P.fieldText }} />
        </label>
        <div role="group" aria-label="Filter FAQs by topic" style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
          {categories.map((item) => (
            <button key={item} type="button" aria-pressed={category === item} onClick={() => setCategory(item)} style={{ minHeight: 38, borderRadius: 999, border: `1px solid ${category === item ? P.asphalt : P.line}`, padding: "0 13px", background: category === item ? P.asphalt : P.card, color: category === item ? "#fff" : P.text, fontFamily: P.sans, fontSize: 12, fontWeight: 800, cursor: "pointer" }}>{item}</button>
          ))}
        </div>
        <div role="status" aria-live="polite" style={{ marginBottom: 12, fontFamily: P.sans, fontSize: 12.5, color: P.muted }}>{filteredFaqs.length} {filteredFaqs.length === 1 ? "answer" : "answers"}{normalizedQuery ? ` for “${query.trim()}”` : " available"}</div>
        <div style={{ display: "grid", gap: 9 }}>
          {filteredFaqs.map((item, index) => {
            const isOpen = openQuestion === item.q;
            const answerId = `wright-faq-answer-${index}`;
            return (
              <section key={item.q} style={{ borderRadius: 14, border: `1px solid ${isOpen ? P.amber : P.line}`, background: P.cardSoft, overflow: "hidden" }}>
                <button type="button" aria-expanded={isOpen} aria-controls={answerId} onClick={() => setOpenQuestion((current) => (current === item.q ? "" : item.q))} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, width: "100%", border: 0, padding: "15px 16px", background: "transparent", color: P.text, textAlign: "left", cursor: "pointer" }}>
                  <span>
                    <span style={{ display: "block", fontFamily: P.sans, fontSize: 10, fontWeight: 850, letterSpacing: "0.12em", textTransform: "uppercase", color: P.amber, marginBottom: 5 }}>{item.category}</span>
                    <span style={{ display: "block", fontFamily: P.sans, fontSize: 14, fontWeight: 800, lineHeight: 1.45 }}>{item.q}</span>
                  </span>
                  <span aria-hidden="true" style={{ fontFamily: P.sans, fontSize: 20, fontWeight: 700, color: P.amber }}>{isOpen ? "−" : "+"}</span>
                </button>
                {isOpen ? <div id={answerId} style={{ padding: "0 16px 16px", fontFamily: P.sans, fontSize: 13.5, lineHeight: 1.75, color: P.muted }}>{item.a}</div> : null}
              </section>
            );
          })}
          {!filteredFaqs.length ? <div role="status" style={{ borderRadius: 12, padding: 16, background: P.cardSoft, fontFamily: P.sans, color: P.muted }}>No answer matches those filters. Try a broader phrase or contact Wright directly.</div> : null}
        </div>
      </Surface>

      <Surface tone="soft" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontFamily: P.display, fontSize: 22, lineHeight: 1.1, textTransform: "uppercase", color: P.text }}>Still have a project question?</div>
          <div style={{ marginTop: 5, fontFamily: P.sans, fontSize: 13.5, lineHeight: 1.6, color: P.muted }}>Share the location and requested work; Wright can review fit and availability.</div>
        </div>
        <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
          <a href="/quote" style={{ display: "inline-flex", minHeight: 44, alignItems: "center", borderRadius: 999, padding: "0 16px", background: P.asphalt, color: "#fff", textDecoration: "none", fontFamily: P.sans, fontSize: 12.5, fontWeight: 850 }}>Start quote request</a>
          <a href={`mailto:${BRAND.email}`} style={{ display: "inline-flex", minHeight: 44, alignItems: "center", borderRadius: 999, border: `1px solid ${P.line}`, padding: "0 16px", color: P.text, textDecoration: "none", fontFamily: P.sans, fontSize: 12.5, fontWeight: 850 }}>Email Wright</a>
        </div>
      </Surface>
    </div>
  );
}

function HelpView() {
  return (
    <div style={{ display: "grid", gap: 18 }}>
      <SectionTitle eyebrow="Help Center" title="Answers for service requests and project planning." body="Find guidance on quote details, service markets, careers, and traffic control equipment." />
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

function LegalView({ title, sections, intro = "Read the current information below, and contact Wright with questions about the website or a service request." }) {
  return (
    <div style={{ display: "grid", gap: 18 }}>
      <SectionTitle eyebrow="Website Information" title={title} body={intro} />
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
          style={{ marginTop: 18, border: "none", background: P.amber, color: "#fff", borderRadius: 999, minHeight: 46, padding: "0 18px", fontFamily: P.sans, fontWeight: 800, cursor: "pointer" }}
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
      {view === "services" ? <ServicesView onNavigate={handleNavigate} /> : null}
      {view === "project-tools" ? <WDWrightPreProjectSuite onNavigate={handleNavigate} /> : null}
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
        ["Limited site summary", "This page describes some website behavior visible in the current application. It is not a complete privacy notice and does not list every service provider, retention period, or privacy-request process."],
        ["Quote and contact drafts", "While you fill in the quote or contact form, an unfinished draft is saved in this browser so you can return to it on this device. On a shared device, clear this site's browser data when you finish. Avoid putting passwords, payment-card details, government ID numbers, or sensitive personal information in project notes."],
        ["Submitting a request", "When you submit a request, the application tries to send it to Wright's intake store. If that service is unavailable, it may be kept in a local intake queue in this browser instead. Read the result message to see whether the request was saved remotely or locally; a local-only result is not confirmation that Wright received it."],
        ["Account information and questions", `Account screens may show unsaved defaults when account storage is unavailable. Check the save status before relying on profile changes. For questions about this site, contact ${BRAND.email} or ${BRAND.phone}.`],
      ]} intro="Current website data information, limited to behaviors that can be confirmed in the application. Company data practices and legal rights procedures still require a complete, company-approved privacy notice." /> : null}
      {view === "terms" ? <LegalView title="Terms" sections={[
        ["Service information", "Public-site content is informational and does not, by itself, create a service agreement or work order."],
        ["Quotes and scope", "Final project scope, timing, coverage, and billing should be confirmed through Wright’s actual service and dispatch process."],
        ["Operational boundaries", `Technology, content, and public marketing pages should not be treated as substitutes for signed commercial terms or site-specific field planning. Contact ${BRAND.email} or ${BRAND.phone} for formal commercial follow-up.`],
      ]} intro="These are limited service-information points, not complete terms for every account, document, payment, or project workflow. Confirm project scope, schedule, and price with Wright before work begins." /> : null}
      {view === "accessibility" ? <LegalView title="Accessibility" sections={[
        ["Controls currently available", "The site provides a skip-to-content link and browser-saved options for larger text, higher contrast, and reduced motion. These controls do not establish that every page, document, or workflow conforms to an accessibility standard."],
        ["Report a barrier", `If a page or form blocks access, contact ${BRAND.email} or ${BRAND.phone}. Include the page and task, and request another way to get the information if needed.`],
        ["Accessibility status", "The site has not been represented here as fully accessible or certified against a technical standard. Accessibility review and company response procedures remain ongoing."],
      ]} intro="This page describes specific access controls currently present in the website. It is not a conformance certification." /> : null}
      {view === "dmca" ? <LegalView title="Copyright Contact Information" sections={[
        ["General copyright inquiries", `Contact ${BRAND.email} with the page or material location and a short description of your concern. Do not include sensitive personal information.`],
        ["Formal notices", "This page does not identify a registered DMCA designated agent or describe an operative notice-and-takedown process. The general contact listed here should not be assumed to be a registered agent or to receive legally effective DMCA notices."],
        ["Service-provider status", "Whether a particular Wright website or service qualifies for a copyright safe harbor, and which notice process applies, has not been determined by this page."],
      ]} intro="General contact information about copyright concerns. This is not a DMCA policy or legal determination." /> : null}
    </Shell>
  );
}
