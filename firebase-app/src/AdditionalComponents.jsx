import { useMemo, useState } from "react";
import { SimpleImageBand } from "./EstateHatImagery.jsx";

const S = {
  bg: "var(--s-bg)",
  card: "var(--s-card)",
  surface: "var(--s-surface)",
  surfaceAlt: "var(--s-surface-alt)",
  dark: "var(--s-dark)",
  mid: "var(--s-mid)",
  muted: "var(--s-muted)",
  light: "var(--s-light)",
  border: "var(--s-border)",
  borderStrong: "var(--s-border-strong)",
  gold: "var(--s-gold)",
  goldDeep: "var(--s-gold-deep)",
  green: "var(--s-green)",
  red: "var(--s-red)",
  greenBg: "var(--s-greenBg)",
  redBg: "var(--s-redBg)",
  goldBg: "var(--s-goldBg)",
  blue: "var(--s-blue)",
  blueBg: "var(--s-blueBg)",
  overlay: "var(--s-overlay)",
  shadowSoft: "var(--s-shadow-soft)",
  shadowStrong: "var(--s-shadow-strong)",
  font: "'Plus Jakarta Sans', sans-serif",
  serif: "'DM Serif Display', serif",
};

const fmt = (value = 0) => "$" + Math.round(Number(value) || 0).toLocaleString();

const groups = [
  {
    key: "foundation",
    label: "Foundation",
    intro: "Shared structure, navigation, work surfaces, search, and filtering.",
    items: [
      "App Shell Layout",
      "Responsive Sidebar",
      "Mobile Bottom Navigation",
      "Page Header Component",
      "Breadcrumb Trail",
      "Drawer / Sheet Panels",
      "Data Table Shell",
      "Bulk Action Bar",
      "Saved Search Manager",
      "Active Filter Chips",
    ],
  },
  {
    key: "property",
    label: "Property",
    intro: "Listing media, map context, value signals, neighborhood facts, and saved organization.",
    items: [
      "Property Media Carousel",
      "Property Photo Lightbox",
      "Property Price History",
      "Property Value Estimate Card",
      "Neighborhood Snapshot",
      "Map View Toggle",
      "Map Pin Cluster",
      "Saved Listing Folders",
    ],
  },
  {
    key: "transaction",
    label: "Transaction",
    intro: "Offer-to-close work management for buyers, sellers, agents, and support roles.",
    items: [
      "Contingency Checklist",
      "Earnest Money Tracker",
      "Closing Cost Estimator",
      "Net Proceeds Calculator",
      "Task Board",
      "Task Detail Panel",
      "Role Responsibility Matrix",
      "Collaborator Invite Modal",
      "Permission Matrix Editor",
    ],
  },
  {
    key: "docs",
    label: "Docs And Legal",
    intro: "Document previews, history, signing, disclosure assembly, and rule visibility.",
    items: [
      "Document Preview Pane",
      "Document Version History",
      "Document Checklist",
      "Drag-Drop Upload Queue",
      "E-Signature Status Card",
      "Signature Request Modal",
      "Disclosure Packet Builder",
      "Jurisdiction Rule Explorer",
    ],
  },
  {
    key: "trust",
    label: "Trust And Money",
    intro: "Identity, security, billing, payout, receipts, credits, and trust signals.",
    items: [
      "Identity Verification Status",
      "Trust Score Breakdown",
      "Security Center",
      "MFA Setup Wizard",
      "Billing Method Manager",
      "Payout Account Manager",
      "Invoice List",
      "Receipt Detail Drawer",
      "Refund / Credit Tracker",
    ],
  },
  {
    key: "support",
    label: "Messaging And Support",
    intro: "Conversation improvements, live presence, templates, help, feedback, and alert controls.",
    items: [
      "Conversation List Upgrade",
      "Participant Presence",
      "Template Reply Picker",
      "Help Article Viewer",
      "Feedback / Bug Report Modal",
      "Notification Preferences",
    ],
  },
];

const allItems = groups.flatMap((group) => group.items.map((name) => ({ name, group: group.key, label: group.label })));

function Button({ children, tone = "default", style, ...props }) {
  const palette = tone === "primary"
    ? { background: S.gold, color: S.dark, borderColor: "transparent" }
    : tone === "danger"
      ? { background: S.redBg, color: S.red, borderColor: S.redBg }
      : { background: S.card, color: S.muted, borderColor: S.border };
  return (
    <button type="button" style={{ ...palette, border: `1px solid ${palette.borderColor}`, borderRadius: 8, padding: "9px 12px", fontFamily: S.font, fontSize: 12, fontWeight: 800, cursor: "pointer", ...style }} {...props}>
      {children}
    </button>
  );
}

function Card({ title, kicker, children, actions, className = "" }) {
  return (
    <section className={`estatehat-no-overlap ${className}`.trim()} style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 10, padding: 16, boxShadow: `0 12px 30px ${S.shadowSoft}`, minWidth: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", marginBottom: 12 }}>
        <div>
          {kicker && <div style={{ fontFamily: S.font, fontSize: 10, fontWeight: 900, color: S.goldDeep, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 5 }}>{kicker}</div>}
          <h3 style={{ fontFamily: S.font, fontSize: 15, color: S.dark, margin: 0, lineHeight: 1.25 }}>{title}</h3>
        </div>
        {actions && <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>{actions}</div>}
      </div>
      {children}
    </section>
  );
}

function Pill({ children, tone = "default", onClick, active }) {
  const map = {
    default: { background: active ? S.dark : S.surface, color: active ? S.card : S.muted },
    good: { background: S.greenBg, color: S.green },
    warn: { background: S.redBg, color: S.red },
    accent: { background: S.goldBg, color: S.goldDeep },
    blue: { background: S.blueBg, color: S.blue },
  };
  return (
    <button type="button" onClick={onClick} disabled={!onClick} style={{ ...(map[tone] || map.default), border: "none", borderRadius: 999, padding: "4px 9px", fontFamily: S.font, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase", cursor: onClick ? "pointer" : "default", whiteSpace: "nowrap" }}>
      {children}
    </button>
  );
}

function Bar({ label, value, tone = S.gold }) {
  return (
    <div style={{ display: "grid", gap: 5 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, fontFamily: S.font, fontSize: 11, color: S.light, fontWeight: 800 }}>
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div style={{ height: 8, borderRadius: 999, background: S.surface, overflow: "hidden" }}>
        <div style={{ width: `${Math.max(0, Math.min(100, value))}%`, height: "100%", borderRadius: 999, background: tone }} />
      </div>
    </div>
  );
}

function MiniRows({ rows }) {
  return (
    <div style={{ display: "grid", gap: 8 }}>
      {rows.map((row) => (
        <div key={row[0]} style={{ display: "flex", justifyContent: "space-between", gap: 12, borderTop: `1px solid ${S.surface}`, paddingTop: 8, fontFamily: S.font, fontSize: 12 }}>
          <span style={{ color: S.light }}>{row[0]}</span>
          <strong style={{ color: S.dark, textAlign: "right" }}>{row[1]}</strong>
        </div>
      ))}
    </div>
  );
}

function Modal({ title, children, onClose }) {
  if (!onClose) return null;
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: S.overlay, zIndex: 230 }} />
      <div role="dialog" aria-modal="true" style={{ position: "fixed", inset: "auto 18px 18px auto", width: "min(440px, calc(100vw - 36px))", maxHeight: "calc(100vh - 36px)", overflow: "auto", background: S.card, border: `1px solid ${S.border}`, borderRadius: 10, boxShadow: `0 28px 90px ${S.shadowStrong}`, zIndex: 231, padding: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 12 }}>
          <h3 style={{ fontFamily: S.serif, fontSize: 26, color: S.dark, margin: 0 }}>{title}</h3>
          <Button onClick={onClose}>Close</Button>
        </div>
        {children}
      </div>
    </>
  );
}

function Calculator({ mode }) {
  const [price, setPrice] = useState(mode === "seller" ? 625000 : 520000);
  const [rate, setRate] = useState(mode === "seller" ? 2.8 : 3.1);
  const [extra, setExtra] = useState(mode === "seller" ? 8700 : 5200);
  const amount = mode === "seller" ? price - price * (rate / 100) - extra : price * (rate / 100) + extra;
  return (
    <div style={{ display: "grid", gap: 10 }}>
      <label style={{ fontFamily: S.font, fontSize: 11, color: S.light, fontWeight: 800 }}>Price</label>
      <input value={price} onChange={(event) => setPrice(event.target.value)} type="number" style={inputStyle} />
      <label style={{ fontFamily: S.font, fontSize: 11, color: S.light, fontWeight: 800 }}>{mode === "seller" ? "Commission / transfer percent" : "Cost percent"}</label>
      <input value={rate} onChange={(event) => setRate(event.target.value)} type="number" step="0.1" style={inputStyle} />
      <label style={{ fontFamily: S.font, fontSize: 11, color: S.light, fontWeight: 800 }}>Other costs</label>
      <input value={extra} onChange={(event) => setExtra(event.target.value)} type="number" style={inputStyle} />
      <div style={{ background: S.goldBg, color: S.goldDeep, borderRadius: 8, padding: 12, fontFamily: S.font, fontSize: 13, fontWeight: 900 }}>
        {mode === "seller" ? "Estimated net proceeds" : "Estimated closing cash"}: {fmt(amount)}
      </div>
    </div>
  );
}

const inputStyle = { width: "100%", boxSizing: "border-box", border: `1px solid ${S.border}`, background: "var(--s-input-bg)", color: S.dark, borderRadius: 8, padding: "9px 10px", fontFamily: S.font, fontSize: 13 };

function FoundationDemo({ item }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [filters, setFilters] = useState(["Verified", "Under 30 days", "Inspection ready"]);
  const [selected, setSelected] = useState(["EH-2041"]);
  const saved = ["Starter home under 550k", "Seller-ready townhomes", "Walkable with garage"];
  const tableRows = [
    ["EH-2041", "Buyer packet", "Ready"],
    ["EH-2042", "Inspection", "Review"],
    ["EH-2043", "Seller form", "Needs owner"],
  ];

  if (item === "App Shell Layout") return <ShellPreview />;
  if (item === "Responsive Sidebar") return <SidebarPreview />;
  if (item === "Mobile Bottom Navigation") return <MobileNavPreview />;
  if (item === "Page Header Component") return <HeaderPreview />;
  if (item === "Breadcrumb Trail") return <BreadcrumbPreview />;
  if (item === "Drawer / Sheet Panels") return (
    <Card title={item} kicker="Foundation" actions={<Button tone="primary" onClick={() => setDrawerOpen(true)}>Open Sheet</Button>}>
      <p style={bodyText}>Slide-in sheets are ready for quick edits, previews, and mobile-friendly workflows.</p>
      <Modal title="Transaction Sheet" onClose={drawerOpen ? () => setDrawerOpen(false) : null}>
        <MiniRows rows={[["Panel", "Right drawer"], ["Status", "Interactive"], ["Use", "Forms, docs, receipts"]]} />
      </Modal>
    </Card>
  );
  if (item === "Data Table Shell") return (
    <Card title={item} kicker="Foundation">
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: S.font, fontSize: 12 }}>
          <tbody>
            {tableRows.map((row) => (
              <tr key={row[0]}>
                <td style={cellStyle}><input type="checkbox" checked={selected.includes(row[0])} onChange={() => setSelected((current) => current.includes(row[0]) ? current.filter((id) => id !== row[0]) : [...current, row[0]])} /></td>
                {row.map((col) => <td key={col} style={cellStyle}>{col}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
  if (item === "Bulk Action Bar") return (
    <Card title={item} kicker="Foundation">
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", background: S.surface, borderRadius: 8, padding: 10 }}>
        <strong style={{ fontFamily: S.font, color: S.dark, fontSize: 12 }}>{selected.length} selected</strong>
        <Button>Assign</Button>
        <Button>Export</Button>
        <Button tone="danger">Flag</Button>
      </div>
    </Card>
  );
  if (item === "Saved Search Manager") return (
    <Card title={item} kicker="Foundation">
      <div style={{ display: "grid", gap: 8 }}>
        {saved.map((name) => <button key={name} type="button" style={listButton}>{name}<span>Apply</span></button>)}
      </div>
    </Card>
  );
  return (
    <Card title={item} kicker="Foundation">
      <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
        {filters.map((filter) => <Pill key={filter} tone="accent" onClick={() => setFilters((current) => current.filter((entry) => entry !== filter))}>{filter} x</Pill>)}
        <Button onClick={() => setFilters(["Verified", "Under 30 days", "Inspection ready"])}>Reset</Button>
      </div>
    </Card>
  );
}

function ShellPreview() {
  return (
    <Card title="App Shell Layout" kicker="Foundation">
      <div style={{ border: `1px solid ${S.border}`, borderRadius: 8, overflow: "hidden" }}>
        <div style={{ height: 28, background: S.dark, display: "flex", alignItems: "center", padding: "0 10px", gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: 99, background: S.gold }} />
          <span style={{ color: S.card, fontFamily: S.font, fontSize: 11, fontWeight: 800 }}>EstateHat</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "86px 1fr", minHeight: 96 }}>
          <div style={{ background: S.surface, padding: 8, display: "grid", gap: 6, alignContent: "start" }}>{["Board", "Deals", "Docs"].map((x) => <span key={x} style={railItem}>{x}</span>)}</div>
          <div style={{ padding: 10, display: "grid", gap: 8 }}>
            <div style={{ height: 14, background: S.goldBg, borderRadius: 5 }} />
            <div style={{ height: 44, background: S.surfaceAlt, borderRadius: 8 }} />
          </div>
        </div>
      </div>
    </Card>
  );
}

function SidebarPreview() {
  const [open, setOpen] = useState(true);
  return (
    <Card title="Responsive Sidebar" kicker="Foundation" actions={<Button onClick={() => setOpen((value) => !value)}>{open ? "Collapse" : "Expand"}</Button>}>
      <div style={{ display: "grid", gridTemplateColumns: open ? "126px 1fr" : "42px 1fr", gap: 10, transition: "grid-template-columns 0.18s ease" }}>
        <div style={{ background: S.dark, borderRadius: 8, padding: 8, display: "grid", gap: 6, alignContent: "start" }}>{["B", "S", "D", "A"].map((x, index) => <span key={x} style={{ color: S.card, fontFamily: S.font, fontSize: 11, fontWeight: 800 }}>{open ? ["Board", "Search", "Docs", "Admin"][index] : x}</span>)}</div>
        <div style={{ background: S.surface, borderRadius: 8, padding: 12, fontFamily: S.font, color: S.light, fontSize: 12 }}>Main workspace remains stable while the rail adapts.</div>
      </div>
    </Card>
  );
}

function MobileNavPreview() {
  const [active, setActive] = useState("Board");
  return (
    <Card title="Mobile Bottom Navigation" kicker="Foundation">
      <div style={{ maxWidth: 280, border: `1px solid ${S.border}`, borderRadius: 8, overflow: "hidden", margin: "0 auto" }}>
        <div style={{ height: 96, background: S.surface, display: "grid", placeItems: "center", fontFamily: S.font, color: S.light, fontSize: 12 }}>{active}</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", background: S.card }}>
          {["Board", "Search", "Docs", "Me"].map((tab) => <button key={tab} onClick={() => setActive(tab)} style={{ border: "none", borderTop: `2px solid ${active === tab ? S.gold : "transparent"}`, background: "transparent", padding: "9px 0", fontFamily: S.font, fontSize: 11, fontWeight: 900, color: active === tab ? S.dark : S.light }}>{tab}</button>)}
        </div>
      </div>
    </Card>
  );
}

function HeaderPreview() {
  return (
    <Card title="Page Header Component" kicker="Foundation">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <div>
          <h2 style={{ fontFamily: S.serif, color: S.dark, margin: 0, fontSize: 28 }}>Offer Workspace</h2>
          <p style={{ margin: "4px 0 0", fontFamily: S.font, color: S.light, fontSize: 12 }}>Shared page header with actions and status.</p>
        </div>
        <Button tone="primary">New Action</Button>
      </div>
    </Card>
  );
}

function BreadcrumbPreview() {
  return (
    <Card title="Breadcrumb Trail" kicker="Foundation">
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", fontFamily: S.font, fontSize: 12, fontWeight: 800, color: S.light }}>
        {["Hat Board", "Active Deal", "Documents", "Seller Disclosure"].map((crumb, index) => <span key={crumb} style={{ color: index === 3 ? S.dark : S.light }}>{crumb}{index < 3 ? " /" : ""}</span>)}
      </div>
    </Card>
  );
}

function PropertyDemo({ item, listings = [] }) {
  const listing = listings[0] || { title: "Maple Street Home", price: 525000, address: "123 Maple Street", beds: 3, baths: 2, city: "Atlanta" };
  const [photo, setPhoto] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [mapMode, setMapMode] = useState("List");
  const [folders, setFolders] = useState(["Investor short list", "Family review"]);
  const photos = ["Front", "Kitchen", "Primary", "Street"];

  if (item === "Property Media Carousel") return (
    <Card title={item} kicker="Property">
      <div style={{ height: 126, borderRadius: 8, background: photo % 2 ? S.goldBg : S.surfaceAlt, display: "grid", placeItems: "center", fontFamily: S.serif, color: S.dark, fontSize: 26 }}>{photos[photo]}</div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}><Button onClick={() => setPhoto((photo + photos.length - 1) % photos.length)}>Prev</Button><Button onClick={() => setPhoto((photo + 1) % photos.length)}>Next</Button></div>
    </Card>
  );
  if (item === "Property Photo Lightbox") return (
    <Card title={item} kicker="Property" actions={<Button tone="primary" onClick={() => setLightbox(true)}>Open</Button>}>
      <p style={bodyText}>Full-screen media review is ready for listing photos and inspection visuals.</p>
      <Modal title="Photo Lightbox" onClose={lightbox ? () => setLightbox(false) : null}><div style={{ height: 220, borderRadius: 8, background: S.surfaceAlt, display: "grid", placeItems: "center", fontFamily: S.serif, fontSize: 30, color: S.dark }}>Listing Media</div></Modal>
    </Card>
  );
  if (item === "Property Price History") return <Card title={item} kicker="Property"><MiniRows rows={[["Listed", fmt(listing.price)], ["Price change", "-$12,500"], ["Projected close", fmt(Number(listing.price || 0) * 0.985)]]} /></Card>;
  if (item === "Property Value Estimate Card") return <Card title={item} kicker="Property"><Bar label="Estimate confidence" value={82} /><MiniRows rows={[["Low", fmt(listing.price * 0.94)], ["Likely", fmt(listing.price * 0.99)], ["High", fmt(listing.price * 1.04)]]} /></Card>;
  if (item === "Neighborhood Snapshot") return <Card title={item} kicker="Property"><MiniRows rows={[["Walk score", "74"], ["Median days", "21"], ["School distance", "1.6 mi"], ["Transit", "Moderate"]]} /></Card>;
  if (item === "Map View Toggle") return (
    <Card title={item} kicker="Property">
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>{["List", "Map", "Split"].map((mode) => <Pill key={mode} active={mapMode === mode} onClick={() => setMapMode(mode)}>{mode}</Pill>)}</div>
      <div style={{ height: 118, borderRadius: 8, background: mapMode === "Map" ? S.greenBg : S.surface, display: "grid", placeItems: "center", fontFamily: S.font, color: S.dark, fontWeight: 900 }}>{mapMode} view</div>
    </Card>
  );
  if (item === "Map Pin Cluster") return <Card title={item} kicker="Property"><div style={{ position: "relative", height: 148, borderRadius: 8, background: S.blueBg }}>{[[35, 28, 8], [62, 52, 21], [26, 70, 5]].map(([left, top, count]) => <span key={left} style={{ position: "absolute", left: `${left}%`, top: `${top}%`, transform: "translate(-50%,-50%)", background: S.gold, color: S.dark, borderRadius: 999, padding: "8px 10px", fontFamily: S.font, fontWeight: 900, fontSize: 12 }}>{count}</span>)}</div></Card>;
  return (
    <Card title={item} kicker="Property" actions={<Button onClick={() => setFolders((current) => [...current, `Folder ${current.length + 1}`])}>Add Folder</Button>}>
      <div style={{ display: "grid", gap: 8 }}>{folders.map((folder) => <button key={folder} type="button" style={listButton}>{folder}<span>{Math.ceil(folder.length / 4)} saved</span></button>)}</div>
    </Card>
  );
}

function TransactionDemo({ item }) {
  const [checked, setChecked] = useState(["Inspection"]);
  const [task, setTask] = useState("Review disclosure packet");
  const [inviteOpen, setInviteOpen] = useState(false);
  const contingencies = ["Inspection", "Financing", "Appraisal", "Title"];
  if (item === "Contingency Checklist") return (
    <Card title={item} kicker="Transaction">
      <div style={{ display: "grid", gap: 8 }}>{contingencies.map((name) => <label key={name} style={checkStyle}><input type="checkbox" checked={checked.includes(name)} onChange={() => setChecked((current) => current.includes(name) ? current.filter((entry) => entry !== name) : [...current, name])} />{name}</label>)}</div>
    </Card>
  );
  if (item === "Earnest Money Tracker") return <Card title={item} kicker="Transaction"><Bar label="Deposit progress" value={65} tone={S.green} /><MiniRows rows={[["Due", fmt(12000)], ["Received", fmt(7800)], ["Deadline", "Friday 5 PM"]]} /></Card>;
  if (item === "Closing Cost Estimator") return <Card title={item} kicker="Transaction"><Calculator mode="buyer" /></Card>;
  if (item === "Net Proceeds Calculator") return <Card title={item} kicker="Transaction"><Calculator mode="seller" /></Card>;
  if (item === "Task Board") return <Card title={item} kicker="Transaction"><div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>{["To Do", "Doing", "Done"].map((col) => <div key={col} style={{ background: S.surface, borderRadius: 8, padding: 9, minHeight: 78 }}><strong style={{ fontFamily: S.font, color: S.dark, fontSize: 11 }}>{col}</strong><div style={{ marginTop: 7, background: S.card, borderRadius: 8, padding: 7, fontFamily: S.font, fontSize: 11, color: S.light }}>{col === "Doing" ? "Verify funds" : col === "Done" ? "Open escrow" : task}</div></div>)}</div></Card>;
  if (item === "Task Detail Panel") return <Card title={item} kicker="Transaction"><input value={task} onChange={(event) => setTask(event.target.value)} style={inputStyle} /><MiniRows rows={[["Owner", "Buyer team"], ["Priority", "High"], ["SLA", "18 hours"]]} /></Card>;
  if (item === "Role Responsibility Matrix") return <Card title={item} kicker="Transaction"><MiniRows rows={[["Buyer", "Funds, review, sign"], ["Seller", "Disclosures, access"], ["Agent", "Negotiation, schedule"], ["Admin", "Compliance review"]]} /></Card>;
  if (item === "Collaborator Invite Modal") return (
    <Card title={item} kicker="Transaction" actions={<Button tone="primary" onClick={() => setInviteOpen(true)}>Invite</Button>}>
      <p style={bodyText}>Invite flows are ready for agent, inspector, lender, attorney, and support participants.</p>
      <Modal title="Invite Collaborator" onClose={inviteOpen ? () => setInviteOpen(false) : null}><input placeholder="name@example.com" style={inputStyle} /><div style={{ marginTop: 10 }}><Button tone="primary">Send invite</Button></div></Modal>
    </Card>
  );
  return <Card title={item} kicker="Transaction"><MiniRows rows={[["Buyer", "Read / Comment / Sign"], ["Seller", "Read / Upload / Sign"], ["Agent", "Read / Edit / Assign"], ["Admin", "Full oversight"]]} /></Card>;
}

function DocsDemo({ item }) {
  const [requestOpen, setRequestOpen] = useState(false);
  const [uploads, setUploads] = useState(["seller-disclosure.pdf", "title-commitment.pdf"]);
  if (item === "Document Preview Pane") return <Card title={item} kicker="Docs"><div style={{ display: "grid", gridTemplateColumns: "90px 1fr", gap: 10 }}><div style={{ background: S.surface, borderRadius: 8, padding: 8, fontFamily: S.font, fontSize: 11, color: S.light }}>Disclosure.pdf</div><div style={{ border: `1px solid ${S.border}`, borderRadius: 8, padding: 12, minHeight: 95, fontFamily: S.font, color: S.dark, fontWeight: 800 }}>Preview pane</div></div></Card>;
  if (item === "Document Version History") return <Card title={item} kicker="Docs"><MiniRows rows={[["v3", "Current, signed"], ["v2", "Buyer redlines"], ["v1", "Original upload"]]} /></Card>;
  if (item === "Document Checklist") return <Card title={item} kicker="Docs"><MiniRows rows={[["Seller disclosure", "Ready"], ["Lead paint", "Pending"], ["HOA addendum", "Needed"], ["Wire notice", "Ready"]]} /></Card>;
  if (item === "Drag-Drop Upload Queue") return <Card title={item} kicker="Docs" actions={<Button onClick={() => setUploads((current) => [...current, `upload-${current.length + 1}.pdf`])}>Queue File</Button>}><div style={{ display: "grid", gap: 7 }}>{uploads.map((file, index) => <Bar key={file} label={file} value={index === uploads.length - 1 ? 38 : 100} tone={index === uploads.length - 1 ? S.gold : S.green} />)}</div></Card>;
  if (item === "E-Signature Status Card") return <Card title={item} kicker="Docs"><MiniRows rows={[["Buyer", "Signed"], ["Seller", "Waiting"], ["Agent", "Viewed"], ["Expiration", "2 days"]]} /></Card>;
  if (item === "Signature Request Modal") return <Card title={item} kicker="Docs" actions={<Button tone="primary" onClick={() => setRequestOpen(true)}>Request</Button>}><p style={bodyText}>Signing request handoff is staged for the final e-sign provider connection.</p><Modal title="Signature Request" onClose={requestOpen ? () => setRequestOpen(false) : null}><MiniRows rows={[["Packet", "Disclosure bundle"], ["Recipients", "3"], ["Message", "Please sign by Friday"]]} /></Modal></Card>;
  if (item === "Disclosure Packet Builder") return <Card title={item} kicker="Docs"><MiniRows rows={[["Selected docs", "6"], ["Missing", "HOA addendum"], ["Export", "Packet PDF"], ["Status", "Draft"]]} /></Card>;
  return <Card title={item} kicker="Docs"><MiniRows rows={[["State", "Georgia"], ["County", "Fulton"], ["Required forms", "8"], ["Review cadence", "Daily"]]} /></Card>;
}

function TrustDemo({ item }) {
  const [mfaStep, setMfaStep] = useState(1);
  const [receiptOpen, setReceiptOpen] = useState(false);
  if (item === "Identity Verification Status") return <Card title={item} kicker="Trust"><MiniRows rows={[["ID document", "Verified"], ["Address", "Verified"], ["Sanctions", "Clear"], ["Last checked", "Today"]]} /></Card>;
  if (item === "Trust Score Breakdown") return <Card title={item} kicker="Trust"><Bar label="Profile" value={96} tone={S.green} /><Bar label="Transaction history" value={78} /><Bar label="Security" value={88} tone={S.blue} /></Card>;
  if (item === "Security Center") return <Card title={item} kicker="Trust"><MiniRows rows={[["Password", "Strong"], ["Sessions", "2 active"], ["Devices", "Phone, laptop"], ["Alerts", "None"]]} /></Card>;
  if (item === "MFA Setup Wizard") return <Card title={item} kicker="Trust" actions={<Button onClick={() => setMfaStep((mfaStep % 3) + 1)}>Next</Button>}><Bar label={`Step ${mfaStep} of 3`} value={mfaStep * 33} /><p style={bodyText}>{["Choose method", "Scan setup code", "Confirm backup code"][mfaStep - 1]}</p></Card>;
  if (item === "Billing Method Manager") return <Card title={item} kicker="Money"><MiniRows rows={[["Primary", "Visa ending 4242"], ["Backup", "ACH ending 4421"], ["Autopay", "On"]]} /></Card>;
  if (item === "Payout Account Manager") return <Card title={item} kicker="Money"><MiniRows rows={[["Account", "Operating ACH"], ["Status", "Verified"], ["Next payout", fmt(2450)]]} /></Card>;
  if (item === "Invoice List") return <Card title={item} kicker="Money"><MiniRows rows={[["INV-1042", "Paid"], ["INV-1043", "Due"], ["INV-1044", "Draft"]]} /></Card>;
  if (item === "Receipt Detail Drawer") return <Card title={item} kicker="Money" actions={<Button tone="primary" onClick={() => setReceiptOpen(true)}>Open</Button>}><p style={bodyText}>Receipts can open in a side drawer for quick accounting review.</p><Modal title="Receipt Detail" onClose={receiptOpen ? () => setReceiptOpen(false) : null}><MiniRows rows={[["Receipt", "RCPT-2044"], ["Amount", fmt(650)], ["Method", "Card"], ["Status", "Paid"]]} /></Modal></Card>;
  return <Card title={item} kicker="Money"><Bar label="Credit available" value={44} tone={S.green} /><MiniRows rows={[["Refund pending", fmt(125)], ["Credit balance", fmt(420)], ["Applied this month", fmt(80)]]} /></Card>;
}

function SupportDemo({ item }) {
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [prefs, setPrefs] = useState(["Email", "In-app"]);
  if (item === "Conversation List Upgrade") return <Card title={item} kicker="Support"><MiniRows rows={[["Seller disclosure thread", "2 unread"], ["Inspection team", "Live"], ["Closing desk", "Waiting"]]} /></Card>;
  if (item === "Participant Presence") return <Card title={item} kicker="Support"><div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{["Buyer online", "Agent idle", "Admin away"].map((x, i) => <Pill key={x} tone={i === 0 ? "good" : i === 1 ? "accent" : "default"}>{x}</Pill>)}</div></Card>;
  if (item === "Template Reply Picker") return <Card title={item} kicker="Support"><div style={{ display: "grid", gap: 8 }}>{["Need signature", "Tour confirmed", "Document received"].map((template) => <button key={template} type="button" style={listButton}>{template}<span>Insert</span></button>)}</div></Card>;
  if (item === "Help Article Viewer") return <Card title={item} kicker="Support"><h4 style={{ margin: 0, fontFamily: S.font, color: S.dark }}>How closing steps work</h4><p style={bodyText}>Articles open inline so users stay in their workflow while getting the exact next step.</p></Card>;
  if (item === "Feedback / Bug Report Modal") return <Card title={item} kicker="Support" actions={<Button tone="primary" onClick={() => setFeedbackOpen(true)}>Report</Button>}><p style={bodyText}>Feedback capture is ready for product issues, deal blockers, and account support.</p><Modal title="Feedback" onClose={feedbackOpen ? () => setFeedbackOpen(false) : null}><textarea placeholder="Tell the team what happened..." style={{ ...inputStyle, minHeight: 110 }} /><div style={{ marginTop: 10 }}><Button tone="primary">Submit</Button></div></Modal></Card>;
  return (
    <Card title={item} kicker="Support">
      <div style={{ display: "grid", gap: 8 }}>{["Email", "SMS", "In-app", "Weekly digest"].map((pref) => <label key={pref} style={checkStyle}><input type="checkbox" checked={prefs.includes(pref)} onChange={() => setPrefs((current) => current.includes(pref) ? current.filter((entry) => entry !== pref) : [...current, pref])} />{pref}</label>)}</div>
    </Card>
  );
}

function ComponentPreview({ item, listings }) {
  if (groups[0].items.includes(item.name)) return <FoundationDemo item={item.name} />;
  if (groups[1].items.includes(item.name)) return <PropertyDemo item={item.name} listings={listings} />;
  if (groups[2].items.includes(item.name)) return <TransactionDemo item={item.name} />;
  if (groups[3].items.includes(item.name)) return <DocsDemo item={item.name} />;
  if (groups[4].items.includes(item.name)) return <TrustDemo item={item.name} />;
  return <SupportDemo item={item.name} />;
}

export function EstateHatComponentSuiteView({ listings = [], user, onNavigate }) {
  const [activeGroup, setActiveGroup] = useState("all");
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const installed = useMemo(() => allItems.filter((item) => (activeGroup === "all" || item.group === activeGroup) && (!q || `${item.name} ${item.label}`.toLowerCase().includes(q))), [activeGroup, q]);

  return (
    <main className="estatehat-responsive-workspace" style={{ maxWidth: 1220, margin: "0 auto", padding: "26px 18px 42px" }}>
      <div className="estatehat-workspace-header" style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: 18, alignItems: "end", marginBottom: 20 }}>
        <div>
          <div style={{ fontFamily: S.font, fontSize: 11, color: S.goldDeep, fontWeight: 900, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6 }}>EstateHat Hat Data</div>
          <h1 style={{ fontFamily: S.serif, fontSize: 38, lineHeight: 1, color: S.dark, margin: 0 }}>Hat Data</h1>
          <p style={{ fontFamily: S.font, fontSize: 14, color: S.light, lineHeight: 1.6, maxWidth: 760, margin: "10px 0 0" }}>
            New EstateHat Hat Data items are grouped here for testing, review, and rollout. The tools use local state now and are ready to connect to live services as those controls come online.
          </p>
        </div>
        <Button tone="primary" onClick={() => onNavigate?.("dashboard")}>Back To Hat Board</Button>
      </div>
      <SimpleImageBand context="Hat Data" compact />

      <div className="estatehat-summary-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 12, marginBottom: 18 }}>
        <Card title="Installed" kicker="Status"><div style={metricStyle}>50</div><p style={bodyText}>Remaining recommended Hat Data items now have screens.</p></Card>
        <Card title="Groups" kicker="Coverage"><div style={metricStyle}>6</div><p style={bodyText}>Foundation, property, transaction, docs, trust, and support.</p></Card>
        <Card title="Account" kicker="Session"><div style={metricStyle}>{user?.accountType || "Guest"}</div><p style={bodyText}>Visible through navigation and command search.</p></Card>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 16 }}>
        <Pill active={activeGroup === "all"} onClick={() => setActiveGroup("all")}>All</Pill>
        {groups.map((group) => <Pill key={group.key} active={activeGroup === group.key} onClick={() => setActiveGroup(group.key)}>{group.label}</Pill>)}
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filter Hat Data..." style={{ ...inputStyle, width: "min(320px, 100%)", marginLeft: "auto" }} />
      </div>

      {activeGroup !== "all" && (
        <div style={{ background: S.goldBg, border: `1px solid ${S.border}`, borderRadius: 10, padding: 14, marginBottom: 16, fontFamily: S.font, color: S.goldDeep, fontSize: 13, fontWeight: 800 }}>
          {groups.find((group) => group.key === activeGroup)?.intro}
        </div>
      )}

      <div className="estatehat-tile-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 14 }}>
        {installed.map((item) => <ComponentPreview key={item.name} item={item} listings={listings} />)}
      </div>
    </main>
  );
}

const bodyText = { fontFamily: S.font, fontSize: 12.5, color: S.light, lineHeight: 1.55, margin: 0 };
const metricStyle = { fontFamily: S.serif, fontSize: 34, color: S.dark, lineHeight: 1, marginBottom: 6 };
const railItem = { display: "block", background: S.card, borderRadius: 6, padding: "5px 6px", fontFamily: S.font, fontSize: 10, color: S.light, fontWeight: 800 };
const cellStyle = { borderTop: `1px solid ${S.surface}`, padding: "9px 8px", color: S.dark, whiteSpace: "nowrap" };
const listButton = { border: `1px solid ${S.border}`, background: S.surface, borderRadius: 8, padding: "10px 11px", display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", fontFamily: S.font, color: S.dark, fontWeight: 800, fontSize: 12, cursor: "pointer", width: "100%", textAlign: "left" };
const checkStyle = { display: "flex", alignItems: "center", gap: 8, fontFamily: S.font, fontSize: 12, color: S.dark, fontWeight: 800 };
