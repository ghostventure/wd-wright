import React from "react";

function getBrandLockupStyle(themeMode, context = "header") {
  const isHero = context === "hero";
  if (themeMode === "wright-night") {
    return {
      wrap: {
        display: "inline-flex",
        padding: isHero ? "14px 18px" : "10px 14px",
        borderRadius: isHero ? 24 : 18,
        background: isHero ? "rgba(255,255,255,0.94)" : "rgba(255,255,255,0.92)",
        border: "1px solid rgba(255,255,255,0.18)",
        boxShadow: isHero ? "0 18px 34px rgba(0,0,0,0.24)" : "0 10px 22px rgba(0,0,0,0.16)",
      },
      image: {
        filter: "drop-shadow(0 8px 14px rgba(0,0,0,0.12)) saturate(1.02)",
      },
    };
  }
  if (themeMode === "wright-safety") {
    return {
      wrap: {
        display: "inline-flex",
        padding: isHero ? "14px 18px" : "10px 14px",
        borderRadius: isHero ? 24 : 18,
        background: isHero ? "rgba(252,248,234,0.96)" : "rgba(252,248,234,0.94)",
        border: "1px solid rgba(240,174,47,0.28)",
        boxShadow: isHero ? "0 18px 34px rgba(12,16,5,0.28)" : "0 10px 22px rgba(12,16,5,0.18)",
      },
      image: {
        filter: "drop-shadow(0 8px 14px rgba(0,0,0,0.12)) saturate(1.04) contrast(1.02)",
      },
    };
  }
  return {
    wrap: {
      display: "inline-flex",
      padding: isHero ? "10px 0" : 0,
      borderRadius: isHero ? 18 : 0,
      background: "transparent",
      border: "none",
      boxShadow: "none",
    },
    image: {
      filter: isHero ? "drop-shadow(0 18px 28px rgba(0,0,0,0.24))" : "none",
    },
  };
}

export default function WDWrightBrandLockup({
  themeMode = "wright-day",
  context = "header",
  width = 220,
  alt = "WD Wright a right traffic company",
}) {
  const styles = getBrandLockupStyle(themeMode, context);
  return (
    <span style={styles.wrap}>
      <img
        src="/wdwright/wd-wright-legacy-lockup.webp"
        alt={alt}
        style={{ display: "block", width, height: "auto", ...styles.image }}
      />
    </span>
  );
}
