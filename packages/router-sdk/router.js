// router-sdk/router.js
//
// This is the actual product. Everything else in this repo (resource-server,
// registry) exists to support this: an SDK that lets an agent ask for a
// *category* of data/service, and automatically discovers, ranks, pays,
// and falls back between competing x402 providers -- without the agent
// developer writing any payment code themselves.
//
// Usage:
//   import { request } from "router-sdk";
//   const result = await request({ category: "price-feed", maxPrice: 0.02 });

import "dotenv/config";
import { CdpX402Client } from "@coinbase/cdp-sdk/x402";
import { wrapFetchWithPayment } from "@x402/fetch";

const REGISTRY_URL = process.env.REGISTRY_URL || "http://localhost:4000";
const X402_ENVIRONMENT = process.env.X402_ENVIRONMENT || "development";

let _client = null;
let _fetchWithPayment = null;

// Lazily create the paying wallet/client once and reuse it across calls.
async function getPayingFetch() {
  if (_fetchWithPayment) return _fetchWithPayment;

  _client = new CdpX402Client({ environment: X402_ENVIRONMENT });
  const { evmAddress } = await _client.getAddresses();
  console.log(`[router-sdk] paying from wallet: ${evmAddress}`);

  _fetchWithPayment = wrapFetchWithPayment(globalThis.fetch, _client);
  return _fetchWithPayment;
}

async function fetchProviders(category) {
  const url = new URL("/providers", REGISTRY_URL);
  if (category) url.searchParams.set("category", category);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`registry returned ${res.status}`);
  return res.json();
}

async function reportOutcome(providerId, { success, latencyMs, amountUsdc }) {
  try {
    await fetch(`${REGISTRY_URL}/providers/${providerId}/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ success, latencyMs, amountUsdc }),
    });
  } catch (err) {
    // Reputation reporting is best-effort -- never let it break the caller's request.
    console.warn(`[router-sdk] failed to report outcome for ${providerId}: ${err.message}`);
  }
}

/**
 * Request data/service in a given category. Automatically:
 *  1. Queries the registry for active providers in that category
 *  2. Ranks them by live reputation score
 *  3. Pays + calls the top-ranked provider via x402
 *  4. Falls back to the next-best provider on failure
 *  5. Reports the outcome back to the registry either way
 *
 * @param {object} opts
 * @param {string} opts.category - e.g. "price-feed"
 * @param {number} [opts.maxPrice] - skip providers priced above this (USDC)
 * @param {object} [opts.params] - extra query params appended to the provider's endpoint
 * @param {number} [opts.attempts] - max providers to try before giving up (default 3)
 */
export async function request({ category, maxPrice, params, attempts = 3 }) {
  const allProviders = await fetchProviders(category);
  const candidates = (maxPrice != null ? allProviders.filter((p) => p.price_usdc <= maxPrice) : allProviders).slice(
    0,
    attempts
  );

  if (candidates.length === 0) {
    throw new Error(`No providers available for category "${category}"${maxPrice != null ? ` under $${maxPrice}` : ""}`);
  }

  const fetchWithPayment = await getPayingFetch();
  const errors = [];

  for (const provider of candidates) {
    const start = Date.now();
    try {
      const url = new URL(provider.endpoint_url);
      if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

      const res = await fetchWithPayment(url.toString());
      const latencyMs = Date.now() - start;

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      await reportOutcome(provider.id, { success: true, latencyMs, amountUsdc: provider.price_usdc });

      return {
        data,
        provider: { id: provider.id, name: provider.name, price_usdc: provider.price_usdc },
        latencyMs,
      };
    } catch (err) {
      const latencyMs = Date.now() - start;
      await reportOutcome(provider.id, { success: false, latencyMs });
      errors.push(`${provider.name}: ${err.message}`);
      // fall through to next candidate
    }
  }

  throw new Error(`All providers failed for category "${category}":\n${errors.join("\n")}`);
}
