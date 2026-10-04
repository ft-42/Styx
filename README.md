# Styx402 -- x402 Agent Commerce Router

Styx is a discovery, routing, and reputation layer on top of Coinbase's
x402 payment protocol on Base. Agents ask for a capability by category;
Styx ranks every registered provider by live reputation, pays the best
one over x402, and falls back to the next one if it fails.

- **Live site:** https://www.styx402.com
- **Live dashboard:** https://www.styx402.com/dashboard
- **Register your API:** https://www.styx402.com/register

## What's in here

```
packages/
  resource-server/   One x402-paid endpoint. Run it 2-3x with different
                      env vars to simulate 2-3 competing providers.
  registry/           Providers register here. Router SDK queries it.
                      JSON-file backed (persisted on a Railway Volume).
  router-sdk/         THE PRODUCT. Discovers providers, ranks by live
                      reputation, pays via x402, falls back on failure.
  demo-agent/         Autonomous script that proves the whole loop works
                      unattended on Base mainnet.
  dashboard/          Next.js site: public landing page, provider
                      self-registration (/register), admin review queue
                      (/admin), and the live stats dashboard (/dashboard).
  contracts/          Optional on-chain ProviderRegistry (Base Sepolia and
                      Base mainnet, 0x4dfb3aca5bd61f9be7cb51a97a17376d9ec7466e).
```

Everything is verified to install and run -- the registry has been tested
end-to-end (register, list, rank, report). The resource-server and router
use the real, current Coinbase CDP SDK API, confirmed against the official
docs and the actual installed package exports.

## 1. Get CDP credentials (5 minutes, free)

1. Go to https://portal.cdp.coinbase.com and create a free account.
2. Create an API key -- you'll get `CDP_API_KEY_ID` and `CDP_API_KEY_SECRET`.
3. Generate a wallet secret -- you'll get `CDP_WALLET_SECRET`.

These three values let the CDP SDK provision wallets for you automatically.
You do NOT need to generate or store private keys yourself for either the
resource-server (receiving) or the router-sdk/demo-agent (paying) side.

## 2. Install

```bash
npm install
```

This installs all four packages via npm workspaces (already verified working).

## 3. Set up environment variables

Copy the example env file into each package that needs it:

```bash
cp packages/resource-server/.env.example packages/resource-server/.env
```

Fill in your `CDP_API_KEY_ID`, `CDP_API_KEY_SECRET`, `CDP_WALLET_SECRET` in
that file. The router-sdk and demo-agent need the same three variables --
easiest is to export them in your shell before running those:

```bash
export CDP_API_KEY_ID="..."
export CDP_API_KEY_SECRET="..."
export CDP_WALLET_SECRET="..."
```

Leave `X402_ENVIRONMENT=development` everywhere for now -- that uses Base
Sepolia (testnet) with free test funds. You'll flip this to `production`
only once you're ready to go live on Base mainnet (see the build plan,
Days 12-13).

## 4. Run the registry

```bash
npm run registry
```

Runs on `http://localhost:4000`. Leave this running in its own terminal.

## 5. Run 2-3 provider instances

Each of these is the SAME resource-server code, just on a different port
with a different name/asset -- simulating 2-3 competing providers, exactly
as the architecture plan describes.

```bash
# terminal 2
cd packages/resource-server && PORT=4001 PROVIDER_NAME="Price Feed A" ASSET=ETH PRICE='$0.01' node server.js

# terminal 3
cd packages/resource-server && PORT=4002 PROVIDER_NAME="Price Feed B" ASSET=ETH PRICE='$0.008' node server.js

# terminal 4
cd packages/resource-server && PORT=4003 PROVIDER_NAME="Price Feed C" ASSET=ETH PRICE='$0.012' node server.js
```

Each one provisions its own CDP wallet on startup and self-registers with
the registry -- you'll see `registered with registry at http://localhost:4000`
in the logs. No manual wallet address copying needed.

If you'd rather test the registry/router logic before wiring up real CDP
wallets, you can seed 3 fake providers instead:

```bash
cd packages/registry && node seed.js
```

## 6. Fund your paying wallet (testnet, free)

Run the demo agent once to see which address it pays from, then send it
free testnet USDC from the CDP faucet (portal.cdp.coinbase.com or the
`cdp.evm.requestFaucet` API -- see the official buyer quickstart linked
below).

## 7. Run the demo agent

```bash
export REGISTRY_URL=http://localhost:4000
npm run agent
```

You'll see it autonomously: query the registry, pick the top-ranked
provider, pay via x402, get the data back, and report the outcome --
repeating every 15 seconds. This loop, run unattended on Base mainnet for
24-48h, is your real transaction history for the grant application.

## Reference docs used to build this

- How x402 works: https://docs.cdp.coinbase.com/x402/how-it-works
- Seller quickstart (what resource-server/server.js is based on):
  https://docs.cdp.coinbase.com/x402/seller/quickstart
- Buyer quickstart (what router-sdk/router.js is based on):
  https://docs.cdp.coinbase.com/x402/buyer/quickstart
