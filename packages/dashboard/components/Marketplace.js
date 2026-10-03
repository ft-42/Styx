import { useMemo, useState } from "react";
import { Section, SectionTitle, formatUsdc } from "./ui";
import { useProviders } from "./useRegistry";

function ApiCard({ p }) {
  const score = p.reputation_score ?? 0.5;
  const calls = p.reputation_stats?.calls_total ?? 0;
  return (
    <div
      style={{
        background: "var(--surface-1)",
        border: "1px solid var(--border)",
        borderRadius: 14,
        padding: 22,
        display: "flex",
        flexDirection: "column",
        gap: 12,
        minWidth: 0,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17, overflowWrap: "anywhere" }}>
          {p.name}
        </div>
        <span
          style={{
            flexShrink: 0,
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "var(--brand-accent)",
            background: "var(--brand-accent-soft)",
            padding: "4px 9px",
            borderRadius: 999,
          }}
        >
          {p.category}
        </span>
      </div>
      <div style={{ display: "flex", gap: 18, fontSize: 13, color: "var(--text-secondary)" }}>
        <span>
          <strong style={{ color: "var(--text-primary)", fontFamily: "'IBM Plex Mono', monospace" }}>
            {formatUsdc(p.price_usdc)}
          </strong>{" "}
          / call
        </span>
        <span>
          Reputation <strong style={{ color: "var(--text-primary)" }}>{Math.round(score * 100)}</strong>
        </span>
      </div>
      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{calls} routed calls</div>
    </div>
  );
}

export default function Marketplace() {
  const providers = useProviders();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");

  const categories = useMemo(() => {
    const set = new Set((providers || []).map((p) => p.category).filter(Boolean));
    return ["all", ...Array.from(set).sort()];
  }, [providers]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (providers || []).filter(
      (p) =>
        (category === "all" || p.category === category) &&
        (!q || p.name?.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q))
    );
  }, [providers, query, category]);

  return (
    <Section id="marketplace" style={{ padding: "0 24px 96px" }}>
      <SectionTitle
        eyebrow="API MARKETPLACE"
        title="Every live provider, ranked by reputation"
        sub="Browse what agents can already pay for. Ranking updates from real routed calls."
      />

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 24 }}>
        <input
          type="search"
          placeholder="Search APIs"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            flex: "1 1 240px",
            minWidth: 0,
            padding: "11px 14px",
            borderRadius: 8,
            border: "1px solid var(--border)",
            background: "var(--surface-1)",
            color: "var(--text-primary)",
            fontSize: 14,
            fontFamily: "var(--font-body)",
          }}
        />
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              style={{
                padding: "8px 14px",
                borderRadius: 999,
                fontSize: 13,
                fontFamily: "var(--font-display)",
                fontWeight: 600,
                cursor: "pointer",
                border: `1px solid ${category === c ? "var(--brand-accent)" : "var(--border)"}`,
                background: category === c ? "var(--brand-accent-soft)" : "var(--surface-1)",
                color: category === c ? "var(--brand-accent)" : "var(--text-secondary)",
              }}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {providers === null && <div style={{ color: "var(--text-muted)", fontSize: 14 }}>Loading providers…</div>}
      {providers !== null && visible.length === 0 && (
        <div style={{ color: "var(--text-muted)", fontSize: 14, textAlign: "center", padding: 32 }}>
          No matching APIs yet. Be the first to{" "}
          <a href="/register" style={{ color: "var(--brand-accent)" }}>
            list one
          </a>
          .
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 18 }}>
        {visible.map((p) => (
          <ApiCard key={p.id} p={p} />
        ))}
      </div>
    </Section>
  );
}
