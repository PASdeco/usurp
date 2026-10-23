# USURP — Architecture Decisions

> Record of technical choices and open questions. Update as each milestone lands.

---

## Milestone 1: Scaffold

### D-01 · Framework: Vite + React instead of Next.js

**Spec called for:** Next.js (App Router) + Vercel  
**What was built:** Vite + React + TypeScript (the Arc Studio sandbox default)

**Why:** Arc Studio's sandbox runs a pre-wired Vite + React project with wagmi, ConnectKit, TanStack Query, and all Circle SDKs already installed. Migrating to Next.js would require ejecting and reinstalling the whole stack, which adds risk and delays the contract work. The component architecture (pages/, components/, contexts/, lib/) is identical to what Next.js would use.

**Trade-offs:**  
- No SSR/SSG. All pages are client-rendered. SEO meta tags are in index.html and will be extended in Milestone 2.  
- No file-based routing. A hash router (`window.location.hash`) is used instead of Next.js App Router. This means no server-side redirects.  
- Deploy: HF Spaces (Docker) or Netlify (static) rather than Vercel. Vercel still works as a static host; document in DEPLOY.md.

**Future:** If Next.js is required for production (SSR, ISR, API routes), the migration is straightforward — each `src/pages/` file becomes an `app/` route, and `src/components/` is unchanged.

---

### D-02 · Router: hash-based, no react-router dependency

**Why:** Keeps dependencies minimal for the scaffold milestone. No `bun add` needed.  
**Trade-off:** No nested routes, no typed params. Sufficient for the ~8 pages USURP needs.  
**Future:** If deep linking or query params become required (admin panel, referral links), add `react-router-dom`.

---

### D-03 · Theme: CSS custom properties + `data-theme` attribute

**Why:** The design spec defines 20+ tokens. CSS vars allow Tailwind to consume them without JS overhead. The `data-theme` attribute avoids a flash-of-wrong-theme because the inline script in `index.html` sets it before React hydrates.

---

### D-04 · Fonts: loaded via Google Fonts (CDN)

**Spec called for:** `next/font` (Next.js only)  
**What was built:** `<link>` preconnect + stylesheet in `index.html`  
**Trade-off:** No font subsetting, slight FOUC on cold load. Acceptable for testnet/demo. For production, self-host the font files.

---

### D-05 · Logo: inline SVG built from PNG reference

The uploaded PNGs show:
- Dark variant: five-point crown, warm gold gradient (#FFE08A → #B8801F), no outline, black background.
- Light variant: same crown shape, deeper gold (#F0B429 → #8A5A00), 2.5px dark stroke (paint-order: stroke fill), white background.

The SVG paths were drawn to match the crown silhouette in the PNGs. No external image file dependency.

---

## Milestone 3: Contract

### D-06 · USDC payment model: ERC-20 transferFrom (not msg.value)

Arc USDC is a 6-decimal ERC-20 at `0x3600000000000000000000000000000000000000`. On Arc the native gas token IS USDC (18-decimal view), but contract payments use the ERC-20 interface. `steal()` calls `IERC20(USDC).safeTransferFrom(msg.sender, address(this), pricePaid)`. Callers must `approve()` the contract first. This is consistent with how every USDC-receiving contract on Arc works.

### D-07 · Slither false positives (documented, not fixed)

| Finding | Why not fixed |
|---------|---------------|
| `weak-prng` on `nextDripAt()` | Uses `%` for time arithmetic (position within drip interval), not randomness |
| `divide-before-multiply` in drip math | Intentional: drip accrues in whole intervals; fractional intervals don't pay out |
| `incorrect-equality` — sentinel checks | `address(0)` and `potEmptySince == 0` are correct sentinel idioms |
| `timestamp` — reset timers, timelocks | Expected; miner manipulation risk is minimal on Arc (2s blocks, no miner selection) |

### D-08 · awardCrown (Phase 2 hook) — known privileged bypass

The functional auditor flagged `awardCrown()` as allowing crown assignment without payment. This is **intentional** per the spec ("Leave a hook for Phase 2 — Usurp Arena, a 60-second duel mode"). It is gated behind `authorizedCaller != address(0)` (always reverts on testnet), and `authorizedCaller` can only be set via a 2-day timelocked `setAuthorizedCaller` + `applyAuthorizedCaller` flow. The NatSpec on the function says "PHASE 2 HOOK — unaudited. Must be security-reviewed before enabling authorizedCaller." This decision must be revisited with a full audit before mainnet.

### D-09 · Constructor owner and fee address

Both set to the Circle platform deployer wallet (`0x5B12Ce46C7194aD57d143bC22847224047b1Ef42`) for testnet. Before mainnet: transfer ownership to a multisig and update feeAddress via the timelock to a builder-controlled wallet.

### D-10 · Pot seed amount

`MIN_SEED = 1_000_000` (1.00 USDC) is defined as a constant. The builder should call `seedPot()` before publicizing the game so the first holder earns a drip immediately.

---

---

## Milestone 5: Game wired to chain

### D-11 · Live reads: useReadContract + 5s polling (not WebSocket subscriptions)

**Why:** Arc Testnet's public RPC does not guarantee persistent WebSocket connections. A 5-second `refetchInterval` on `useReadContract` is reliable and sufficient for a game with 30-second drip intervals. WebSocket subscriptions are used for events only (`useWatchContractEvent`) as a fallback to polling.

### D-12 · Slippage buffer: 1% on steal price

Frontend adds 1% to `maxPrice` when calling `steal()`. This prevents reverts from a price change between tx sign and tx mine while keeping the user's exposure bounded to 1% above what they saw.

### D-13 · Earnings interpolation: client-side drip math

The live earnings ticker interpolates between chain reads using `dripPerMs = holderStealPrice × DRIP_BPS/10000 / (DRIP_INTERVAL × 1000)`. This is a display estimate only; the contract is the source of truth on settlement.

---

## Milestone 6: Game feel

### D-14 · canvas-confetti: used for break-even milestone and steal success

Fires on steal success and on first ring hit of 100%. Both can be disabled by the user via the "Effects" toggle (persisted to localStorage). `prefers-reduced-motion` sets the default to off.

### D-15 · Best hold and streak: client-side from event logs

Derived from the last 2000 blocks of `Stolen` events. `useGameStats` computes:
- Best hold = maximum hold duration across all steals (consecutive event timestamp differences).
- 7-day streak = count of unique UTC calendar days (in the last 7) where the connected address appears as newHolder in a Stolen event.
No indexer required for testnet. For mainnet production, swap `useGameFeed` to read from a Ponder or The Graph subgraph.

---

## Milestone 7: Admin and safety

### D-16 · Region restriction: client-side only (Layer 1)

`VITE_BLOCKED_REGIONS` uses `navigator.language` locale heuristics (e.g. `en-US` → US) as a first line. This is easily bypassed by VPN. Layer 2 (server-side via Vercel Edge Middleware or Cloudflare Workers) is documented in DEPLOY.md but not yet implemented. **Add server-side blocking before mainnet.**

### D-17 · Admin page: owner guard is client-side

The `/admin` page reads `owner()` and `feeAddress()` from the chain and hides the UI if the connected wallet doesn't match. The contract enforces access control on every write — the UI guard is UX convenience only, not a security boundary.

---

## Milestone 8: Polish

### D-18 · OG image: placeholder

`/brand/og-image.png` is referenced in meta tags but the PNG file needs to be created by the builder. Recommended: dark background (#07060B), the gold crown SVG centered, "USURP" in Big Shoulders Display 900, "Steal the Crown" in Plus Jakarta Sans. Export at 1200×630.

### D-19 · Playwright tests: not implemented

The spec called for Playwright for 3 key flows (connect wallet, steal, claim). These are not implemented because Playwright requires a running testnet node or a fork, which is outside the Arc Studio sandbox. Document in DEPLOY.md as a pre-mainnet requirement.

### D-20 · Vercel deploy: documented but not executed

DEPLOY.md documents the Vercel deploy steps. The app is deployable to Netlify, Hugging Face, or Vercel as a static SPA. The live preview URL runs in Arc Studio's preview environment.

---

## Open Questions

- OQ-01: Fee wallet address for the 50% builder split — placeholder in contract; must be set before any real funds.
- OQ-02: Pot seed amount (TBD in spec §5) — "amount TBD, a parameter".
- OQ-03: GenoLayer/AI panel integration for Arena — deferred to Phase 2, only a teaser in Milestone 1.
- OQ-04: Region restriction list — to be determined before mainnet.
