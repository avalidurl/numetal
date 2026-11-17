---
title: Numetal — Project Bible
status: active
supersedes: Agent Bounty
network: Base
token: $NUMETAL
maintainer: Gökhan Turhan (Atelier Gökhan)
created: 2026-06-07
tags: [numetal, project, bible, roadmap, strategy, agentbounty-successor]
---

# Numetal — Project Bible

> **What this is.** The single source of truth for Numetal: what it is, where it stands, what was built this session, and what we are going to build next — including the forward strategy for Privy, cross-chain settlement, Chainlink, safety/guardrails, and the automated marketing engine. This **supersedes Agent Bounty**; the `agentbounty` / `agentbounty-beta` repos are being closed and their useful state migrates here.
>
> **How to use it.** This is the in-repo product brief. `AGENTS.md` routes here. When in doubt, this file wins. Keep it updated as decisions land.

---

## 0. TL;DR

Numetal is an **onchain protocol on Base for the verification of autonomous agent work**. A sponsor posts a bounty funded in **USDC** (held in escrow); an autonomous agent (or human) does the work and submits; a **bonded reviewer** adjudicates; the outcome **settles onchain**; disputes escalate to a **modular resolution** layer. The token is **$NUMETAL** (Base, Clanker V4 — `0x57EDb7FC54ADa9Ef4E113DC05A168449e63cFbA3`). It is the rebrand of "Agent Bounty," repositioned to ride the **x402 / Base agent-economy** narrative rather than the bruised "AI-agent-token" one.

The thesis in one line: **agentic trust, verified** — be the neutral verification & adjudication protocol for agent work (topple Kleros-style subjective courts; do *not* take on UMA head-on yet), with World ID as a later identity moat.

---

## 1. Where we are (current state, as of 2026-06-07)

### 1.1 Brand & positioning
- **Agent Bounty → Numetal (NUMETAL).** Founder's "opus magnum." Verification sandbox for humans + agents, with modular subjective/objective dispute resolution.
- **Visual identity:** riso / e-ink / Bauhaus matte "de-slop" — IKB `#002FA7` + cream/paper + orange `#FF5A1F` + cyan `#06B6D4`, mono-forward (US-Graphics austerity). DexScreener header exactly 1500×500. Owned by the `shokunin` agent + the unslop forge (PIL/numpy DSP + ImageMagick + FLUX.2).
- **Hero line (live):** "Agentic trust, verified." Eyebrow: "Verification for autonomous agent work."

### 1.2 Public site
- **numetal.xyz** is the public site: landing, fee distribution, terms, and privacy.
- **`apps/web`** in this repository deploys to Cloudflare Pages (`numetal-web`) from `main`.

### 1.3 Repos & architecture (HYBRID — decided)
- **This repository** (product monorepo) — pnpm + Turborepo. `apps/web` (marketing and docs), `apps/dapp` (**coming** — wagmi/viem/Privy), `packages/sdk` (**coming** — ABIs and viem clients), `packages/ui` (brand tokens), `packages/config`. CI: `.github/workflows/deploy-web.yml`.
- **`numetal-contracts`** (separate repo) — Foundry. The audit boundary stays apart from the product on purpose. Holds `BountyEscrow`, `VerdictModule`, and `SettlementModule`.
- **Why hybrid:** contracts get an immutable cadence + audit isolation; product gets atomic cross-package changes; `packages/sdk` is the clean seam between them.

## 2. The product, precisely

**Lifecycle:** `POST` (sponsor funds a bounty in USDC → escrow) → `WORK` (agent/human submits onchain) → `VERIFY` (bonded reviewer adjudicates vs the brief) → `SETTLE` (verdict pays out onchain; disputes escalate).

**Contracts (current seams):**
- `BountyEscrow` — funding, `baseBond` / `payoutMax` (raw token units today, **no USD denomination** — a fragility we fix with Chainlink feeds), `markVerdicted()`, refund-after windows.
- `VerdictModule` — `submitVerdict()` is **EIP-712 reviewer-signed**; `MIN_REVIEWER_BOND` hardcoded; this signature seam is exactly where a Chainlink-CRE machine reviewer plugs in.
- `SettlementModule` — `settle()` is permissionless-but-time-gated (an Automation target); the **fee engine** (buyback/burn split) lives in `_processPayout`.
- `resolveDispute()` — currently a single `DISPUTE_RESOLVER_ROLE` admin EOA (a centralization wart; the VRF/CRE target for the dispute layer).

**Fee distribution policy (live on the landing):** WETH side 80/10/10 (team/treasury/burn); $NUMETAL side 40/30/30 (team/treasury/burn). Every creator-fee claim splits onchain; visible on `/fees`.

---

## 3. The build-out (forward strategy)

*These five sections were each researched against current (2026) tooling. They are the substance of "what we're gonna do."*

### 3.1 Privy — auth and agent wallets

Privy is an `apps/dapp` concern only. `apps/web` stays static marketing with no wallet code. Server credentials stay on a server surface and out of this repository. The browser never receives them.

**Client wiring.** `@privy-io/react-auth`, `@privy-io/wagmi`, `wagmi`, `viem`, `@tanstack/react-query`. Embedded wallets register as connectors. Pin `chains: [base]`. The `packages/sdk` clients consume the wagmi connector. Contracts stay decoupled.

**Human auth (sponsor and reviewer).** Email, social, or an external wallet. Reviewers are bonded, so prefer an external wallet. On-chain authorization is enforced by the contracts via `msg.sender`.

**Agents.** Developer-owned agent wallets, one per agent, under a locked policy: spend caps, a contract allowlist, and calldata limits so an agent can submit work and cannot withdraw to an arbitrary address. Session keys stay deferred.

**MVP vs later.** *MVP:* human auth, an embedded fallback, and server-provisioned agent wallets under one locked policy, signing against `BountyEscrow`. *Later:* ERC-4337 smart wallets, user-delegated session signers, multi-sig quorums, and fiat on-ramp funding.

**Pointers:** public docs at `docs.privy.io`. Contracts remain the source of truth for authorization.

### 3.2 Cross-chain — letting Solana agents settle on Base

Numetal's contracts live only on Base; Solana sponsors/agents should never have to know that. Goal: a Solana participant signs **one** transaction in their own wallet and the protocol absorbs all bridging. **USDC is the entire value layer, so the right primitive is Circle CCTP v2 — native burn-and-mint, not a wrapped-asset bridge.** CCTP v2 went live on Solana in Oct 2025 (programs `TokenMessengerMinter` + `MessageTransmitter`) and is live on Base.

**MVP — CCTP v2 for value, Numetal contracts + indexer as the messaging layer.** Don't reach for CCIP or a general bridge on day one; our own Base contracts + indexer already own settlement state.

- **Deposit (Solana → Base escrow):** sponsor calls `depositForBurn` on Solana with `mintRecipient` = Base `BountyEscrow`, `destinationCaller` locked to our relayer; `minFinalityThreshold ≤ 500` (Fast Transfer ~8–20s), `maxFee` from Circle's `/v2/burn/USDC/fees`. USDC burns on Solana; Circle's **Iris** signs the attestation; a **CCTP v2 hook** makes the destination mint atomically call `BountyEscrow.fund(bountyId)` — value + intent bound in one tx. No attestation → no mint; escrow only sees fully-attested funds.
- **Payout (Base → Solana):** after a verdict finalizes, the payout module calls `depositForBurn` on Base, `mintRecipient` = winner's Solana USDC ATA (captured at submission). Automatic.
- **UX:** one-click behind **Privy** (EVM + Solana embedded + server wallets). A Numetal **server wallet** acts as `destinationCaller`/relayer. The user never bridges manually, never touches Base gas, never sees a wrapped token.

**Trade-offs.** CCTP Fast wins for MVP because "trust Circle" is a trust assumption we *already make by denominating in USDC* — a bridge only adds a *second* trust domain. **Intent bridges** (deBridge DLN ~1–4s, LI.FI, Across, Relay) are a worthwhile **fallback route** (the LI.FI SDK can itself select CCTP) for congestion or non-USDC assets, at the cost of solver counterparty risk + spread. **Wormhole** only if we ever leave USDC-only.

**Phase 2 — CCIP for cross-chain settlement *state*.** Only when settlement logic itself must live cross-chain (e.g. escrow/bonds deployed *on* Solana released by a Base verdict). CCIP's value is the decentralized message + Risk Management Network, not token transfer; pair `ccipSend` (verdict/bond-release) with CCTP for the USDC leg. Until then it's over-engineering.

**Stack:** Circle CCTP v2 (`depositForBurn`/`receiveMessage`, Iris, hooks); Privy (EVM+Solana); LI.FI SDK fallback; Chainlink CCIP reserved for Phase 2.

### 3.3 Chainlink — oracles, verification & automation

Chainlink maps unusually well because our hardest problem isn't custody (escrow is simple) but **trustworthy offchain truth**: did the work meet spec, and who decides. **Priority: (1) Data Feeds — MVP; (2) Automation — MVP/fast-follow; (3) Functions→CRE for verification — flagship, v0.2; (4) VRF for juror selection — v0.2 dispute layer; (5) CCIP — later, demand-gated.**

- **Data Feeds (MVP).** Today bonds/payouts are raw token units; a $NUMETAL price swing silently re-prices security. Wire ETH/USD (live on Base) and, once listed, $NUMETAL/USD-or-ETH via `AggregatorV3Interface.latestRoundData()` to: size bonds to a **USD floor**, denominate the fee split + buyback leg, power USD displays. Always check `updatedAt` staleness + bounds. *Brand-new token likely has no feed on Chainlink or Pyth initially — bootstrap from a DEX TWAP and migrate.* Pyth (pull-based, sub-second) only if we go HFT-style; Chainlink push feeds for slow-moving bond sizing.
- **Automation/Keepers (MVP/fast-follow).** The state machine is full of time gates (`settle()` after `challengeWindow`, `refund()` after `REFUND_AFTER`, pool-claim windows, `recordCycle`). Make `SettlementModule` Automation-compatible (`checkUpkeep`/`performUpkeep`); register a time-based upkeep for fee-claim/buyback cycles (note the Dec-2025 forwarder gating → add a forwarder check). *Gelato is the defensible cheaper swap; lean Chainlink for neutral-verification narrative consistency.*
- **Functions → CRE (flagship, v0.2).** **Chainlink Functions sunsets Sept 1, 2026 (testnet already retired Jun 2, 2026) — build on CRE, not Functions.** CRE runs offchain workflows across a DON with consensus on every step; Chainlink's own reference pattern calls an **LLM (e.g. Vertex AI) with grounded search and returns a structured verdict with confidence + citations** — exactly Numetal's adjudication. Use CRE as a **machine reviewer**: fetch the submission's evidence payload, run spec-conformance / API / LLM scoring offchain, return a verdict driving `markVerdicted()`. Cleanest seam: a `CRE_REVIEWER_ROLE` analogous to the EIP-712 `submitVerdict`. Reserve human bonded reviewers for subjective work + disputes; let CRE auto-clear objective bounties. Best architecture: **CRE first-pass + UMA-style optimistic challenge for escalation.** (vs UMA/Kleros: those are *human-incentive* layers, slow; CRE is compute-first + fast. Watch Confidential Compute for private-evidence bounties.)
- **VRF (v2.5, dispute layer, v0.2).** Replace the single-admin `resolveDispute()` with a randomly-drawn bonded-reviewer panel (`openDispute()` requests randomness; `fulfillRandomWords` assigns the panel) to kill juror-selection collusion. **Caveat: confirm VRF v2.5 Base-mainnet availability before committing** (confirmed on Arbitrum/Avax/BNB/Ethereum/Polygon; Base unconfirmed). Block-hash/commit-reveal is only a weak interim.
- **CCIP (later, demand-gated).** CCIP v1.6 made Solana the first non-EVM chain (May 2025); the Coinbase Base↔Solana bridge runs on it. Real, but not MVP — park behind explicit Solana traction.

**Net:** Data Feeds + Automation are cheap immediate hardening. **CRE-as-verifier is the bet that makes "agent-native adjudication" more than a slogan — prioritize a CRE spike now, precisely because Functions is dead by September.**

### 3.4 Safety & the Guardrail Agent

Numetal is permissionless — anyone/any agent can post a bounty or submission — which makes the operator an *electronic service provider* in the legal sense. The verification logic reasons about deliverable *quality*; it is **not** a safety layer, and an LLM judge reading untrusted content is itself jailbreakable. **Safety must be a separate, defense-in-depth pipeline that runs before and alongside verification, never folded into it.**

**Layered architecture (fail-closed):**
1. **Deterministic pre-filters** — perceptual-hash matching of every image/video against known-CSAM sets (PhotoDNA, Thorn Safer, Meta PDQ) + regex/secret scanners for doxxing PII + credentials. Hash hits → instant block + preserve + report (non-negotiable).
2. **Multimodal classifiers** — OpenAI `omni-moderation-latest` (free, text+image, covers sexual/minors, violence, self-harm, harassment, hate, illicit) as the cheap first pass; escalate ambiguous/high-stakes to **Azure AI Content Safety** (severity grades, Prompt Shields) and **Hive** (NSFW). Two providers in OR-mode for CSAM-adjacent + violence.
3. **Code-specific scanning** — deliverables are often code: static analysis for malware/exploit/callback/obfuscation signatures + an LLM **intent-classifier** on the bounty text ("build a credential stealer / ransomware / deanonymizer"). This is where most "build me a weapon" abuse hides.
4. **The Guardrail Agent + guardrail frameworks** — Llama Guard 4 / ShieldGemma as input/output rails wrapped by NeMo Guardrails (or LLM Guard) so the *verification droids' own* inputs/outputs are checked too.

**The Guardrail Agent persona.** A dedicated droid (`.factory/droids/guardrail.md`), peer to the verification droids but with **veto power**, run under the **quarantine pattern**: it reads untrusted content but holds **no settlement tools** — it emits only a structured verdict, so a successful injection can't move money.
- **Inputs:** bounty text + metadata at intake; full deliverable at submission; poster/hunter reputation + prior flags; the layer-1–3 scores.
- **Decision policy:** `risk_score (0–100)`, `category`, `confidence`. **0–30 allow; 30–60 flag** (proceed, log, watchlist); **60–85 quarantine** (freeze, block escrow, human review within SLA); **85–100 block + escalate**. Any CSAM/minors hit **bypasses scoring** → instant block + evidence preservation + NCMEC report.
- **Pipeline position — three gates:** (a) **pre-escrow** (illegal *requests* never get funded); (b) **pre-work** (hunters never receive an abusive brief); (c) **pre-settlement** (the deliverable is the highest-risk artifact — deepest scan before USDC releases).
- **Escalation:** quarantine/block → a trust-and-safety queue with access-controlled artifacts. CSAM never sits in a human queue — auto-report + purge to a sealed evidence store.

**Onchain vs offchain enforcement.** Moderation is offchain; enforcement is *anchored* onchain. Make a **screening attestation a precondition for escrow release**: the Guardrail Agent (a trusted signer / **EAS** schema) emits `{itemId, verdict:pass, policyVersion, timestamp}`; `SettlementModule.release()` requires a valid unexpired pass-attestation, else block + refund-to-sponsor. Store only **hashes** on-chain; raw content + scores stay in access-controlled offchain storage with retention expiry. A guardian/multisig keeps an emergency `freeze(itemId)`.

**Legal / compliance.** US providers **must** report apparent CSAM to **NCMEC CyberTipline** (18 U.S.C. §2258A; Thorn Safer Reporting API). Preserve evidence ≥90 days, don't re-distribute, restrict access. Keep immutable moderation logs (decision, policy version, reviewer) for subpoena response. Name a responsible reporting entity + counsel for the chosen jurisdiction — "it's decentralized" is not a defense when an operator funds inference + settlement.

**UX.** Screening runs **async, in parallel** with verification so latency hides behind work already happening; only quarantine/block interrupts. Favor **recall** on CSAM/minors (block aggressively), **precision** elsewhere (don't block legitimate security-research bounties — our whole value prop). Appeal path → the dispute flow.

**MVP vs later.** *MVP:* PhotoDNA/Safer hash-matching (mandatory), `omni-moderation` text+image at all three gates, NCMEC wired, the Guardrail Agent as a blocking droid emitting a pass/fail gate `SettlementModule` checks, regex PII/secret scan, manual T&S queue. *Later:* EAS on-chain attestation gating, second-vendor OR-mode, code/intent malware classifiers, Llama Guard/NeMo rails around verification droids, reputation-weighted scoring, automated appeals, red-team of the Guardrail Agent itself. *(This fills the content-safety gap in the existing threat model — add a TM-010 content-abuse row.)*

### 3.5 Automated marketing engine

**Design principle:** autonomy with guardrails, not full autonomy — agents own the labor (ideate, draft, schedule, measure); two gates stay human-adjacent: the **brand-reviewer compliance gate** (agentic) and a final **operator publish approval** (human, mandatory for unlaunched-token material per publication discipline). **Nothing auto-publishes.**

**The loop.** `growth-orchestrator` is the front door + router. Each cycle: pull a Grok x402 sentiment read (X+web, batched 2–4×/day, ~$0.40/pull, never per-tweet) → classify → dispatch. **Ideate** (`content-strategist` maps narratives/cashtags/KOLs to the four pillars, batch-drafts) → **enrich** (imagery forks to `shokunin`) → **GATE** (every asset, copy + image, passes `brand-reviewer` `/marketing:brand-review` → severity-tagged + pass/revise; High-severity = hard block) → **schedule** (a dated content-bank: pillar, format, asset, image, review-status, slot, posted, metrics) → **operator approval → post** → **measure** (`process-optimizer` scores vs pillar/format and writes learnings back).

**Cadence.** A cron agent (≈3×/day) refills the bank to a target depth (e.g. 30 ready+reviewed). **Ceiling: 3–5 posts/day, 2–3h apart, one thread/day** — >10/day reads as spam; "multi-post-per-hour" is correct only for *replies* + event-day bursts. **Two lanes:** (1) **Evergreen** — pre-reviewed bank drip on a fixed clock; (2) **Trend-reactive** — same-hour reactions to live narratives, *still* through the gate. **Replies stay human/human-approved** (X bans keyword-auto-replies; crypto punishes broadcast bots).

**Channels.** X primary (threads, single posts, human-led replies, shokunin memes/charts); Discord (milestone/build-log digests, changelog echoes — convo stays human); blog/docs (repurpose best threads for SEO/AEO); email/changelog **later**.

**Pillars:** (1) build-in-public proof (real txns/demos), (2) x402/Base agent-economy education, (3) the mechanic explained (USDC escrow + bond + verdict + settlement), (4) closed-beta access scarcity. Ride agentic-payments/x402; avoid the AI-agent-token narrative.

**Compliance gate (2026-hardened).** No price/return/listing/"buy"/airdrop-value language; testnet truth; namesake disambiguation. **New flags:** the SEC stance that *marketing itself can convert a token into a security* (any return/appreciation implication = High-severity → operator) and X's **"Paid Partnership"** labeling rule (live Feb 2026 — sponsored/KOL posts must carry it). Disclaimers don't cure a message implying financial expectation.

**Visual pipeline.** Image requests fork at draft: FLUX.2 base (paid → operator-OK) → `unslop.py` de-slop (limited IKB/cream/matte ink, halftone, misregistration, Futura knockout) → shokunin review → bank at exact spec (X 1600×900 or 1:1; header 1500×500) → brand-reviewer gate.

**Metrics:** per-post engagement, thread completion, reply quality, profile clicks, and the honest pre-launch KPI — **access requests + qualified beta signups + builder reach** (never token price). Weekly tuning note biases the next batch.

**MVP vs later.** *MVP:* evergreen lane — cron bank-refill → brand-reviewer gate → operator-approved scheduled X posts + manual replies; sentiment 2×/day; manual weekly tuning. *Later:* trend-reactive auto-drafts, Discord digest agent, thread→blog repurposing, email/changelog, closed analytics→content feedback loop. *(Maps 1:1 onto the seven agents already in `.claude/agents/` — no new agents required.)*

---

## 4. Agents & automation ("Factory droids")

Numetal runs on three agent layers:

1. **Marketing fleet** (`.claude/agents/`): `growth-orchestrator` (router), `campaign-planner`, `content-strategist`, `brand-guardian` (voice SoT), `brand-reviewer` (compliance gate), `process-optimizer` (ops/measure), `shokunin` (visual de-slop). Wraps the `/workflows`, `/campaign-plan`, `/content-strategy`, `/brand-guidelines`, `/marketing:brand-review`, `/process-optimization` skills. → **drives §3.5.**
2. **Factory mission droids** (`.factory/droids/`, `.factory/missions/`, `.factory/workflows/`, `.factory/memories.md`): the verification/ops droids carried over from the beta. **New: `guardrail.md`** (§3.4) — a quarantined safety droid with settlement veto. **New: a CRE-reviewer droid** wrapper (§3.3) for automated adjudication.
3. **Infra workers:** the fee-engine reader and the marketing scheduler. A CCTP relayer is planned.

**Routing principle:** `AGENTS.md` points at this bible. Mission briefs live under `.factory/` when those files exist. Marketing briefs live under `.claude/agents/` when those files exist.

---

## 5. Roadmap

### Phase 0 — Migration & hygiene (now)
- [ ] Keep `numetal-contracts` as a separate Foundry repository. **Decision:** keep "bounty" as the domain term, or strip it for the full rebrand.
- [ ] Contracts **v0.2 fixes**: Test NUMETAL / Test USD + deferred audit items (#2–#6, #8); USD-denominate bonds (ties to §3.3 feeds).
- [ ] Stand up **Vocs docs** (`apps/docs`, or fix the waku peer-dep in `apps/web`).
- [ ] **`packages/sdk`** — export ABIs + addresses + viem clients from contracts (the product↔contracts seam).
- [ ] **Bump GH Actions** (Node 20 EOL Jun 16 2026).
- [ ] **Close / archive Agent Bounty repos**; final asset + memory handoff into this bible.

### Phase 1 — Product foundation
- [ ] Scaffold **`apps/dapp`** (wagmi/viem + the bounty lifecycle UI).
- [ ] **Privy** (§3.1): human auth + embedded fallback; server-provisioned developer-owned **agent wallets** + one locked-down policy; sign against `BountyEscrow`.
- [ ] **Chainlink Data Feeds** (§3.3): ETH/USD now + $NUMETAL via DEX TWAP bootstrap → USD bond sizing + fee-engine pricing.
- [ ] **Chainlink Automation** (§3.3): auto-settle on window expiry + fee-claim/buyback cycles.

### Phase 2 — Differentiators
- [ ] **Chainlink CRE spike** (§3.3): LLM-verdict automated verification → `CRE_REVIEWER_ROLE`; CRE first-pass + optimistic challenge.
- [ ] **CCTP v2 cross-chain** (§3.2): Solana→Base deposit (hook → `BountyEscrow.fund`) + Base→Solana payout; Privy relayer/`destinationCaller`.
- [ ] **Guardrail Agent + moderation stack** (§3.4): hash-matching + `omni-moderation` at 3 gates + NCMEC wiring + the blocking droid + EAS attestation gate on `release()`.
- [ ] **VRF juror selection** (§3.3): verify Base availability → randomized bonded-reviewer panel for `resolveDispute()`.

### Phase 3 — Growth & scale
- [ ] **Automated marketing engine** (§3.5): evergreen lane → brand-review gate → scheduled X; then trend-reactive lane + Discord digest + thread→blog.
- [ ] **CCIP** (§3.2/§3.3): cross-chain settlement state — demand-gated on Solana traction.
- [ ] **World ID** identity moat (post-traction).
- [ ] **agentbounty.dev transition banner** (legal-material; needs explicit go + redirect-timing decision).

### Open decisions
1. **"Bounty" naming** in the contracts/SDK — keep as domain term, or full rebrand to Numetal vocabulary?
2. **agentbounty.dev** — banner wording + redirect now vs banner-only.
3. **Adjudication center of gravity** — how aggressively to lean CRE automation vs bonded human reviewers at launch.

---

## 6. Where this brief lives

This file is the product brief for the repository.

| Surface | Location | Role |
|---|---|---|
| **Repo docs** | `docs/BIBLE.md` | Product brief beside the code |
| **AGENTS.md** | `AGENTS.md` | Routes work to this brief |

**Routing rule:** `AGENTS.md` → this bible. Keep the bible current.

---

## 7. Hard constraints (carry into every session)

- **Secrets hygiene:** do not commit API keys, tokens, account ids, or wallet keys. Deploy credentials stay in CI and edge secrets. The public token contract may be named.
- **No financial actions by the agent:** trades, transfers, swaps, burns, claims, and wallet submissions stay with the operator.
- **Publication discipline:** confirm before a public or legal-sensitive deploy. Deploy only on an explicit command.
- **No self-modification of access controls/permissions:** guide the user; don't change sharing/roles directly.
- **Paid-tool discipline:** default to free WebSearch/WebFetch; paid Firecrawl/Browserbase/FLUX only on explicit OK.
- **Training-data provenance (non-negotiable):** any model Numetal trains or ships — above all the **bounty-review engine** — is built ONLY on legally-sourced, provenance-clean data (public bounty/audit-contest corpora, disclosed bug bounties, licensed/HF datasets, first-party data). **No pirated / "bootlegged" / unauthorized-access sources.** A verification protocol trained on stolen data is an existential trust + legal liability (copyright/CFAA/trade-secret/PII), not an edge — and one leak ends the brand. Legal sourcing is the moat *and* the only shippable path.
- **Mentorship mode:** real adversarial pushback, not sycophancy — name risk, sharpen the thesis, never flatter.

---

*End of bible. Update in place as decisions land.*
