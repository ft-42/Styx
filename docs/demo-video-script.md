# Demo video script (2-3 min)

Goal: prove the full loop is real -- a provider registers, an agent
discovers it with zero human involvement, pays it via x402 on Base
mainnet, gets data back, and reputation updates live. Base grant
reviewers respond to real usage evidence far more than a pitch deck, so
every shot should show something actually happening on screen, not a
slide describing it.

Record screen + voiceover using **Loom** -- the Base Builder Grant form
specifically asks for a Loom link, so record with it directly rather
than a generic screen recorder and re-uploading elsewhere.

---

## 0:00-0:15 -- Cold open: the problem

**Show:** black slide or your face on camera, no code yet.

**Say:**
> "AI agents can now pay for things autonomously, thanks to Coinbase's
> x402 protocol. But x402 only answers 'how do I pay this one endpoint.'
> It doesn't answer 'which of the 3 competing providers should I pay,'
> or 'what happens when the one I picked is down.' That's what we built."

---

## 0:15-0:40 -- The registry: providers competing

**Show:** terminal running `curl http://localhost:4000/providers | jq`
(or the dashboard table) -- 3 "Price Feed" providers, different prices,
different wallets.

**Say:**
> "Here are three independent data providers, all registered with our
> registry, all selling the same kind of data at different prices.
> In a real deployment these would be three different companies who've
> never talked to each other."

**On-screen text overlay:** "3 independent providers · self-registered"

---

## 0:40-1:05 -- The router SDK: discovery + ranking + payment

**Show:** `router-sdk/router.js` -- specifically the `request()` function
signature and the ranking/fallback loop (lines ~70-112). Then switch to
a terminal running:

```js
const result = await request({ category: "price-feed", maxPrice: 0.02 });
```

**Say:**
> "An agent doesn't pick a provider itself. It asks the router for a
> *category* of data. The router queries the registry, ranks every
> candidate by live reputation, pays the best one via x402, and falls
> back automatically if that one fails. Zero payment code in the
> agent itself."

---

## 1:05-1:45 -- The real payment, live, on Base mainnet

**Show:** the demo agent's terminal log, live, showing a tick paying a
provider -- e.g.:
```
[agent] tick=N ... -> paid Price Feed C ($0.012) in Xms :: {...}
```
Then cut to [BaseScan](https://basescan.org) with that transaction's
hash pasted in, showing the real on-chain USDC transfer.

**Say:**
> "This isn't a simulation. That's a real USDC payment, settled on Base
> mainnet, right now. [Point at BaseScan] Here's the transaction --
> anyone can verify it independently."

**Note:** grab a fresh transaction hash from your terminal logs right
before recording this segment so the BaseScan lookup is current.

---

## 1:45-2:25 -- The dashboard: reputation updating live

**Show:** `http://localhost:3000` -- let it sit on screen through at
least one 5-second auto-refresh so the "just now" timestamp and numbers
visibly tick over.

**Say:**
> "Every payment reports its outcome back automatically -- success,
> latency -- and reputation scores update in real time. The router
> already used this once today to route around a slower provider
> without anyone touching it."

**On-screen text overlay:** "[N] real payments · $[X] routed · 0
manual interventions"

*(Fill in [N] and [X] with your actual dashboard numbers at recording
time -- see the Known numbers section below for what to check.)*

---

## 2:25-2:50 -- Why this matters / differentiation

**Show:** back to face-on-camera or a simple slide.

**Say:**
> "x402 solves payment. We solve the layer above it: discovery and
> trust. Any agent developer can plug into one SDK call and get
> automatic routing across every provider in a category, with
> reputation doing the picking -- instead of hardcoding one endpoint
> and hoping it stays up."

---

## 2:50-3:00 -- Close

**Show:** GitHub repo URL, live dashboard URL (if hosted), contact info.

**Say:**
> "Everything you just saw is open source and running right now. Links
> below."

---

## Before recording: numbers to grab fresh

Pull these right before you record so the video matches reality:

```bash
curl -s http://localhost:4000/dashboard/summary
```

Use `total_calls`, `total_successful_calls`, and `total_revenue_usdc`
for the on-screen overlay text. Also grab one real transaction hash
from the demo agent's terminal output (or from your wallet's
transaction history on [BaseScan](https://basescan.org/address/0x020315eD81dc61212d830392059763bB96F753E2))
for the 1:05-1:45 segment.
