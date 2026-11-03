"use client";

import React from "react";

export function StatusPill({ label, tone = "default", palette, style = {} }) {
  const tones = {
    default: {
      background: palette?.panelSoft || "rgba(255,255,255,0.08)",
      border: palette?.line || "rgba(255,255,255,0.12)",
      color: palette?.muted || "#5c6c6d",
    },
    accent: {
      background: palette?.accentSoft || "var(--wdw-accent-soft, rgba(47,116,115,0.14))",
      border: palette?.accent || "var(--wdw-accent, #2f7473)",
      color: palette?.strong || palette?.accent || "#315e63",
    },
    contrast: {
      background: palette?.dark || "#111d1d",
      border: palette?.dark || "#111d1d",
      color: palette?.accentText || "#ffffff",
    },
  };
  const colors = tones[tone] || tones.default;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "7px 11px",
        borderRadius: 999,
        border: `1px solid ${colors.border}`,
        background: colors.background,
        color: colors.color,
        fontSize: 11.5,
        fontWeight: 800,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        ...style,
      }}
    >
      {label}
    </span>
  );
}

export function SegmentedThemeToggle({ options = [], value, onChange, palette, compact = false }) {
  return (
    <div
      style={{
        display: "inline-flex",
        gap: 6,
        padding: 6,
        borderRadius: 999,
        border: `1px solid ${palette.line}`,
        background: palette.panelSoft || palette.panel || "rgba(255,255,255,0.08)",
        boxShadow: compact ? "none" : "0 12px 24px rgba(0,0,0,0.08)",
      }}
    >
      {options.map((option) => {
        const key = option.key || option[0];
        const label = option.label || option[1];
        const active = key === value;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange?.(key)}
            style={{
              minHeight: compact ? 34 : 38,
              minWidth: compact ? 70 : 88,
              borderRadius: 999,
              border: "none",
              cursor: "pointer",
              padding: "0 14px",
              background: active ? palette.dark : "transparent",
              color: active ? (palette.accentText || "#fff") : palette.text,
              fontSize: compact ? 11.5 : 12.5,
              fontWeight: 800,
              fontFamily: "inherit",
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

export function AmbientSection({ children, palette, style = {} }) {
  return (
    <section
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: 28,
        border: `1px solid ${palette.line}`,
        background: palette.panel,
        boxShadow: "0 24px 60px rgba(12,20,18,0.12)",
        ...style,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(circle at 12% 14%, var(--wdw-accent-soft), transparent 22%), radial-gradient(circle at 88% 8%, var(--wdw-accent-soft), transparent 18%)",
        }}
      />
      <div style={{ position: "relative" }}>{children}</div>
    </section>
  );
}

export function QuickActionRail({ items = [], palette }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
      {items.map((item) => (
        <button
          key={item.label}
          type="button"
          onClick={item.onClick}
          style={{
            borderRadius: 18,
            border: `1px solid ${palette.line}`,
            background: palette.panelSoft || palette.panel,
            padding: 16,
            textAlign: "left",
            cursor: "pointer",
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: palette.strong || palette.accent, marginBottom: 8 }}>
            {item.kicker || "Action"}
          </div>
          <div style={{ fontSize: 14, fontWeight: 800, color: palette.dark, marginBottom: 6 }}>{item.label}</div>
          <div style={{ fontSize: 13, lineHeight: 1.65, color: palette.muted }}>{item.body}</div>
        </button>
      ))}
    </div>
  );
}

export function BreadcrumbTrail({ items = [], palette, onNavigate }) {
  if (!items.length) return null;
  return (
    <nav aria-label="Breadcrumb" style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <React.Fragment key={item.label}>
            <button
              type="button"
              onClick={() => !isLast && onNavigate?.(item.href)}
              disabled={isLast}
              style={{
                border: "none",
                background: "transparent",
                padding: 0,
                cursor: isLast ? "default" : "pointer",
                color: isLast ? palette.dark : palette.muted,
                fontSize: 12,
                fontWeight: isLast ? 800 : 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              {item.label}
            </button>
            {!isLast ? <span style={{ color: palette.muted, fontSize: 12 }}>/</span> : null}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

export function Stepper({ steps = [], activeStep = 0, palette }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.max(steps.length, 1)}, minmax(0, 1fr))`, gap: 10 }}>
      {steps.map((step, index) => {
        const status = index < activeStep ? "complete" : index === activeStep ? "active" : "pending";
        return (
          <div key={step.key || step.label} style={{ display: "grid", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 999,
                  display: "grid",
                  placeItems: "center",
                  border: `1px solid ${status === "pending" ? palette.line : palette.accent}`,
                  background: status === "complete" ? palette.accent : status === "active" ? palette.accentSoft || palette.panelSoft : palette.panelSoft || "transparent",
                  color: status === "pending" ? palette.muted : palette.dark,
                  fontSize: 12,
                  fontWeight: 800,
                }}
              >
                {status === "complete" ? "✓" : index + 1}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: status === "pending" ? palette.muted : palette.dark }}>{step.label}</div>
                {step.detail ? <div style={{ fontSize: 11.5, color: palette.muted, marginTop: 2 }}>{step.detail}</div> : null}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function InlineFieldMessage({ message, tone = "error" }) {
  if (!message) return null;
  const color = tone === "success" ? "#1d5a44" : tone === "warn" ? "#8a5a0f" : "#a33727";
  return <div style={{ fontSize: 12, lineHeight: 1.5, color, marginTop: 4 }}>{message}</div>;
}

export function LoadingSkeleton({ rows = 3, palette }) {
  return (
    <div style={{ display: "grid", gap: 10 }}>
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} style={{ height: index === 0 ? 22 : 16, borderRadius: 10, background: palette.panelSoft || "rgba(0,0,0,0.06)", opacity: 0.8 }} />
      ))}
    </div>
  );
}

export function EmptyPanel({ title, body, actionLabel, onAction, palette }) {
  return (
    <div style={{ borderRadius: 20, border: `1px dashed ${palette.line}`, background: palette.panelSoft || palette.panel, padding: 18 }}>
      <div style={{ fontSize: 14, fontWeight: 800, color: palette.dark }}>{title}</div>
      <div style={{ marginTop: 8, fontSize: 13, lineHeight: 1.65, color: palette.muted }}>{body}</div>
      {actionLabel ? (
        <button
          type="button"
          onClick={onAction}
          style={{ marginTop: 14, borderRadius: 999, border: `1px solid ${palette.line}`, background: "transparent", color: palette.dark, minHeight: 40, padding: "0 14px", cursor: "pointer", fontWeight: 800 }}
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

export function ResponsiveDataList({ columns = [], rows = [], palette, emptyTitle = "No records", emptyBody = "Nothing is available yet." }) {
  if (!rows.length) {
    return <EmptyPanel title={emptyTitle} body={emptyBody} palette={palette} />;
  }
  return (
    <div style={{ display: "grid", gap: 10 }}>
      {rows.map((row) => (
        <div key={row.id || JSON.stringify(row)} style={{ borderRadius: 18, border: `1px solid ${palette.line}`, background: palette.panelSoft || palette.panel, padding: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10 }}>
            {columns.map((column) => (
              <div key={column.key}>
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: palette.strong || palette.accent }}>{column.label}</div>
                <div style={{ marginTop: 6, fontSize: 13, lineHeight: 1.6, color: palette.dark }}>{row[column.key] || "Not available"}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function HelpDrawer({ open, title = "Help", body = "", items = [], onClose, palette }) {
  if (!open) return null;
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(7,12,12,0.42)", zIndex: 350 }} />
      <aside
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          width: "min(420px, 100vw)",
          height: "100vh",
          zIndex: 351,
          background: palette.panel || "#fff",
          borderLeft: `1px solid ${palette.line}`,
          boxShadow: "-24px 0 60px rgba(7,12,12,0.22)",
          padding: 22,
          overflowY: "auto",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "start" }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: palette.strong || palette.accent }}>
              Contextual Help
            </div>
            <div style={{ marginTop: 8, fontSize: 24, fontWeight: 800, color: palette.dark }}>{title}</div>
          </div>
          <button type="button" onClick={onClose} style={{ border: `1px solid ${palette.line}`, background: "transparent", borderRadius: 999, minHeight: 38, padding: "0 12px", cursor: "pointer", color: palette.dark, fontWeight: 800 }}>
            Close
          </button>
        </div>
        {body ? <div style={{ marginTop: 12, fontSize: 13.5, lineHeight: 1.7, color: palette.muted }}>{body}</div> : null}
        <div style={{ display: "grid", gap: 10, marginTop: 18 }}>
          {items.map((item) => (
            <div key={item.title} style={{ borderRadius: 18, border: `1px solid ${palette.line}`, background: palette.panelSoft || palette.panel, padding: 16 }}>
              <div style={{ fontSize: 13.5, fontWeight: 800, color: palette.dark }}>{item.title}</div>
              <div style={{ marginTop: 6, fontSize: 12.5, lineHeight: 1.65, color: palette.muted }}>{item.body}</div>
            </div>
          ))}
        </div>
      </aside>
    </>
  );
}

export function FilePreviewModal({ open, file, onClose, palette }) {
  if (!open || !file) return null;
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(7,12,12,0.48)", zIndex: 360 }} />
      <div
        style={{
          position: "fixed",
          left: "50%",
          top: "12vh",
          transform: "translateX(-50%)",
          width: "min(760px, calc(100vw - 28px))",
          zIndex: 361,
          background: palette.panel || "#fff",
          border: `1px solid ${palette.line}`,
          borderRadius: 24,
          boxShadow: "0 32px 90px rgba(7,12,12,0.3)",
          overflow: "hidden",
        }}
      >
        <div style={{ padding: 18, borderBottom: `1px solid ${palette.line}`, display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: palette.strong || palette.accent }}>
              File Preview
            </div>
            <div style={{ marginTop: 6, fontSize: 20, fontWeight: 800, color: palette.dark }}>{file.name}</div>
          </div>
          <button type="button" onClick={onClose} style={{ border: `1px solid ${palette.line}`, background: "transparent", borderRadius: 999, minHeight: 38, padding: "0 12px", cursor: "pointer", color: palette.dark, fontWeight: 800 }}>
            Close
          </button>
        </div>
        <div style={{ padding: 20, display: "grid", gap: 14 }}>
          <div style={{ borderRadius: 20, border: `1px dashed ${palette.line}`, background: palette.panelSoft || palette.panel, padding: 22 }}>
            <div style={{ fontSize: 13, lineHeight: 1.7, color: palette.muted }}>
              {file.summary || "This preview surfaces document metadata, timing, and next-step context before the full release workflow is connected."}
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10 }}>
            {[
              ["Type", file.type || "Document"],
              ["Status", file.status || "Pending"],
              ["Access", file.access || "Protected"],
              ["Next step", file.nextStep || "Review metadata"],
            ].map(([label, value]) => (
              <div key={label} style={{ borderRadius: 16, border: `1px solid ${palette.line}`, background: palette.panelSoft || palette.panel, padding: 14 }}>
                <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: palette.strong || palette.accent }}>{label}</div>
                <div style={{ marginTop: 6, fontSize: 13, lineHeight: 1.6, color: palette.dark }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
