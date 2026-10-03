import { Section, PrimaryButton, SecondaryButton } from "./ui";

export default function FinalCta() {
  return (
    <Section style={{ padding: "0 24px 96px" }}>
      <div
        style={{
          background: "var(--surface-1)",
          border: "1px solid var(--border)",
          borderRadius: 16,
          padding: "52px 28px",
          textAlign: "center",
        }}
      >
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(24px, 3vw, 32px)", fontWeight: 700, margin: "0 0 12px" }}>
          Ready to cross the river?
        </h2>
        <p style={{ fontSize: 16, color: "var(--text-secondary)", maxWidth: 520, margin: "0 auto 26px", lineHeight: 1.65 }}>
          Everything on this page is running live on Base mainnet: real providers, real payments, real reputation.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <PrimaryButton href="/register">List your API</PrimaryButton>
          <SecondaryButton href="/dashboard">Open the live dashboard</SecondaryButton>
        </div>
      </div>
    </Section>
  );
}
