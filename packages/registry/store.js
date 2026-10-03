// registry/store.js
//
// Minimal JSON-file backed store so the registry has zero external
// dependencies (no Postgres/Supabase account needed) to get started.
// Swap this module for a real Postgres client later -- the schema below
// maps directly onto the "providers" / "reputation_stats" tables from
// the architecture doc, so migrating is a matter of changing this file only.

import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { randomUUID, randomBytes } from "node:crypto";

// DB_PATH env var points this at a mounted persistent volume in
// production (Railway wipes the container filesystem on every
// redeploy -- without a real volume, every deploy silently resets the
// registry to empty, taking every registered provider with it). Falls
// back to a local file next to this module for local dev, where no
// volume exists.
const DB_PATH = process.env.DB_PATH || new URL("./db.json", import.meta.url);

async function loadDB() {
  if (!existsSync(DB_PATH)) {
    return { providers: [] };
  }
  const raw = await readFile(DB_PATH, "utf-8");
  return raw.trim() ? JSON.parse(raw) : { providers: [] };
}

async function saveDB(db) {
  await writeFile(DB_PATH, JSON.stringify(db, null, 2));
}

// Reputation score: weighted blend of success rate and latency.
// Simple on purpose -- good enough for an MVP, easy to justify in a grant
// application, and trivial to swap for something fancier later.
function computeScore(stats) {
  if (!stats || stats.calls_total === 0) return 0.5; // neutral prior for brand-new providers
  const successRate = stats.calls_success / stats.calls_total;
  // Normalize latency: <300ms is "great" (1.0), >3000ms is "bad" (0.0)
  const latencyScore = Math.max(0, Math.min(1, 1 - (stats.avg_latency_ms - 300) / 2700));
  return Math.round((successRate * 0.7 + latencyScore * 0.3) * 1000) / 1000;
}

// Public API responses never include the management_token -- it's a
// write-secret, shown to its owner exactly once at creation time.
function stripSecrets(provider) {
  const { management_token, ...rest } = provider;
  return rest;
}

// Thrown when an untrusted caller tries to update an existing
// endpoint_url without the management_token it was issued at creation.
export class ForbiddenError extends Error {}

/**
 * Register or update a provider.
 *
 * - `trusted: true` (our own resource-server instances, authenticated via
 *   a shared secret at the HTTP layer) -- creates/updates immediately as
 *   active, exactly the original behavior. No token required or checked.
 * - `trusted: false` (the public self-serve form) -- a brand-new
 *   endpoint_url is created as `pending_review` (inactive, invisible to
 *   routing) with a freshly generated management_token returned to the
 *   caller. Updating an EXISTING endpoint_url requires that same token,
 *   or the call is rejected -- this is what stops a stranger who merely
 *   knows the URL from overwriting someone else's listing.
 */
export async function addProvider({ name, category, endpoint_url, price_usdc, wallet_addr, trusted, managementToken }) {
  const db = await loadDB();

  // Idempotent: re-registering the same endpoint_url just updates it,
  // so restarting a resource-server doesn't create duplicate entries.
  const existing = db.providers.find((p) => p.endpoint_url === endpoint_url);
  if (existing) {
    if (!trusted && managementToken !== existing.management_token) {
      throw new ForbiddenError("Invalid or missing management_token for this endpoint_url.");
    }
    Object.assign(existing, { name, category, price_usdc, wallet_addr });
    if (trusted) {
      existing.status = "approved";
      existing.active = true;
    }
    await saveDB(db);
    return { provider: stripSecrets(existing), management_token: null };
  }

  const newManagementToken = randomBytes(24).toString("hex");
  const provider = {
    id: randomUUID(),
    name,
    category,
    endpoint_url,
    price_usdc,
    wallet_addr,
    active: !!trusted,
    status: trusted ? "approved" : "pending_review",
    management_token: newManagementToken,
    created_at: new Date().toISOString(),
    reputation_stats: {
      calls_total: 0,
      calls_success: 0,
      avg_latency_ms: 0,
      revenue_usdc: 0,
      last_updated: null,
    },
  };
  db.providers.push(provider);
  await saveDB(db);
  return { provider: stripSecrets(provider), management_token: trusted ? null : newManagementToken };
}

export async function listProviders(category) {
  const db = await loadDB();
  let providers = db.providers.filter((p) => p.active);
  if (category) providers = providers.filter((p) => p.category === category);
  return providers
    .map((p) => ({ ...stripSecrets(p), reputation_score: computeScore(p.reputation_stats) }))
    .sort((a, b) => b.reputation_score - a.reputation_score);
}

export async function getProvider(id) {
  const db = await loadDB();
  const provider = db.providers.find((p) => p.id === id);
  return provider ? stripSecrets(provider) : null;
}

export async function listPending() {
  const db = await loadDB();
  return db.providers.filter((p) => p.status === "pending_review").map(stripSecrets);
}

export async function approveProvider(id) {
  const db = await loadDB();
  const provider = db.providers.find((p) => p.id === id);
  if (!provider) return null;
  provider.status = "approved";
  provider.active = true;
  await saveDB(db);
  return stripSecrets(provider);
}

export async function rejectProvider(id) {
  const db = await loadDB();
  const provider = db.providers.find((p) => p.id === id);
  if (!provider) return null;
  provider.status = "rejected";
  provider.active = false;
  await saveDB(db);
  return stripSecrets(provider);
}

export async function reportOutcome(id, { success, latencyMs, amountUsdc }) {
  const db = await loadDB();
  const provider = db.providers.find((p) => p.id === id);
  if (!provider) return null;

  const stats = provider.reputation_stats;
  const prevAvg = stats.avg_latency_ms;
  const prevTotal = stats.calls_total;

  stats.calls_total += 1;
  if (success) {
    stats.calls_success += 1;
    // Only successful calls actually moved money.
    stats.revenue_usdc = Math.round(((stats.revenue_usdc || 0) + (amountUsdc || 0)) * 1e6) / 1e6;
  }
  // Running average latency
  stats.avg_latency_ms = Math.round((prevAvg * prevTotal + latencyMs) / stats.calls_total);
  stats.last_updated = new Date().toISOString();

  await saveDB(db);
  return { ...stripSecrets(provider), reputation_score: computeScore(stats) };
}

export async function allProvidersWithScores() {
  const db = await loadDB();
  return db.providers.map((p) => ({ ...stripSecrets(p), reputation_score: computeScore(p.reputation_stats) }));
}
