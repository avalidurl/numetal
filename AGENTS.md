# AGENTS.md — Numetal

Product monorepo for **Numetal**, the onchain protocol for verification of autonomous agent work on Base. Successor to Agent Bounty.

## Read first

- `docs/BIBLE.md` — product brief in this repository
- `AGENTS.md` — this file

## What this repo is

pnpm + Turborepo:

- `apps/web` — marketing site and docs. Deploys to Cloudflare Pages project `numetal-web`.
- `apps/dapp` — coming: the bounty lifecycle UI.
- `packages/sdk` — coming: ABIs and clients generated from the contracts repo.
- `packages/ui` — brand tokens. `packages/config` — shared tsconfig.

Smart contracts live in the separate `numetal-contracts` repository so the audit boundary stays apart from this product repo.

## Deploy

`apps/web` deploys via `.github/workflows/deploy-web.yml` on push to `main` when web or package files change. The public site is [numetal.xyz](https://numetal.xyz).

## Hard rules

- Do not commit API keys, tokens, account ids, or wallet keys. Deploy credentials stay in CI and edge secrets.
- Do not execute trades, transfers, swaps, burns, claims, or wallet submissions.
- Confirm before a public or legal-sensitive deploy.
- Do not change access controls or sharing.
- Paid tools only when the operator asks.

## Brand

IKB `#002FA7`, cream `#FAFAF8`, orange `#FF5A1F`, cyan `#06B6D4`. Mono-forward. DexScreener header 1500×500.
