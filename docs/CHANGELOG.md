# Changelog

All notable changes to USURP are documented here.

---

## [Unreleased]

### Planned
- Phase 2: Usurp Arena (60-second AI-judged duel mode)
- Playwright end-to-end tests
- Contract source verification on Arc Mainnet explorer (pending Cloudflare fix on explorer API)
- OG image PNG, favicon-32.png, apple-touch-icon.png

---

## [1.3.0] — 2026-10-26

### Changed
- Removed pause/unpause from admin panel and all frontend UI
- Pause state no longer read or displayed anywhere in the frontend
- Steal button is no longer blocked by pause state in the UI (contract-level pause still applies onchain)

### Fixed
- Hold timer and earnings ticker now freeze correctly when the pot balance hits zero
- Fixed freeze logic: previously only triggered on the paused→unpaused transition; now checks freeze condition on every render, so loading the page while already paused or pot-empty works correctly

---

## [1.2.0] — 2026-10-23

### Added
- `src/onchain-shim.ts`: standalone replacements for Arc Studio sandbox-only helpers (`getUsdc`, `requireChain`, `Amount`, `buildTxExplorerUrl`). Production build now works outside the Arc Studio sandbox environment.

### Fixed
- `useGameFeed`: was hardcoded to Arc Testnet RPC — now uses mainnet RPC from config
- Replaced `useWatchContractEvent` (uses `eth_newFilter`, unsupported on Arc RPC) with polling every 10 seconds across `useGameFeed`
- `buildTxExplorerUrl` argument order corrected in `useSteal`, `useClaim`, `HistoryPage`, `PlayerPage`
- All hooks migrated from sandbox-only `@/onchain-facts` and `@/onchain-money` imports to `src/onchain-shim.ts`

---

## [1.1.0] — 2026-10-23

### Changed
- Admin panel: loading state now says "Arc Mainnet", status notice updated to "Arc Mainnet — all actions involve real USDC"
- Admin panel: contract address now shows mainnet address `0xC47cc87cb5fe4EDAe581064045A79074264bC415`
- Disclaimer: section 7 renamed "Mainnet — real funds", describes Arc Mainnet with real USDC and irreversible transactions; last updated bumped to October 23, 2026
- FAQ: Q13 updated — removed "testnet prototype", now says "unaudited mainnet contract"; Q14 updated to ycee contact; Q17 renamed to "What network does Usurp run on?" with Arc Mainnet answer; Q20 contact updated
- How it works: testnet notice replaced with Arc Mainnet notice; contract address in "Verify it yourself" updated to mainnet address with mainnet explorer link; faucet link removed

### Fixed
- Hold timer showing `497996:45:00` when no holder: now shows `00:00:00` when `heldSince = 0`

---

## [1.0.0] — 2026-10-21

### Added
- Full frontend deployed to Vercel at `https://usurp-arena.vercel.app`
- Usurp.sol deployed to Arc Mainnet at `0xC47cc87cb5fe4EDAe581064045A79074264bC415`
- Usurp.sol deployed to Arc Testnet at `0x5B16a6fd5a2f14D0c4D671bB5A14f9044fdE89e5`
- All 66 Foundry unit, fuzz, and invariant tests passing
- Two security audit rounds completed; Slither static analysis run
- Admin panel at `/#/admin` with seedPot, withdrawFees, timelocked param changes
- Live earnings ticker, hold timer, break-even ring, confetti, shake animations
- Dethroned player claim card for pending earnings after being displaced
- Region restriction via `VITE_BLOCKED_REGIONS`
- Legal pages: Disclaimer, Terms, Privacy fully written (no placeholders)
- SEO: sitemap.xml, robots.txt, OG meta tags, canonical URL
