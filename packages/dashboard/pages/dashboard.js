import Link from "next/link";
import { useEffect, useState } from "react";

const REGISTRY_URL = process.env.NEXT_PUBLIC_REGISTRY_URL;
const POLL_MS = 5000;

function formatUsdc(n) {
  return `$${Number(n || 0).toFixed(4).replace(/0+$/, "").replace(/\.$/, "")}`;
}

function formatPct(n) {
  return n == null ? "—" : `${Math.round(n * 100)}%`;
}

function timeAgo(iso) {
  if (!iso) return "never";
  const seconds = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  return `${hours}h ago`;
}

function StatTile({ label, value, sub }) {
  return (
    <div
      style={{
        background: "var(--surface-1)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: "16px 20px",
        flex: "1 1 160px",
        minWidth: 160,
      }}
    >
      <div style={{ color: "var(--text-muted)", fontSize: 13 }}>{label}</div>
      <div style={{ color: "var(--text-primary)", fontSize: 28, fontWeight: 600, marginTop: 4 }}>
        {value}
      </div>
      {sub && <div style={{ color: "var(--text-secondary)", fontSize: 12, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function ScoreBar({ score }) {
  const pct = Math.max(0, Math.min(1, score ?? 0)) * 100;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 120 }}>
      <div
        style={{
          flex: 1,
          height: 6,
          borderRadius: 3,
          background: "var(--series-blue-track)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: "var(--series-blue)",
            borderRadius: 3,
          }}
        />
      </div>
      <span style={{ fontSize: 13, color: "var(--text-secondary)", width: 32, textAlign: "right" }}>
        {score != null ? score.toFixed(2) : "—"}
      </span>
    </div>
  );
}

function StatusBadge({ active }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13 }}>
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: active ? "var(--status-good)" : "var(--text-muted)",
          display: "inline-block",
        }}
      />
      <span style={{ color: active ? "var(--success-text)" : "var(--text-muted)" }}>
        {active ? "Active" : "Inactive"}
      </span>
    </span>
  );
}

export default function Dashboard() {
  const [providers, setProviders] = useState([]);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);
  const [lastRefreshed, setLastRefreshed] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const [providersRes, summaryRes] = await Promise.all([
          fetch(`${REGISTRY_URL}/dashboard/providers`),
          fetch(`${REGISTRY_URL}/dashboard/summary`),
        ]);
        if (!providersRes.ok || !summaryRes.ok) throw new Error("registry request failed");
        const [providersData, summaryData] = await Promise.all([providersRes.json(), summaryRes.json()]);
        if (cancelled) return;
        setProviders(providersData.sort((a, b) => b.reputation_score - a.reputation_score));
        setSummary(summaryData);
        setError(null);
        setLastRefreshed(new Date());
      } catch (err) {
        if (!cancelled) setError(err.message);
      }
    }

    poll();
    const id = setInterval(poll, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px 64px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8 }}>
        <div>
          <Link href="/" style={{ color: "var(--text-muted)", fontSize: 13, textDecoration: "none" }}>
            ← x402 Agent Commerce Router
          </Link>
          <h1 style={{ fontSize: 22, fontWeight: 600, margin: "6px 0 0" }}>Live Dashboard</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 14, margin: "4px 0 0" }}>
            Live provider registry — {REGISTRY_URL}
          </p>
        </div>
        <div style={{ color: "var(--text-muted)", fontSize: 12 }}>
          {error ? (
            <span style={{ color: "var(--status-critical)" }}>Registry unreachable: {error}</span>
          ) : (
            <>Refreshed {lastRefreshed ? timeAgo(lastRefreshed.toISOString()) : "…"}</>
          )}
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 24 }}>
        <StatTile label="Providers" value={summary?.total_providers ?? "—"} />
        <StatTile label="Calls routed" value={summary?.total_calls ?? "—"} sub={`${summary?.total_successful_calls ?? 0} successful`} />
        <StatTile label="Success rate" value={formatPct(summary?.overall_success_rate)} />
        <StatTile label="Total revenue" value={formatUsdc(summary?.total_revenue_usdc)} sub="USDC routed to providers" />
      </div>

      <div
        style={{
          background: "var(--surface-1)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          marginTop: 24,
          overflow: "auto",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--gridline)" }}>
              {["Provider", "Category", "Price", "Reputation", "Calls", "Avg latency", "Revenue", "Status", "Last call"].map(
                (h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: "left",
                      padding: "10px 16px",
                      color: "var(--text-muted)",
                      fontWeight: 500,
                      fontSize: 12,
                      textTransform: "uppercase",
                      letterSpacing: "0.03em",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {providers.length === 0 && (
              <tr>
                <td colSpan={9} style={{ padding: 24, textAlign: "center", color: "var(--text-muted)" }}>
                  {error ? "Could not reach the registry." : "No providers registered yet."}
                </td>
              </tr>
            )}
            {providers.map((p) => (
              <tr key={p.id} style={{ borderBottom: "1px solid var(--gridline)" }}>
                <td style={{ padding: "10px 16px", fontWeight: 500 }}>{p.name}</td>
                <td style={{ padding: "10px 16px", color: "var(--text-secondary)" }}>{p.category}</td>
                <td style={{ padding: "10px 16px", color: "var(--text-secondary)" }}>${p.price_usdc}</td>
                <td style={{ padding: "10px 16px" }}>
                  <ScoreBar score={p.reputation_score} />
                </td>
                <td style={{ padding: "10px 16px", color: "var(--text-secondary)" }}>
                  {p.reputation_stats.calls_success}/{p.reputation_stats.calls_total}
                </td>
                <td style={{ padding: "10px 16px", color: "var(--text-secondary)" }}>
                  {p.reputation_stats.avg_latency_ms ? `${p.reputation_stats.avg_latency_ms}ms` : "—"}
                </td>
                <td style={{ padding: "10px 16px", color: "var(--text-secondary)" }}>
                  {formatUsdc(p.reputation_stats.revenue_usdc)}
                </td>
                <td style={{ padding: "10px 16px" }}>
                  <StatusBadge active={p.active} />
                </td>
                <td style={{ padding: "10px 16px", color: "var(--text-muted)" }}>
                  {timeAgo(p.reputation_stats.last_updated)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
