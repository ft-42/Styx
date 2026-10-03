// registry/server.js
//
// The registry: providers self-register here (see resource-server/server.js),
// and the router SDK queries it to decide who to pay. This is the piece the
// architecture doc calls the "Registry API" + "Registry DB".

import "dotenv/config";
import express from "express";
import {
  addProvider,
  listProviders,
  getProvider,
  reportOutcome,
  allProvidersWithScores,
  listPending,
  approveProvider,
  rejectProvider,
  ForbiddenError,
} from "./store.js";

const PORT = process.env.PORT || 4000;
// Shared secret for two things: (1) our own resource-server instances
// prove they're "trusted" so their registrations go active immediately,
// (2) the admin review endpoints. Unset in local dev is fine -- every
// registration is then untrusted (pending_review) and admin routes are
// simply unreachable (no token can match undefined).
const REGISTRY_ADMIN_TOKEN = process.env.REGISTRY_ADMIN_TOKEN;

const app = express();
// Railway (and most PaaS hosts) terminate the connection through a
// reverse proxy -- without this, req.ip is the proxy's address for
// every request, and the per-IP rate limiter below would treat every
// visitor as the same "IP".
app.set("trust proxy", true);
app.use(express.json());

// CORS: wide open. The registry has no per-user auth model -- only a
// single shared admin secret -- so this is fine; nothing here is
// per-origin sensitive.
app.use((_req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, X-Registry-Secret");
  next();
});

function isTrusted(req) {
  return Boolean(REGISTRY_ADMIN_TOKEN) && req.get("X-Registry-Secret") === REGISTRY_ADMIN_TOKEN;
}

function requireAdmin(req, res, next) {
  if (!isTrusted(req)) return res.status(401).json({ error: "missing or invalid X-Registry-Secret" });
  next();
}

// Very small in-memory rate limiter for untrusted (public self-serve)
// registration attempts -- good enough to stop casual abuse without a
// new dependency. Trusted (our own resource-server) calls are exempt.
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX = 5;
const rateLimitHits = new Map(); // ip -> timestamps[]

function checkRateLimit(ip) {
  const now = Date.now();
  const hits = (rateLimitHits.get(ip) || []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (hits.length >= RATE_LIMIT_MAX) return false;
  hits.push(now);
  rateLimitHits.set(ip, hits);
  return true;
}

// Register (or re-register) a provider.
// Trusted callers (our own resource-server instances, via X-Registry-Secret)
// go active immediately. Everyone else lands as pending_review, rate-limited,
// and gets back a management_token (shown once) needed to ever update that
// same endpoint_url again.
app.post("/providers", async (req, res) => {
  const { name, category, endpoint_url, price_usdc, wallet_addr, management_token } = req.body || {};
  if (!name || !category || !endpoint_url || !wallet_addr) {
    return res.status(400).json({ error: "name, category, endpoint_url, and wallet_addr are required" });
  }

  const trusted = isTrusted(req);
  if (!trusted && !checkRateLimit(req.ip)) {
    return res.status(429).json({ error: "too many registration attempts, try again later" });
  }

  try {
    const { provider, management_token: newToken } = await addProvider({
      name,
      category,
      endpoint_url,
      price_usdc,
      wallet_addr,
      trusted,
      managementToken: management_token,
    });
    res.status(201).json(newToken ? { ...provider, management_token: newToken } : provider);
  } catch (err) {
    if (err instanceof ForbiddenError) return res.status(403).json({ error: err.message });
    throw err;
  }
});

// Admin review queue for pending (untrusted) submissions.
app.get("/admin/providers/pending", requireAdmin, async (_req, res) => {
  res.json(await listPending());
});

app.post("/admin/providers/:id/approve", requireAdmin, async (req, res) => {
  const updated = await approveProvider(req.params.id);
  if (!updated) return res.status(404).json({ error: "not found" });
  res.json(updated);
});

app.post("/admin/providers/:id/reject", requireAdmin, async (req, res) => {
  const updated = await rejectProvider(req.params.id);
  if (!updated) return res.status(404).json({ error: "not found" });
  res.json(updated);
});

// List providers, optionally filtered by category, ranked by reputation score.
app.get("/providers", async (req, res) => {
  const providers = await listProviders(req.query.category);
  res.json(providers);
});

// Fetch a single provider.
app.get("/providers/:id", async (req, res) => {
  const provider = await getProvider(req.params.id);
  if (!provider) return res.status(404).json({ error: "not found" });
  res.json(provider);
});

// The router calls this after every real routed call, so reputation
// reflects live usage instead of self-reported claims.
app.post("/providers/:id/report", async (req, res) => {
  const { success, latencyMs, amountUsdc } = req.body || {};
  if (typeof success !== "boolean" || typeof latencyMs !== "number") {
    return res.status(400).json({ error: "success (boolean) and latencyMs (number) are required" });
  }
  const updated = await reportOutcome(req.params.id, { success, latencyMs, amountUsdc });
  if (!updated) return res.status(404).json({ error: "not found" });
  res.json(updated);
});

// Powers the dashboard's "all providers + scores" view.
app.get("/dashboard/providers", async (_req, res) => {
  res.json(await allProvidersWithScores());
});

// Powers the dashboard's summary cards (total volume, revenue, etc).
app.get("/dashboard/summary", async (_req, res) => {
  const providers = await allProvidersWithScores();
  const summary = providers.reduce(
    (acc, p) => {
      if (p.active) acc.total_providers += 1;
      acc.total_calls += p.reputation_stats.calls_total;
      acc.total_successful_calls += p.reputation_stats.calls_success;
      acc.total_revenue_usdc += p.reputation_stats.revenue_usdc || 0;
      return acc;
    },
    { total_providers: 0, total_calls: 0, total_successful_calls: 0, total_revenue_usdc: 0 }
  );
  summary.total_revenue_usdc = Math.round(summary.total_revenue_usdc * 1e6) / 1e6;
  summary.overall_success_rate = summary.total_calls > 0 ? Math.round((summary.total_successful_calls / summary.total_calls) * 1000) / 1000 : null;
  res.json(summary);
});

app.get("/health", (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`Registry listening on :${PORT}`);
});
