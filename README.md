# USURP — Steal the Crown

> A real-time USDC game on Arc Mainnet. One crown. One holder. Pay to steal it. Earn a drip while you hold.

**[Play now →](https://usurp-arena.vercel.app)**

---

## What is USURP?

USURP is a king-of-the-hill USDC game on Arc Mainnet:

- One public crown. One holder at a time.
- Pay the current price to steal the crown. Each steal costs 20% more (capped at $5.00).
- While you hold the crown, you earn a drip of 2% of your steal price every 30 seconds, paid from the shared pot.
- When someone steals from you, you keep everything you earned — but you don't get your steal price back.
- After 1 hour with no steals (or 10 minutes with an empty pot), the price resets to $0.13.

**This is a game, not an investment. You can lose what you pay. Real USDC on Arc Mainnet.**

---

## Quick start (10 minutes)

### Prerequisites

- [Bun](https://bun.sh) v1.0+ (`curl -fsSL https://bun.sh/install | bash`)
- [Foundry](https://book.getfoundry.sh/getting-started/installation) (`curl -L https://foundry.paradigm.xyz | bash && foundryup`)
- A browser wallet (MetaMask, Rabby, or any WalletConnect-compatible wallet)

### 1. Clone and install

```bash
git clone https://github.com/PASdeco/usurp.git
cd usurp
bun install
```

### 2. Configure environment

```bash
cp docs/ENV_EXAMPLE.md .env
# Edit .env and fill in:
#   VITE_NETWORK=mainnet                   (set to mainnet for production)
#   VITE_MAINNET_CONTRACT_ADDRESS          (0xC47cc87cb5fe4EDAe581064045A79074264bC415)
#   VITE_WALLETCONNECT_PROJECT_ID          (get from https://cloud.walletconnect.com)
```

### 3. Run in mock mode (no wallet needed)

```bash
VITE_MOCK_MODE=true bun run dev
```

Open [http://localhost:5173](http://localhost:5173). The UI is fully interactive with seeded fake data.

### 4. Run against Arc Mainnet

```bash
bun run dev
```

Connect your wallet to **Arc Mainnet**:
- Network name: Arc
- Chain ID: 5042
- RPC URL: https://rpc.mainnet.arc.io
- Currency: USDC
- Explorer: https://explorer.arc.io

---

## Contract

| Field | Value |
|---|---|
| **Address** | `0xC47cc87cb5fe4EDAe581064045A79074264bC415` |
| **Chain** | Arc Mainnet (chain ID 5042) |
| **USDC** | `0x3600000000000000000000000000000000000000` |
| **Explorer** | [View on Arc Explorer](https://explorer.arc.io/address/0xC47cc87cb5fe4EDAe581064045A79074264bC415) |
| **Owner** | `0xE3fd801A2939c636f2EA5c281A726Ea131799F12` |
| **Fee address** | `0xBd87d93B45c017EFC656a1F78BA190c49e5e8673` |
| **Status** | Deployed on Arc Mainnet |
| **Audit** | Two-round security review; 66 unit + fuzz + invariant tests passing |

### Run contract tests

```bash
bun run contracts:test
```

### Build contracts

```bash
bun run contracts:build
```

### Deploy your own instance

```bash
# Set MAINNET_PRIVATE_KEY, MAINNET_FEE_ADDRESS, and USDC_ADDRESS in .env first
forge script contracts/script/DeployUsurp.s.sol \
  --rpc-url https://rpc.mainnet.arc.io \
  --private-key $MAINNET_PRIVATE_KEY \
  --broadcast \
  --verify \
  --verifier blockscout \
  --verifier-url https://explorer.arc.io/api \
  -vvvv
```

---

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS v3 |
| Web3 | wagmi v2, viem v2, ConnectKit |
| Contracts | Solidity 0.8.20, Foundry, OpenZeppelin 5.1.0 |
| Chain | Arc Mainnet (chain ID 5042) |
| Token | USDC ERC-20, 6 decimals |
| Fonts | Big Shoulders Display, Plus Jakarta Sans, JetBrains Mono |
| Effects | canvas-confetti, framer-motion |
| State | TanStack Query, wagmi |
| Toasts | Sonner |

---

## Project structure

```
usurp/
├── contracts/
│   ├── Usurp.sol                   Main game contract
│   ├── test/Usurp.t.sol            66 Foundry unit + fuzz + invariant tests
│   └── script/DeployUsurp.s.sol    Deploy script (forge script)
├── src/
│   ├── App.tsx                     Root: providers + hash router
│   ├── config.ts                   wagmi config (Arc Mainnet + Testnet)
│   ├── onchain-shim.ts             Chain helpers (addresses, Amount, explorer URLs)
│   ├── lib/
│   │   ├── contract.ts             ABI + contract address (mainnet/testnet)
│   │   └── mock.ts                 Mock game state (VITE_MOCK_MODE)
│   ├── contexts/
│   │   ├── GameContext.tsx         Live/mock game state provider
│   │   ├── ThemeContext.tsx        Dark/light theme
│   │   └── EffectsContext.tsx      Effects on/off
│   ├── hooks/
│   │   ├── useGameState.ts         Live chain reads (5s poll)
│   │   ├── useGameFeed.ts          Event log (getLogs polling — Arc mainnet compatible)
│   │   ├── useGameStats.ts         Best hold + streak from events
│   │   ├── useSteal.ts             Approve + steal two-step
│   │   ├── useClaim.ts             Claim earnings
│   │   ├── useAdmin.ts             Admin writes + reads
│   │   ├── useWallet.ts            Address, balance, chain check
│   │   ├── useConfetti.ts          canvas-confetti wrapper
│   │   ├── useShake.ts             Screen shake
│   │   └── useEffects.ts           Effects preference
│   ├── components/
│   │   ├── Header.tsx              Sticky header (Arc Mainnet network pill)
│   │   ├── Footer.tsx              Footer nav
│   │   ├── Logo.tsx                SVG crown + wordmark (dark/light)
│   │   ├── ThroneScreen.tsx        Main game view
│   │   ├── WalletButton.tsx        Connect/disconnect wallet
│   │   ├── WrongNetworkBanner.tsx  Wrong-chain notice
│   │   ├── AgeGate.tsx             18+ confirmation modal
│   │   ├── RegionNotice.tsx        Region block overlay
│   │   ├── EffectsToggle.tsx       Effects on/off button
│   │   ├── ErrorBoundary.tsx       Render error catcher
│   │   └── icons.tsx               Lucide icon aliases
│   └── pages/
│       ├── HowItWorksPage.tsx
│       ├── FaqPage.tsx
│       ├── DisclaimerPage.tsx
│       ├── TermsPage.tsx
│       ├── PrivacyPage.tsx
│       ├── HistoryPage.tsx
│       ├── PlayerPage.tsx
│       ├── AdminPage.tsx
│       └── NotFoundPage.tsx
├── docs/
│   ├── ARCHITECTURE.md             State machine, accrual math, trust model
│   ├── CHANGELOG.md                Release history
│   ├── CONTRIBUTING.md             Dev setup, commit style, PR guide
│   ├── DECISIONS.md                Technical decisions and open questions
│   ├── DEPLOY.md                   Mainnet deployment guide
│   └── SECURITY.md                 Threat model, bot analysis, known risks
└── public/
    ├── brand/                      Favicons, manifest
    ├── sitemap.xml
    └── robots.txt
```

## Game mechanics

| Parameter | Value |
|---|---|
| Start price | $0.13 USDC |
| Price increase | +20% per steal |
| Price cap | $5.00 USDC |
| Steal split | 50% to builder, 50% to pot |
| Drip rate | 2% of steal price per 30 seconds |
| Break-even hold | ~25 minutes |
| Idle reset | 1 hour with no steals |
| Empty pot reset | 10 minutes with empty pot |

---

## Accessibility

- Semantic HTML throughout: `<header>`, `<main>`, `<nav>`, `<section>`, `<footer>`
- All controls ≥44px tap target
- Focus-trapped modal (age gate)
- `aria-live="polite"` on live earnings, hold timer, and feed
- `prefers-reduced-motion`: no shake, no confetti, no pulse when set
- "Effects: on/off" toggle persisted to localStorage
- Visible focus rings in both themes

---

## Docs

- [Architecture](docs/ARCHITECTURE.md) — state machine, accrual math, component tree
- [Security](docs/SECURITY.md) — threat model, bot analysis, top risks
- [Decisions](docs/DECISIONS.md) — technical choices and open questions
- [Deploy](docs/DEPLOY.md) — mainnet deployment guide
- [Changelog](docs/CHANGELOG.md) — release history
- [Contributing](docs/CONTRIBUTING.md) — dev setup and PR guide

---

## Disclaimer

USURP is a live game on Arc Mainnet using real USDC. You can lose the funds you play with. This is not financial advice. 18+ only. See the [full disclaimer](https://usurp-arena.vercel.app/#/disclaimer) before playing.

Built with [Arc Studio](https://studio.arc.io)
