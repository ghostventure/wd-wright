import React from "react";
import WDWrightBrandLockup from "./WDWrightBrandLockup.jsx";
import { BRAND, FOOTER_COLUMNS } from "./wd-wright-data.js";
import { WDWRIGHT_THEME } from "./wd-wright-theme.js";

const palette = {
  bg: "var(--wdw-footer-bg)",
  card: "var(--wdw-footer-card)",
  line: "var(--wdw-footer-line)",
  text: "var(--wdw-footer-text)",
  muted: "var(--wdw-footer-muted)",
  amber: "var(--wdw-accent)",
  lime: "var(--wdw-accent-strong)",
  sans: WDWRIGHT_THEME.sans,
  display: WDWRIGHT_THEME.display,
};

const SERVICE_LINKS = [
  ["Flagging", "/services"],
  ["Traffic Plans", "/services"],
  ["Barricading", "/services"],
  ["TMA Support", "/services"],
];

function FooterLink({ label, href, onNavigate, color = palette.muted, fontSize = 13 }) {
  return (
    <button
      type="button"
      onClick={() => onNavigate(href)}
      style={{
        border: "none",
        background: "transparent",
        color,
        padding: "4px 0",
        textAlign: "left",
        cursor: "pointer",
        fontFamily: palette.sans,
        fontSize,
      }}
    >
      {label}
    </button>
  );
}

function FooterAction({ label, href, onNavigate, fill = false }) {
  return (
    <button
      type="button"
      onClick={() => onNavigate(href)}
      style={{
        minHeight: 44,
        borderRadius: 999,
        border: fill ? "none" : `1px solid ${palette.line}`,
        background: fill ? palette.amber : "transparent",
        color: fill ? palette.bg : palette.text,
        cursor: "pointer",
        fontFamily: palette.sans,
        fontSize: 12.5,
        fontWeight: 800,
        padding: "0 14px",
      }}
    >
      {label}
    </button>
  );
}

function FooterColumn({ title, links = [], onNavigate, color = palette.muted }) {
  return (
    <div>
      <div style={{ color: palette.amber, fontFamily: palette.sans, fontSize: 11, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 10 }}>
        {title}
      </div>
      {links.map(([label, href]) => (
        <FooterLink key={label} label={label} href={href} onNavigate={onNavigate} color={color} />
      ))}
    </div>
  );
}

function FooterShell({ children, auth = false }) {
  return (
    <footer
      style={{
        width: "min(1180px, 100%)",
        margin: auth ? "10px auto 0" : "24px auto 0",
        background: auth ? "linear-gradient(180deg, rgba(12,12,12,0.98) 0%, rgba(22,22,22,0.98) 100%)" : palette.bg,
        color: palette.text,
        borderRadius: auth ? 24 : 16,
        padding: auth ? "24px clamp(18px, 4vw, 28px)" : "30px clamp(18px, 4vw, 34px)",
        boxSizing: "border-box",
        boxShadow: auth ? "0 20px 54px rgba(0,0,0,0.18)" : "0 20px 60px rgba(0,0,0,0.22)",
        border: `1px solid ${palette.line}`,
      }}
    >
      {children}
    </footer>
  );
}

export default function WDWrightPublicFooter({ onNavigate, variant = "full", themeMode = "wright-day" }) {
  const isAuth = variant === "auth";
  const heroTitle = isAuth ? "One account across quotes, documents, and dashboard access." : "Traffic control, coverage, quotes, and account access in one place.";
  const heroBody = isAuth
    ? "Use one WD Wright sign-in for protected requests, files, and account follow-up."
    : "Move directly into services, locations, FAQ, legal pages, and account access without hunting through the site.";
  const actions = isAuth
    ? [["Get A Quote", "/quote", true], ["Resources", "/resources", false], ["FAQ", "/faq", false], ["Contact", "/contact", false]]
    : [["Get A Quote", "/quote", true], ["Locations", "/locations", false], ["Portal", "/signin", false], ["FAQ", "/faq", false]];

  return (
    <FooterShell auth={isAuth}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isAuth ? "minmax(0, 1.1fr) minmax(260px, 0.9fr)" : "minmax(0, 1.1fr) minmax(300px, 0.9fr)",
          gap: 20,
          marginBottom: 22,
          paddingBottom: 22,
          borderBottom: `1px solid ${palette.line}`,
          alignItems: "end",
        }}
      >
        <div>
          <div style={{ color: palette.amber, fontFamily: palette.sans, fontSize: 11, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 10 }}>
            {isAuth ? "WD Wright Access" : "Wright Traffic Control"}
          </div>
          <div style={{ marginBottom: 12 }}>
            <WDWrightBrandLockup themeMode={themeMode} context="header" width={220} />
          </div>
          <div style={{ fontFamily: palette.display, fontSize: isAuth ? "clamp(1.8rem, 4vw, 2.5rem)" : "clamp(2rem, 4vw, 3rem)", lineHeight: 0.96, textTransform: "uppercase", color: palette.text, maxWidth: 700 }}>
            {heroTitle}
          </div>
          <div style={{ color: palette.muted, fontFamily: palette.sans, fontSize: 13.5, lineHeight: 1.75, marginTop: 10, maxWidth: 720 }}>
            {heroBody}
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
          {actions.map(([label, href, fill]) => (
            <FooterAction key={label} label={label} href={href} onNavigate={onNavigate} fill={fill} />
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isAuth ? "minmax(0, 1.1fr) repeat(3, minmax(150px, 0.7fr))" : "minmax(0, 1fr) repeat(4, minmax(150px, 0.7fr))", gap: 22, marginBottom: 20 }}>
        <div>
          <div style={{ color: palette.amber, fontFamily: palette.sans, fontSize: 11, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 10 }}>
            Contact
          </div>
          <div style={{ color: palette.muted, fontFamily: palette.sans, fontSize: 12.5, lineHeight: 1.8 }}>
            {BRAND.legal}<br />
            {BRAND.phone}<br />
            {BRAND.email}
          </div>
        </div>
        <FooterColumn title="Company" links={FOOTER_COLUMNS.company} onNavigate={onNavigate} color={isAuth ? palette.text : palette.muted} />
        <FooterColumn title="Support" links={FOOTER_COLUMNS.support} onNavigate={onNavigate} color={isAuth ? palette.text : palette.muted} />
        <FooterColumn title="Legal" links={FOOTER_COLUMNS.legal} onNavigate={onNavigate} color={isAuth ? palette.text : palette.muted} />
        {!isAuth ? <FooterColumn title="Service Lanes" links={SERVICE_LINKS} onNavigate={onNavigate} /> : null}
      </div>

      <div style={{ borderTop: `1px solid ${palette.line}`, paddingTop: 14, display: "grid", gap: 8, color: palette.muted, fontFamily: palette.sans, fontSize: 11.5, lineHeight: 1.7 }}>
        <div>
          WD Wright presents traffic control, planning, coverage, recruiting, FAQ, and legal information in one streamlined company surface.
        </div>
        <div>
          © 2026 {BRAND.legal}. All rights reserved.
        </div>
      </div>
    </FooterShell>
  );
}
