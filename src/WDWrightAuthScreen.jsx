"use client";

import React, { useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  getRedirectResult,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  updateProfile,
} from "firebase/auth";
import { auth } from "./firebase.js";
import { defaultProfile, ensureUserProfile } from "./backend.js";
import WDWrightBrandLockup from "./WDWrightBrandLockup.jsx";
import WDWrightPublicFooter from "./WDWrightPublicFooter.jsx";
import { AmbientSection, QuickActionRail, SegmentedThemeToggle, StatusPill } from "./WDWrightUiKit.jsx";
import { announceWrightSignIn } from "./wd-wright-auth-sync.js";
import { useWrightThemeMode, WRIGHT_THEME_OPTIONS } from "./wd-wright-theme-sync.js";
import { WDWRIGHT_THEME } from "./wd-wright-theme.js";

const SHARED_AUTH_THEME = {
  bg: "linear-gradient(180deg, var(--wdw-bg) 0%, var(--wdw-bg-alt) 55%, var(--wdw-bg) 100%)",
  panel: "var(--wdw-card)",
  text: "var(--wdw-text)",
  muted: "var(--wdw-text-muted)",
  dark: "var(--wdw-text-strong)",
  pine: "var(--wdw-asphalt)",
  amber: "var(--wdw-accent)",
  accentText: "#ffffff",
  line: "var(--wdw-line)",
  fieldBg: "var(--wdw-field-bg)",
  fieldText: "var(--wdw-field-text)",
  shellShadow: "0 20px 56px var(--wdw-shadow-strong)",
};

const AUTH_THEMES = Object.fromEntries(
  ["wright-day", "wright-night", "wright-safety"].map((mode) => [mode, SHARED_AUTH_THEME])
);

const ACCOUNT_PURPOSE_OPTIONS = [
  ["customer", "Requesting traffic control services", "buyer"],
  ["contractor", "Prime contractor, utility, or project partner", "corp_buyer"],
  ["public_agency", "Public agency or municipality", "corp_seller"],
  ["job_seeker", "Looking for traffic-control work", "seller"],
];

const VALUE_PROPS = [
  ["One account", "Use one WD Wright account for quote requests, documents, help, scheduling access, and account management."],
  ["Faster follow-up", "Save your service needs, timeline, budget, language, timezone, and contact preferences so future requests move faster."],
  ["Protected access", "Service requests, payment-related pages, and document-related pages stay behind sign-in."],
  ["Better visibility", "Your dashboard brings booking, scheduling, profile details, security controls, and account settings into one place."],
];

const ACCESS_METRICS = [
  ["One account", "Shared sign-in across quotes, help, documents, and dashboard"],
  ["Protected", "Request, payment-related, and document-related pages stay behind sign-in"],
  ["Profile-led", "Saved account details help speed up future support"],
];

const ACCESS_JUMP_POINTS = [
  ["Field coverage", "Live traffic control support, lane closures, and crew deployment coordination.", "/wdwright/flagging-services.jpg"],
  ["Smart work zone", "Guardian SmartFlagger and connected work-zone technology routing.", "/wdwright/guardian-smartflagger.jpg"],
];

const COMPANY_ACCESS_POINTS = [
  ["Manager's Desk", "Approved managers can review routing, capacity, shift feed, and desk-level operational posture after sign-in."],
  ["Company Rep Access", "Dispatch, coordinator, and office users should sign in with their approved WD Wright work credentials."],
];

function normalizeEmail(value) {
  return value.trim().toLowerCase();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isStrongPassword(password) {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password);
}

function friendlyError(error, intent = "auth") {
  const code = error?.code || "";
  if (
    code === "auth/invalid-credential" ||
    code === "auth/wrong-password" ||
    code === "auth/user-not-found" ||
    code === "auth/invalid-login-credentials"
  ) {
    return "Invalid email or password.";
  }
  if (code === "auth/email-already-in-use") {
    return "That email already has an account. Sign in instead.";
  }
  if (code === "auth/weak-password") {
    return "Use at least 8 characters with uppercase, lowercase, and a number.";
  }
  if (code === "auth/too-many-requests") {
    return "Too many sign-in attempts. Pause and try again shortly.";
  }
  if (code === "wdwright/profile-persistence-failed") return error.message;
  if (intent === "reset") {
    return "Password reset failed. Please try again.";
  }
  return intent === "signup" ? "Account creation failed. Please try again." : "Sign-in failed. Please try again.";
}

function buildAuthSignalIdentity(user, profile = {}, fallbackAccountType = "") {
  return {
    uid: user?.uid || "",
    email: user?.email || profile?.email || "",
    accountType: profile?.accountType || fallbackAccountType || "",
    oneId: profile?.oneWrightId || profile?.oneEstateHatId || "",
  };
}

export default function WDWrightAuthScreen({ onAuth, initialMode = "login", onOpenPublicPage }) {
  const [themeMode, setThemeMode] = useWrightThemeMode();
  const [mode, setMode] = useState(initialMode === "signup" ? "signup" : "login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [accountType, setAccountType] = useState("buyer");
  const [accountPurpose, setAccountPurpose] = useState("");
  const [preferredContact, setPreferredContact] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const palette = AUTH_THEMES[themeMode] || AUTH_THEMES["wright-day"];

  useEffect(() => {
    let mounted = true;

    async function finishRedirectLogin() {
      try {
        const credential = await getRedirectResult(auth);
        if (!mounted || !credential?.user) return;
        const profile = await ensureUserProfile(credential.user);
        announceWrightSignIn(buildAuthSignalIdentity(credential.user, profile));
        onAuth?.(profile);
      } catch (nextError) {
        if (mounted) setError(friendlyError(nextError));
      }
    }

    finishRedirectLogin();
    return () => {
      mounted = false;
    };
  }, [onAuth]);

  useEffect(() => {
    setMode(initialMode === "signup" ? "signup" : "login");
  }, [initialMode]);

  async function handleLogin(event) {
    event.preventDefault();
    if (loading) return;
    const cleanEmail = normalizeEmail(email);
    if (!isValidEmail(cleanEmail)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);
    setError("");
    setNotice("");
    try {
      const credential = await signInWithEmailAndPassword(auth, cleanEmail, password);
      const profile = await ensureUserProfile(credential.user);
      announceWrightSignIn(buildAuthSignalIdentity(credential.user, profile));
      onAuth?.(profile);
    } catch (nextError) {
      setError(friendlyError(nextError));
    } finally {
      setLoading(false);
    }
  }

  async function handleSignup(event) {
    event.preventDefault();
    if (loading) return;
    const cleanEmail = normalizeEmail(email);
    if (name.trim().length < 2) {
      setError("Please enter your name.");
      return;
    }
    if (!isValidEmail(cleanEmail)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!isStrongPassword(password)) {
      setError("Use at least 8 characters with uppercase, lowercase, and a number.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!accountPurpose) {
      setError("Choose what brings you to WD Wright so we can set up the right profile.");
      return;
    }
    if (!preferredContact) {
      setError("Choose how you prefer Wright to contact you.");
      return;
    }
    if (accountPurpose === "wright_team" && !cleanEmail.endsWith("@wdwright.com")) {
      setError("Use your WD Wright work email for team access. Use a customer or project-partner purpose for other accounts.");
      return;
    }
    if (["phone", "sms"].includes(preferredContact) && phone.replace(/\D/g, "").length < 7) {
      setError("Add a callback number to use phone or text as your preferred contact method.");
      return;
    }

    setLoading(true);
    setError("");
    setNotice("");
    try {
      const credential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      await updateProfile(credential.user, { displayName: name.trim() }).catch(() => {});
      const profile = defaultProfile(credential.user, {
        name: name.trim(),
        email: cleanEmail,
        phone: phone.trim(),
        accountType,
        userDatabase: {
          leadSource: "wd-wright-site",
          targetMarket: "",
          transactionIntent: "service",
          accountPurpose,
          preferredContact,
          organizationName: "",
        },
      });
      const ensured = await ensureUserProfile(credential.user, profile, { throwOnError: true });
      announceWrightSignIn(buildAuthSignalIdentity(credential.user, ensured, accountType));
      onAuth?.(ensured);
    } catch (nextError) {
      setError(friendlyError(nextError, "signup"));
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword() {
    if (loading) return;
    const cleanEmail = normalizeEmail(email);
    if (!isValidEmail(cleanEmail)) {
      setError("Enter your email address first, then try reset password again.");
      return;
    }

    setLoading(true);
    setError("");
    setNotice("");
    try {
      await sendPasswordResetEmail(auth, cleanEmail);
      setNotice(`Password reset email sent to ${cleanEmail}.`);
    } catch (nextError) {
      setError(friendlyError(nextError, "reset"));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    if (loading) return;
    setLoading(true);
    setError("");
    setNotice("");
    const provider = new GoogleAuthProvider();

    try {
      const credential = await signInWithPopup(auth, provider);
      const profile = await ensureUserProfile(credential.user);
      announceWrightSignIn(buildAuthSignalIdentity(credential.user, profile));
      onAuth?.(profile);
    } catch (nextError) {
      if (nextError?.code === "auth/popup-blocked" || nextError?.code === "auth/popup-closed-by-user") {
        setNotice("Popup blocked or closed. Redirecting to Google sign-in...");
        await signInWithRedirect(auth, provider);
        return;
      }
      setError(friendlyError(nextError));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: palette.bg, padding: 20, color: palette.text, fontFamily: WDWRIGHT_THEME.sans }}>
      <div style={{ width: "min(var(--wdw-content-width, 1180px), 100%)", margin: "0 auto", display: "grid", gap: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <StatusPill label={mode === "login" ? "Return access" : "New account"} tone="accent" palette={{ line: palette.line, panelSoft: palette.panel, muted: palette.muted, accentSoft: "var(--wdw-accent-soft)", accent: palette.amber, strong: palette.pine }} />
            <StatusPill label="OneID synced" palette={{ line: palette.line, panelSoft: palette.panel, muted: palette.muted }} />
          </div>
          <SegmentedThemeToggle
            options={WRIGHT_THEME_OPTIONS.map((option) => ({ key: option.key, label: option.label.replace("Wright ", "") }))}
            value={themeMode}
            onChange={setThemeMode}
            palette={{ line: palette.line, panelSoft: palette.panel, dark: palette.dark, accentText: themeMode === "wright-day" ? "#fff" : "#071013", text: palette.text }}
          />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.08fr) minmax(320px, 0.92fr)", gap: 20 }}>
          <AmbientSection palette={{ line: "rgba(255,255,255,0.08)", panel: "linear-gradient(180deg, rgba(0,0,0,0.98) 0%, rgba(39,39,39,0.97) 58%, rgba(62,62,62,0.95) 100%)" }} style={{ padding: 24, color: "#f3f7f4", boxShadow: "0 28px 70px rgba(9, 26, 28, 0.28)", display: "grid", gap: 16 }}>
            <div
              style={{
                position: "relative",
                minHeight: 420,
                borderRadius: 24,
                overflow: "hidden",
                background: "#0d0d0d",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <img
                src="/wdwright/hero-road-signal.jpg"
                alt="WD Wright traffic control field operations"
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(180deg, rgba(0,0,0,0.16) 0%, rgba(0,0,0,0.42) 42%, rgba(0,0,0,0.84) 100%)",
                }}
              />
              <div
                style={{
                  position: "relative",
                  zIndex: 1,
                  minHeight: 420,
                  padding: "24px clamp(18px, 4vw, 28px)",
                  display: "grid",
                  alignContent: "space-between",
                  gap: 18,
                }}
              >
                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", color: palette.amber, marginBottom: 10 }}>
                    Wright Account Access
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <WDWrightBrandLockup themeMode={themeMode} context="hero" width="min(360px, 70vw)" />
                  </div>
                  <h1 style={{ margin: 0, fontFamily: WDWRIGHT_THEME.display, fontSize: "clamp(2.8rem, 6vw, 5rem)", lineHeight: 0.94, textTransform: "uppercase", maxWidth: 720 }}>
                    Sign in for quotes, documents, scheduling, and account access.
                  </h1>
                  <p style={{ margin: "14px 0 0", fontSize: 15, lineHeight: 1.8, color: "rgba(243,247,244,0.82)", maxWidth: 640 }}>
                    Your WD Wright account keeps quote requests, documents, help, profile details, and dashboard access together in one place.
                  </p>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 }}>
                  {ACCESS_METRICS.map(([title, body]) => (
                    <div key={title} style={{ borderRadius: 18, padding: 14, background: "rgba(0,0,0,0.42)", border: "1px solid rgba(255,255,255,0.14)", backdropFilter: "blur(12px)" }}>
                      <div style={{ fontFamily: WDWRIGHT_THEME.display, fontSize: 24, lineHeight: 1, textTransform: "uppercase", color: "#fff", marginBottom: 6 }}>{title}</div>
                      <div style={{ fontSize: 12.5, lineHeight: 1.65, color: "rgba(243,247,244,0.82)" }}>{body}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <QuickActionRail
              palette={{ line: "rgba(255,255,255,0.10)", panelSoft: "rgba(255,255,255,0.08)", dark: "#ffffff", muted: "rgba(243,247,244,0.82)", strong: "#dbe92e" }}
              items={[
                { kicker: "Access", label: "Quotes and booking", body: "Keep requests tied to one account so follow-up is faster and cleaner." },
                { kicker: "Control", label: "Documents and help", body: "Protected pages, support context, and dashboard access stay connected." },
                { kicker: "Speed", label: "Saved profile context", body: "Service intent, contact method, and readiness details carry forward." },
              ]}
            />

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
              {VALUE_PROPS.map(([title, body]) => (
                <div key={title} style={{ borderRadius: 18, padding: 16, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "#dbe92e", marginBottom: 8 }}>{title}</div>
                  <div style={{ fontSize: 13.5, lineHeight: 1.65, color: "rgba(243,247,244,0.82)" }}>{body}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
              {ACCESS_JUMP_POINTS.map(([title, body, image]) => (
                <div key={title} style={{ borderRadius: 20, overflow: "hidden", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  <img src={image} alt={title} loading="lazy" decoding="async" style={{ width: "100%", height: 148, objectFit: "cover", display: "block" }} />
                  <div style={{ padding: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: "#f4a422", marginBottom: 8 }}>
                      {title}
                    </div>
                    <div style={{ fontSize: 13.5, lineHeight: 1.65, color: "rgba(243,247,244,0.82)" }}>{body}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ borderRadius: 20, padding: 18, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: "#f4a422", marginBottom: 8 }}>
                Company access
              </div>
              <div style={{ display: "grid", gap: 10 }}>
                {COMPANY_ACCESS_POINTS.map(([title, body]) => (
                  <div key={title}>
                    <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "#ffffff", marginBottom: 4 }}>
                      {title}
                    </div>
                    <div style={{ fontSize: 13.5, lineHeight: 1.65, color: "rgba(243,247,244,0.82)" }}>{body}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ borderRadius: 20, padding: 18, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: "#f4a422", marginBottom: 8 }}>
                Included now
              </div>
              <div style={{ display: "grid", gap: 8 }}>
                {[
                  "WD Wright account creation and sign-in",
                  "A personal dashboard for booking, scheduling, profile updates, and documents",
                  "Protected customer and team access across the WD Wright site",
                ].map((item) => (
                  <div key={item} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <span style={{ color: "#f4a422", fontWeight: 800 }}>•</span>
                    <span style={{ fontSize: 13.5, lineHeight: 1.6 }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </AmbientSection>

          <section style={{ borderRadius: 28, padding: 28, background: palette.panel, border: `1px solid ${palette.line}`, boxShadow: palette.shellShadow }}>
            <div style={{ display: "flex", gap: 8, padding: 6, borderRadius: 999, background: "rgba(17,38,40,0.04)", marginBottom: 18 }}>
              {[
                ["login", "Sign In"],
                ["signup", "Create Account"],
              ].map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setMode(key);
                    setError("");
                    setNotice("");
                  }}
                  style={{
                    flex: 1,
                    minHeight: 44,
                    borderRadius: 999,
                    border: "none",
                    cursor: "pointer",
                    background: mode === key ? palette.dark : "transparent",
                    color: mode === key ? (themeMode === "wright-day" ? "#fff" : "#071013") : palette.text,
                    fontFamily: WDWRIGHT_THEME.sans,
                    fontSize: 13.5,
                    fontWeight: 800,
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: palette.amber, marginBottom: 8 }}>
                {mode === "login" ? "Return to Wright" : "Create Wright Access"}
              </div>
              <h2 style={{ margin: 0, fontFamily: WDWRIGHT_THEME.display, fontSize: 42, lineHeight: 0.96, textTransform: "uppercase", color: palette.dark }}>
                {mode === "login" ? "Open your dashboard." : "Set up your WD Wright account."}
              </h2>
              <p style={{ margin: "10px 0 0", fontSize: 14, lineHeight: 1.7, color: palette.muted }}>
                {mode === "login"
                  ? "Use your account to manage profile details, documents, scheduling, and service requests."
                  : "Create an account for quote follow-up, recruiting, or internal coordination. Administrative access remains tied to approved Wright emails."}
              </p>
            </div>

            <div style={{ borderRadius: 18, border: `1px solid ${palette.line}`, background: "rgba(17,38,40,0.04)", padding: 16, marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "start", flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: palette.amber, marginBottom: 6 }}>
                    Manager's Desk
                  </div>
                  <div style={{ fontSize: 13.5, lineHeight: 1.65, color: palette.muted, maxWidth: 420 }}>
                    Managers and company reps should use their WD Wright work email here. Approved access routes into the protected `Manager's Desk` after sign-in.
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setMode("login");
                      setError("");
                      setNotice("Manager and company access uses the standard sign-in flow. Use your approved WD Wright work email.");
                    }}
                    style={{ minHeight: 40, borderRadius: 999, border: `1px solid ${palette.line}`, background: "transparent", color: palette.dark, cursor: "pointer", fontFamily: WDWRIGHT_THEME.sans, fontSize: 12.5, fontWeight: 800, padding: "0 14px" }}
                  >
                    Manager Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMode("signup");
                      setAccountType("agent");
                      setAccountPurpose("wright_team");
                      setPreferredContact("email");
                      setError("");
                      setNotice("Company reps can request access here. Manager-capable access still depends on WD Wright approval.");
                    }}
                    style={{ minHeight: 40, borderRadius: 999, border: "none", background: palette.dark, color: themeMode === "wright-day" ? "#fff" : "#071013", cursor: "pointer", fontFamily: WDWRIGHT_THEME.sans, fontSize: 12.5, fontWeight: 800, padding: "0 14px" }}
                  >
                    Company Rep Account
                  </button>
                </div>
              </div>
            </div>

            <form onSubmit={mode === "login" ? handleLogin : handleSignup} style={{ display: "grid", gap: 12 }}>
              {mode === "signup" ? (
                <label style={{ display: "grid", gap: 6, fontSize: 12.5, fontWeight: 700 }}>
                  Full Name
                  <input value={name} onChange={(event) => setName(event.target.value)} style={{ minHeight: 46, borderRadius: 12, border: `1px solid ${palette.line}`, background: palette.fieldBg, color: palette.fieldText, padding: "0 12px", fontFamily: WDWRIGHT_THEME.sans, fontSize: 14 }} />
                </label>
              ) : null}

              <label style={{ display: "grid", gap: 6, fontSize: 12.5, fontWeight: 700 }}>
                Email
                <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} style={{ minHeight: 46, borderRadius: 12, border: `1px solid ${palette.line}`, background: palette.fieldBg, color: palette.fieldText, padding: "0 12px", fontFamily: WDWRIGHT_THEME.sans, fontSize: 14 }} />
              </label>

              {mode === "signup" ? (
                <label style={{ display: "grid", gap: 6, fontSize: 12.5, fontWeight: 700 }}>
                  Phone
                  <input value={phone} onChange={(event) => setPhone(event.target.value)} style={{ minHeight: 46, borderRadius: 12, border: `1px solid ${palette.line}`, background: palette.fieldBg, color: palette.fieldText, padding: "0 12px", fontFamily: WDWRIGHT_THEME.sans, fontSize: 14 }} />
                </label>
              ) : null}

              {mode === "signup" ? (
                <label style={{ display: "grid", gap: 6, fontSize: 12.5, fontWeight: 700 }}>
                  What brings you to WD Wright?
                  <select value={accountPurpose} onChange={(event) => {
                    const nextPurpose = event.target.value;
                    setAccountPurpose(nextPurpose);
                    const option = ACCOUNT_PURPOSE_OPTIONS.find(([value]) => value === nextPurpose);
                    if (option) setAccountType(option[2]);
                  }} style={{ minHeight: 46, borderRadius: 12, border: `1px solid ${palette.line}`, background: palette.fieldBg, color: palette.fieldText, padding: "0 12px", fontFamily: WDWRIGHT_THEME.sans, fontSize: 14 }}>
                    <option value="" disabled>Choose one</option>
                    {accountPurpose === "wright_team" ? <option value="wright_team">WD Wright team member (approved work email)</option> : null}
                    {ACCOUNT_PURPOSE_OPTIONS.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}

              {mode === "signup" ? (
                <label style={{ display: "grid", gap: 6, fontSize: 12.5, fontWeight: 700 }}>
                  Preferred way to contact you
                  <select value={preferredContact} onChange={(event) => setPreferredContact(event.target.value)} style={{ minHeight: 46, borderRadius: 12, border: `1px solid ${palette.line}`, background: palette.fieldBg, color: palette.fieldText, padding: "0 12px", fontFamily: WDWRIGHT_THEME.sans, fontSize: 14 }}>
                    <option value="" disabled>Choose one</option>
                    <option value="email">Email</option>
                    <option value="phone">Phone call</option>
                    <option value="sms">Text message</option>
                  </select>
                  <span style={{ color: palette.muted, fontSize: 11.5, fontWeight: 500 }}>A phone number is needed for calls. Texting is not enabled on this profile yet, and selecting a preference does not enroll you in text messages.</span>
                </label>
              ) : null}

              <label style={{ display: "grid", gap: 6, fontSize: 12.5, fontWeight: 700 }}>
                Password
                <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} style={{ minHeight: 46, borderRadius: 12, border: `1px solid ${palette.line}`, background: palette.fieldBg, color: palette.fieldText, padding: "0 12px", fontFamily: WDWRIGHT_THEME.sans, fontSize: 14 }} />
              </label>

              {mode === "signup" ? (
                <label style={{ display: "grid", gap: 6, fontSize: 12.5, fontWeight: 700 }}>
                  Confirm Password
                  <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} style={{ minHeight: 46, borderRadius: 12, border: `1px solid ${palette.line}`, background: palette.fieldBg, color: palette.fieldText, padding: "0 12px", fontFamily: WDWRIGHT_THEME.sans, fontSize: 14 }} />
                </label>
              ) : null}

              {mode === "login" ? (
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button type="button" onClick={handleResetPassword} disabled={loading} style={{ border: "none", background: "transparent", color: palette.pine, cursor: "pointer", fontFamily: WDWRIGHT_THEME.sans, fontWeight: 800, padding: 0 }}>
                    Reset password
                  </button>
                </div>
              ) : null}

              {error ? <div style={{ borderRadius: 14, padding: "12px 14px", background: "#fde7e2", color: "#a33727", fontSize: 13.5 }}>{error}</div> : null}
              {notice ? <div style={{ borderRadius: 14, padding: "12px 14px", background: "#e7f3ee", color: "#1d5a44", fontSize: 13.5 }}>{notice}</div> : null}

              <button type="submit" disabled={loading} style={{ minHeight: 50, borderRadius: 999, border: "none", background: palette.amber, color: palette.accentText, cursor: loading ? "not-allowed" : "pointer", fontFamily: WDWRIGHT_THEME.sans, fontSize: 14, fontWeight: 800 }}>
                {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
              </button>
            </form>

            <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "18px 0" }}>
              <div style={{ flex: 1, height: 1, background: palette.line }} />
              <span style={{ fontSize: 12, color: palette.muted }}>or</span>
              <div style={{ flex: 1, height: 1, background: palette.line }} />
            </div>

            <button onClick={handleGoogle} disabled={loading} style={{ width: "100%", minHeight: 50, borderRadius: 999, border: `1px solid ${palette.line}`, background: palette.fieldBg, color: palette.dark, cursor: loading ? "not-allowed" : "pointer", fontFamily: WDWRIGHT_THEME.sans, fontSize: 14, fontWeight: 800 }}>
              Continue with Google
            </button>

            <div style={{ marginTop: 18, fontSize: 12.5, lineHeight: 1.7, color: palette.muted }}>
              Signing in or out updates the rest of your open WD Wright pages so your account stays in sync.
            </div>
            <div style={{ marginTop: 12, fontSize: 13, color: palette.muted }}>
              {mode === "login" ? "Need an account?" : "Already have one?"}{" "}
              <span onClick={() => setMode(mode === "login" ? "signup" : "login")} style={{ color: palette.pine, fontWeight: 800, cursor: "pointer" }}>
                {mode === "login" ? "Create one" : "Sign in"}
              </span>
            </div>
          </section>
        </div>

        <WDWrightPublicFooter
          themeMode={themeMode}
          variant="auth"
          onNavigate={(target) => {
            if (target === "signin") {
              setMode("login");
              return;
            }
            if (target === "quote") {
              onOpenPublicPage?.("quote");
              return;
            }
            onOpenPublicPage?.(target);
          }}
        />
      </div>
    </div>
  );
}
