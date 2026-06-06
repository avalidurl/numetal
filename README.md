# Numetal

Product monorepo — marketing site, docs, and the app. Smart contracts live separately in **numetal-contracts** (clean audit boundary, immutable cadence).

## Structure

- apps/web — marketing site + docs (Vocs)
- apps/dapp — the app (wagmi / viem / Privy) [coming]
- packages/ui — brand tokens + shared components
- packages/config — shared tsconfig / eslint
- packages/sdk — ABIs + addresses + viem clients, generated from numetal-contracts [coming]

## Develop

    pnpm install
    pnpm dev

## Deploy

apps/web deploys to Cloudflare Pages via .github/workflows/deploy-web.yml (Wrangler + Cloudflare API token).
