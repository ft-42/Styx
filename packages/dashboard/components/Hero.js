import Image from "next/image";
import Link from "next/link";

/*
 * Cinematic river hero. Palette extracted from public/logo402.png
 * (near-black sky, layered midnight-blue mountain silhouettes, a pale
 * blue moonlight streak down the water). Everything below is CSS/SVG --
 * no external art beyond the logo itself.
 */

function Mountains() {
  // Four layers, farthest (lightest / haziest) to nearest (darkest).
  // Each is a simple jagged silhouette spanning the full width.
  return (
    <>
      <svg
        viewBox="0 0 1600 400"
        preserveAspectRatio="none"
        style={{ position: "absolute", left: 0, right: 0, bottom: "38%", width: "100%", height: "34%", opacity: 0.55 }}
      >
        <polygon
          fill="#141f30"
          points="0,400 0,220 120,160 260,210 400,130 560,190 700,110 880,180 1040,120 1200,200 1360,140 1500,190 1600,150 1600,400"
        />
      </svg>
      <svg
        viewBox="0 0 1600 360"
        preserveAspectRatio="none"
        style={{ position: "absolute", left: 0, right: 0, bottom: "36%", width: "100%", height: "30%", opacity: 0.75 }}
      >
        <polygon
          fill="#0d1522"
          points="0,360 0,240 150,180 320,230 480,150 620,210 780,120 940,200 1100,140 1260,220 1420,160 1600,210 1600,360"
        />
      </svg>
      <svg
        viewBox="0 0 1600 320"
        preserveAspectRatio="none"
        style={{ position: "absolute", left: 0, right: 0, bottom: "34%", width: "100%", height: "26%" }}
      >
        <polygon
          fill="#070c14"
          points="0,320 0,260 180,190 340,240 520,170 680,230 860,150 1020,220 1200,180 1380,240 1600,200 1600,320"
        />
      </svg>
      <svg
        viewBox="0 0 1600 260"
        preserveAspectRatio="none"
        style={{ position: "absolute", left: 0, right: 0, bottom: "33%", width: "100%", height: "20%" }}
      >
        <polygon
          fill="#020408"
          points="0,260 0,290 200,220 420,260 640,200 880,250 1100,210 1320,255 1600,225 1600,260"
        />
      </svg>
    </>
  );
}

function Water() {
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, top: "58%", overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(180deg, #060a12 0%, #04060a 60%, #020305 100%)",
        }}
      />
      {/* moonlight reflection streak, matching the vertical highlight in the logo */}
      <div
        className="styx-shimmer"
        style={{
          position: "absolute",
          left: "50%",
          top: 0,
          bottom: 0,
          width: 220,
          transform: "translateX(-50%)",
          background:
            "linear-gradient(180deg, rgba(120,165,215,0.28) 0%, rgba(90,135,185,0.16) 30%, rgba(60,95,140,0.08) 60%, rgba(40,65,100,0.02) 100%)",
          filter: "blur(6px)",
        }}
      />
      {/* subtle horizontal ripple lines */}
      <div
        className="styx-ripple"
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "repeating-linear-gradient(180deg, rgba(140,180,225,0.05) 0px, rgba(140,180,225,0.05) 1px, transparent 1px, transparent 14px)",
          opacity: 0.5,
        }}
      />
    </div>
  );
}

function Fog() {
  return (
    <>
      <div
        className="styx-fog styx-fog-a"
        style={{
          position: "absolute",
          left: "-10%",
          top: "30%",
          width: "60%",
          height: "24%",
          background: "radial-gradient(ellipse at center, rgba(90,120,160,0.14) 0%, rgba(90,120,160,0) 70%)",
          filter: "blur(18px)",
        }}
      />
      <div
        className="styx-fog styx-fog-b"
        style={{
          position: "absolute",
          right: "-15%",
          top: "40%",
          width: "70%",
          height: "22%",
          background: "radial-gradient(ellipse at center, rgba(70,100,140,0.12) 0%, rgba(70,100,140,0) 70%)",
          filter: "blur(22px)",
        }}
      />
    </>
  );
}

function Boat() {
  return (
    <div className="styx-boat" style={{ position: "absolute", bottom: "38%", left: 0 }}>
      <div className="styx-boat-bob">
        <div
          style={{
            position: "absolute",
            left: "50%",
            bottom: -6,
            width: 120,
            height: 14,
            transform: "translateX(-50%)",
            background: "radial-gradient(ellipse at center, rgba(58,90,130,0.35) 0%, rgba(58,90,130,0) 75%)",
          }}
        />
        <Image src="/boat402.png" alt="" width={128} height={96} style={{ display: "block" }} />
      </div>
    </div>
  );
}

function StageLabel({ align, eyebrow, title, sub }) {
  return (
    <div
      className={`styx-stage styx-stage-${align}`}
      style={{
        position: "absolute",
        top: "14%",
        [align]: "5%",
        textAlign: align === "left" ? "left" : "right",
        maxWidth: 260,
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 15,
          fontWeight: 700,
          letterSpacing: "0.2em",
          color: "#6f9bd1",
          marginBottom: 8,
        }}
      >
        {eyebrow}
      </div>
      <div style={{ fontFamily: "var(--font-display)", fontSize: 19, fontWeight: 600, color: "#dbe6f2" }}>{title}</div>
      <div style={{ fontSize: 15, color: "#94a9c1", marginTop: 5, lineHeight: 1.55 }}>{sub}</div>
    </div>
  );
}

export default function Hero() {
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100vh",
        minHeight: 640,
        overflow: "hidden",
        background: "linear-gradient(180deg, #020305 0%, #050a13 55%, #060a12 100%)",
      }}
    >
      <Mountains />
      <Fog />
      <Water />

      {/* brand mark -- text on top, logo below. Anchored with a plain, safe
          top percentage (no large negative calc() offsets, which get
          silently clipped by the hero's overflow:hidden). */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "9%",
          transform: "translateX(-50%)",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 34,
            fontWeight: 700,
            letterSpacing: "0.14em",
            color: "#eaf1f8",
            marginBottom: 10,
          }}
        >
          STYX402
        </div>
        {/* glow lives in its own relative wrapper, sized to the logo, so it
            stays centered on it no matter where the block above sits */}
        <div style={{ position: "relative", display: "inline-block" }}>
          <div
            className="styx-glow"
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: 420,
              height: 420,
              transform: "translate(-50%, -50%)",
              background: "radial-gradient(circle, rgba(90,140,195,0.22) 0%, rgba(90,140,195,0) 68%)",
              pointerEvents: "none",
              zIndex: 0,
            }}
          />
          <Image
            src="/logo402.png"
            alt="Styx402"
            width={200}
            height={200}
            priority
            style={{ display: "block", margin: "0 auto", position: "relative", zIndex: 1 }}
          />
        </div>
      </div>

      <StageLabel align="left" eyebrow="PROVIDE" title="API PROVIDERS" sub="Publish & monetize APIs" />
      <StageLabel align="right" eyebrow="DISCOVER" title="AI AGENTS & DEVELOPERS" sub="Discover & use APIs" />

      <Boat />

      {/* headline + CTAs, anchored at the bottom, over a fade so the river stays the focus */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          padding: "80px 24px 44px",
          textAlign: "center",
          background: "linear-gradient(180deg, rgba(2,3,5,0) 0%, rgba(2,3,5,0.85) 55%, #020305 100%)",
        }}
      >
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(22px, 4.2vw, 46px)",
            fontWeight: 700,
            letterSpacing: "0.01em",
            color: "#f3f7fb",
            margin: "0 0 12px",
            lineHeight: 1.2,
          }}
        >
          THE GATEWAY BETWEEN APIs AND AGENTS
        </h1>
        <p style={{ fontSize: 15, color: "#93a7bd", margin: "0 0 26px" }}>
          Provide APIs. Discover capabilities. Pay programmatically.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link
            href="/register"
            style={{
              background: "#3a6ea8",
              color: "#fff",
              padding: "12px 26px",
              borderRadius: 8,
              fontFamily: "var(--font-display)",
              fontSize: 14,
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            List Your API
          </Link>
          <Link
            href="#marketplace"
            style={{
              background: "transparent",
              border: "1px solid rgba(147,167,189,0.35)",
              color: "#dbe6f2",
              padding: "12px 26px",
              borderRadius: 8,
              fontFamily: "var(--font-display)",
              fontSize: 14,
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Explore APIs
          </Link>
        </div>
      </div>

    </div>
  );
}
