import Link from "next/link";
import { useEffect, useState } from "react";

const REGISTRY_URL = process.env.NEXT_PUBLIC_REGISTRY_URL;
const STORAGE_KEY = "styx_admin_token";

export default function Admin() {
  const [token, setToken] = useState("");
  const [tokenInput, setTokenInput] = useState("");
  const [pending, setPending] = useState(null);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        setToken(stored);
        setTokenInput(stored);
      }
    } catch {
      // sessionStorage unavailable -- just skip restoring, no big deal
    }
  }, []);

  async function loadPending(withToken) {
    setError(null);
    try {
      const res = await fetch(`${REGISTRY_URL}/admin/providers/pending`, {
        headers: { "X-Registry-Secret": withToken },
      });
      if (res.status === 401) {
        setError("Invalid admin token.");
        setPending(null);
        return;
      }
      if (!res.ok) throw new Error(`registry returned ${res.status}`);
      setPending(await res.json());
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    if (token) loadPending(token);
  }, [token]);

  function handleUnlock(e) {
    e.preventDefault();
    try {
      sessionStorage.setItem(STORAGE_KEY, tokenInput);
    } catch {
      // ignore -- token just won't persist across reloads
    }
    setToken(tokenInput);
  }

  async function act(id, action) {
    setBusyId(id);
    try {
      const res = await fetch(`${REGISTRY_URL}/admin/providers/${id}/${action}`, {
        method: "POST",
        headers: { "X-Registry-Secret": token },
      });
      if (!res.ok) throw new Error(`${action} failed (${res.status})`);
      setPending((list) => list.filter((p) => p.id !== id));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  if (!token) {
    return (
      <div style={{ maxWidth: 420, margin: "0 auto", padding: "80px 24px" }}>
        <Link href="/" style={{ color: "var(--text-muted)", fontSize: 13, textDecoration: "none" }}>
          ← Styx
        </Link>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: "16px 0 20px" }}>Admin</h1>
        <form onSubmit={handleUnlock}>
          <input
            type="password"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            placeholder="Admin token"
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: "var(--surface-1)",
              color: "var(--text-primary)",
              fontSize: 14,
              marginBottom: 12,
            }}
          />
          <button
            type="submit"
            style={{
              background: "var(--series-blue)",
              color: "#fff",
              border: "none",
              padding: "10px 20px",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Unlock
          </button>
        </form>
        {error && <div style={{ color: "var(--status-critical)", fontSize: 13, marginTop: 12 }}>{error}</div>}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "48px 24px 80px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div>
          <Link href="/" style={{ color: "var(--text-muted)", fontSize: 13, textDecoration: "none" }}>
            ← Styx
          </Link>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: "8px 0 0" }}>Pending providers</h1>
        </div>
        <button
          onClick={() => {
            try {
              sessionStorage.removeItem(STORAGE_KEY);
            } catch {}
            setToken("");
            setTokenInput("");
            setPending(null);
          }}
          style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: 13, cursor: "pointer" }}
        >
          Lock
        </button>
      </div>

      {error && <div style={{ color: "var(--status-critical)", fontSize: 13, margin: "16px 0" }}>{error}</div>}

      <div style={{ marginTop: 24 }}>
        {pending === null && !error && <div style={{ color: "var(--text-muted)" }}>Loading…</div>}
        {pending && pending.length === 0 && (
          <div style={{ color: "var(--text-muted)", fontSize: 14 }}>Nothing waiting for review.</div>
        )}
        {pending &&
          pending.map((p) => (
            <div
              key={p.id}
              style={{
                background: "var(--surface-1)",
                border: "1px solid var(--border)",
                borderRadius: 10,
                padding: 18,
                marginBottom: 12,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{p.name}</div>
                  <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>
                    {p.category} · ${p.price_usdc}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6, wordBreak: "break-all" }}>
                    {p.endpoint_url}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2, wordBreak: "break-all" }}>
                    wallet: {p.wallet_addr}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  <button
                    disabled={busyId === p.id}
                    onClick={() => act(p.id, "approve")}
                    style={{
                      background: "var(--status-good)",
                      color: "#fff",
                      border: "none",
                      padding: "8px 14px",
                      borderRadius: 6,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                      opacity: busyId === p.id ? 0.6 : 1,
                    }}
                  >
                    Approve
                  </button>
                  <button
                    disabled={busyId === p.id}
                    onClick={() => act(p.id, "reject")}
                    style={{
                      background: "none",
                      color: "var(--status-critical)",
                      border: "1px solid var(--status-critical)",
                      padding: "8px 14px",
                      borderRadius: 6,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                      opacity: busyId === p.id ? 0.6 : 1,
                    }}
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
