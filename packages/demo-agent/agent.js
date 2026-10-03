// demo-agent/agent.js
//
// The flagship demo: a fully autonomous "agent" that periodically needs
// price data, asks the router SDK for it (zero human involvement, zero
// payment code written here), and logs the outcome. Run this unattended
// for 24-48h on Base mainnet before you apply for the grant -- that's your
// real, provable transaction history.

import "dotenv/config";
import { request } from "router-sdk";

const INTERVAL_MS = Number(process.env.AGENT_INTERVAL_MS) || 15000;
const CATEGORY = process.env.AGENT_CATEGORY || "price-feed";
const MAX_PRICE = process.env.AGENT_MAX_PRICE ? Number(process.env.AGENT_MAX_PRICE) : 0.02;

// If every provider fails N times in a row, it's almost always the paying
// wallet running out of funds -- not a reason to keep hammering every
// INTERVAL_MS forever. Back off exponentially instead, capped at
// MAX_BACKOFF_MS, so an unattended 24-48h run degrades to occasional
// retries (and loud warnings) rather than spamming failed requests.
const BACKOFF_WARNING_THRESHOLD = 3;
const MAX_BACKOFF_MS = 10 * 60 * 1000; // 10 minutes

let tick = 0;
let consecutiveFailures = 0;

async function runOnce() {
  tick += 1;
  const startedAt = new Date().toISOString();
  try {
    const result = await request({ category: CATEGORY, maxPrice: MAX_PRICE });
    console.log(
      `[agent] tick=${tick} ${startedAt} -> paid ${result.provider.name} ` +
        `($${result.provider.price_usdc}) in ${result.latencyMs}ms :: ${JSON.stringify(result.data)}`
    );
    consecutiveFailures = 0;
  } catch (err) {
    consecutiveFailures += 1;
    console.error(`[agent] tick=${tick} ${startedAt} -> FAILED (${consecutiveFailures}x in a row): ${err.message}`);
    if (consecutiveFailures === BACKOFF_WARNING_THRESHOLD) {
      console.warn(
        `[agent] ${consecutiveFailures} consecutive failures across every provider -- ` +
          `this usually means the paying wallet is out of funds. Check its balance and ` +
          `top it up (faucet on testnet, a real transfer on mainnet). Backing off.`
      );
    }
  }
}

function nextDelay() {
  if (consecutiveFailures === 0) return INTERVAL_MS;
  const backoff = INTERVAL_MS * 2 ** Math.min(consecutiveFailures, 10);
  return Math.min(backoff, MAX_BACKOFF_MS);
}

async function loop() {
  await runOnce();
  const delay = nextDelay();
  if (consecutiveFailures > 0) {
    console.log(`[agent] next attempt in ${Math.round(delay / 1000)}s`);
  }
  setTimeout(loop, delay);
}

console.log(`[agent] starting -- category="${CATEGORY}" maxPrice=$${MAX_PRICE} interval=${INTERVAL_MS}ms`);
console.log(`[agent] press Ctrl+C to stop`);

loop();
