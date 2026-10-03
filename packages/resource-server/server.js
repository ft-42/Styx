// resource-server/server.js
//
// This is ONE x402-paid provider. Run this same file multiple times with
// different env vars (PORT, PROVIDER_NAME, ASSET) to simulate 2-3
// independent "competing" providers, exactly like the architecture plan.
//
// It uses the official CDP SDK to provision the receiving wallet for you --
// you do NOT need to generate or store a private key for this server.
// See: https://docs.cdp.coinbase.com/x402/seller/quickstart

import "dotenv/config";
import express from "express";
import { CdpClient } from "@coinbase/cdp-sdk";
import { createX402Server } from "@coinbase/cdp-sdk/x402";
import { paymentMiddlewareFromHTTPServer } from "@x402/express";
import { createPublicClient, http, encodeFunctionData } from "viem";
import { base, baseSepolia } from "viem/chains";

const PORT = process.env.PORT || 4001;
const PROVIDER_NAME = process.env.PROVIDER_NAME || "Price Feed A";
const ASSET = process.env.ASSET || "ETH";
const PRICE = process.env.PRICE || "$0.01";
// "development" = Base Sepolia testnet (free test funds).
// "production"  = Base mainnet (real USDC). Flip this only when you're ready.
const X402_ENVIRONMENT = process.env.X402_ENVIRONMENT || "development";
const REGISTRY_URL = process.env.REGISTRY_URL || "http://localhost:4000";
const CATEGORY = "price-feed";
// Optional: on-chain ProviderRegistry contract address (see
// packages/contracts). Purely additive -- if unset, behavior is
// identical to before this was added.
const PROVIDER_REGISTRY_ADDRESS = process.env.PROVIDER_REGISTRY_ADDRESS;

// Minimal ABI fragment -- just the one function this server calls.
// Kept inline rather than depending on packages/contracts' build output,
// so resource-server has no cross-package dependency for one function call.
const PROVIDER_REGISTRY_ABI = [
  {
    type: "function",
    name: "registerProvider",
    stateMutability: "nonpayable",
    inputs: [
      { name: "name", type: "string" },
      { name: "category", type: "string" },
      { name: "endpointUrl", type: "string" },
      { name: "priceMicroUsdc", type: "uint256" },
      { name: "walletAddr", type: "address" },
    ],
    outputs: [{ name: "id", type: "bytes32" }],
  },
];

// Swap this for a real data source (CoinGecko, a CEX API, etc).
// Kept dependency-free and offline-safe so the demo always works even
// without outbound network access.
function getSimulatedPrice(asset) {
  const base = { ETH: 3200, BTC: 62000, SOL: 145 }[asset] || 100;
  const jitter = (Math.random() - 0.5) * base * 0.01; // +/- 0.5%
  return Math.round((base + jitter) * 100) / 100;
}

// Same account name used for payToConfig below, so the on-chain
// registration (if enabled) signs from the exact same wallet that
// receives this provider's x402 payments.
const ACCOUNT_NAME = `x402-${PROVIDER_NAME.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-wallet`;

// The URL this provider reports about itself to the registry (both
// off-chain and on-chain). Railway (and most PaaS hosts) auto-inject
// RAILWAY_PUBLIC_DOMAIN once a public domain is attached to the
// service -- prefer that over localhost so a hosted deployment reports
// a URL other machines can actually reach. Override with PUBLIC_URL if
// you're hosting somewhere that doesn't set that convention.
const PUBLIC_BASE_URL =
  process.env.PUBLIC_URL ||
  (process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : `http://localhost:${PORT}`);

async function main() {
  const app = express();

  // createX402Server provisions (or reuses) a CDP-managed wallet for this
  // provider, connects to the CDP Facilitator, and registers payment schemes.
  const server = await createX402Server({
    environment: X402_ENVIRONMENT,
    // Without this, every resource-server instance defaults to the same
    // account name ("x402-receiver-wallet-1") and ends up sharing one wallet
    // across all "competing" providers -- give each provider its own.
    payToConfig: {
      type: "eoa",
      accountName: ACCOUNT_NAME,
    },
    routes: {
      [`GET /price/${ASSET.toLowerCase()}`]: {
        price: PRICE,
        description: `${PROVIDER_NAME}: live ${ASSET} price feed`,
      },
    },
  });

  app.use(paymentMiddlewareFromHTTPServer(server));

  app.get(`/price/${ASSET.toLowerCase()}`, (_req, res) => {
    res.json({
      provider: PROVIDER_NAME,
      asset: ASSET,
      price_usd: getSimulatedPrice(ASSET),
      timestamp: new Date().toISOString(),
    });
  });

  // Simple unpaid healthcheck so the router/registry can ping liveness
  // without triggering a 402.
  app.get("/health", (_req, res) => res.json({ ok: true, provider: PROVIDER_NAME }));

  app.listen(PORT, async () => {
    console.log(`[${PROVIDER_NAME}] listening on :${PORT}`);
    console.log(`[${PROVIDER_NAME}] receiving payments at ${server.payToEvmAddress}`);
    console.log(`[${PROVIDER_NAME}] paid route: GET /price/${ASSET.toLowerCase()} (${PRICE})`);

    // Self-register with the registry so you don't have to hand-enter
    // wallet addresses. Safe to fail silently if the registry isn't up yet --
    // you can always POST /providers manually (see registry/seed.js).
    try {
      const res = await fetch(`${REGISTRY_URL}/providers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Marks this as a trusted (first-party) registration so it goes
          // active immediately instead of landing in the pending-review
          // queue meant for the public self-serve form. Unset in local
          // dev is fine -- it just falls back to the pending-review path.
          ...(process.env.REGISTRY_ADMIN_TOKEN ? { "X-Registry-Secret": process.env.REGISTRY_ADMIN_TOKEN } : {}),
        },
        body: JSON.stringify({
          name: PROVIDER_NAME,
          category: CATEGORY,
          endpoint_url: `${PUBLIC_BASE_URL}/price/${ASSET.toLowerCase()}`,
          price_usdc: parsePriceToNumber(PRICE),
          wallet_addr: server.payToEvmAddress,
        }),
      });
      if (res.ok) {
        console.log(`[${PROVIDER_NAME}] registered with registry at ${REGISTRY_URL}`);
      } else {
        console.warn(`[${PROVIDER_NAME}] registry responded ${res.status}, register manually if needed`);
      }
    } catch (err) {
      console.warn(`[${PROVIDER_NAME}] could not reach registry (${REGISTRY_URL}) -- start it first, or register manually. (${err.message})`);
    }

    // Optional on-chain registration -- see packages/contracts. Opt-in via
    // PROVIDER_REGISTRY_ADDRESS; does not affect the off-chain flow above.
    if (PROVIDER_REGISTRY_ADDRESS) {
      try {
        const priceMicroUsdc = BigInt(Math.round(parsePriceToNumber(PRICE) * 1e6));
        const txHash = await registerOnChain({
          contractAddress: PROVIDER_REGISTRY_ADDRESS,
          environment: X402_ENVIRONMENT,
          accountName: ACCOUNT_NAME,
          name: PROVIDER_NAME,
          category: CATEGORY,
          endpointUrl: `${PUBLIC_BASE_URL}/price/${ASSET.toLowerCase()}`,
          priceMicroUsdc,
          walletAddr: server.payToEvmAddress,
        });
        console.log(`[${PROVIDER_NAME}] registered on-chain: ${txHash}`);
      } catch (err) {
        console.warn(`[${PROVIDER_NAME}] on-chain registration failed (non-fatal): ${err.message}`);
      }
    }
  });
}

async function registerOnChain({
  contractAddress,
  environment,
  accountName,
  name,
  category,
  endpointUrl,
  priceMicroUsdc,
  walletAddr,
}) {
  const cdp = new CdpClient({
    apiKeyId: process.env.CDP_API_KEY_ID,
    apiKeySecret: process.env.CDP_API_KEY_SECRET,
    walletSecret: process.env.CDP_WALLET_SECRET,
  });
  // getOrCreateAccount is idempotent by name -- this returns the SAME
  // account already used as this provider's payTo wallet, not a new one.
  const account = await cdp.evm.getOrCreateAccount({ name: accountName });

  const chain = environment === "production" ? base : baseSepolia;
  const publicClient = createPublicClient({ chain, transport: http() });

  const data = encodeFunctionData({
    abi: PROVIDER_REGISTRY_ABI,
    functionName: "registerProvider",
    args: [name, category, endpointUrl, priceMicroUsdc, walletAddr],
  });

  const [nonce, fees, gas] = await Promise.all([
    publicClient.getTransactionCount({ address: account.address }),
    publicClient.estimateFeesPerGas(),
    publicClient.estimateGas({ account: account.address, to: contractAddress, data }),
  ]);

  const transaction = {
    type: "eip1559",
    chainId: chain.id,
    to: contractAddress,
    nonce,
    data,
    gas: (gas * 120n) / 100n,
    maxFeePerGas: fees.maxFeePerGas,
    maxPriorityFeePerGas: fees.maxPriorityFeePerGas,
    value: 0n,
  };

  // A regular contract call (has a `to`) -- CDP's remote signTransaction
  // handles this fine. Only contract *creation* (no `to`, see
  // packages/contracts/scripts/deploy.mjs) needed the manual hash-signing
  // workaround.
  const signedTx = await account.signTransaction(transaction);
  const hash = await publicClient.sendRawTransaction({ serializedTransaction: signedTx });
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  if (receipt.status !== "success") {
    throw new Error(`on-chain registerProvider tx reverted (${hash})`);
  }
  return hash;
}

function parsePriceToNumber(priceStr) {
  return Number(String(priceStr).replace("$", "")) || 0;
}

main().catch((err) => {
  console.error("Failed to start resource server:", err);
  process.exit(1);
});
