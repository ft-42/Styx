import { Section, Pill, SecondaryButton, SectionTitle } from "./ui";

const snippet = `import { request } from "router-sdk";

const result = await request({
  category: "price-feed",
  maxPrice: 0.02,
});

console.log(result.provider.name, result.data);`;

export default function ForDevelopers() {
  return (
    <Section id="for-developers" style={{ padding: "0 24px 96px" }}>
      <SectionTitle
        eyebrow="FOR AGENT DEVELOPERS"
        title="Stop hardcoding one endpoint"
        sub="One call picks the best live provider in a category, pays it over x402, and falls back to the next one if it fails."
      />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 28 }}>
        <div
          style={{
            background: "var(--surface-1)",
            border: "1px solid var(--border)",
            borderRadius: 14,
            padding: 28,
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <Pill>Router SDK</Pill>
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 700, margin: 0 }}>
            Discover, rank, pay, fall back
          </h3>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.65, margin: 0 }}>
            Every candidate is ranked by live reputation, the top one is paid via x402 on Base, and the outcome feeds back
            into the next ranking.
          </p>
          <div style={{ marginTop: "auto", display: "flex", gap: 12, flexWrap: "wrap" }}>
            <SecondaryButton href="/dashboard">See live activity</SecondaryButton>
          </div>
        </div>

        <pre
          style={{
            background: "var(--page-plane)",
            border: "1px solid var(--border)",
            borderRadius: 14,
            padding: "20px 22px",
            fontSize: 13,
            lineHeight: 1.65,
            overflowX: "auto",
            color: "var(--text-primary)",
            margin: 0,
            fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
          }}
        >
          <code>{snippet}</code>
        </pre>
      </div>
    </Section>
  );
}
