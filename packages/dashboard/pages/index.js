import Link from "next/link";
import Hero from "../components/Hero";
import ForProviders from "../components/ForProviders";
import ForDevelopers from "../components/ForDevelopers";
import GatewayFlow from "../components/GatewayFlow";
import HowItWorks from "../components/HowItWorks";
import AgentEconomy from "../components/AgentEconomy";
import Marketplace from "../components/Marketplace";
import FinalCta from "../components/FinalCta";
import { Section, PrimaryButton } from "../components/ui";
import { useLiveSummary } from "../components/useRegistry";

function RiverDivider() {
  return (
    <svg width="100%" height="16" viewBox="0 0 400 16" preserveAspectRatio="none" style={{ display: "block" }}>
      <path
        d="M0 8 Q 50 0, 100 8 T 200 8 T 300 8 T 400 8"
        fill="none"
        stroke="var(--brand-accent)"
        strokeWidth="1.5"
        opacity="0.3"
      />
      <circle cx="200" cy="8" r="3" fill="var(--brand-accent)" />
    </svg>
  );
}

export default function Landing() {
  const summary = useLiveSummary();

  return (
    <div style={{ fontFamily: "var(--font-body)" }}>
      <div style={{ borderBottom: "1px solid var(--border)" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "18px 5%",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17, letterSpacing: "0.01em" }}>
            STYX
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 24, fontSize: 14, flexWrap: "wrap" }}>
            <a href="#how-it-works" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>
              How it works
            </a>
            <a href="#for-providers" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>
              For providers
            </a>
            <a href="#for-developers" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>
              For developers
            </a>
            <a href="#marketplace" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>
              Marketplace
            </a>
            <Link href="/dashboard" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>
              Live dashboard
            </Link>
            <PrimaryButton href="/register">Register your API</PrimaryButton>
          </div>
        </div>
      </div>

      <Hero />
      <ForProviders />
      <ForDevelopers />
      <GatewayFlow />
      <HowItWorks />
      <AgentEconomy summary={summary} />
      <Marketplace />
      <FinalCta />

      <div style={{ borderTop: "1px solid var(--border)", padding: "28px 24px" }}>
        <Section style={{ padding: 0 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
            <RiverDivider />
            <div style={{ display: "flex", gap: 20, fontSize: 13, color: "var(--text-secondary)" }}>
              <Link href="/dashboard" style={{ color: "inherit", textDecoration: "none" }}>
                Dashboard
              </Link>
              <Link href="/register" style={{ color: "inherit", textDecoration: "none" }}>
                Register
              </Link>
            </div>
            <span style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center" }}>
              Styx — the toll for the agent economy. Built on Coinbase's x402 protocol, running on Base.
            </span>
          </div>
        </Section>
      </div>
    </div>
  );
}
