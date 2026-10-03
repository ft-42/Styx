import Link from "next/link";

export function Section({ id, children, style }) {
  return (
    <section id={id} style={{ maxWidth: 1040, margin: "0 auto", padding: "0 24px", ...style }}>
      {children}
    </section>
  );
}

export function Pill({ children }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        fontFamily: "var(--font-display)",
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        color: "var(--brand-accent)",
        background: "var(--brand-accent-soft)",
        padding: "7px 14px",
        borderRadius: 999,
      }}
    >
      {children}
    </span>
  );
}

export function PrimaryButton({ href, children }) {
  return (
    <Link
      href={href}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: "var(--brand-accent)",
        color: "#fff",
        padding: "11px 22px",
        borderRadius: 8,
        fontFamily: "var(--font-display)",
        fontSize: 14,
        fontWeight: 600,
        textDecoration: "none",
      }}
    >
      {children}
    </Link>
  );
}

export function SecondaryButton({ href, children }) {
  return (
    <Link
      href={href}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: "var(--surface-1)",
        border: "1px solid var(--border)",
        color: "var(--text-primary)",
        padding: "11px 22px",
        borderRadius: 8,
        fontFamily: "var(--font-display)",
        fontSize: 14,
        fontWeight: 600,
        textDecoration: "none",
      }}
    >
      {children}
    </Link>
  );
}

export function SectionTitle({ eyebrow, title, sub }) {
  return (
    <div style={{ textAlign: "center", marginBottom: 44 }}>
      {eyebrow && (
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: "0.2em",
            color: "var(--brand-accent)",
            marginBottom: 12,
          }}
        >
          {eyebrow}
        </div>
      )}
      <h2
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(26px, 3.4vw, 36px)",
          fontWeight: 700,
          margin: "0 0 12px",
          lineHeight: 1.2,
        }}
      >
        {title}
      </h2>
      {sub && (
        <p style={{ fontSize: 16, color: "var(--text-secondary)", maxWidth: 620, margin: "0 auto", lineHeight: 1.65 }}>
          {sub}
        </p>
      )}
    </div>
  );
}

export function formatUsdc(n) {
  return `$${Number(n || 0).toFixed(4).replace(/0+$/, "").replace(/\.$/, "")}`;
}

export function formatPct(n) {
  return n == null ? "—" : `${Math.round(n * 100)}%`;
}
