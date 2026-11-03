import React, { useEffect, useState } from "react";
import EstateHatPublicFooter from "./EstateHatPublicFooter.jsx";

const palette = {
  bg: "#f3eee6",
  ink: "#1f1a15",
  muted: "#5e5347",
  card: "rgba(255,255,255,0.9)",
  border: "rgba(31,26,21,0.12)",
  accent: "#c56f2d",
  accentDeep: "#9f4f15",
  pine: "#0f5b52",
  pineSoft: "rgba(15,91,82,0.12)",
  sand: "#f8f1e8",
  serif: "'DM Serif Display', Georgia, serif",
  sans: "'Plus Jakarta Sans', system-ui, sans-serif",
};

const FEATURES = [
  {
    title: "Know What To Do Next",
    body: "EstateHat keeps the listing, messages, forms, and next steps in one place so the sale feels easier to follow.",
  },
  {
    title: "Feel Safer From The Start",
    body: "Profiles, documents, and role checks help buyers and sellers understand who they are working with.",
  },
  {
    title: "See The Costs Up Front",
    body: "The fee model is presented plainly so people are not surprised late in the process.",
  },
  {
    title: "Use It Anywhere",
    body: "The web app works across phones and desktops, so the same sale stays with you.",
  },
];

const INTRO_SLIDES = [
  {
    id: "workflow",
    eyebrow: "One EstateHat",
    title: "Keep the listing, forms, messages, and next steps in one place.",
    body: "EstateHat is strongest when it works like one connected home-sale workspace instead of scattered tabs, texts, and documents.",
    image: "/landing/estatehat-intro-workflow.png",
    points: ["List or search from one account", "Track forms and document steps", "See what to do next without guesswork"],
  },
  {
    id: "trust",
    eyebrow: "Trust before stress",
    title: "Move forward with clearer identity, role, and closing boundaries.",
    body: "The public site leans hardest on verification posture, role separation, and licensed escrow boundaries to make the process feel safer and easier to follow.",
    image: "/landing/estatehat-intro-closing.png",
    points: ["U.S.-verified buyer and seller workflows", "Role checks reduce conflicts of interest", "Funds move through licensed escrow partners"],
  },
  {
    id: "clarity",
    eyebrow: "Cost clarity",
    title: "Show the fee story and closing path early.",
    body: "The most useful promise is not hype. It is simple guidance, visible costs, and fewer surprises as the sale moves toward closing.",
    metrics: [
      ["Platform fee", "1.50%"],
      ["Listing fee", "No upfront listing fee"],
      ["Support flow", "Move Kit, Forms, Hat Data"],
    ],
    checklist: [
      "Guided steps instead of scattered reminders",
      "Public/legal pages keep scope clear",
      "Works across web, phone, and desktop",
    ],
  },
];

function CtaButton({ label, onClick, tone = "primary", disabled = false }) {
  const isPrimary = tone === "primary";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        border: isPrimary ? "none" : `1px solid ${palette.border}`,
        background: isPrimary ? `linear-gradient(135deg, ${palette.accent} 0%, ${palette.accentDeep} 100%)` : "transparent",
        color: isPrimary ? "#fff" : palette.ink,
        borderRadius: 8,
        minHeight: 48,
        padding: "0 22px",
        maxWidth: "100%",
        fontFamily: palette.sans,
        fontSize: 14,
        fontWeight: 700,
        cursor: disabled ? "default" : "pointer",
        whiteSpace: "normal",
      }}
    >
      {label}
    </button>
  );
}

function IntroReel() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % INTRO_SLIDES.length);
    }, 4200);

    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <div
      className="estatehat-intro-reel"
      style={{
        position: "relative",
        minHeight: 520,
        height: "100%",
        background: `linear-gradient(165deg, ${palette.pine} 0%, #0c3f39 100%)`,
        overflow: "hidden",
      }}
    >
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 12% 12%, rgba(255,255,255,0.18), transparent 28%)" }} />
      <div className="estatehat-intro-topline" style={{ position: "absolute", top: 20, left: 20, right: 20, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, zIndex: 3 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, borderRadius: 999, border: "1px solid rgba(255,255,255,0.14)", background: "rgba(255,255,255,0.1)", padding: "7px 12px", color: "rgba(255,255,255,0.92)", fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 800 }}>
          <span style={{ width: 8, height: 8, borderRadius: 999, background: "#67f0d7", boxShadow: "0 0 18px rgba(103,240,215,0.8)" }} />
          Intro Reel
        </div>
        <div style={{ color: "rgba(255,255,255,0.72)", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase" }}>Muted autoplay</div>
      </div>

      <div style={{ position: "absolute", top: 58, left: 20, right: 20, display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8, zIndex: 3 }}>
        {INTRO_SLIDES.map((slide, index) => (
          <button
            key={slide.id}
            type="button"
            onClick={() => setActiveIndex(index)}
            aria-label={`Show ${slide.eyebrow} slide`}
            style={{
              border: "none",
              height: 5,
              borderRadius: 999,
              background: index === activeIndex ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.24)",
              cursor: "pointer",
              padding: 0,
            }}
          />
        ))}
      </div>

      {INTRO_SLIDES.map((slide, index) => {
        const isActive = index === activeIndex;
        return (
          <article
            key={slide.id}
            className={`estatehat-intro-slide${isActive ? " is-active" : ""}`}
            aria-hidden={!isActive}
            style={{
              position: "absolute",
              inset: 0,
              opacity: isActive ? 1 : 0,
              transform: isActive ? "scale(1)" : "scale(1.02)",
              transition: "opacity 700ms ease, transform 700ms ease",
            }}
          >
            {"image" in slide ? (
              <>
                <img
                  src={slide.image}
                  alt={slide.title}
                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(7,29,27,0.86) 0%, rgba(7,29,27,0.58) 42%, rgba(7,29,27,0.18) 100%)" }} />
                <div className="estatehat-intro-copy" style={{ position: "absolute", left: 26, right: 26, bottom: 26, display: "grid", gap: 14, maxWidth: 420 }}>
                  <div>
                    <div style={{ color: "#f4c285", fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 800 }}>{slide.eyebrow}</div>
                    <div style={{ marginTop: 10, color: "#fff", fontFamily: palette.serif, fontSize: "clamp(2rem, 4vw, 2.65rem)", lineHeight: 1.04 }}>{slide.title}</div>
                    <div style={{ marginTop: 10, color: "rgba(255,255,255,0.8)", fontSize: 14, lineHeight: 1.65 }}>{slide.body}</div>
                  </div>
                  <div style={{ display: "grid", gap: 8 }}>
                    {slide.points.map((point) => (
                      <div key={point} style={{ display: "flex", alignItems: "center", gap: 10, borderRadius: 8, background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.12)", padding: "10px 12px", color: "#fff", fontSize: 13.5, lineHeight: 1.45 }}>
                        <span style={{ width: 10, height: 10, borderRadius: 999, background: "#67f0d7", flex: "0 0 auto" }} />
                        <span>{point}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(155deg, rgba(3,29,27,0.96), rgba(12,63,57,0.98))" }} />
                <div style={{ position: "absolute", inset: "90px 24px 24px", display: "grid", gap: 18, gridTemplateRows: "auto auto 1fr" }}>
                  <div>
                    <div style={{ color: "#f4c285", fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 800 }}>{slide.eyebrow}</div>
                    <div style={{ marginTop: 10, color: "#fff", fontFamily: palette.serif, fontSize: "clamp(2rem, 4vw, 2.5rem)", lineHeight: 1.04, maxWidth: 500 }}>{slide.title}</div>
                    <div style={{ marginTop: 10, color: "rgba(255,255,255,0.8)", fontSize: 14, lineHeight: 1.65, maxWidth: 520 }}>{slide.body}</div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10 }}>
                    {slide.metrics.map(([label, value]) => (
                      <div key={label} style={{ borderRadius: 8, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.08)", padding: 14 }}>
                        <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 700 }}>{label}</div>
                        <div style={{ marginTop: 8, color: "#fff", fontSize: 19, lineHeight: 1.2, fontWeight: 700 }}>{value}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ borderRadius: 8, border: "1px solid rgba(255,255,255,0.12)", background: "linear-gradient(180deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))", padding: 18, display: "grid", gap: 12, alignContent: "start" }}>
                    <div style={{ color: "#fff", fontSize: 13, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase" }}>What the site should sell first</div>
                    {slide.checklist.map((item, itemIndex) => (
                      <div key={item} style={{ display: "grid", gridTemplateColumns: "28px 1fr", gap: 12, alignItems: "start" }}>
                        <div style={{ width: 28, height: 28, borderRadius: 8, background: itemIndex === 1 ? "rgba(244,194,133,0.22)" : "rgba(103,240,215,0.18)", color: itemIndex === 1 ? "#f4c285" : "#67f0d7", display: "grid", placeItems: "center", fontWeight: 800 }}>{itemIndex + 1}</div>
                        <div style={{ color: "rgba(255,255,255,0.86)", fontSize: 14, lineHeight: 1.6 }}>{item}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </article>
        );
      })}

      <div className="estatehat-intro-chip-row" style={{ position: "absolute", left: 20, right: 20, bottom: 18, display: "flex", gap: 8, flexWrap: "wrap", zIndex: 3 }}>
        {INTRO_SLIDES.map((slide, index) => (
          <button
            key={slide.id}
            type="button"
            onClick={() => setActiveIndex(index)}
            style={{
              border: `1px solid ${index === activeIndex ? "rgba(255,255,255,0.36)" : "rgba(255,255,255,0.12)"}`,
              background: index === activeIndex ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.08)",
              color: "#fff",
              borderRadius: 999,
              padding: "8px 12px",
              fontSize: 11,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {slide.eyebrow}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function MarketingLanding({ onStartSignup, onSignIn, onOpenApp, onOpenPublicPage, isAuthenticated = false }) {
  return (
    <div
      className="estatehat-landing-root"
      style={{
        minHeight: "100vh",
        background: [
          "radial-gradient(circle at 0% 0%, rgba(197,111,45,0.22), transparent 32%)",
          "radial-gradient(circle at 100% 100%, rgba(15,91,82,0.18), transparent 36%)",
          `linear-gradient(180deg, ${palette.bg} 0%, ${palette.sand} 55%, #efe5d7 100%)`,
        ].join(","),
        color: palette.ink,
        fontFamily: palette.sans,
        overflowX: "hidden",
      }}
    >
      <div style={{ width: "min(1180px, 100%)", margin: "0 auto", padding: "26px 18px 44px", boxSizing: "border-box" }}>
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 14,
            flexWrap: "wrap",
            marginBottom: 24,
            position: "sticky",
            top: 10,
            zIndex: 5,
            padding: 12,
            borderRadius: 8,
            border: `1px solid ${palette.border}`,
            background: "rgba(255,255,255,0.84)",
            backdropFilter: "blur(18px)",
          }}
        >
          <div style={{ minWidth: 0, maxWidth: "100%" }}>
            <div style={{ fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase", color: palette.pine }}>EstateHat</div>
            <div style={{ fontFamily: palette.serif, fontSize: "clamp(1.45rem, 5.6vw, 1.82rem)", lineHeight: 1.1, overflowWrap: "anywhere", wordBreak: "break-word" }}>A calmer way to sell or buy a home</div>
          </div>
          <div className="estatehat-landing-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap", minWidth: 0 }}>
            <CtaButton label={isAuthenticated ? "Open App" : "Sign In"} onClick={isAuthenticated ? onOpenApp : onSignIn} tone="secondary" />
            {!isAuthenticated ? <CtaButton label="Create Account" onClick={onStartSignup} /> : null}
          </div>
        </header>

        <section
          style={{
            background: palette.card,
            borderRadius: 8,
            border: `1px solid ${palette.border}`,
            boxShadow: "0 28px 70px rgba(51,37,24,0.15)",
            overflow: "hidden",
            marginBottom: 24,
          }}
        >
          <div className="estatehat-landing-hero-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(320px, 100%), 1fr))" }}>
            <div
              style={{
                padding: "clamp(24px, 5vw, 48px)",
                background: "linear-gradient(180deg, rgba(255,248,238,0.95), rgba(255,255,255,0.9))",
                display: "grid",
                alignContent: "center",
              }}
            >
              <div style={{ fontSize: 12, letterSpacing: "0.16em", textTransform: "uppercase", color: palette.accentDeep, marginBottom: 10, fontWeight: 800 }}>
                Sell smarter. Buy with less stress.
              </div>
              <h1 style={{ margin: 0, fontFamily: palette.serif, fontSize: "clamp(2.25rem, 7vw, 5.2rem)", lineHeight: 0.98, maxWidth: 540, overflowWrap: "anywhere", wordBreak: "break-word" }}>
                Your home sale should not feel like homework.
              </h1>
              <p style={{ margin: "16px 0 0", color: palette.muted, lineHeight: 1.65, fontSize: 16, maxWidth: 620 }}>
                EstateHat helps regular people keep listings, messages, forms, money reminders, and closing steps together. It is built for the person who wants a calmer, more guided way to move through a home sale.
              </p>
              <div style={{ marginTop: 16, maxWidth: 640, borderLeft: `3px solid ${palette.accent}`, paddingLeft: 14 }}>
                <div style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: palette.accentDeep, fontWeight: 800 }}>
                  Why EstateHat
                </div>
                <div style={{ marginTop: 6, color: palette.ink, fontSize: 14, lineHeight: 1.6 }}>
                  Zillow, Redfin, and Homes.com are strong listing destinations, but EstateHat goes further with a guided platform for listings, messages, forms, account setup, verification posture, and next-step transaction flow in one place.
                </div>
              </div>
              <div className="estatehat-landing-actions" style={{ marginTop: 22, display: "flex", gap: 10, flexWrap: "wrap" }}>
                {!isAuthenticated ? <CtaButton label="Start Free Account" onClick={onStartSignup} /> : <CtaButton label="Open EstateHat" onClick={onOpenApp} />}
                <CtaButton label={isAuthenticated ? "You Are Signed In" : "I Already Have Access"} onClick={isAuthenticated ? undefined : onSignIn} tone="secondary" disabled={isAuthenticated} />
              </div>
              <div style={{ marginTop: 22, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(130px, 100%), 1fr))", gap: 10 }}>
                {[
                  ["No listing fee", "Publish your home without paying just to start."],
                  ["1.50% fee model", "Keep the cost story visible early instead of late."],
                  ["One account", "Listings, forms, messages, and next steps stay together."],
                ].map(([label, detail]) => (
                  <div key={label} style={{ border: `1px solid ${palette.border}`, borderRadius: 8, background: "rgba(255,255,255,0.78)", padding: 12 }}>
                    <strong style={{ display: "block", color: palette.ink, fontSize: 14 }}>{label}</strong>
                    <span style={{ display: "block", marginTop: 4, color: palette.muted, fontSize: 12.5, lineHeight: 1.45 }}>{detail}</span>
                  </div>
                ))}
              </div>
            </div>
            <IntroReel />
          </div>
        </section>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(220px, 100%), 1fr))", gap: 14, marginBottom: 24 }}>
          {FEATURES.map((feature) => (
            <article key={feature.title} style={{ background: palette.card, border: `1px solid ${palette.border}`, borderRadius: 8, padding: "18px 16px", boxShadow: "0 14px 32px rgba(51,37,24,0.09)" }}>
              <h2 style={{ margin: "0 0 6px", fontFamily: palette.serif, fontSize: 25, lineHeight: 1.1 }}>{feature.title}</h2>
              <p style={{ margin: 0, color: palette.muted, fontSize: 13.5, lineHeight: 1.6 }}>{feature.body}</p>
            </article>
          ))}
        </section>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(240px, 100%), 1fr))", gap: 14, marginBottom: 24 }}>
          {[
            ["1", "Create One EstateHat", "Pick your role and add the basics so EstateHat can show the right next steps."],
            ["2", "Start your listing or search", "Put the home, photos, saved options, and people involved in one workspace."],
            ["3", "Follow the path to close", "Use reminders, forms, Hat Data, and Goodies so important details are easier to track."],
          ].map(([step, title, body]) => (
            <article key={step} style={{ borderRadius: 8, border: `1px solid ${palette.border}`, background: "rgba(255,255,255,0.86)", padding: 18, display: "grid", gap: 8 }}>
              <div style={{ width: 38, height: 38, borderRadius: 8, display: "grid", placeItems: "center", background: palette.pine, color: "#fff", fontWeight: 800 }}>{step}</div>
              <strong style={{ fontSize: 18, color: palette.ink }}>{title}</strong>
              <p style={{ margin: 0, color: palette.muted, fontSize: 13.5, lineHeight: 1.6 }}>{body}</p>
            </article>
          ))}
        </section>

        <section style={{ borderRadius: 8, border: `1px solid ${palette.border}`, background: palette.pineSoft, padding: "24px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14 }}>
          <div>
            <div style={{ fontSize: 12, letterSpacing: "0.16em", textTransform: "uppercase", color: palette.pine, fontWeight: 800 }}>Ready to make the move simpler?</div>
            <div style={{ fontFamily: palette.serif, fontSize: "clamp(2rem, 5vw, 3rem)", lineHeight: 1.04 }}>Create your EstateHat account in minutes.</div>
          </div>
          {!isAuthenticated ? <CtaButton label="Create Account Now" onClick={onStartSignup} /> : <CtaButton label="Open EstateHat" onClick={onOpenApp} />}
        </section>

        <EstateHatPublicFooter
          isAuthenticated={isAuthenticated}
          onCreateAccount={onStartSignup}
          onSignIn={onSignIn}
          onOpenApp={onOpenApp}
          onOpenPublicPage={onOpenPublicPage}
        />

        <style>{`
          .estatehat-landing-root,
          .estatehat-landing-root * {
            box-sizing: border-box;
          }
          .estatehat-landing-root {
            max-width: 100vw;
          }
          .estatehat-landing-hero-grid > *,
          .estatehat-landing-actions,
          .estatehat-landing-actions > * {
            min-width: 0;
          }
          @media (max-width: 1040px) {
            .estatehat-landing-root {
              overflow-x: clip;
            }
            .estatehat-landing-root > div {
              width: 100% !important;
              padding: 24px 10px 38px !important;
            }
            .estatehat-landing-root header {
              align-items: stretch !important;
              width: 100% !important;
            }
            .estatehat-landing-root header > div:first-child,
            .estatehat-landing-root section,
            .estatehat-landing-root article,
            .estatehat-landing-root h1,
            .estatehat-landing-root h2,
            .estatehat-landing-root p {
              width: 100% !important;
              max-width: 100% !important;
              overflow-wrap: anywhere !important;
              word-break: break-word !important;
            }
            .estatehat-landing-root header > div:first-child div:last-child {
              font-size: 1.35rem !important;
              line-height: 1.15 !important;
            }
            .estatehat-landing-root h1 {
              font-size: clamp(2rem, 10vw, 2.65rem) !important;
              line-height: 1.04 !important;
            }
            .estatehat-landing-root section[style*="grid-template-columns"] {
              grid-template-columns: minmax(0, 1fr) !important;
            }
            .estatehat-landing-hero-grid {
              grid-template-columns: minmax(0, 1fr) !important;
            }
            .estatehat-landing-actions {
              display: grid !important;
              grid-template-columns: minmax(0, 1fr) !important;
              width: 100%;
            }
            .estatehat-landing-actions button {
              width: 100%;
            }
          }
          @media (max-width: 720px) {
            .estatehat-landing-root {
              overflow-x: hidden !important;
            }
            .estatehat-intro-reel {
              min-height: 620px !important;
            }
            .estatehat-intro-topline {
              flex-wrap: wrap;
              align-items: flex-start !important;
            }
            .estatehat-intro-copy {
              left: 18px !important;
              right: 18px !important;
              bottom: 74px !important;
              max-width: calc(100% - 36px) !important;
            }
            .estatehat-intro-chip-row {
              bottom: 14px !important;
            }
          }
        `}</style>
      </div>
    </div>
  );
}
