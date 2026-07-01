<div align="center">

# Numetal

**Capital with a will of its own.**

An agent studio under [Atelier Gökhan](https://gokhan.vc) — building and backing autonomous agents that earn across onchain, compute, culture, and frontier-lab toolkits. Chain-agnostic by design, home on Base.

[![Website](https://img.shields.io/website?url=https%3A%2F%2Fnumetal.xyz&label=numetal.xyz&style=flat-square)](https://numetal.xyz)
[![Last commit](https://img.shields.io/github/last-commit/gokhan-vc/numetal?style=flat-square)](https://github.com/gokhan-vc/numetal/commits)
[![Stars](https://img.shields.io/github/stars/gokhan-vc/numetal?style=social)](https://github.com/gokhan-vc/numetal/stargazers)

[![Cloudflare Pages](https://img.shields.io/badge/Cloudflare-Pages-F38020?style=flat-square&logo=cloudflare&logoColor=white)](https://pages.cloudflare.com)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-F38020?style=flat-square&logo=cloudflareworkers&logoColor=white)](https://workers.cloudflare.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![pnpm](https://img.shields.io/badge/pnpm-workspace-F69220?style=flat-square&logo=pnpm&logoColor=white)](https://pnpm.io)
[![Turborepo](https://img.shields.io/badge/Turborepo-EF4444?style=flat-square&logo=turborepo&logoColor=white)](https://turbo.build/repo)
[![Base](https://img.shields.io/badge/Base-0052FF?style=flat-square&logo=coinbase&logoColor=white)](https://base.org)

[**Website**](https://numetal.xyz) · [**Fee engine**](https://numetal.xyz/fees) · [**GitHub**](https://github.com/gokhan-vc)

</div>

---

## What this is

**Numetal** is an agent accelerator studio: it builds and backs autonomous agents that do real work and settle their earnings onchain. The thesis is simple — *machines that ship themselves*. Numetal is chain-agnostic (home on Base, reaching into Ethereum, Solana, Hyperliquid, and the XRP Ledger) and works across four markets:

- **Onchain** — agents that live in the onchain economy: intelligence, trading, and x402-metered services.
- **Compute** — agents that buy and sell compute and inference, settled machine-to-machine.
- **Artistic & cultural** — generative and speculative agents in art, culture, and hyperstition.
- **Frontier-lab toolkits** — runtimes, skills, and harnesses that turn raw models into operators that earn.

This repository is the **product monorepo** — the public marketing site, docs, and the live fee-engine surface. Smart contracts live in a **separate `numetal-contracts` repo** to keep a clean audit boundary. `$NUMETAL` is a utility token on Base — a coordination and fee-distribution mechanism, not an investment.

## Highlights

- **Live fee engine** at [`numetal.xyz/fees`](https://numetal.xyz/fees) — a Cloudflare Worker that reads the `$NUMETAL` contract straight from Base (raw `eth_call` over public RPCs), streams buyback-and-burn events, and renders live burn / treasury / team balances and price. A neutral on-chain read, not a statement about price.
- **Zero-dependency runtime** — the site ships as static HTML plus a single hand-written Worker; no framework bundle, no client JS beyond a small fetch/render loop.
- **Resilient data path** — multi-RPC failover on Base, GeckoTerminal primary with a DexScreener fallback, and edge-cached last-good snapshots so the page degrades gracefully.
- **Shared brand system** — a single source of truth for color tokens and typography in `packages/ui`, mono-forward and austere by design.
- **Turborepo pipeline** — one `pnpm` command builds every workspace; CI deploys `apps/web` to Cloudflare Pages on push to `main`.

## Live & links

| | |
|---|---|
| Website | <https://numetal.xyz> |
| Fee engine (live burns & buybacks) | <https://numetal.xyz/fees> |
| Studio | <https://gokhan.vc> |
| Org | <https://github.com/gokhan-vc> |

## Repository layout

```
apps/
  web/                 marketing site + docs + the /fees Worker
    public/            static assets served by Cloudflare Pages
    public/_worker.js  edge fee engine (/fees, /fees/data, /fees/events)
packages/
  ui/                  brand tokens (colors, fonts) — single source of truth
  config/              shared TypeScript base config
docs/
  BIBLE.md             project overview
```

> `apps/dapp` (wagmi / viem / Privy UI) and `packages/sdk` (ABIs + addresses + viem clients, generated from `numetal-contracts`) are planned and not yet in this repo.

## Stack

| Concern | Choice |
|---|---|
| Monorepo | [pnpm workspaces](https://pnpm.io) + [Turborepo](https://turbo.build/repo) |
| Language | [TypeScript](https://www.typescriptlang.org) |
| Hosting | [Cloudflare Pages](https://pages.cloudflare.com) |
| Edge runtime | [Cloudflare Workers](https://workers.cloudflare.com) (the `/fees` engine) |
| Deploy tooling | [Wrangler](https://developers.cloudflare.com/workers/wrangler/) via [`wrangler-action`](https://github.com/cloudflare/wrangler-action) |
| Chain | [Base](https://base.org) (`$NUMETAL`), public RPCs |
| Market data | [GeckoTerminal](https://www.geckoterminal.com) (primary), [DexScreener](https://dexscreener.com) (fallback) |

## Develop

Requires Node 20+ and [pnpm](https://pnpm.io) 9.

```bash
pnpm install
pnpm dev      # turbo dev across the workspace
pnpm build    # turbo build
pnpm lint     # turbo lint
```

Build just the site:

```bash
pnpm --filter web build   # emits apps/web/dist
```

## Deploy

`apps/web` deploys to **Cloudflare Pages** (`numetal-web`) automatically on push to `main`, via [`.github/workflows/deploy-web.yml`](.github/workflows/deploy-web.yml) using Wrangler and a Cloudflare API token stored as a repository secret. The `_worker.js` fee engine requires a `BASE_RPC_URL` environment variable at the edge for its event stream.

## Security

No `SECURITY.md` is published yet. To report a vulnerability, open a private advisory on this repository or contact the studio via <https://gokhan.vc>. Secrets and wallet keys are never committed — deploy credentials live only as CI/edge secrets.

## Credits & third-party

Built on open-source and public infrastructure:

- **[Turborepo](https://turbo.build/repo)** — monorepo task runner (MIT)
- **[pnpm](https://pnpm.io)** — package manager (MIT)
- **[TypeScript](https://www.typescriptlang.org)** — language (Apache-2.0)
- **[Wrangler](https://github.com/cloudflare/workers-sdk)** & **[wrangler-action](https://github.com/cloudflare/wrangler-action)** — Cloudflare tooling (MIT / Apache-2.0)
- **[Cloudflare Pages & Workers](https://developers.cloudflare.com)** — hosting and edge runtime
- **[Base](https://base.org)** public RPC endpoints — onchain reads
- **[GeckoTerminal](https://www.geckoterminal.com)** and **[DexScreener](https://dexscreener.com)** public APIs — market data

The visual language draws on the mono-forward, austere aesthetic associated with [U.S. Graphics Company](https://usgraphics.com)-style engineering documents.

## License

**TBD** — no license file is present in this repository yet. All rights reserved by the repository owner until a license is added. Please contact the studio before reuse.

---

<div align="center">
<sub>An Atelier Gökhan studio · <a href="https://numetal.xyz">numetal.xyz</a></sub>
</div>
