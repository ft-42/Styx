import { Section, SectionTitle } from "./ui";

const steps = [
  {
    n: "01",
    title: "Providers register",
    desc: "Any paid API adds its category, price, and receiving wallet in one submission.",
  },
  {
    n: "02",
    title: "Agent asks for a capability",
    desc: "One SDK call names a category. No payment code to write, no endpoint to hardcode.",
  },
  {
    n: "03",
    title: "Router ranks, pays, and learns",
    desc: "The best live provider is paid via x402 on Base. The real outcome updates its reputation for next time.",
  },
];

export default function HowItWorks() {
  return (
    <Section id="how-it-works" style={{ padding: "0 24px 96px" }}>
      <SectionTitle eyebrow="HOW IT WORKS" title="Three steps, then it runs itself" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 22 }}>
        {steps.map((s) => (
          <div
            key={s.n}
            style={{
              background: "var(--surface-1)",
              border: "1px solid var(--border)",
              borderRadius: 14,
              padding: 26,
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 13,
                fontWeight: 700,
                color: "var(--brand-accent)",
                letterSpacing: "0.12em",
                marginBottom: 14,
              }}
            >
              {s.n}
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 19, fontWeight: 700, marginBottom: 8 }}>
              {s.title}
            </div>
            <div style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.65 }}>{s.desc}</div>
          </div>
        ))}
      </div>
    </Section>
  );
}
