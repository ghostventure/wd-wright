import WDWrightMobileOptimizer from "../src/WDWrightMobileOptimizer.jsx";

export const metadata = {
  title: "Wright Traffic Control",
  description: "Traffic control, work zone safety, planning, locations, recruiting, account access, and quote intake for Wright Traffic Control.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icons/wd-wright-icon.svg"
  }
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ecf0ea"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,300;0,500;0,700;1,300;1,500;1,700&display=swap" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-TWW3MG8S');`
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(() => { try { const key = 'wd-wright-theme'; const storedTheme = localStorage.getItem(key) || 'wright-day'; document.documentElement.dataset.wdWrightTheme = storedTheme; document.documentElement.classList.toggle('dark', storedTheme !== 'wright-day'); } catch {} })();`
          }}
        />
        <style
          dangerouslySetInnerHTML={{
            __html: `
              :root {
                --wdw-bg: #eef2e8;
                --wdw-bg-alt: #f8faf5;
                --wdw-card: rgba(255,255,255,0.96);
                --wdw-card-soft: #f1f4ec;
                --wdw-asphalt: #111111;
                --wdw-line: #d5ddd4;
                --wdw-text: #243233;
                --wdw-text-muted: #5c6c6d;
                --wdw-text-strong: #111d1d;
                --wdw-accent: #5b9aa0;
                --wdw-accent-strong: #447f85;
                --wdw-shadow: rgba(0,0,0,0.08);
                --wdw-shadow-strong: rgba(0,0,0,0.14);
                --wdw-footer-bg: #111111;
                --wdw-footer-card: #1a1a1a;
                --wdw-footer-line: rgba(255,255,255,0.12);
                --wdw-footer-text: #ffffff;
                --wdw-footer-muted: rgba(255,255,255,0.72);
                --wdw-field-bg: #ffffff;
                --wdw-field-text: #243233;
              }
              :root[data-wd-wright-theme="wright-night"] {
                --wdw-bg: #081012;
                --wdw-bg-alt: #111d21;
                --wdw-card: rgba(16,26,29,0.94);
                --wdw-card-soft: rgba(26,38,41,0.96);
                --wdw-asphalt: #071013;
                --wdw-line: rgba(255,255,255,0.1);
                --wdw-text: #dce6e1;
                --wdw-text-muted: #97aba6;
                --wdw-text-strong: #f3f5f1;
                --wdw-accent: #5b9aa0;
                --wdw-accent-strong: #8ec1c5;
                --wdw-shadow: rgba(0,0,0,0.26);
                --wdw-shadow-strong: rgba(0,0,0,0.42);
                --wdw-footer-bg: #071013;
                --wdw-footer-card: #10191b;
                --wdw-footer-line: rgba(255,255,255,0.1);
                --wdw-footer-text: #f3f5f1;
                --wdw-footer-muted: #97aba6;
                --wdw-field-bg: rgba(255,255,255,0.04);
                --wdw-field-text: #edf4ef;
              }
              :root[data-wd-wright-theme="wright-safety"] {
                --wdw-bg: #1c200f;
                --wdw-bg-alt: #2a3018;
                --wdw-card: rgba(28,32,15,0.95);
                --wdw-card-soft: rgba(40,44,20,0.97);
                --wdw-asphalt: #101407;
                --wdw-line: rgba(240,174,47,0.16);
                --wdw-text: #efe7c8;
                --wdw-text-muted: #c8bf98;
                --wdw-text-strong: #fcf8ea;
                --wdw-accent: #5b9aa0;
                --wdw-accent-strong: #8ec1c5;
                --wdw-shadow: rgba(0,0,0,0.24);
                --wdw-shadow-strong: rgba(0,0,0,0.38);
                --wdw-footer-bg: #151606;
                --wdw-footer-card: #1e210d;
                --wdw-footer-line: rgba(240,174,47,0.18);
                --wdw-footer-text: #fcf8ea;
                --wdw-footer-muted: #c8bf98;
                --wdw-field-bg: rgba(252,248,234,0.06);
                --wdw-field-text: #fcf8ea;
              }
              html, body {
                background: var(--wdw-bg);
                color: var(--wdw-text);
                margin: 0;
                padding: 0;
                min-height: 100%;
                scroll-behavior: smooth;
                font-family: 'Poppins', sans-serif;
                -webkit-font-smoothing: antialiased;
                text-rendering: optimizeLegibility;
              }
              * {
                box-sizing: border-box;
              }
              body {
                position: relative;
                overflow-x: hidden;
                min-height: calc(var(--wdw-device-vh, 1vh) * 100);
              }
              body::before {
                content: "";
                position: fixed;
                inset: 0;
                pointer-events: none;
                background:
                  radial-gradient(circle at 14% 10%, rgba(91,154,160,0.10), transparent 22%),
                  radial-gradient(circle at 86% 8%, rgba(68,127,133,0.10), transparent 18%),
                  linear-gradient(180deg, rgba(255,255,255,0.03), transparent 32%);
                z-index: 0;
              }
              body > * {
                position: relative;
                z-index: 1;
              }
              a, button, input, select, textarea {
                transition: background-color 160ms ease, border-color 160ms ease, color 160ms ease, box-shadow 160ms ease, transform 160ms ease, opacity 160ms ease;
              }
              img {
                max-width: 100%;
              }
              ::selection {
                background: rgba(91,154,160,0.28);
                color: var(--wdw-text-strong);
              }
              :focus-visible {
                outline: 3px solid rgba(91,154,160,0.55);
                outline-offset: 2px;
              }
              .wdw-skip-link {
                position: fixed;
                left: 16px;
                top: 14px;
                z-index: 999;
                transform: translateY(-160%);
                padding: 10px 14px;
                border-radius: 999px;
                background: var(--wdw-accent);
                color: #fff;
                text-decoration: none;
                font-size: 12px;
                font-weight: 800;
                letter-spacing: 0.08em;
                text-transform: uppercase;
                box-shadow: 0 12px 28px rgba(0,0,0,0.18);
              }
              .wdw-skip-link:focus {
                transform: translateY(0);
              }
              .wdw-shell-main {
                scroll-margin-top: 96px;
              }
              html[data-wdw-mobile="true"] body {
                overscroll-behavior-y: none;
                -webkit-text-size-adjust: 100%;
              }
              html[data-wdw-mobile="true"] .wdw-shell-main {
                scroll-margin-top: 78px;
              }
              html[data-wdw-mobile="true"] .wdw-public-shell-width,
              html[data-wdw-mobile="true"] .wdw-auth-shell-width {
                width: min(100%, calc(100% - 20px)) !important;
                padding-left: 0 !important;
                padding-right: 0 !important;
              }
              html[data-wdw-mobile="true"] .wdw-public-hero-grid,
              html[data-wdw-mobile="true"] .wdw-public-split,
              html[data-wdw-mobile="true"] .wdw-public-comparison-row,
              html[data-wdw-mobile="true"] .wdw-public-roadmap-row,
              html[data-wdw-mobile="true"] .wdw-auth-shell-grid {
                grid-template-columns: minmax(0, 1fr) !important;
              }
              html[data-wdw-mobile="true"] .wdw-auth-sidebar {
                position: static !important;
                top: auto !important;
              }
              html[data-wdw-android="true"] body {
                padding-bottom: env(safe-area-inset-bottom, 0px);
              }
              html[data-wdw-android="true"] .wdw-public-shell-width,
              html[data-wdw-android="true"] .wdw-auth-shell-width {
                padding-bottom: max(18px, env(safe-area-inset-bottom, 0px)) !important;
              }
              @media (prefers-reduced-motion: reduce) {
                html, body {
                  scroll-behavior: auto;
                }
                a, button, input, select, textarea {
                  transition: none;
                }
              }
            `
          }}
        />
      </head>
      <body>
        <WDWrightMobileOptimizer />
        <a href="#wdw-main" className="wdw-skip-link">Skip to content</a>
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-TWW3MG8S"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        {children}
      </body>
    </html>
  );
}
