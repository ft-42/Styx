// registry/seed.js
//
// Optional: manually seed 3 fake providers so you can test the registry
// API and the router's ranking logic BEFORE you've wired up real CDP
// wallets. Once your real resource-server instances are running, they
// self-register automatically and you don't need this.
//
// Usage: node seed.js   (registry server must already be running)

const REGISTRY_URL = process.env.REGISTRY_URL || "http://localhost:4000";

const fakeProviders = [
  {
    name: "Price Feed A (seed)",
    category: "price-feed",
    endpoint_url: "http://localhost:4001/price/eth",
    price_usdc: 0.01,
    wallet_addr: "0x0000000000000000000000000000000000AAAA",
  },
  {
    name: "Price Feed B (seed)",
    category: "price-feed",
    endpoint_url: "http://localhost:4002/price/eth",
    price_usdc: 0.008,
    wallet_addr: "0x0000000000000000000000000000000000BBBB",
  },
  {
    name: "Price Feed C (seed)",
    category: "price-feed",
    endpoint_url: "http://localhost:4003/price/eth",
    price_usdc: 0.012,
    wallet_addr: "0x0000000000000000000000000000000000CCCC",
  },
];

async function main() {
  for (const provider of fakeProviders) {
    const res = await fetch(`${REGISTRY_URL}/providers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(provider),
    });
    const body = await res.json();
    console.log(res.ok ? `Seeded: ${provider.name}` : `Failed: ${provider.name} -> ${JSON.stringify(body)}`);
  }
}

main().catch((err) => {
  console.error("Seed failed -- is the registry running on", REGISTRY_URL, "?", err.message);
  process.exit(1);
});
