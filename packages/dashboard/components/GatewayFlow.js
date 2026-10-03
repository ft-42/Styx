import Image from "next/image";
import { Section, SectionTitle } from "./ui";

function Node({ label, title, desc, accent }) {
  return (
    <div
      style={{
        background: accent ? "var(--brand-accent-soft)" : "var(--surface-1)",
        border: `1px solid ${accent ? "var(--brand-accent)" : "var(--border)"}`,
        borderRadius: 14,
        padding: "24px 22px",
        textAlign: "center",
        flex: "1 1 0",
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {accent && (
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
          <Image src="/logo402.png" alt="" width={64} height={64} />
        </div>
      )}
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: "0.18em",
          color: "var(--brand-accent)",
          marginBottom: 8,
        }}
      >
        {label}
      </div>
      <div style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6 }}>{desc}</div>
    </div>
  );
}

function Connector() {
  return (
    <div className="gw-connector" aria-hidden="true">
      <span className="gw-line" />
      <span className="gw-arrow">▶</span>
    </div>
  );
}

export default function GatewayFlow() {
  return (
    <Section id="gateway" style={{ padding: "0 24px 96px" }}>
      <SectionTitle
        eyebrow="THE STYX402 GATEWAY"
        title="One layer between every provider and every agent"
        sub="Providers publish. Styx402 ranks, routes, and settles. Agents just ask for a capability."
      />
      <div className="gw-row">
        <Node label="PROVIDE" title="API providers" desc="Publish an endpoint with a price and a wallet." />
        <Connector />
        <Node
          accent
          label="ROUTE"
          title="Styx402 gateway"
          desc="Ranks by live reputation, pays over x402, falls back on failure."
        />
        <Connector />
        <Node label="DISCOVER" title="Agents & developers" desc="Request a category. Get a paid result back." />
      </div>
    </Section>
  );
}
