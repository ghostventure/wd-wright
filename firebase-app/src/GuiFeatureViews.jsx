import { useEffect, useMemo, useState } from "react";

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
  nav: "var(--s-nav)",
  overlay: "var(--s-overlay)",
  shadowSoft: "var(--s-shadow-soft)",
  shadowStrong: "var(--s-shadow-strong)",
  font: "'Plus Jakarta Sans', sans-serif",
  serif: "'DM Serif Display', serif",
  btn: (bg, color) => ({ background: bg, color, border: "1px solid transparent", borderRadius: 8, padding: "10px 16px", fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 13, cursor: "pointer" }),
  input: { width: "100%", padding: "12px 14px", border: "1px solid var(--s-input-border)", borderRadius: 8, fontSize: 14, fontFamily: "'Plus Jakarta Sans', sans-serif", outline: "none", boxSizing: "border-box", background: "var(--s-input-bg)", color: "var(--s-dark)" },
  label: { fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, fontWeight: 800, color: "var(--s-muted)", display: "block", marginBottom: 6, marginTop: 14 },
};

const fmt = (value = 0) => "$" + Math.round(Number(value) || 0).toLocaleString();
const fee = (price = 0) => Math.round((Number(price) || 0) * 0.015 + 650 + 75);
function useLocalState(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : initialValue;
    } catch {
      return initialValue;
    }
  });
  function setPersisted(next) {
    setValue((current) => {
      const resolved = typeof next === "function" ? next(current) : next;
      try {
        localStorage.setItem(key, JSON.stringify(resolved));
      } catch {
        // Keep in memory if storage is unavailable.
      }
      return resolved;
    });
  }
  return [value, setPersisted];
}

function useMediaQuery(query) {
  const getMatch = () => (typeof window !== "undefined" ? window.matchMedia(query).matches : false);
  const [matches, setMatches] = useState(getMatch);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const media = window.matchMedia(query);
    const onChange = () => setMatches(media.matches);
    onChange();
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}

function Card({ children, style, ...rest }) {
  return <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 10, padding: 18, boxShadow: `0 10px 28px ${S.shadowSoft}`, ...style }} {...rest}>{children}</div>;
}

function Badge({ children, tone = "default" }) {
  const map = {
    default: { background: S.surface, color: S.muted },
    good: { background: S.greenBg, color: S.green },
    warn: { background: S.redBg, color: S.red },
    accent: { background: S.goldBg, color: S.goldDeep },
  };
  return <span style={{ ...(map[tone] || map.default), borderRadius: 999, padding: "3px 9px", fontFamily: S.font, fontSize: 10.5, fontWeight: 800, textTransform: "uppercase", whiteSpace: "nowrap" }}>{children}</span>;
}

function Header({ title, sub }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h2 style={{ fontFamily: S.serif, fontSize: 32, color: S.dark, margin: "0 0 5px", lineHeight: 1 }}>{title}</h2>
      {sub && <p style={{ fontFamily: S.font, fontSize: 14, color: S.light, margin: 0, lineHeight: 1.55 }}>{sub}</p>}
    </div>
  );
}

function Tabs({ tabs, active, onSelect }) {
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 18 }}>
      {tabs.map((tab) => (
        <button key={tab.key} onClick={() => onSelect(tab.key)} style={{ ...S.btn(active === tab.key ? S.dark : S.card, active === tab.key ? S.card : S.muted), borderColor: active === tab.key ? S.dark : S.border }}>
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function EmptyState({ title, body, actionLabel, onAction }) {
  return (
    <Card style={{ textAlign: "center", padding: 28 }}>
      <div style={{ fontFamily: S.font, fontSize: 15, fontWeight: 900, color: S.dark }}>{title}</div>
      <div style={{ fontFamily: S.font, fontSize: 13, color: S.light, lineHeight: 1.55, marginTop: 6 }}>{body}</div>
      {actionLabel && onAction && (
        <button type="button" onClick={onAction} style={{ ...S.btn(S.gold, S.dark), marginTop: 16 }}>
          {actionLabel}
        </button>
      )}
    </Card>
  );
}

export function ToastHost({ toasts = [], onDismiss }) {
  if (!toasts.length) return null;
  return (
    <div style={{ position: "fixed", right: 18, bottom: 18, zIndex: 260, display: "grid", gap: 10, width: "min(360px, calc(100vw - 36px))" }}>
      {toasts.map((toast) => (
        <div key={toast.id} style={{ background: S.card, border: `1px solid ${toast.tone === "error" ? S.red : toast.tone === "success" ? S.green : S.border}`, borderLeft: `4px solid ${toast.tone === "error" ? S.red : toast.tone === "success" ? S.green : S.gold}`, borderRadius: 10, padding: "12px 14px", boxShadow: `0 22px 50px ${S.shadowStrong}`, display: "flex", justifyContent: "space-between", gap: 12 }}>
          <div>
            <div style={{ fontFamily: S.font, fontSize: 13, fontWeight: 800, color: S.dark }}>{toast.title}</div>
            {toast.message && <div style={{ fontFamily: S.font, fontSize: 12, color: S.light, lineHeight: 1.45, marginTop: 3 }}>{toast.message}</div>}
          </div>
          <button onClick={() => onDismiss(toast.id)} style={{ border: "none", background: "transparent", color: S.light, cursor: "pointer", fontSize: 16 }}>x</button>
        </div>
      ))}
    </div>
  );
}

export function ConfirmDialog({ request, onCancel, onConfirm }) {
  if (!request) return null;
  return (
    <>
      <div onClick={onCancel} style={{ position: "fixed", inset: 0, background: S.overlay, zIndex: 240 }} />
      <div role="dialog" aria-modal="true" style={{ position: "fixed", left: "50%", top: "50%", transform: "translate(-50%, -50%)", width: "min(460px, calc(100vw - 32px))", background: S.card, border: `1px solid ${S.border}`, borderRadius: 10, boxShadow: `0 30px 90px ${S.shadowStrong}`, zIndex: 241, padding: 22 }}>
        <div style={{ fontFamily: S.serif, fontSize: 28, color: S.dark, marginBottom: 8 }}>{request.title || "Confirm action"}</div>
        <div style={{ fontFamily: S.font, fontSize: 13, color: S.muted, lineHeight: 1.6, marginBottom: 18 }}>{request.message}</div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, flexWrap: "wrap" }}>
          <button onClick={onCancel} style={{ ...S.btn(S.surfaceAlt, S.muted), borderColor: S.border }}>Cancel</button>
          <button onClick={onConfirm} style={{ ...S.btn(request.danger ? S.red : S.gold, request.danger ? "#fff" : S.dark) }}>{request.confirmLabel || "Confirm"}</button>
        </div>
      </div>
    </>
  );
}

export function UniversalSearchView({ onNavigate, listings = [], savedSearches = [], recentViewedIds = [], docs = [], deals = [] }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const pages = [
    ["Notification Center", "notifications", "Offers, tasks, messages, compliance"],
    ["Document Vault", "documents", "Deal, listing, identity, and billing files"],
    ["Property Comparison", "compare", "Compare saved or live listings"],
    ["Tour Scheduler", "tours", "Showing and inspection appointments"],
    ["Offer Composer", "offer", "Draft purchase terms"],
    ["Admin Workbench", "admin-workbench", "Bulk review and operational tables"],
  ].filter(([label, , meta]) => `${label} ${meta}`.toLowerCase().includes(q));
  const listingHits = listings.filter((item) => `${item.title} ${item.address} ${item.type}`.toLowerCase().includes(q)).slice(0, 8);
  const dealHits = deals.filter((item) => `${item.id} ${item.property} ${item.phase}`.toLowerCase().includes(q)).slice(0, 5);
  const docHits = docs.filter((item) => `${item.docName} ${item.property} ${item.transaction}`.toLowerCase().includes(q)).slice(0, 5);
  const recent = recentViewedIds.map((id) => listings.find((item) => item.id === id)).filter(Boolean).slice(0, 4);

  return (
    <div style={{ maxWidth: 1040, margin: "0 auto", padding: 24 }}>
      <Header title="Universal Search" sub="Search listings, deals, documents, pages, and operational workspaces." />
      <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by address, deal ID, document, page, or task..." style={{ ...S.input, fontSize: 16, padding: "16px 18px", marginBottom: 18 }} />
      {!q && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 14 }}>
          {[
            ["Recent Views", recent.map((item) => item.title).join(", ") || "No recent listings yet", "browse"],
            ["Saved Searches", savedSearches.length ? `${savedSearches.length} saved search presets` : "Create one from Browse", "browse"],
            ["Active Deals", deals.length ? `${deals.length} transaction workflows` : "No live transaction feed connected", "transaction"],
            ["Documents", docs.length ? `${docs.length} reviewable files` : "No live document feed connected", "documents"],
          ].map(([title, body, target]) => (
            <Card key={title} onClick={() => onNavigate(target)} style={{ cursor: "pointer" }}>
              <div style={{ fontFamily: S.font, fontSize: 14, fontWeight: 800, color: S.dark }}>{title}</div>
              <div style={{ fontFamily: S.font, fontSize: 12.5, color: S.light, lineHeight: 1.5, marginTop: 6 }}>{body}</div>
            </Card>
          ))}
        </div>
      )}
      {q && <ResultGroups groups={[
        ["Pages", pages.map(([label, view, meta]) => ({ label, meta, action: () => onNavigate(view) }))],
        ["Listings", listingHits.map((item) => ({ label: item.title, meta: `${fmt(item.price)} · ${item.address}`, action: () => onNavigate(item.source === "deal" ? "transaction" : "detail", item.id) }))],
        ["Deals", dealHits.map((item) => ({ label: item.id, meta: `${item.property} · ${item.phase}`, action: () => onNavigate("transaction") }))],
        ["Documents", docHits.map((item) => ({ label: item.docName, meta: `${item.transaction} · ${item.property}`, action: () => onNavigate("documents", item.id) }))],
      ]} />}
    </div>
  );
}

function ResultGroups({ groups }) {
  const visible = groups.filter(([, items]) => items.length);
  if (!visible.length) return <Card style={{ textAlign: "center", fontFamily: S.font, color: S.light }}>No matching EstateHat result.</Card>;
  return (
    <div style={{ display: "grid", gap: 14 }}>
      {visible.map(([title, items]) => (
        <Card key={title}>
          <div style={{ fontFamily: S.font, fontSize: 11, fontWeight: 800, letterSpacing: 1.4, textTransform: "uppercase", color: S.light, marginBottom: 10 }}>{title}</div>
          {items.map((item) => (
            <button key={`${title}-${item.label}`} onClick={item.action} style={{ width: "100%", border: "none", borderTop: `1px solid ${S.surface}`, background: "transparent", padding: "12px 0", textAlign: "left", cursor: "pointer" }}>
              <div style={{ fontFamily: S.font, fontSize: 14, fontWeight: 800, color: S.dark }}>{item.label}</div>
              <div style={{ fontFamily: S.font, fontSize: 12, color: S.light, marginTop: 3 }}>{item.meta}</div>
            </button>
          ))}
        </Card>
      ))}
    </div>
  );
}

export function NotificationCenterView({ onNavigate, notify = () => {} }) {
  const [filter, setFilter] = useState("all");
  const [readIds, setReadIds] = useLocalState("estatehat-read-notifications-v1", []);
  const [offers] = useLocalState("estatehat-offers-v1", []);
  const [tours] = useLocalState("estatehat-tours-v1", []);
  const [uploads] = useLocalState("estatehat-vault-uploads-v1", []);
  const notifications = [
    ...offers.map((offer) => ({ id: `offer-${offer.id}`, type: "offer", title: "Offer draft saved", body: `${offer.property} · ${fmt(offer.price)}`, priority: "medium", time: offer.savedAtLabel || "Saved", target: "offer" })),
    ...tours.map((tour) => ({ id: `tour-${tour.id}`, type: "task", title: "Appointment scheduled", body: `${tour.property} · ${tour.date} at ${tour.time}`, priority: "medium", time: tour.date || "Scheduled", target: "tours" })),
    ...uploads.map((upload, index) => ({ id: `upload-${index}-${upload.name}`, type: "document", title: "Vault upload queued", body: `${upload.name} · ${upload.size || "file"}`, priority: "medium", time: upload.time || "Uploaded", target: "documents" })),
  ];
  const visible = filter === "all" ? notifications : notifications.filter((item) => item.type === filter);
  function open(item) {
    setReadIds((current) => current.includes(item.id) ? current : [...current, item.id]);
    notify({ title: "Notification opened", message: item.title, tone: "success" });
    onNavigate(item.target);
  }
  return (
    <div style={{ maxWidth: 980, margin: "0 auto", padding: 24 }}>
      <Header title="Notification Center" sub="Offers, messages, document requests, compliance alerts, and deal tasks." />
      <Tabs tabs={["all", "offer", "document", "task", "message", "compliance"].map((key) => ({ key, label: key === "all" ? "All" : key }))} active={filter} onSelect={setFilter} />
      <div style={{ display: "grid", gap: 12 }}>
        {visible.length === 0 && <EmptyState title="No notifications" body="Live notifications will appear after a saved offer, scheduled tour, uploaded document, message, or connected compliance event." />}
        {visible.map((item) => (
          <Card key={item.id} onClick={() => open(item)} style={{ cursor: "pointer", borderLeft: `4px solid ${item.priority === "high" ? S.red : S.gold}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <div>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 5 }}>
                  {!readIds.includes(item.id) && <span style={{ width: 8, height: 8, borderRadius: 99, background: S.gold }} />}
                  <div style={{ fontFamily: S.font, fontSize: 15, fontWeight: 800, color: S.dark }}>{item.title}</div>
                  <Badge tone={item.priority === "high" ? "warn" : "default"}>{item.type}</Badge>
                </div>
                <div style={{ fontFamily: S.font, fontSize: 13, color: S.muted, lineHeight: 1.5 }}>{item.body}</div>
              </div>
              <div style={{ fontFamily: S.font, fontSize: 11, color: S.light, whiteSpace: "nowrap" }}>{item.time}</div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function DocumentVaultView({ initialDocId, notify = () => {}, docs = [], deals = [] }) {
  const isCompact = useMediaQuery("(max-width: 900px)");
  const [category, setCategory] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortKey, setSortKey] = useState("recent");
  const [query, setQuery] = useState("");
  const [uploads, setUploads] = useLocalState("estatehat-vault-uploads-v1", []);
  const [uploadProfile, setUploadProfile] = useState({ category: "transaction", docType: "Purchase contract", priority: "high" });
  const [selectedId, setSelectedId] = useState(initialDocId || docs[0]?.id);
  const allDocs = useMemo(() => [
    ...docs.map((doc) => ({
      ...doc,
      category: doc.category || (doc.transaction === "N/A" ? "listing" : "transaction"),
      status: doc.status || "pending",
      priority: doc.priority || (doc.flags?.length ? "high" : "medium"),
      dueLabel: doc.dueLabel || (doc.status === "approved" ? "Ready" : doc.flags?.length ? "Resolve before closing" : "Review within 24h"),
      reviewOwner: doc.reviewOwner || (doc.status === "approved" ? "Closing desk" : "Document review"),
      versionCount: doc.versionCount || 1,
      signersPending: doc.signersPending ?? Math.max((doc.parties?.length || 1) - (doc.status === "approved" ? (doc.parties?.length || 1) : 1), 0),
      checklist: doc.checklist || [],
    })),
    ...uploads.map((doc, index) => ({
      id: `UP-${index}`,
      transaction: doc.transaction || "User Upload",
      property: doc.property || "Vault Upload",
      docName: doc.name,
      docType: doc.docType || doc.type || "Uploaded File",
      uploadedBy: "You",
      uploadedRole: "user",
      uploaded: doc.time,
      pages: doc.pages || 1,
      status: "pending",
      flags: doc.flags || [],
      parties: doc.parties || ["You", "Closing desk"],
      category: doc.category || "identity",
      priority: doc.priority || "medium",
      dueLabel: doc.dueLabel || "Review within 24h",
      reviewOwner: doc.reviewOwner || "Document review",
      versionCount: doc.versionCount || 1,
      signersPending: doc.signersPending ?? 1,
      checklist: doc.checklist || [
        { label: "File uploaded", done: true },
        { label: "Metadata confirmed", done: false },
        { label: "Review released", done: false },
      ],
      intakeNotes: doc.intakeNotes || "Uploaded from the document vault. Attach property and transaction context before final release.",
    })),
  ], [docs, uploads]);
  const filtered = useMemo(() => {
    let next = category === "all" ? allDocs : allDocs.filter((doc) => doc.category === category);
    if (statusFilter !== "all") next = next.filter((doc) => doc.status === statusFilter);
    const q = query.trim().toLowerCase();
    if (q) {
      next = next.filter((doc) => `${doc.docName} ${doc.docType} ${doc.property} ${doc.transaction} ${doc.uploadedBy} ${doc.reviewOwner}`.toLowerCase().includes(q));
    }
    return [...next].sort((a, b) => {
      if (sortKey === "name") return String(a.docName).localeCompare(String(b.docName));
      if (sortKey === "status") return String(a.status).localeCompare(String(b.status));
      if (sortKey === "priority") {
        const order = { high: 0, medium: 1, low: 2 };
        return (order[a.priority] ?? 3) - (order[b.priority] ?? 3);
      }
      return String(b.uploaded || "").localeCompare(String(a.uploaded || ""));
    });
  }, [allDocs, category, query, sortKey, statusFilter]);
  const visible = filtered;
  const selected = allDocs.find((doc) => doc.id === selectedId) || visible[0];
  const metrics = useMemo(() => {
    const source = category === "all" ? allDocs : allDocs.filter((doc) => doc.category === category);
    const approvals = source.filter((doc) => doc.status === "approved").length;
    const blocked = source.filter((doc) => doc.flags?.length || doc.status === "rejected").length;
    const pending = source.filter((doc) => doc.status === "pending").length;
    return {
      total: source.length,
      approvals,
      blocked,
      pending,
      readiness: source.length ? Math.round((approvals / source.length) * 100) : 0,
    };
  }, [allDocs, category]);
  function upload(event) {
    const now = new Date();
    const files = Array.from(event.target.files || []).map((file) => ({
      name: file.name,
      size: `${(file.size / 1024).toFixed(1)} KB`,
      type: file.type || "file",
      time: now.toLocaleString(),
      category: uploadProfile.category,
      docType: uploadProfile.docType,
      priority: uploadProfile.priority,
      property: deals[0]?.property || "Vault Upload",
      transaction: deals[0]?.id || "Manual intake",
      dueLabel: uploadProfile.priority === "high" ? "Same-day review" : "Review within 24h",
      reviewOwner: uploadProfile.category === "identity" ? "Verification desk" : "Document review",
      checklist: [
        { label: "File uploaded", done: true },
        { label: "Metadata confirmed", done: false },
        { label: "Release approved", done: false },
      ],
    }));
    if (!files.length) return;
    setUploads((current) => [...files, ...current].slice(0, 12));
    notify({ title: "Upload queued", message: `${files.length} file${files.length === 1 ? "" : "s"} added to the vault.`, tone: "success" });
    if (!selectedId) setSelectedId("UP-0");
  }
  return (
    <div style={{ maxWidth: 1120, margin: "0 auto", padding: 24 }}>
      <Header title="Document Vault" sub="Review transaction, listing, identity, billing, and legal files from one workspace." />
      <Tabs tabs={["all", "transaction", "listing", "identity"].map((key) => ({ key, label: key }))} active={category} onSelect={setCategory} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 12, marginBottom: 18 }}>
        {[
          ["Vault Readiness", `${metrics.readiness}%`, `${metrics.approvals}/${metrics.total || 0} documents release-ready`, "good"],
          ["Pending Review", String(metrics.pending), "Needs review, signatures, or indexing", "accent"],
          ["Blocked Items", String(metrics.blocked), "Flags or rejected packets need attention", metrics.blocked ? "warn" : "good"],
          ["Visible Queue", String(visible.length), query ? "Filtered search results" : "Current working set", "default"],
        ].map(([label, value, body, tone]) => (
          <Card key={label} style={{ padding: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
              <div style={{ fontFamily: S.font, fontSize: 11, letterSpacing: 1.2, textTransform: "uppercase", fontWeight: 900, color: S.light }}>{label}</div>
              <Badge tone={tone === "default" ? "default" : tone}>{tone === "good" ? "ready" : tone === "warn" ? "blocked" : tone === "accent" ? "active" : "visible"}</Badge>
            </div>
            <div style={{ fontFamily: S.serif, fontSize: 28, lineHeight: 1, color: S.dark, marginTop: 10 }}>{value}</div>
            <div style={{ fontFamily: S.font, fontSize: 12.5, lineHeight: 1.5, color: S.light, marginTop: 6 }}>{body}</div>
          </Card>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: isCompact ? "1fr" : "1.1fr 0.9fr", gap: 18 }}>
        <div style={{ display: "grid", gap: 16 }}>
          <Card>
            <div style={{ display: "grid", gridTemplateColumns: isCompact ? "1fr" : "repeat(3,minmax(0,1fr))", gap: 12 }}>
              <div>
                <label style={{ ...S.label, marginTop: 0 }}>Upload category</label>
                <select value={uploadProfile.category} onChange={(event) => setUploadProfile((current) => ({ ...current, category: event.target.value }))} style={S.input}>
                  <option value="transaction">Transaction</option>
                  <option value="listing">Listing</option>
                  <option value="identity">Identity</option>
                </select>
              </div>
              <div>
                <label style={{ ...S.label, marginTop: 0 }}>Packet type</label>
                <select value={uploadProfile.docType} onChange={(event) => setUploadProfile((current) => ({ ...current, docType: event.target.value }))} style={S.input}>
                  <option>Purchase contract</option>
                  <option>Disclosure packet</option>
                  <option>Proof of funds</option>
                  <option>ID verification</option>
                  <option>Closing statement</option>
                </select>
              </div>
              <div>
                <label style={{ ...S.label, marginTop: 0 }}>Review priority</label>
                <select value={uploadProfile.priority} onChange={(event) => setUploadProfile((current) => ({ ...current, priority: event.target.value }))} style={S.input}>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>
            <label style={S.label}>Upload to vault</label>
            <input type="file" multiple onChange={upload} style={S.input} />
            <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 10 }}>
              {[
                ["Review owner", uploadProfile.category === "identity" ? "Verification desk" : "Document review"],
                ["SLA", uploadProfile.priority === "high" ? "Same-day release" : "24h release target"],
                ["Required next step", uploadProfile.category === "listing" ? "Attach listing context" : "Confirm metadata and parties"],
              ].map(([label, value]) => (
                <div key={label} style={{ background: S.surfaceAlt, border: `1px solid ${S.border}`, borderRadius: 8, padding: 12 }}>
                  <div style={{ fontFamily: S.font, fontSize: 10.5, letterSpacing: 1.1, textTransform: "uppercase", color: S.light, fontWeight: 900 }}>{label}</div>
                  <div style={{ fontFamily: S.font, fontSize: 12.5, color: S.dark, fontWeight: 800, marginTop: 6 }}>{value}</div>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <div style={{ display: "grid", gridTemplateColumns: isCompact ? "1fr" : "1.2fr 0.8fr 0.8fr", gap: 10 }}>
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search file, property, transaction, reviewer..." style={{ ...S.input, marginTop: 0 }} />
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} style={S.input}>
                <option value="all">All statuses</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
              <select value={sortKey} onChange={(event) => setSortKey(event.target.value)} style={S.input}>
                <option value="recent">Most recent</option>
                <option value="priority">Priority</option>
                <option value="status">Status</option>
                <option value="name">Name</option>
              </select>
            </div>
            <div style={{ display: "grid", gap: 8, marginTop: 16 }}>
              {visible.length === 0 && <EmptyState title="No documents in this view" body="Try another category or status filter, or upload a packet to seed the vault queue." />}
              {visible.map((doc) => (
                <button key={doc.id} onClick={() => setSelectedId(doc.id)} style={{ textAlign: "left", border: `1px solid ${selected?.id === doc.id ? S.gold : S.border}`, borderRadius: 8, background: selected?.id === doc.id ? S.goldBg : S.card, padding: 12, cursor: "pointer" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "start" }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontFamily: S.font, fontSize: 13, fontWeight: 800, color: S.dark, lineHeight: 1.4 }}>{doc.docName}</div>
                      <div style={{ fontFamily: S.font, fontSize: 11.5, color: S.light, marginTop: 4 }}>{doc.transaction} · {doc.property}</div>
                    </div>
                    <div style={{ display: "grid", gap: 6, justifyItems: "end", flexShrink: 0 }}>
                      <Badge tone={doc.status === "approved" ? "good" : doc.status === "rejected" ? "warn" : "accent"}>{doc.status}</Badge>
                      <Badge tone={doc.priority === "high" ? "warn" : doc.priority === "low" ? "default" : "accent"}>{doc.priority}</Badge>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 8, marginTop: 10 }}>
                    {[
                      ["Type", doc.docType],
                      ["Review owner", doc.reviewOwner],
                      ["Due", doc.dueLabel],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <div style={{ fontFamily: S.font, fontSize: 10.5, letterSpacing: 1.1, textTransform: "uppercase", color: S.light, fontWeight: 900 }}>{label}</div>
                        <div style={{ fontFamily: S.font, fontSize: 12, color: S.dark, marginTop: 4 }}>{value}</div>
                      </div>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </Card>
        </div>
        <DocumentPreview doc={selected} />
      </div>
    </div>
  );
}

function DocumentPreview({ doc }) {
  if (!doc) return <Card>No document selected.</Card>;
  const checklist = doc.checklist?.length ? doc.checklist : [
    { label: "Metadata captured", done: true },
    { label: "Review routed", done: doc.status !== "pending" },
    { label: "Parties released", done: doc.status === "approved" },
  ];
  const timeline = [
    { label: "Uploaded", detail: doc.uploaded || "Queued", tone: "good" },
    { label: "Metadata indexed", detail: `${doc.docType || "Document"} categorized under ${doc.category || "vault"} files`, tone: "good" },
    { label: "Review owner", detail: `${doc.reviewOwner || "Document review"} · ${doc.dueLabel || "Awaiting release"}`, tone: doc.priority === "high" ? "warn" : "accent" },
    { label: "Signature status", detail: doc.status === "approved" ? "All required signatures or approvals complete" : `${doc.signersPending || 0} signer${doc.signersPending === 1 ? "" : "s"} or reviewer action remaining`, tone: doc.status === "approved" ? "good" : "accent" },
    { label: "Audit trail", detail: doc.flags?.length ? `${doc.flags.length} flag${doc.flags.length === 1 ? "" : "s"} attached for review` : "No active flags", tone: doc.flags?.length ? "warn" : "good" },
  ];
  const completion = Math.round((checklist.filter((item) => item.done).length / checklist.length) * 100);
  return (
    <Card style={{ minHeight: 520 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "start", marginBottom: 12, flexWrap: "wrap" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: S.font, fontSize: 11, letterSpacing: 1.3, textTransform: "uppercase", color: S.light, fontWeight: 800 }}>Document Preview</div>
          <div style={{ fontFamily: S.serif, fontSize: 25, color: S.dark, lineHeight: 1.05, marginTop: 4 }}>{doc.docName}</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
            <Badge tone={doc.status === "approved" ? "good" : doc.status === "rejected" ? "warn" : "accent"}>{doc.status}</Badge>
            <Badge tone={doc.priority === "high" ? "warn" : doc.priority === "low" ? "default" : "accent"}>{doc.priority} priority</Badge>
            <Badge tone="default">{doc.category || "vault"}</Badge>
          </div>
        </div>
        <div style={{ minWidth: 180, flex: "0 0 180px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontFamily: S.font, fontSize: 11.5, color: S.muted, marginBottom: 8 }}>
            <span>Release readiness</span>
            <strong style={{ color: S.dark }}>{completion}%</strong>
          </div>
          <div style={{ height: 8, borderRadius: 999, background: S.surface, overflow: "hidden" }}>
            <div style={{ width: `${completion}%`, height: "100%", background: completion === 100 ? S.green : S.gold }} />
          </div>
        </div>
      </div>
      <div style={{ height: 186, borderRadius: 8, border: `1px dashed ${S.borderStrong}`, background: S.surfaceAlt, display: "grid", placeItems: "center", marginBottom: 14, padding: 18 }}>
        <div style={{ textAlign: "center", maxWidth: 360 }}>
          <div style={{ fontFamily: S.font, fontSize: 15, fontWeight: 900, letterSpacing: 1.2, color: S.muted }}>DOCUMENT PACKET</div>
          <div style={{ fontFamily: S.font, fontSize: 13, color: S.muted, fontWeight: 800, marginTop: 8 }}>{doc.pages || 1} page preview · version {doc.versionCount || 1}</div>
          <div style={{ fontFamily: S.font, fontSize: 11.5, color: S.light, marginTop: 8, lineHeight: 1.5 }}>{doc.intakeNotes || "Preview metadata is available. Connected file rendering will appear here once the document service provides a storage URL."}</div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 12, marginBottom: 16 }}>
        <div style={{ background: S.surfaceAlt, border: `1px solid ${S.border}`, borderRadius: 8, padding: 12 }}>
          <div style={{ fontFamily: S.font, fontSize: 10.5, letterSpacing: 1.2, textTransform: "uppercase", color: S.light, fontWeight: 900, marginBottom: 8 }}>Packet Facts</div>
          {[
            ["Type", doc.docType],
            ["Property", doc.property],
            ["Transaction", doc.transaction],
            ["Uploaded by", `${doc.uploadedBy} (${doc.uploadedRole})`],
            ["Uploaded", doc.uploaded],
          ].map(([label, value]) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "7px 0", borderTop: `1px solid ${S.border}`, fontFamily: S.font, fontSize: 12 }}>
              <span style={{ color: S.light }}>{label}</span>
              <span style={{ color: S.dark, fontWeight: 700, textAlign: "right" }}>{value}</span>
            </div>
          ))}
        </div>
        <div style={{ background: S.surfaceAlt, border: `1px solid ${S.border}`, borderRadius: 8, padding: 12 }}>
          <div style={{ fontFamily: S.font, fontSize: 10.5, letterSpacing: 1.2, textTransform: "uppercase", color: S.light, fontWeight: 900, marginBottom: 8 }}>Parties And Routing</div>
          <div style={{ display: "grid", gap: 8 }}>
            {(doc.parties?.length ? doc.parties : ["You"]).map((party) => (
              <div key={party} style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center", borderTop: `1px solid ${S.border}`, paddingTop: 8 }}>
                <div style={{ fontFamily: S.font, fontSize: 12.5, color: S.dark, fontWeight: 800 }}>{party}</div>
                <Badge tone={doc.status === "approved" ? "good" : party === "You" ? "good" : "accent"}>{doc.status === "approved" ? "released" : party === "You" ? "uploaded" : "pending"}</Badge>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${S.border}`, fontFamily: S.font, fontSize: 12.5, color: S.light, lineHeight: 1.5 }}>
            Owner: <strong style={{ color: S.dark }}>{doc.reviewOwner || "Document review"}</strong><br />
            Due: <strong style={{ color: S.dark }}>{doc.dueLabel || "Awaiting release"}</strong>
          </div>
        </div>
      </div>
      <div style={{ marginTop: 16, borderTop: `1px solid ${S.border}`, paddingTop: 14 }}>
        <div style={{ fontFamily: S.font, fontSize: 11, letterSpacing: 1.3, textTransform: "uppercase", color: S.light, fontWeight: 900, marginBottom: 10 }}>Release Checklist</div>
        <div style={{ display: "grid", gap: 8 }}>
          {checklist.map((item) => (
            <div key={item.label} style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", background: item.done ? S.greenBg : S.surfaceAlt, border: `1px solid ${item.done ? "transparent" : S.border}`, borderRadius: 8, padding: "10px 12px" }}>
              <div style={{ fontFamily: S.font, fontSize: 12.5, color: S.dark, fontWeight: 700 }}>{item.label}</div>
              <Badge tone={item.done ? "good" : "accent"}>{item.done ? "done" : "next"}</Badge>
            </div>
          ))}
        </div>
      </div>
      <div style={{ marginTop: 16, borderTop: `1px solid ${S.border}`, paddingTop: 14 }}>
        <div style={{ fontFamily: S.font, fontSize: 11, letterSpacing: 1.3, textTransform: "uppercase", color: S.light, fontWeight: 900, marginBottom: 10 }}>Version And Audit Timeline</div>
        <div style={{ display: "grid", gap: 10 }}>
          {timeline.map((item, index) => (
            <div key={item.label} style={{ display: "grid", gridTemplateColumns: "22px 1fr", gap: 10 }}>
              <div>
                <div style={{ width: 14, height: 14, borderRadius: 99, background: item.tone === "warn" ? S.red : item.tone === "good" ? S.green : S.gold, marginTop: 2 }} />
                {index < timeline.length - 1 && <div style={{ width: 2, height: 26, background: S.border, marginLeft: 6, marginTop: 2 }} />}
              </div>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <div style={{ fontFamily: S.font, fontSize: 12.5, fontWeight: 900, color: S.dark }}>{item.label}</div>
                  <Badge tone={item.tone}>{item.tone === "good" ? "ready" : item.tone === "warn" ? "review" : "pending"}</Badge>
                </div>
                <div style={{ fontFamily: S.font, fontSize: 11.5, color: S.light, lineHeight: 1.45, marginTop: 2 }}>{item.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {doc.flags?.length > 0 && <div style={{ marginTop: 12, display: "grid", gap: 6 }}>{doc.flags.map((flag) => <div key={flag} style={{ background: S.redBg, color: S.red, borderRadius: 8, padding: "8px 10px", fontFamily: S.font, fontSize: 12 }}>Flag: {flag}</div>)}</div>}
    </Card>
  );
}

export function TransactionMilestonesView({ onNavigate, deals = [] }) {
  const isCompact = useMediaQuery("(max-width: 900px)");
  const [activeDealId, setActiveDealId] = useState(deals[0]?.id);
  const deal = deals.find((item) => item.id === activeDealId) || deals[0];
  if (!deal) return <div style={{ maxWidth: 1040, margin: "0 auto", padding: 24 }}><EmptyState title="No active timeline" body="No transaction milestones are available for this account yet." /></div>;
  const checklist = Object.entries(deal.checklist || {});
  const complete = checklist.filter(([, done]) => done).length;
  return (
    <div style={{ maxWidth: 1040, margin: "0 auto", padding: 24 }}>
      <Header title="Transaction Timeline" sub="Milestones, blockers, and the next best action for each active hat." />
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>{deals.map((item) => <button key={item.id} onClick={() => setActiveDealId(item.id)} style={{ ...S.btn(item.id === deal.id ? S.gold : S.card, item.id === deal.id ? S.dark : S.muted), borderColor: S.border }}>{item.id}</button>)}</div>
      <div style={{ display: "grid", gridTemplateColumns: isCompact ? "1fr" : "0.9fr 1.1fr", gap: 16 }}>
        <Card>
          <div style={{ fontFamily: S.serif, fontSize: 27, color: S.dark }}>{deal.property}</div>
          <div style={{ fontFamily: S.font, color: S.light, fontSize: 13, marginTop: 6 }}>{fmt(deal.price)} · {deal.phase}</div>
          <div style={{ margin: "18px 0 8px", display: "flex", justifyContent: "space-between", fontFamily: S.font, fontSize: 12, color: S.muted }}><span>Checklist progress</span><strong>{complete}/{checklist.length}</strong></div>
          <div style={{ height: 7, background: S.surface, borderRadius: 999, overflow: "hidden" }}><div style={{ height: "100%", width: `${checklist.length ? (complete / checklist.length) * 100 : 0}%`, background: complete === checklist.length ? S.green : S.gold }} /></div>
          <button onClick={() => onNavigate("transaction")} style={{ ...S.btn(S.dark, S.card), width: "100%", marginTop: 16 }}>Open Full Transaction</button>
        </Card>
        <Card>
          <div style={{ display: "grid", gap: 12 }}>
            {(deal.timeline || []).map((event, index) => {
              const done = event.status === "Complete";
              return (
                <div key={`${event.date}-${event.label}`} style={{ display: "grid", gridTemplateColumns: "72px 24px 1fr", gap: 10 }}>
                  <div style={{ fontFamily: S.font, fontSize: 12, color: S.light }}>{event.date}</div>
                  <div><div style={{ width: 18, height: 18, borderRadius: 99, background: done ? S.green : event.status === "Pending" ? S.gold : S.surface, border: `2px solid ${done ? S.green : S.gold}` }} />{index < deal.timeline.length - 1 && <div style={{ width: 2, height: 34, background: S.border, marginLeft: 8 }} />}</div>
                  <div><div style={{ fontFamily: S.font, fontSize: 13.5, fontWeight: 800, color: S.dark }}>{event.label}</div><div style={{ marginTop: 3 }}><Badge tone={done ? "good" : "accent"}>{event.status}</Badge></div></div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}

export function OfferComposerView({ listings = [], notify = () => {} }) {
  const isCompact = useMediaQuery("(max-width: 900px)");
  const [savedOffers, setSavedOffers] = useLocalState("estatehat-offers-v1", []);
  const [listingId, setListingId] = useState(listings[0]?.id || "");
  const listing = listings.find((item) => String(item.id) === String(listingId)) || listings[0];
  const [offer, setOffer] = useState({ price: "", earnest: "10000", financing: "conventional", inspectionDays: "10", appraisal: true, closingDate: "2026-05-15" });
  const price = Number(offer.price || listing?.price || 0);
  function saveOfferDraft() {
    if (!listing || !price) return;
    const now = new Date();
    const draft = {
      id: `OFFER-${Date.now()}`,
      listingId: listing.id,
      property: listing.title,
      address: listing.address,
      price,
      earnest: Number(offer.earnest) || 0,
      financing: offer.financing,
      inspectionDays: Number(offer.inspectionDays) || 0,
      appraisal: !!offer.appraisal,
      closingDate: offer.closingDate,
      savedAt: now.toISOString(),
      savedAtLabel: now.toLocaleString(),
      status: "draft",
    };
    setSavedOffers((current) => [draft, ...current].slice(0, 20));
    notify({ title: "Offer draft saved", message: `${fmt(price)} offer package is ready for review.`, tone: "success" });
  }
  return (
    <div style={{ maxWidth: 1060, margin: "0 auto", padding: 24 }}>
      <Header title="Offer Composer" sub="Draft price, financing, contingencies, earnest money, closing date, and expiration before sending." />
      {listings.length === 0 ? (
        <EmptyState title="No properties ready for offers" body="Live listings will appear here when they are available." />
      ) : (
      <div style={{ display: "grid", gridTemplateColumns: isCompact ? "1fr" : "1fr 0.8fr", gap: 18 }}>
        <Card>
          <label style={S.label}>Property</label>
          <select value={listingId} onChange={(event) => setListingId(event.target.value)} style={S.input}>{listings.map((item) => <option key={item.id} value={item.id}>{item.title} · {fmt(item.price)}</option>)}</select>
          <label style={S.label}>Offer price</label>
          <input value={offer.price} onChange={(event) => setOffer({ ...offer, price: event.target.value })} placeholder={listing ? String(listing.price) : "500000"} style={S.input} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div><label style={S.label}>Earnest money</label><input value={offer.earnest} onChange={(event) => setOffer({ ...offer, earnest: event.target.value })} style={S.input} /></div>
            <div><label style={S.label}>Financing</label><select value={offer.financing} onChange={(event) => setOffer({ ...offer, financing: event.target.value })} style={S.input}><option value="conventional">Conventional</option><option value="cash">Cash</option><option value="fha">FHA</option><option value="va">VA</option></select></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div><label style={S.label}>Inspection period</label><input value={offer.inspectionDays} onChange={(event) => setOffer({ ...offer, inspectionDays: event.target.value })} style={S.input} /></div>
            <div><label style={S.label}>Closing date</label><input type="date" value={offer.closingDate} onChange={(event) => setOffer({ ...offer, closingDate: event.target.value })} style={S.input} /></div>
          </div>
          <label style={{ ...S.label, display: "flex", gap: 8, alignItems: "center" }}><input type="checkbox" checked={offer.appraisal} onChange={(event) => setOffer({ ...offer, appraisal: event.target.checked })} /> Include appraisal contingency</label>
          <button type="button" onClick={saveOfferDraft} disabled={!listing || !price} style={{ ...S.btn(!listing || !price ? S.surface : S.gold, !listing || !price ? S.light : S.dark), width: "100%", marginTop: 16, cursor: !listing || !price ? "not-allowed" : "pointer" }}>Save Offer Draft</button>
        </Card>
        <Card>
          <div style={{ fontFamily: S.font, fontSize: 11, fontWeight: 800, letterSpacing: 1.3, textTransform: "uppercase", color: S.light }}>Offer Summary</div>
          <div style={{ fontFamily: S.serif, fontSize: 32, color: S.dark, marginTop: 8 }}>{fmt(price)}</div>
          <div style={{ fontFamily: S.font, fontSize: 13, color: S.muted, lineHeight: 1.6, margin: "8px 0 14px" }}>{listing?.title || "Select a property"} · {offer.financing} financing · closes {offer.closingDate}</div>
          <div style={{ display: "grid", gap: 8, fontFamily: S.font, fontSize: 12.5, color: S.muted }}>
            <div>EstateHat fees: <strong style={{ color: S.dark }}>{fmt(fee(price))}</strong></div>
            <div>Earnest money: <strong style={{ color: S.dark }}>{fmt(offer.earnest)}</strong></div>
            <div>Inspection: <strong style={{ color: S.dark }}>{offer.inspectionDays} days</strong></div>
            <div>Appraisal: <strong style={{ color: S.dark }}>{offer.appraisal ? "Included" : "Waived"}</strong></div>
          </div>
          <div style={{ borderTop: `1px solid ${S.border}`, marginTop: 16, paddingTop: 14 }}>
            <div style={{ fontFamily: S.font, fontSize: 12, fontWeight: 900, color: S.dark, marginBottom: 8 }}>Saved Drafts</div>
            {savedOffers.length === 0 && <div style={{ fontFamily: S.font, fontSize: 12, color: S.light }}>No offer drafts saved yet.</div>}
            {savedOffers.slice(0, 4).map((draft) => (
              <div key={draft.id} style={{ fontFamily: S.font, fontSize: 12, color: S.muted, borderTop: `1px solid ${S.surface}`, padding: "8px 0" }}>
                <strong style={{ color: S.dark }}>{fmt(draft.price)}</strong> · {draft.property}
              </div>
            ))}
          </div>
        </Card>
      </div>
      )}
    </div>
  );
}

export function TourSchedulerView({ listings = [], notify = () => {} }) {
  const isCompact = useMediaQuery("(max-width: 900px)");
  const [tours, setTours] = useLocalState("estatehat-tours-v1", []);
  const [draft, setDraft] = useState({ listingId: listings[0]?.id || "", date: "2026-04-18", time: "10:00", type: "showing", notes: "" });
  const selected = listings.find((item) => String(item.id) === String(draft.listingId)) || listings[0];
  function schedule() {
    if (!selected) return;
    const next = { ...draft, id: `TOUR-${Date.now()}`, property: selected?.title || "Selected property", address: selected?.address || "" };
    setTours((current) => [next, ...current].slice(0, 12));
    notify({ title: "Tour scheduled", message: `${next.property} on ${next.date} at ${next.time}.`, tone: "success" });
  }
  return (
    <div style={{ maxWidth: 980, margin: "0 auto", padding: 24 }}>
      <Header title="Tour Scheduler" sub="Schedule showings, walkthroughs, inspections, and signing appointments." />
      <div style={{ display: "grid", gridTemplateColumns: isCompact ? "1fr" : "0.9fr 1.1fr", gap: 18 }}>
        <Card>
          {listings.length === 0 ? (
            <EmptyState title="No tour-ready properties" body="Live listings will appear here when available." />
          ) : (
            <>
          <label style={S.label}>Property</label>
          <select value={draft.listingId} onChange={(event) => setDraft({ ...draft, listingId: event.target.value })} style={S.input}>{listings.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}><div><label style={S.label}>Date</label><input type="date" value={draft.date} onChange={(event) => setDraft({ ...draft, date: event.target.value })} style={S.input} /></div><div><label style={S.label}>Time</label><input type="time" value={draft.time} onChange={(event) => setDraft({ ...draft, time: event.target.value })} style={S.input} /></div></div>
          <label style={S.label}>Appointment type</label>
          <select value={draft.type} onChange={(event) => setDraft({ ...draft, type: event.target.value })} style={S.input}><option value="showing">Showing</option><option value="inspection">Inspection</option><option value="walkthrough">Final walkthrough</option><option value="signing">Signing</option></select>
          <label style={S.label}>Notes</label>
          <textarea value={draft.notes} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} style={{ ...S.input, minHeight: 90 }} placeholder="Gate code, parking, attendee notes..." />
          <button type="button" onClick={schedule} style={{ ...S.btn(S.gold, S.dark), width: "100%", marginTop: 14 }}>Schedule Appointment</button>
            </>
          )}
        </Card>
        <Card>
          <div style={{ fontFamily: S.font, fontSize: 14, fontWeight: 800, color: S.dark, marginBottom: 12 }}>Upcoming Appointments</div>
          {tours.length === 0 && <div style={{ color: S.light, fontFamily: S.font, fontSize: 13 }}>No appointments scheduled yet.</div>}
          {tours.map((item) => <div key={item.id} style={{ borderTop: `1px solid ${S.surface}`, padding: "12px 0", fontFamily: S.font }}><div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}><strong style={{ color: S.dark, fontSize: 13 }}>{item.property}</strong><Badge tone="accent">{item.type}</Badge></div><div style={{ color: S.light, fontSize: 12, marginTop: 4 }}>{item.date} at {item.time} · {item.address}</div></div>)}
        </Card>
      </div>
    </div>
  );
}

export function PropertyComparisonView({ listings = [], savedListingIds = [], onNavigate }) {
  const defaults = (savedListingIds.length ? savedListingIds : listings.map((item) => item.id)).slice(0, 3);
  const [selectedIds, setSelectedIds] = useState(defaults);
  const selected = listings.filter((listing) => selectedIds.includes(listing.id)).slice(0, 4);
  return (
    <div style={{ maxWidth: 1120, margin: "0 auto", padding: 24 }}>
      <Header title="Property Comparison" sub="Compare pricing, facts, trusted status, fees, and seller details side by side." />
      {listings.length === 0 ? (
        <EmptyState title="No properties to compare" body="Saved listings and active transaction properties will appear here when available." onAction={() => onNavigate("browse")} actionLabel="Browse Listings" />
      ) : (
      <>
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{listings.map((listing) => <label key={listing.id} style={{ border: `1px solid ${selectedIds.includes(listing.id) ? S.gold : S.border}`, background: selectedIds.includes(listing.id) ? S.goldBg : S.card, borderRadius: 8, padding: "8px 10px", fontFamily: S.font, fontSize: 12, color: S.muted, cursor: "pointer" }}><input type="checkbox" checked={selectedIds.includes(listing.id)} onChange={() => setSelectedIds((current) => current.includes(listing.id) ? current.filter((id) => id !== listing.id) : [...current, listing.id].slice(-4))} /> {listing.title}</label>)}</div>
      </Card>
      <div style={{ overflowX: "auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: `160px repeat(${Math.max(selected.length, 1)}, minmax(210px, 1fr))`, minWidth: 760, border: `1px solid ${S.border}`, borderRadius: 10, overflow: "hidden", background: S.card }}>
          {["", ...selected.map((listing) => listing.title)].map((heading, index) => <div key={`h-${index}`} style={{ background: S.surfaceAlt, padding: 12, fontFamily: S.font, fontSize: 12, fontWeight: 800, color: S.dark }}>{heading}</div>)}
          {[
            ["Price", (l) => fmt(l.price)],
            ["Type", (l) => l.type],
            ["Address", (l) => l.address],
            ["Size", (l) => `${l.beds} bed · ${l.baths} bath · ${l.sqft.toLocaleString()} sqft`],
            ["Seller", (l) => `${l.sellerType}: ${l.seller}`],
            ["Verified", (l) => l.verified ? "Verified" : "Not verified"],
            ["EstateHat fees", (l) => fmt(fee(l.price))],
            ["Seller net", (l) => fmt(l.price - fee(l.price))],
          ].flatMap(([label, render]) => [<div key={`${label}-label`} style={{ padding: 12, borderTop: `1px solid ${S.border}`, fontFamily: S.font, fontSize: 12, fontWeight: 800, color: S.light }}>{label}</div>, ...selected.map((listing) => <div key={`${label}-${listing.id}`} style={{ padding: 12, borderTop: `1px solid ${S.border}`, fontFamily: S.font, fontSize: 12.5, color: S.muted }}>{render(listing)}</div>)])}
        </div>
      </div>
      {selected[0] && (
        <button
          onClick={() => onNavigate(selected[0].source === "deal" ? "transaction" : "detail", selected[0].id)}
          style={{ ...S.btn(S.gold, S.dark), marginTop: 16 }}
        >
          {selected[0].source === "deal" ? "Open Transaction" : "Open First Listing"}
        </button>
      )}
      </>
      )}
    </div>
  );
}

export function AdminWorkbenchView({ notify = () => {}, confirmAction = ({ onConfirm }) => onConfirm?.(), docs = [], flags = [], transactions = [] }) {
  const [tab, setTab] = useState("docs");
  const [selectedIds, setSelectedIds] = useState([]);
  const rows = tab === "docs" ? docs : tab === "flags" ? flags : transactions;
  const columns = tab === "docs"
    ? [["docName", "Document"], ["transaction", "Transaction"], ["property", "Property"], ["status", "Status"], ["flagCount", "Flags"]]
    : tab === "flags"
      ? [["severity", "Severity"], ["type", "Type"], ["subject", "Subject"], ["transaction", "Transaction"], ["action", "Action"]]
      : [["id", "Transaction"], ["property", "Property"], ["status", "Status"], ["phase", "Phase"], ["flagCount", "Flags"]];
  const normalizedRows = rows.map((row) => ({ ...row, flagCount: row.flagCount ?? row.flags?.length ?? 0 }));
  function toggle(id) {
    setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }
  function bulk(action) {
    confirmAction({
      title: `${action} selected items`,
      message: `${selectedIds.length} ${tab} item${selectedIds.length === 1 ? "" : "s"} will be marked for "${action}".`,
      confirmLabel: action,
      onConfirm: () => {
        notify({ title: "Bulk action recorded", message: `${action} applied to ${selectedIds.length} selected item${selectedIds.length === 1 ? "" : "s"}.`, tone: "success" });
        setSelectedIds([]);
      },
    });
  }
  return (
    <div style={{ maxWidth: 1120, margin: "0 auto", padding: 24 }}>
      <Header title="Admin Workbench" sub="Bulk review tables for documents, flags, and transaction operations." />
      <Tabs tabs={[{ key: "docs", label: "Documents" }, { key: "flags", label: "Flags" }, { key: "transactions", label: "Transactions" }]} active={tab} onSelect={(next) => { setTab(next); setSelectedIds([]); }} />
      {selectedIds.length > 0 && <Card style={{ marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", borderLeft: `4px solid ${S.gold}` }}><div style={{ fontFamily: S.font, fontSize: 13, color: S.dark, fontWeight: 800 }}>{selectedIds.length} selected</div><div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{["Approve", "Request changes", "Assign review", "Export"].map((action) => <button key={action} onClick={() => bulk(action)} style={{ ...S.btn(action === "Approve" ? S.green : S.surfaceAlt, action === "Approve" ? "#fff" : S.muted), borderColor: S.border }}>{action}</button>)}</div></Card>}
      {normalizedRows.length === 0 ? (
        <EmptyState title="No live operations data" body="This workbench is ready for connected document, flag, and transaction feeds. It does not display placeholder review rows." />
      ) : (
      <div style={{ overflowX: "auto", border: `1px solid ${S.border}`, borderRadius: 10, background: S.card }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}>
          <thead><tr style={{ background: S.surfaceAlt }}><th style={{ padding: 12, width: 42 }}><input type="checkbox" checked={normalizedRows.length > 0 && normalizedRows.every((row) => selectedIds.includes(row.id))} onChange={() => setSelectedIds(selectedIds.length === normalizedRows.length ? [] : normalizedRows.map((row) => row.id))} /></th>{columns.map(([, label]) => <th key={label} style={{ padding: "12px 14px", textAlign: "left", fontFamily: S.font, fontSize: 11, textTransform: "uppercase", letterSpacing: 1.2, color: S.light }}>{label}</th>)}</tr></thead>
          <tbody>{normalizedRows.map((row) => <tr key={row.id} style={{ borderTop: `1px solid ${S.border}` }}><td style={{ padding: 12 }}><input type="checkbox" checked={selectedIds.includes(row.id)} onChange={() => toggle(row.id)} /></td>{columns.map(([key]) => <td key={key} style={{ padding: "12px 14px", fontFamily: S.font, fontSize: 12.5, color: S.muted, verticalAlign: "top" }}>{["status", "severity"].includes(key) ? <Badge tone={["approved", "In Progress", "info"].includes(row[key]) ? "good" : ["critical", "Blocked"].includes(row[key]) ? "warn" : "accent"}>{row[key]}</Badge> : row[key]}</td>)}</tr>)}</tbody>
        </table>
      </div>
      )}
    </div>
  );
}
