import { Section, SectionTitle, SecondaryButton, formatPct, formatUsdc } from "./ui";

export default function AgentEconomy({ summary }) {
  const items = [
    { label: "Active providers", value: summary?.total_providers ?? "—" },
    { label: "Real payments routed", value: summary?.total_calls ?? "—" },
    { label: "Success rate", value: formatPct(summary?.overall_success_rate) },
    { label: "USDC settled on Base", value: formatUsdc(summary?.total_revenue_usdc) },
  ];

  return (
    <Section id="agent-economy" style={{ padding: "0 24px 96px" }}>
      <SectionTitle
        eyebrow="THE AGENT ECONOMY"
        title="Agents pay for what they use, one call at a time"
        sub="No subscriptions, no API keys to juggle. Every call is a small, real payment, and every outcome is recorded."
      />
      <div style={{ display: "flex", flexWrap: "wrap", gap: 1, background: "var(--gridline)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
        {items.map((item) => (
          <div key={item.label} style={{ flex: "1 1 200px", background: "var(--surface-1)", padding: "26px 24px" }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 700 }}>{item.value}</div>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>{item.label}</div>
          </div>
        ))}
      </div>
      <div style={{ textAlign: "center", marginTop: 22 }}>
        <SecondaryButton href="/dashboard">Open the live dashboard</SecondaryButton>
      </div>
    </Section>
  );
}
