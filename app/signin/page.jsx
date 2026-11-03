"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import WDWrightAuthScreen from "../../src/WDWrightAuthScreen.jsx";
import { ensureUserProfile, loadUserProfile } from "../../src/backend.js";
import { auth } from "../../src/firebase.js";
import { announceWrightSignIn, subscribeToWrightAuthSignals } from "../../src/wd-wright-auth-sync.js";

function buildAuthSignalIdentity(user, profile = {}) {
  return {
    uid: user?.uid || "",
    email: user?.email || profile?.email || "",
    accountType: profile?.accountType || "",
    oneId: profile?.oneWrightId || profile?.oneEstateHatId || "",
  };
}

export default function SignInPage() {
  const router = useRouter();
  const [authReady, setAuthReady] = useState(false);
  const [postAuthTarget] = useState(() => {
    if (typeof window === "undefined") return "/home";
    const params = new URLSearchParams(window.location.search);
    const nextTarget = params.get("next") || "/home";
    return nextTarget.startsWith("/") ? nextTarget : "/home";
  });
  const [initialMode] = useState(() => {
    if (typeof window === "undefined") return "login";
    const params = new URLSearchParams(window.location.search);
    return params.get("mode") === "signup" ? "signup" : "login";
  });

  useEffect(() => {
    document.title = initialMode === "signup" ? "Create Wright Account" : "Wright Sign In";
  }, [initialMode]);

  useEffect(() => {
    let active = true;
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!active) return;
      if (!firebaseUser) {
        setAuthReady(true);
        return;
      }

      try {
        const profile = await loadUserProfile(firebaseUser);
        const ensuredProfile = profile || (await ensureUserProfile(firebaseUser));
        announceWrightSignIn(buildAuthSignalIdentity(firebaseUser, ensuredProfile));
      } finally {
        if (active) router.replace(postAuthTarget);
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [postAuthTarget, router]);

  useEffect(() => {
    return subscribeToWrightAuthSignals((signal) => {
      if (signal?.type === "sign_in") {
        router.replace(postAuthTarget);
        return;
      }
      if (signal?.type === "sign_out") {
        Promise.resolve(signOut(auth)).catch(() => {});
        setAuthReady(true);
      }
    });
  }, [postAuthTarget, router]);

  function handleAuth() {
    router.replace(postAuthTarget);
  }

  if (!authReady) {
    return <div className="app-loader">Loading sign in&hellip;</div>;
  }

  return <WDWrightAuthScreen onAuth={handleAuth} initialMode={initialMode} onOpenPublicPage={(page) => router.push(`/${String(page).replace(/^\//, "")}`)} />;
}
