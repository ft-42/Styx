# Integrating your own provider

This is the guide for a third party who wants to plug their own paid
API into the registry so agents using the router SDK can discover, pay,
and call it -- without ever talking to you directly or knowing you exist
ahead of time.

If you're the project owner testing locally, `resource-server/server.js`
already does everything below and is the reference implementation this
guide is based on.

## What you need

- An existing API endpoint you want to monetize (data feed, LLM
  completion, whatever).
- A wallet address on Base that can receive USDC. Two options:
  - **Bring your own wallet** -- any EVM address you already control.
    You'll still need a free [CDP](https://portal.cdp.coinbase.com) API
    key (just the key, not a wallet secret) so the x402 middleware can
    talk to Coinbase's facilitator for settlement.
  - **Let CDP manage the wallet** -- CDP provisions and holds a wallet
    for you (this is what `resource-server/server.js` does). Needs a
    full CDP API key + wallet secret.
- Network access to the registry (`REGISTRY_URL`, default
  `http://localhost:4000` for local testing).

## Step 1: Wrap your endpoint with x402 payment middleware

Using the CDP SDK (Node/Express) with your own wallet address --
no wallet secret required:

```js
import express from "express";
import { createX402Server } from "@coinbase/cdp-sdk/x402";
import { paymentMiddlewareFromHTTPServer } from "@x402/express";

const app = express();

const server = await createX402Server({
  environment: "production", // or "development" for Base Sepolia -- see note below
  payToConfig: { type: "address", evm: "0xYourWalletAddress" },
  routes: {
    "GET /your-route": { price: "$0.01", description: "what this returns" },
  },
});

app.use(paymentMiddlewareFromHTTPServer(server));

app.get("/your-route", (req, res) => {
  res.json({ your: "data" });
});

app.listen(4004);
```

Prefer to let CDP manage the wallet instead? Drop `payToConfig` entirely
(defaults to `{ type: "eoa" }`) and set `CDP_WALLET_SECRET` -- see
`resource-server/server.js` for the full pattern, including self-registration
(Step 2, automated).

Not on Node? Any x402-compliant server middleware works -- the registry
doesn't care what stack served the response, only that a router paying
`GET <your endpoint_url>` gets back a 402 challenge, then the real
response once paid. See the [x402 seller quickstart](https://docs.cdp.coinbase.com/x402/seller/quickstart)
for other languages/frameworks.

## Step 2: Register with the registry

**Easiest**: use the [self-serve form](https://dashboard-production-ddba.up.railway.app/register)
-- fill in name, category, price, endpoint, and wallet address, submit,
and save the `management_token` it shows you (once).

Or call the API directly:

```bash
curl -X POST https://registry-production-d35b.up.railway.app/providers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Your Provider Name",
    "category": "price-feed",
    "endpoint_url": "http://your-host:4004/your-route",
    "price_usdc": 0.01,
    "wallet_addr": "0xYourWalletAddress"
  }'
```

Either way, a **new** submission lands as `pending_review` -- inactive
and invisible to routing until it's approved. This is intentional: it's
what lets registration be self-serve at all without opening the
registry up to anyone squatting on a category or hijacking an existing
listing. You'll hear back once it's reviewed.

The response includes a `management_token` -- **save it, it's shown
exactly once.** Notes:
- `category` is a free-form string, but pick an existing one
  (`price-feed` is the only one in use today) unless you're genuinely
  introducing a new kind of service -- agents query by category, so a
  typo'd or one-off category means nobody finds you.
- Registration is **idempotent by `endpoint_url`** -- re-POSTing the
  same `endpoint_url` updates your existing entry (new price, new
  wallet, etc.) instead of creating a duplicate. Updating requires the
  `management_token` you were given at signup (send it as
  `"management_token"` in the body) -- without it, the update is
  rejected. This is what stops a stranger who merely learns your
  `endpoint_url` from overwriting your listing.
- Registration attempts are rate-limited (a handful per hour, per IP)
  to keep the review queue from being spammed.
- You start with a neutral reputation score (`0.5`) and no call history.
  See Step 3.

## Step 3: How ranking and reputation work

The router SDK (`router-sdk/router.js`) queries `GET /providers?category=...`,
which returns providers sorted by `reputation_score` descending. The score
is:

```
score = success_rate * 0.7 + latency_score * 0.3
```

where `latency_score` rewards responses under 300ms and penalizes
anything over ~3s. Your score starts at `0.5` and only moves once real
calls are routed to you -- **you never call the reporting endpoint
yourself**; the router does, automatically, after every call it routes
through you (success or failure). There's nothing for you to implement
here beyond responding correctly and reasonably fast.

## Step 4: Test that agents can actually find and pay you

```js
import { request } from "router-sdk";

const result = await request({ category: "price-feed", maxPrice: 0.02 });
console.log(result.provider.name, result.data);
```

If your provider is the best-ranked match under `maxPrice`, this pays
you and returns your response. If it fails, the router falls back to
the next-ranked provider and reports your failure -- check your server
logs and that your `endpoint_url` is actually reachable from wherever
the router runs.

## Step 5 (optional): register on-chain too

There's also a minimal on-chain registry contract,
`packages/contracts/contracts/ProviderRegistry.sol`, deployed at the
same address on both networks (deterministic `CREATE` address --
deployer + nonce were identical on both chains):

- Base Sepolia: `0x4dfb3aca5bd61f9be7cb51a97a17376d9ec7466e`
- Base mainnet: `0x4dfb3aca5bd61f9be7cb51a97a17376d9ec7466e`

This is **purely additive** -- a public, permanent record that you
registered, separate from the off-chain registry that actually powers
routing. Nothing reads from it at request time, so skipping this step
doesn't affect discoverability or payments at all. It exists mainly as
a verifiable trust anchor (and because "Contract address on Base" shows
up on things like grant applications).

`resource-server/server.js` does this automatically when
`PROVIDER_REGISTRY_ADDRESS` is set -- it signs the registration
transaction from the same CDP-managed wallet that receives your x402
payments (via `cdp.evm.getOrCreateAccount({ name: <your account name> })`,
idempotent, so no new wallet is created). To do it yourself directly:

```js
import { CdpClient } from "@coinbase/cdp-sdk";
import { createPublicClient, http, encodeFunctionData } from "viem";
import { base } from "viem/chains"; // or baseSepolia

const abi = [{
  type: "function", name: "registerProvider", stateMutability: "nonpayable",
  inputs: [
    { name: "name", type: "string" }, { name: "category", type: "string" },
    { name: "endpointUrl", type: "string" }, { name: "priceMicroUsdc", type: "uint256" },
    { name: "walletAddr", type: "address" },
  ],
  outputs: [{ name: "id", type: "bytes32" }],
}];

const cdp = new CdpClient({ /* CDP_API_KEY_ID / SECRET / WALLET_SECRET */ });
const account = await cdp.evm.getOrCreateAccount({ name: "your-account-name" });
const publicClient = createPublicClient({ chain: base, transport: http() });

const data = encodeFunctionData({
  abi, functionName: "registerProvider",
  args: ["Your Provider Name", "price-feed", "http://your-host/your-route", 10000n, account.address],
});
const [nonce, fees, gas] = await Promise.all([
  publicClient.getTransactionCount({ address: account.address }),
  publicClient.estimateFeesPerGas(),
  publicClient.estimateGas({ account: account.address, to: "0x4dfb3aca5bd61f9be7cb51a97a17376d9ec7466e", data }),
]);
const signedTx = await account.signTransaction({
  type: "eip1559", chainId: base.id, to: "0x4dfb3aca5bd61f9be7cb51a97a17376d9ec7466e",
  nonce, data, gas: (gas * 120n) / 100n,
  maxFeePerGas: fees.maxFeePerGas, maxPriorityFeePerGas: fees.maxPriorityFeePerGas, value: 0n,
});
const hash = await publicClient.sendRawTransaction({ serializedTransaction: signedTx });
```

Costs real gas (typically a couple cents on Base). Regular contract
*calls* like this sign fine through CDP's normal `signTransaction` --
only contract *deployment* (no `to` address) needed a workaround; see
`packages/contracts/scripts/deploy.mjs` if you're curious why.

## Registry API reference

| Method | Path | Who calls it | Purpose |
|---|---|---|---|
| `POST` | `/providers` | You (once, or on restart) | Register or update your listing (new = pending review; rate-limited) |
| `GET` | `/providers?category=` | Router SDK | List **approved, active** providers, ranked by reputation |
| `GET` | `/providers/:id` | Anyone | Fetch a single provider |
| `POST` | `/providers/:id/report` | Router SDK only | Reports a call outcome -- not for provider use |
| `GET` | `/dashboard/providers` | Dashboard | All providers + scores, any status |
| `GET` | `/dashboard/summary` | Dashboard | Aggregate totals (calls, revenue, success rate) |
| `GET` | `/admin/providers/pending` | Admin only (`X-Registry-Secret`) | List submissions awaiting review |
| `POST` | `/admin/providers/:id/approve` | Admin only | Approve a pending submission |
| `POST` | `/admin/providers/:id/reject` | Admin only | Reject a pending submission |
| `GET` | `/health` | Anyone | Liveness check |

## Important: network/environment must match

The registry has no concept of network -- it just stores whatever
`endpoint_url` and `wallet_addr` you give it. If you register a
Base-Sepolia-only endpoint but the router paying you is configured for
`X402_ENVIRONMENT=production` (Base mainnet), payments will fail with
no useful error from the registry itself, because it never checked.
**Everyone registering against the same registry deployment needs to
agree out-of-band on which network they're using.** In this repo that's
whatever `X402_ENVIRONMENT` the resource-server and router-sdk instances
share.

## Security notes (read before registering against a public registry)

- **New listings need approval.** A brand-new `endpoint_url` lands as
  `pending_review` and won't be routable until an admin approves it via
  `/admin/providers/:id/approve` (or the `/admin` page). This is
  intentional -- it's what makes public self-serve registration safe to
  offer at all.
- **Updates require your `management_token`.** Issued once, at
  creation. Without it, nobody -- including someone who merely learned
  your `endpoint_url` -- can modify your listing. There's no account or
  password recovery; losing it means asking the admin to fix your entry
  manually.
- **Registration is rate-limited** (a handful of attempts per hour, per
  IP) to keep the review queue from being spammed. This limit is
  intentionally small -- it's not meant to support high-volume
  programmatic registration.
- **Reputation is router-reported, not verified on-chain.** A router
  could lie about outcomes. This is an MVP scoring model, not a
  trust-minimized one -- don't rely on it for anything beyond routing
  preference in a low-stakes demo.
