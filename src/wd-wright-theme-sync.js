"use client";

import { useEffect, useState } from "react";

export const WRIGHT_THEME_MODE_STORAGE_KEY = "wd-wright-theme";
export const WRIGHT_THEME_OPTIONS = [
  { key: "wright-day", label: "Wright Day" },
  { key: "wright-night", label: "Wright Night" },
  { key: "wright-safety", label: "Safety Grid" },
];

const THEME_CHANNEL_NAME = "wd-wright-theme";
const VALID_THEME_KEYS = new Set(WRIGHT_THEME_OPTIONS.map((option) => option.key));

function canUseWindow() {
  return typeof window !== "undefined";
}

export function getStoredThemeMode() {
  if (!canUseWindow()) return "wright-day";
  try {
    const stored = window.localStorage.getItem(WRIGHT_THEME_MODE_STORAGE_KEY);
    return VALID_THEME_KEYS.has(stored) ? stored : "wright-day";
  } catch {
    return "wright-day";
  }
}

export function applyThemeMode(themeMode) {
  if (typeof document === "undefined") return;
  const nextTheme = VALID_THEME_KEYS.has(themeMode) ? themeMode : "wright-day";
  document.documentElement.dataset.wdWrightTheme = nextTheme;
  document.documentElement.classList.toggle("dark", nextTheme !== "wright-day");
}

export function persistThemeMode(themeMode) {
  if (!canUseWindow()) return;
  const nextTheme = VALID_THEME_KEYS.has(themeMode) ? themeMode : "wright-day";
  try {
    window.localStorage.setItem(WRIGHT_THEME_MODE_STORAGE_KEY, nextTheme);
  } catch {
    // Non-blocking.
  }
  try {
    const channel = new BroadcastChannel(THEME_CHANNEL_NAME);
    channel.postMessage({ themeMode: nextTheme, at: Date.now() });
    channel.close();
  } catch {
    // BroadcastChannel is optional.
  }
}

export function subscribeToThemeMode(handler) {
  if (!canUseWindow() || typeof handler !== "function") {
    return () => {};
  }

  let channel = null;

  const onStorage = (event) => {
    if (event.key !== WRIGHT_THEME_MODE_STORAGE_KEY || !event.newValue) return;
    if (!VALID_THEME_KEYS.has(event.newValue)) return;
    handler(event.newValue);
  };

  window.addEventListener("storage", onStorage);

  try {
    channel = new BroadcastChannel(THEME_CHANNEL_NAME);
    channel.addEventListener("message", (event) => {
      const nextTheme = event?.data?.themeMode;
      if (VALID_THEME_KEYS.has(nextTheme)) handler(nextTheme);
    });
  } catch {
    channel = null;
  }

  return () => {
    window.removeEventListener("storage", onStorage);
    try {
      channel?.close();
    } catch {
      // Ignore close failures.
    }
  };
}

export function useWrightThemeMode(defaultTheme = "wright-day") {
  const [themeMode, setThemeMode] = useState(() => {
    const stored = getStoredThemeMode();
    return VALID_THEME_KEYS.has(stored) ? stored : defaultTheme;
  });

  useEffect(() => {
    applyThemeMode(themeMode);
    persistThemeMode(themeMode);
  }, [themeMode]);

  useEffect(() => subscribeToThemeMode((nextTheme) => {
    setThemeMode((current) => (current === nextTheme ? current : nextTheme));
  }), []);

  return [themeMode, setThemeMode];
}
