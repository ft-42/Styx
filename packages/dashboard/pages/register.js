import Link from "next/link";
import { useState } from "react";

const REGISTRY_URL = process.env.NEXT_PUBLIC_REGISTRY_URL;

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid var(--border)",
  background: "var(--surface-1)",
  color: "var(--text-primary)",
  fontSize: 14,
  fontFamily: "inherit",
};

const labelStyle = {
  display: "block",
  fontSize: 13,
  fontWeight: 600,
  color: "var(--text-secondary)",
  marginBottom: 6,
};

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    category: "price-feed",
    endpoint_url: "",
    price_usdc: "",
    wallet_addr: "",
    management_token: "",
  });
  const [state, setState] = useState({ status: "idle" }); // idle | submitting | success | error
  const [result, setResult] = useState(null);

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setState({ status: "submitting" });
    try {
      const body = {
        name: form.name,
        category: form.category,
        endpoint_url: form.endpoint_url,
        price_usdc: Number(form.price_usdc),
        wallet_addr: form.wallet_addr,
      };
      if (form.management_token) body.management_token = form.management_token;

      const res = await fetch(`${REGISTRY_URL}/providers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setState({ status: "error", message: data.error || `Request failed (${res.status})` });
        return;
      }
      setResult(data);
      setState({ status: "success" });
    } catch (err) {
      setState({ status: "error", message: err.message });
    }
  }

  if (state.status === "success") {
    const isUpdate = !result.management_token;
    return (
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "64px 24px" }}>
        <Link href="/" style={{ color: "var(--text-muted)", fontSize: 13, textDecoration: "none" }}>
          ← Styx
        </Link>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: "16px 0 8px" }}>
          {isUpdate ? "Listing updated." : "Submitted for review."}
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 15, lineHeight: 1.6 }}>
          {isUpdate
            ? "Your existing listing has been updated."
            : "Thanks — your provider is in the review queue and will appear once approved."}
        </p>

        {result.management_token && (
          <div
            style={{
              marginTop: 24,
              background: "var(--surface-1)",
              border: "1px solid var(--status-critical)",
              borderRadius: 10,
              padding: 20,
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8, color: "var(--status-critical)" }}>
              Save this now — it will not be shown again
            </div>
            <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 12 }}>
              You'll need this management token to update this listing later (new price, new
              endpoint, etc). There is no account or password — this token is the only way to
              prove the listing is yours.
            </div>
            <code
              style={{
                display: "block",
                background: "var(--page-plane)",
                border: "1px solid var(--border)",
                borderRadius: 6,
                padding: "10px 12px",
                fontSize: 13,
                wordBreak: "break-all",
              }}
            >
              {result.management_token}
            </code>
          </div>
        )}

        <button
          onClick={() => {
            setState({ status: "idle" });
            setResult(null);
          }}
          style={{
            marginTop: 24,
            background: "none",
            border: "1px solid var(--border)",
            color: "var(--text-primary)",
            padding: "10px 18px",
            borderRadius: 8,
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          Submit another
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 560, margin: "0 auto", padding: "64px 24px 80px" }}>
      <Link href="/" style={{ color: "var(--text-muted)", fontSize: 13, textDecoration: "none" }}>
        ← Styx
      </Link>
      <h1 style={{ fontSize: 26, fontWeight: 700, margin: "16px 0 8px" }}>Register your provider</h1>
      <p style={{ color: "var(--text-secondary)", fontSize: 15, lineHeight: 1.6, marginBottom: 32 }}>
        New listings go into a short review queue before they're routable. If you're updating a
        listing you already own, add the management token you were given at signup.
      </p>

      <form onSubmit={handleSubmit}>
        <Field label="Provider name">
          <input
            style={inputStyle}
            required
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="e.g. Acme Weather Feed"
          />
        </Field>

        <Field label="Category">
          <input
            style={inputStyle}
            required
            value={form.category}
            onChange={(e) => update("category", e.target.value)}
            placeholder="price-feed"
          />
        </Field>

        <Field label="Endpoint URL">
          <input
            style={inputStyle}
            required
            type="url"
            value={form.endpoint_url}
            onChange={(e) => update("endpoint_url", e.target.value)}
            placeholder="https://your-api.example.com/route"
          />
        </Field>

        <Field label="Price (USDC per call)">
          <input
            style={inputStyle}
            required
            type="number"
            step="0.001"
            min="0"
            value={form.price_usdc}
            onChange={(e) => update("price_usdc", e.target.value)}
            placeholder="0.01"
          />
        </Field>

        <Field label="Wallet address (receives payments)">
          <input
            style={inputStyle}
            required
            value={form.wallet_addr}
            onChange={(e) => update("wallet_addr", e.target.value)}
            placeholder="0x..."
          />
        </Field>

        <Field label="Management token (only if updating an existing listing)">
          <input
            style={inputStyle}
            value={form.management_token}
            onChange={(e) => update("management_token", e.target.value)}
            placeholder="optional"
          />
        </Field>

        {state.status === "error" && (
          <div style={{ color: "var(--status-critical)", fontSize: 13, marginBottom: 16 }}>{state.message}</div>
        )}

        <button
          type="submit"
          disabled={state.status === "submitting"}
          style={{
            background: "var(--series-blue)",
            color: "#fff",
            border: "none",
            padding: "12px 22px",
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            cursor: state.status === "submitting" ? "default" : "pointer",
            opacity: state.status === "submitting" ? 0.7 : 1,
          }}
        >
          {state.status === "submitting" ? "Submitting…" : "Submit"}
        </button>
      </form>
    </div>
  );
}
