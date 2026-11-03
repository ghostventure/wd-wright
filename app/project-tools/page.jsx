"use client";

import React, { useEffect } from "react";
import WDWrightPublicPage from "../../src/WDWrightPublicPage.jsx";

export default function ProjectToolsPage() {
  useEffect(() => {
    document.title = "Project Planning Tools | Wright Traffic Control";
  }, []);

  return <WDWrightPublicPage initialView="project-tools" />;
}
