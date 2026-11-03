"use client";

import { useEffect } from "react";

function getDeviceState() {
  if (typeof window === "undefined") {
    return {
      isAndroid: false,
      isMobile: false,
      isNative: false,
      width: 0,
      height: 0,
    };
  }

  const ua = window.navigator.userAgent || "";
  const platform = window.navigator.platform || "";
  const touchPoints = window.navigator.maxTouchPoints || 0;
  const isAndroid = /Android/i.test(ua);
  const isIOS = /iPhone|iPad|iPod/i.test(ua) || (/Mac/i.test(platform) && touchPoints > 1);
  const coarsePointer = window.matchMedia?.("(pointer: coarse)")?.matches === true;
  const narrowViewport = window.innerWidth <= 900;
  const isMobile = isAndroid || isIOS || coarsePointer || narrowViewport;
  const isNative = typeof window.Capacitor?.isNativePlatform === "function" ? window.Capacitor.isNativePlatform() : false;

  return {
    isAndroid,
    isMobile,
    isNative,
    width: window.innerWidth,
    height: window.visualViewport?.height || window.innerHeight,
  };
}

function applyDeviceState(previousState) {
  if (typeof document === "undefined" || typeof window === "undefined") return;

  const root = document.documentElement;
  const state = getDeviceState();

  if (!previousState || previousState.isMobile !== state.isMobile) {
    root.dataset.wdwMobile = state.isMobile ? "true" : "false";
  }
  if (!previousState || previousState.isAndroid !== state.isAndroid) {
    root.dataset.wdwAndroid = state.isAndroid ? "true" : "false";
  }
  if (!previousState || previousState.isNative !== state.isNative) {
    root.dataset.wdwNative = state.isNative ? "true" : "false";
  }
  if (!previousState || previousState.height !== state.height) {
    root.style.setProperty("--wdw-device-vh", `${state.height * 0.01}px`);
  }
  if (!previousState || previousState.width !== state.width) {
    root.style.setProperty("--wdw-device-vw", `${state.width * 0.01}px`);
  }
  return state;
}

export default function WDWrightMobileOptimizer() {
  useEffect(() => {
    let lastState = applyDeviceState();
    let frame = 0;
    const sync = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        lastState = applyDeviceState(lastState);
      });
    };
    const viewport = window.visualViewport;

    window.addEventListener("resize", sync);
    window.addEventListener("orientationchange", sync);
    viewport?.addEventListener("resize", sync);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", sync);
      window.removeEventListener("orientationchange", sync);
      viewport?.removeEventListener("resize", sync);
    };
  }, []);

  return null;
}
