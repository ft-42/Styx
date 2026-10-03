import { Section, Pill, PrimaryButton, SectionTitle } from "./ui";

const mockRows = [
  { name: "Price Feed A", category: "price-feed", price: "$0.010", score: 0.96, status: "Active" },
  { name: "Weather Oracle", category: "weather", price: "$0.004", score: 0.91, status: "Active" },
  { name: "Your API", category: "price-feed", price: "$0.008", score: null, status: "Pending" },
];

function MockDashboard() {
  return (
    <div
      style={{
        background: "var(--surface-1)",
        border: "1px solid var(--border)",
        borderRadius: 14,
        overflow: "hidden",
        boxShadow: "0 24px 60px rgba(0,0,0,0.25)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "10px 14px",
          borderBottom: "1px solid var(--border)",
          background: "var(--page-plane)",
        }}
      >
        <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#e66767" }} />
        <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#e6b867" }} />
        <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#67c46b" }} />
        <span style={{ marginLeft: 10, fontSize: 12, color: "var(--text-muted)" }}>Your listings</span>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 420 }}>
          <thead>
            <tr style={{ color: "var(--text-muted)", textAlign: "left" }}>
              <th style={{ padding: "12px 16px", fontWeight: 500 }}>Provider</th>
              <th style={{ padding: "12px 16px", fontWeight: 500 }}>Category</th>
              <th style={{ padding: "12px 16px", fontWeight: 500 }}>Price</th>
              <th style={{ padding: "12px 16px", fontWeight: 500 }}>Reputation</th>
              <th style={{ padding: "12px 16px", fontWeight: 500 }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {mockRows.map((r) => (
              <tr key={r.name} style={{ borderTop: "1px solid var(--border)" }}>
                <td style={{ padding: "12px 16px", fontWeight: 600 }}>{r.name}</td>
                <td style={{ padding: "12px 16px", color: "var(--text-secondary)" }}>{r.category}</td>
                <td style={{ padding: "12px 16px", fontFamily: "'IBM Plex Mono', monospace" }}>{r.price}</td>
                <td style={{ padding: "12px 16px" }}>
                  {r.score == null ? (
                    <span style={{ color: "var(--text-muted)" }}>—</span>
                  ) : (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                      <span style={{ width: 60, height: 6, borderRadius: 3, background: "var(--gridline)", overflow: "hidden" }}>
                        <span
                          style={{
                            display: "block",
                            height: "100%",
                            width: `${r.score * 100}%`,
                            background: "var(--brand-accent)",
                          }}
                        />
                      </span>
                      {Math.round(r.score * 100)}
                    </span>
                  )}
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: r.status === "Active" ? "var(--status-good)" : "var(--text-muted)",
                    }}
                  >
                    {r.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function ForProviders() {
  return (
    <Section id="for-providers" style={{ padding: "96px 24px" }}>
      <SectionTitle
        eyebrow="FOR PROVIDERS"
        title="Get paid by every agent that finds you"
        sub="Wrap your endpoint with x402 middleware, register once, and get routed traffic. CDP manages your wallet, so you never handle a private key."
      />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 40, alignItems: "center" }}>
        <div>
          <ul style={{ listStyle: "none", padding: 0, margin: "0 0 28px", display: "grid", gap: 14 }}>
            {[
              "Register in one form, or one API call",
              "Set your own price per call in USDC",
              "Reputation builds automatically from real outcomes",
              "Paid straight to your wallet on Base",
            ].map((t) => (
              <li key={t} style={{ display: "flex", gap: 12, fontSize: 15, color: "var(--text-secondary)", lineHeight: 1.55 }}>
                <span style={{ color: "var(--brand-accent)", fontWeight: 700 }}>✓</span>
                {t}
              </li>
            ))}
          </ul>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <PrimaryButton href="/register">List your API →</PrimaryButton>
            <Pill>Reviewed before going live</Pill>
          </div>
        </div>
        <MockDashboard />
      </div>
    </Section>
  );
}
