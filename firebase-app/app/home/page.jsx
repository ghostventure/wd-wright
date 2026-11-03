"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import WDWrightAuthenticatedApp from "../../src/WDWrightAuthenticatedApp.jsx";
import { ensureUserProfile, loadUserProfile } from "../../src/backend.js";
import { auth } from "../../src/firebase.js";
import { LoadingSkeleton } from "../../src/WDWrightUiKit.jsx";
import { saveCanonicalWrightProfile } from "../../src/wd-wright-account-services.js";
import { announceWrightSignOut, subscribeToWrightAuthSignals } from "../../src/wd-wright-auth-sync.js";
import { useWrightThemeMode, WRIGHT_THEME_OPTIONS } from "../../src/wd-wright-theme-sync.js";
import { useInactivityLogout } from "../../src/useInactivityLogout.js";

function buildAuthSignalIdentity(user = {}) {
  return {
    uid: user?.uid || "",
    email: user?.email || "",
    accountType: user?.accountType || "",
    oneId: user?.oneWrightId || user?.oneEstateHatId || "",
  };
}

function BootFrame({ title, description, actions, themeMode, onThemeChange, loading = false }) {
  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "linear-gradient(180deg, var(--wdw-bg) 0%, var(--wdw-bg-alt) 100%)", color: "var(--wdw-text)", fontFamily: "'Barlow', 'Helvetica Neue', sans-serif" }}>
      <div style={{ width: "min(560px, 100%)", padding: 28, borderRadius: 24, border: "1px solid var(--wdw-line)", background: "var(--wdw-card)", boxShadow: "0 24px 60px var(--wdw-shadow-strong)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "start", flexWrap: "wrap", marginBottom: 14 }}>
          <span style={{ display: "inline-block", color: "var(--wdw-accent)", fontSize: 12, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase" }}>Wright Workspace</span>
          <div style={{ display: "inline-flex", gap: 6, padding: 6, borderRadius: 999, border: "1px solid var(--wdw-line)", background: "var(--wdw-card-soft)" }}>
            {WRIGHT_THEME_OPTIONS.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => onThemeChange(option.key)}
                style={{
                  minHeight: 34,
                  borderRadius: 999,
                  border: "none",
                  padding: "0 12px",
                  cursor: "pointer",
                  background: themeMode === option.key ? "var(--wdw-text-strong)" : "transparent",
                  color: themeMode === option.key ? "var(--wdw-card)" : "var(--wdw-text)",
                  fontFamily: "'Barlow', 'Helvetica Neue', sans-serif",
                  fontSize: 11.5,
                  fontWeight: 800,
                }}
              >
                {option.label.replace("Wright ", "")}
              </button>
            ))}
          </div>
        </div>
        <h1 style={{ margin: "0 0 10px", fontFamily: "'Oswald', 'Arial Narrow', sans-serif", fontSize: "clamp(2rem, 4vw, 3rem)", lineHeight: 1, textTransform: "uppercase", color: "var(--wdw-text-strong)" }}>{title}</h1>
        <p style={{ margin: 0, color: "var(--wdw-text-muted)", fontSize: "1rem", lineHeight: 1.7 }}>{description}</p>
        {loading ? <div style={{ marginTop: 20 }}><LoadingSkeleton rows={4} palette={{ panelSoft: "var(--wdw-card-soft)" }} /></div> : null}
        {actions ? <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 22 }}>{actions}</div> : null}
      </div>
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [authReady, setAuthReady] = useState(false);
  const [user, setUser] = useState(null);
  const [fatalError, setFatalError] = useState("");
  const [themeMode, setThemeMode] = useWrightThemeMode();

  useEffect(() => {
    document.title = "Wright Workspace";
  }, []);

  useEffect(() => {
    let active = true;

    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        if (!active) return;

        try {
          if (!firebaseUser) {
            setUser(null);
            setFatalError("");
            setAuthReady(true);
            return;
          }

          const profile = (await loadUserProfile(firebaseUser)) || (await ensureUserProfile(firebaseUser));
          if (!active) return;
          setUser(profile);
          setFatalError("");
        } catch (error) {
          if (!active) return;
          setFatalError(error instanceof Error ? error.message : "Unable to initialize your Wright account.");
        } finally {
          if (active) setAuthReady(true);
        }
      },
      (error) => {
        if (!active) return;
        setFatalError(error instanceof Error ? error.message : "Authentication failed to initialize.");
        setAuthReady(true);
      }
    );

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    return subscribeToWrightAuthSignals((signal) => {
      if (signal?.type !== "sign_out") return;
      Promise.resolve(signOut(auth)).catch(() => {});
      setUser(null);
      setFatalError("");
      setAuthReady(true);
      router.replace("/signin");
    });
  }, [router]);

  async function handleLogout() {
    try {
      announceWrightSignOut(buildAuthSignalIdentity(auth.currentUser || user || {}));
      await signOut(auth);
    } finally {
      setUser(null);
      router.replace("/signin");
    }
  }

  async function handleSaveProfile(profile) {
    if (!auth.currentUser?.uid) {
      throw new Error("You must be signed in to save your profile.");
    }

    const saved = await saveCanonicalWrightProfile(auth.currentUser.uid, profile, auth.currentUser);
    setUser(saved);
    return saved;
  }

  useInactivityLogout({
    enabled: Boolean(user),
    onTimeout: handleLogout,
  });

  if (!authReady) {
    return <BootFrame title="Loading Wright Workspace" description="Restoring your account, profile record, and local session." themeMode={themeMode} onThemeChange={setThemeMode} loading />;
  }

  if (fatalError) {
    return (
      <BootFrame
        title="Wright needs attention"
        description={fatalError}
        actions={<button onClick={() => window.location.reload()}>Reload</button>}
        themeMode={themeMode}
        onThemeChange={setThemeMode}
      />
    );
  }

  if (!user) {
    return (
      <BootFrame
        title="Sign in to open Wright"
        description="The Wright workspace is ready once your account is signed in."
        actions={
          <>
            <button onClick={() => router.replace("/signin")}>Sign In</button>
            <button onClick={() => router.replace("/")}>Public Site</button>
          </>
        }
        themeMode={themeMode}
        onThemeChange={setThemeMode}
      />
    );
  }

  return <WDWrightAuthenticatedApp initialUser={user} onLogout={handleLogout} onSaveProfile={handleSaveProfile} onOpenPublicPage={(target) => router.push(target)} />;
}
