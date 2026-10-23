# USURP

> Built with Arc Studio — money-powered apps in minutes

A real-time crypto game on Arc Testnet. One crown. One holder. Pay to steal it. Earn a drip while you hold.

---

## What This App Does

USURP is a king-of-the-hill USDC game on Arc Testnet. Players pay USDC to steal the crown; the price escalates 20% each steal (capped at $5). The holder earns a slow drip from a shared pot for as long as they hold. When dethroned, the previous holder keeps whatever they earned. Phase 2 (not built yet) adds Usurp Arena — a 60-second AI-judged duel mode.

## Tech Stack

- Frontend: React 18, Vite, TypeScript, Tailwind CSS v3
- Web3: wagmi v2, viem v2, ConnectKit
- Contracts: Solidity 0.8.x + Foundry. Sources in `contracts/`, unit tests in `contracts/test/*.t.sol`. Build with `bun run contracts:build`, test with `bun run contracts:test`.
- Wallet: injected (MetaMask, etc.) via wagmi
- Chain: Arc Testnet (Chain ID: 5042002, imported from `viem/chains` as `arcTestnet`)
- Token: USDC ERC-20, 6 decimals, address `0x3600000000000000000000000000000000000000` on Arc Testnet
- Theme: dark/light via CSS custom properties + `data-theme` on `<html>`, no-flash inline script in `index.html`
- Fonts: Big Shoulders Display 800/900 (display), Plus Jakarta Sans 400/500/700/800 (body), JetBrains Mono 500/700 (mono)
- Routing: hash-based (no library dependency), pages in `src/pages/`
- State: TanStack Query (pre-installed)
- Toasts: Sonner
- Motion: framer-motion (pre-installed, used from Milestone 6)
- Mock mode: `VITE_MOCK_MODE=true` serves seeded fake game state (three scenarios: healthy / low / empty)

## Key Files

- `src/App.tsx` — App root, ThemeProvider + MockProvider, hash router
- `src/contexts/ThemeContext.tsx` — `useTheme()`, `ThemeProvider`
- `src/contexts/MockContext.tsx` — `useMock()`, `MockProvider`
- `src/lib/mock.ts` — `GameState` type, three seeded scenarios, `MOCK_MODE` flag
- `src/components/Logo.tsx` — `Logo`, `CrownMark`, `HeroCrown` (dark/light SVG variants)
- `src/components/icons.tsx` — `PotHealthChip`, `StreakSquares`, all Lucide icon re-exports
- `src/components/Header.tsx` — sticky header with network pill, nav, theme toggle, connect wallet
- `src/components/Footer.tsx` — footer nav
- `src/components/AgeGate.tsx` — age/disclaimer gate modal (focus-trapped)
- `src/components/ThroneScreen.tsx` — main game view (crown hero, pot health, stats, feed, Arena teaser)
- `src/pages/` — HowItWorksPage, FaqPage, DisclaimerPage, TermsPage, PrivacyPage, NotFoundPage
- `src/config.ts` — wagmi config (Arc Testnet + mainnet for ENS)
- `docs/DECISIONS.md` — architecture decisions and open questions
- `docs/DEPLOY.md` — deployment checklist (to be written in Milestone 8)

## Contract Deployments

### Arc Mainnet (chain 5042) — LIVE
- Address: `0xC47cc87cb5fe4EDAe581064045A79074264bC415`
- Owner: `0xE3fd801A2939c636f2EA5c281A726Ea131799F12`
- Fee address: `0xBd87d93B45c017EFC656a1F78BA190c49e5e8673`
- USDC: `0x3600000000000000000000000000000000000000`
- Explorer: https://explorer.arc.io/address/0xC47cc87cb5fe4EDAe581064045A79074264bC415
- Note: Source verification pending (explorer Cloudflare challenge at deploy time)

### Usurp.sol — Arc Testnet (owner-deployed, verified) ✅ CANONICAL
- **Address:** `0x5B16a6fd5a2f14D0c4D671bB5A14f9044fdE89e5`
- **Explorer:** https://explorer.testnet.arc.io/address/0x5b16a6fd5a2f14d0c4d671bb5a14f9044fde89e5
- **Deployed:** 2026-10-20
- **Owner:** `0xD0b8aEEdf195499773415323cae517e5b8369F94` (your deployer wallet)
- **Fee address:** `0x45c99e421d37eA58a4ba239fE91c69f515cbd27e` (your fee/revenue wallet)
- **USDC:** `0x3600000000000000000000000000000000000000`
- **Start price:** 130000 (0.13 USDC)
- **Verified:** Yes (Blockscout, Arc Testnet explorer)
- **Broadcast:** `broadcast/DeployUsurp.s.sol/5042002/run-latest.json`
- **Artifact:** `contracts/out/Usurp.sol/Usurp.json`

_(Previous deploys at 0x7eF500cAa... and 0x57334ec1... superseded.)_

## Milestone Status

| # | Milestone | Status |
|---|-----------|--------|
| 1 | Scaffold: tokens, theme, logo, header/footer, age gate, mock mode | **Done** |
| 2 | Static pages: How it works, FAQ, Disclaimer, Terms, Privacy, 404 | **Done** |
| 3 | Contract: Usurp.sol, tests, deploy + verify on Arc Testnet | **Done** |
| 4 | Wallet + chain layer | **Done** |
| 5 | Game wired to chain | **Done** |
| 6 | Game feel: ring, confetti, shake, effects, history, streaks | **Done** |
| 7 | Admin + safety: /admin, pause, timelocked changes, region restriction | **Done** |
| 8 | Polish: a11y pass, ErrorBoundary, README, docs | **Done** |

## To Run

```bash
bun install
bun run dev
```

Enable mock mode (no chain needed):

```bash
VITE_MOCK_MODE=true bun run dev
```
