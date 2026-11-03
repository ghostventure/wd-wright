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
        <script
          dangerouslySetInnerHTML={{
            __html: `(() => { try { const key = 'wd-wright-theme'; const storedTheme = localStorage.getItem(key) || 'wright-day'; document.documentElement.dataset.wdWrightTheme = storedTheme; document.documentElement.classList.toggle('dark', storedTheme !== 'wright-day'); } catch {} })();`
          }}
        />
        <style
          dangerouslySetInnerHTML={{
            __html: `
              :root {
                --wdw-bg: #f1f4ed;
                --wdw-bg-alt: #e8eee7;
                --wdw-card: rgba(255,255,255,0.96);
                --wdw-card-soft: #f6f8f4;
                --wdw-asphalt: #183236;
                --wdw-line: #d7e1db;
                --wdw-text: #334745;
                --wdw-text-muted: #617571;
                --wdw-text-strong: #1c3331;
                --wdw-accent: #2f7473;
                --wdw-accent-strong: #255d5d;
                --wdw-accent-soft: rgba(47,116,115,0.14);
                --wdw-accent-rgb: 47,116,115;
                --wdw-shadow: rgba(0,0,0,0.08);
                --wdw-shadow-strong: rgba(0,0,0,0.14);
                --wdw-footer-bg: #183236;
                --wdw-footer-card: #203d3f;
                --wdw-footer-line: rgba(220,235,226,0.16);
                --wdw-footer-text: #ffffff;
                --wdw-footer-muted: #c3d2cb;
                --wdw-field-bg: #ffffff;
                --wdw-field-text: #263a38;
                --wdw-radius-card: 20px;
                --wdw-radius-feature: 28px;
                --wdw-radius-control: 14px;
                --wdw-content-width: 1180px;
                --wdw-sans-font: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                --wdw-display-font: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              }
              :root[data-wd-wright-theme="wright-night"] {
                --wdw-bg: #0d191b;
                --wdw-bg-alt: #132326;
                --wdw-card: rgba(21,36,38,0.96);
                --wdw-card-soft: rgba(29,47,48,0.96);
                --wdw-asphalt: #091416;
                --wdw-line: rgba(220,235,226,0.13);
                --wdw-text: #dce8e3;
                --wdw-text-muted: #9aada5;
                --wdw-text-strong: #f4f6f2;
                --wdw-accent: #3e7574;
                --wdw-accent-strong: #326363;
                --wdw-accent-soft: rgba(62,117,116,0.2);
                --wdw-accent-rgb: 62,117,116;
                --wdw-shadow: rgba(0,0,0,0.26);
                --wdw-shadow-strong: rgba(0,0,0,0.42);
                --wdw-footer-bg: #091416;
                --wdw-footer-card: #132326;
                --wdw-footer-line: rgba(220,235,226,0.12);
                --wdw-footer-text: #f3f5f1;
                --wdw-footer-muted: #9aada5;
                --wdw-field-bg: rgba(255,255,255,0.04);
                --wdw-field-text: #edf4ef;
              }
              :root[data-wd-wright-theme="wright-safety"] {
                --wdw-bg: #171b10;
                --wdw-bg-alt: #242a18;
                --wdw-card: rgba(34,38,22,0.96);
                --wdw-card-soft: rgba(45,50,28,0.97);
                --wdw-asphalt: #11150a;
                --wdw-line: rgba(224,187,98,0.2);
                --wdw-text: #eee9d6;
                --wdw-text-muted: #c5bd9d;
                --wdw-text-strong: #fcf8ea;
                --wdw-accent: #66702b;
                --wdw-accent-strong: #4e5b20;
                --wdw-accent-soft: rgba(102,112,43,0.2);
                --wdw-accent-rgb: 102,112,43;
                --wdw-shadow: rgba(0,0,0,0.24);
                --wdw-shadow-strong: rgba(0,0,0,0.38);
                --wdw-footer-bg: #171b10;
                --wdw-footer-card: #242a18;
                --wdw-footer-line: rgba(224,187,98,0.2);
                --wdw-footer-text: #fcf8ea;
                --wdw-footer-muted: #c5bd9d;
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
                font-family: var(--wdw-sans-font);
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
                  radial-gradient(circle at 14% 10%, var(--wdw-accent-soft), transparent 22%),
                  radial-gradient(circle at 86% 8%, var(--wdw-accent-soft), transparent 18%),
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
              button, input, select, textarea {
                font-family: inherit;
              }
              img {
                max-width: 100%;
              }
              ::selection {
                background: rgba(var(--wdw-accent-rgb),0.28);
                color: var(--wdw-text-strong);
              }
              :focus-visible {
                outline: 3px solid rgba(var(--wdw-accent-rgb),0.72);
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
        <div id="wdw-main" tabIndex={-1}>{children}</div>
      </body>
    </html>
  );
}
