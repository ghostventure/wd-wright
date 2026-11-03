"use client";

import React, { useEffect } from "react";
import WDWrightPublicPage from "../../src/WDWrightPublicPage.jsx";

export default function LandingPage() {
  useEffect(() => {
    document.title = "Wright Traffic Control";
  }, []);

  return <WDWrightPublicPage initialView="home" />;
}
