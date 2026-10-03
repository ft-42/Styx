# Base Builder Grant Program -- application draft

Mapped exactly to the real form fields (fetched from the application
link you shared). `[BRACKETS]` = needs your input; everything else is
drafted from the actual build. Two fields (marked **BLOCKER**) can't be
honestly answered yet -- see the notes under each.

Form: https://docs.google.com/forms/d/e/1FAIpQLSeEFi9BLm5XCm7KrFzRZC-rxcAqCNZPzWZ9He4aZkxsKuRXjw/viewform

---

**Full name*** -- [YOUR NAME]

**Email*** -- [YOUR EMAIL]

**X (Twitter) handle*** -- [YOUR HANDLE]

**Telegram username*** -- [YOUR USERNAME]

**Project name + one-line description of what it does*** --
> x402 Agent Commerce Router -- a discovery, routing, and reputation
> layer for x402 payments on Base, so autonomous agents can find and
> pay the best available provider for a category of paid API instead
> of hardcoding one endpoint.

**Tell us about the founding team*** (prior companies/exits, funding
raised, relevant domain expertise) --
[YOUR BACKGROUND. Be specific and honest -- this field exists because
reviewers weight team credibility heavily, and a vague answer reads
worse than a short, concrete one.]

**Link to your live product*** --
> https://dashboard-production-ddba.up.railway.app
>
> Landing page explaining the product, with a live-activity link to
> https://dashboard-production-ddba.up.railway.app/dashboard (real-time
> provider stats). Hosted on Railway. Registry:
> https://registry-production-d35b.up.railway.app · Providers:
> [A](https://provider-a-production.up.railway.app/health) ·
> [B](https://provider-b-production.up.railway.app/health) ·
> [C](https://provider-c-production.up.railway.app/health) -- all
> independently live, self-registered (off-chain and on-chain), and
> currently being paid by an autonomous demo agent running on the same
> infrastructure, unattended.

**Link to a Product Demo (Loom)*** --
[LOOM RECORDING LINK. Use `docs/demo-video-script.md` as the shot
list -- the form specifically wants Loom, so record with that rather
than a generic screen recorder if you want the link format they expect.]

**Contract address on Base*** --
> `0x4dfb3aca5bd61f9be7cb51a97a17376d9ec7466e`
>
> [ProviderRegistry](https://basescan.org/address/0x4dfb3aca5bd61f9be7cb51a97a17376d9ec7466e)
> -- a minimal on-chain provider registry (source:
> `packages/contracts/contracts/ProviderRegistry.sol`). Providers
> self-register on-chain at startup as a public, verifiable trust
> anchor; live routing/reputation stays off-chain for speed (no gas
> cost per routed call). All 3 demo providers are registered on it as
> of [DATE] -- `providerCount()` returns 3.
>
> (Source verification on BaseScan is still pending -- optional, the
> contract is fully functional either way. See
> `docs/provider-integration.md` if you want to verify it later.)

**Which track best fits what you're building?*** --
Agents / Agentic Commerce
*(direct match -- no ambiguity here)*

**Share your key usage numbers*** (all-time users onboarded, current
DAU/WAU, all-time volume processed, last-30-day volume) --
> Honest framing: this is agent-to-agent infrastructure, not a
> consumer app, so "users onboarded" and DAU/WAU don't map cleanly yet
> -- there are 0 external third-party users onboarded so far. What we
> do have: **399 real, successful x402 payments** settled on Base
> mainnet by our own autonomous demo agent as of 2026-09-05, **$3.988
> in real USDC** routed end-to-end (registry lookup -> reputation
> ranking -> payment -> data returned -> reputation reported), 100%
> success rate while the paying wallet held funds, across 3
> independently-registered competing providers. All transactions
> verifiable on
> [BaseScan](https://basescan.org/address/0x020315eD81dc61212d830392059763bB96F753E2).

*(These are the historical totals as of the date above -- recorded
here as fixed numbers because the registry's own live counters were
reset since. The on-chain transactions themselves are permanent and
independently verifiable regardless. If the live run resumes and
accumulates further, prefer fresh numbers from
`https://registry-production-d35b.up.railway.app/dashboard/summary`
over this snapshot.)*

**How does your product make money today?*** --
[HONEST ANSWER NEEDED. As built, the router/registry don't currently
take a fee -- the `price_usdc` a provider charges goes entirely to that
provider. If you intend to monetize via a take rate on routed payments,
a provider listing fee, or something else, say so here as a stated
intent rather than an implemented mechanism, since it isn't built yet.
Don't let me draft a monetization claim you haven't actually decided on.]

**What's your GTM plan for the next 3 months?*** --
> Onboard real third-party providers using our existing integration
> guide (`docs/provider-integration.md`) -- targeting agent-consumed
> categories beyond price feeds (e.g. web search, LLM completions) to
> prove the routing layer generalizes beyond our own demo. In parallel,
> harden the registry for public registration (currently open/no-auth,
> appropriate for a demo, not production) and integrate a real data
> source in place of the current simulated price feed.

**What's your Base Builder Code?*** -- [YOUR CODE]

**What is the primary challenge or bottleneck you are currently facing
as you grow your project?*** --
[PICK ONE -- "Go-to-market strategy" or "User acquisition" both fit
honestly, since the core product works and the actual gap is getting
real third-party providers and agent developers to integrate. Your
call on which framing fits better.]

**Which credits would be most useful for you as you build?*** --
[e.g. cloud hosting credits (AWS/GCP/a VPS provider) directly address
the live-hosting blocker above; also worth considering if you want
Privy or another wallet-auth credit, though CDP already covers wallet
provisioning for this build.]

---

## Before you submit

1. Resolve the two **BLOCKER** fields above (hosting + contract
   address decision).
2. Record the Loom demo using `docs/demo-video-script.md`.
3. Pull fresh numbers with `curl http://localhost:4000/dashboard/summary`.
4. Fill every remaining `[BRACKET]` -- these are all things only you
   can answer honestly (identity, team background, funding history,
   Builder Code, monetization intent).
