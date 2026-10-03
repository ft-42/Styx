# x402 Agent Commerce Middleware

A discovery + routing + reputation layer on top of Coinbase's x402 payment
protocol on Base. This is the working skeleton from the build plan --
Days 1-2 (paid endpoint + environment) plus early scaffolding for the
registry, router SDK, and demo agent (Days 3-11).

## What's in here

```
packages/
  resource-server/   One x402-paid endpoint. Run it 2-3x with different
                      env vars to simulate 2-3 competing providers.
  registry/           Providers register here. Router SDK queries it.
                      JSON-file backed for now (swap for Postgres later).
  router-sdk/         THE PRODUCT. Discovers providers, ranks by live
                      reputation, pays via x402, falls back on failure.
  demo-agent/          Autonomous script that proves the whole loop works
                      unattended. This is what you run for 24-48h before
                      applying for the grant.
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

## Where you are in the 14-day plan

- [x] Days 1-2: environment set up, working paid endpoint pattern
- [x] Days 3-5: registry + provider self-registration (tested end-to-end)
- [x] Days 6-8: router SDK with ranking + fallback + reputation reporting
- [x] Days 9-11: demo agent scaffold
- [x] Days 9-11 (remaining): build the dashboard (Next.js) -- `packages/dashboard`
- [x] Days 12-13 (partial): mainnet integration verified, real payments confirmed
- [x] Days 12-13: hosted on Railway -- registry, all 3 providers, dashboard,
  and demo agent all run persistently, independent of any local machine.
  Landing page: https://dashboard-production-ddba.up.railway.app · Live
  stats: https://dashboard-production-ddba.up.railway.app/dashboard
- [x] Public-facing landing page (`pages/index.js`) -- explains the
  product for the two audiences (providers, agent developers), pulls
  live stats from the registry as proof, links to the stats dashboard
  (moved to `pages/dashboard.js`).
- [x] Self-serve provider registration -- `/register` (public form) and
  `/admin` (review queue) in `packages/dashboard`, backed by the
  registry's new pending-review/approve/reject flow. Real third-party
  signups no longer need a hand-run `curl` command.
- [ ] Days 12-13 (remaining): let the unattended run accumulate ~30 days
  of real transaction history before submitting
- [x] Days 12-13: integration docs for third-party providers -- see
  [`docs/provider-integration.md`](docs/provider-integration.md)
- [x] Days 12-13: on-chain ProviderRegistry contract -- deployed to both
  Base Sepolia and Base mainnet at
  `0x4dfb3aca5bd61f9be7cb51a97a17376d9ec7466e`, all 3 demo providers
  registered on-chain. See `packages/contracts/` and
  [`docs/provider-integration.md`](docs/provider-integration.md#step-5-optional-register-on-chain-too).
  Purely additive -- routing still uses the off-chain registry.
- [x] Day 14 (draft): demo video script and grant application draft --
  see [`docs/demo-video-script.md`](docs/demo-video-script.md) and
  [`docs/grant-application-draft.md`](docs/grant-application-draft.md)
- [ ] Day 14 (remaining): record the actual video, fill in placeholders
  (team, funding ask, links) and submit

## Hosting (Railway)

The whole stack runs persistently on Railway -- 6 services in one project
(`registry`, `provider-a/b/c`, `demo-agent`, `dashboard`), deployed via the
`railway` CLI. A couple of gotchas worth knowing if you redeploy or debug:

- **Registry, providers, and dashboard** deploy standalone via
  `railway up packages/<name> --path-as-root --service <name>` -- each has
  no local workspace dependencies, so Railway's auto-detection (Railpack)
  picks up that package's own `package.json` scripts directly. No custom
  build/start commands needed.
- **`demo-agent` is the exception** -- it depends on the local `router-sdk`
  workspace package (`"router-sdk": "*"`). Deploying it with
  `--path-as-root` breaks: npm resolves that dependency against the
  *public* npm registry instead of the local workspace (there's an
  unrelated package also named `router-sdk`), and it silently installs
  the wrong thing. `demo-agent` deploys from the **repo root** instead
  (`railway up --service demo-agent`, no `--path-as-root`), using the
  root `package.json`'s `start` script (`npm run start
  --workspace=packages/demo-agent`) so npm workspaces resolve
  `router-sdk` correctly.
- **CDP credentials never touch a committed file.** Set per-service via
  `railway variable set KEY --service <name> --stdin < file` (reads the
  value from a local file/stdin rather than a shell argument, so secrets
  never appear in command-line text or shell history).
- **`resource-server` reports its own public URL** via
  `RAILWAY_PUBLIC_DOMAIN` (auto-injected once a domain is generated) --
  see `PUBLIC_BASE_URL` in `resource-server/server.js`. Generate each
  provider's domain (`railway domain --service provider-a`) *before* its
  first deploy so the very first self-registration already reports the
  right URL, instead of `localhost`.
- The `.railway/railway.ts` "config as code" path (`railway config
  plan`/`apply`) has a bug on Windows in the CLI version used here (5.45.7)
  -- its own version-check spawns a subprocess incorrectly and always
  fails with a misleading "requires CLI 5.42.1+" error. Plain `railway up`
  / `railway variable set` / `railway domain` calls (used throughout this
  setup) don't hit this bug.
- **The registry needs a persistent Volume, or every redeploy silently
  wipes it.** Railway rebuilds the container filesystem from scratch on
  every deploy -- without a real Volume, `db.json` resets to whatever's
  in the source tree at build time, taking every registered provider
  (and, worse, every real third-party self-serve registration) with it.
  Fixed by attaching a Volume to the `registry` service at mount path
  `/data` (Railway's `volume add` CLI command panics reliably on
  Windows in this CLI version -- do it from the project's web canvas
  instead: right-click the service -> Attach Volume) and pointing
  `DB_PATH=/data/db.json` at it (`packages/registry/store.js` reads
  this env var, falling back to a local file for local dev where no
  volume exists). **Watch for MSYS/Git-Bash path mangling** when setting
  that variable from Git Bash on Windows -- `/data/db.json` silently
  becomes `C:/Program Files/Git/data/db.json` unless the command is
  prefixed with `MSYS_NO_PATHCONV=1`.
- A stray root-level `.gitignore` entry (`packages/*/db.json`) does
  **not** protect a `--path-as-root packages/registry` deploy -- gitignore
  exclusion isn't the relevant mechanism here at all (see the Volume
  point above for why); don't rely on it.

## Known gaps to close before going live

- Swap the simulated price in `resource-server/server.js` for a real data
  source (currently returns a jittered mock price so the demo works with
  zero external dependencies).
- ~~Registry has no auth~~ -- closed: new self-serve registrations
  (via `/register` or the API directly) land as `pending_review` and
  need admin approval (`/admin`) before they're routable; updates to an
  existing listing require the `management_token` issued at creation.
  Our own resource-server instances authenticate as trusted via
  `REGISTRY_ADMIN_TOKEN` and go active immediately, unchanged from
  before. See `docs/provider-integration.md`.
- Registry has no concept of network/environment -- providers and routers
  against the same registry must agree out-of-band on testnet vs mainnet
  (see `docs/provider-integration.md`).
- Demo agent has exponential backoff on repeated failures (see
  `demo-agent/agent.js`), but the whole stack (registry, providers, agent,
  dashboard) still needs to run on persistent hosting, not a dev machine
  that stops between sessions, for the real 24-48h unattended run.
