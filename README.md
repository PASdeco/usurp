# USURP — Steal the Crown

> A real-time crypto game on Arc. One crown. One holder. Pay to steal it. Earn a drip while you hold.

**[Play on Arc Testnet →](https://i6j8mbfrvxxw0vlycbcg3.preview.studio.arc.io)**

---

## What is USURP?

USURP is a king-of-the-hill USDC game on Arc Testnet:

- One public crown. One holder at a time.
- Pay the current price to steal the crown. Each steal costs 20% more (capped at $5.00).
- While you hold the crown, you earn a drip of 2% of your steal price every 30 seconds, paid from the shared pot.
- When someone steals from you, you keep everything you earned — but you don't get your steal price back.
- After 1 hour with no steals (or 10 minutes with an empty pot), the price resets to $0.13.

**This is a game, not an investment. You can lose what you pay. Test funds only on Arc Testnet.**

---

## Quick start (10 minutes)

### Prerequisites

- [Bun](https://bun.sh) v1.0+ (`curl -fsSL https://bun.sh/install | bash`)
- [Foundry](https://book.getfoundry.sh/getting-started/installation) (`curl -L https://foundry.paradigm.xyz | bash && foundryup`)
- A browser wallet (MetaMask or any WalletConnect-compatible wallet)

### 1. Clone and install

```bash
git clone <repo-url>
cd usurp
bun install
```

### 2. Configure environment

```bash
cp docs/ENV_EXAMPLE.md .env
# Edit .env and fill in:
#   VITE_CONTRACT_ADDRESS   (use the deployed testnet address below, or deploy your own)
#   PRIVATE_KEY             (only needed if you want to deploy your own contract)
#   FEE_ADDRESS             (your wallet address — receives 50% of steal revenue)
```

### 3. Run in mock mode (no wallet needed)

```bash
VITE_MOCK_MODE=true bun run dev
```

Open [http://localhost:5173](http://localhost:5173). The UI is fully interactive with seeded fake data.

### 4. Run against Arc Testnet

```bash
bun run dev
```

Connect MetaMask (or any wallet) to **Arc Testnet**:
- Network name: Arc Testnet
- Chain ID: 5042002
- RPC URL: https://rpc.testnet.arc.io
- Currency: USDC
- Explorer: https://explorer.testnet.arc.io

Get testnet USDC from the "Get test USDC" button in Arc Studio, or from the Arc Testnet faucet.

---

## Contract

| Field | Value |
|---|---|
| **Address** | `0x5B16a6fd5a2f14D0c4D671bB5A14f9044fdE89e5` |
| **Chain** | Arc Testnet (5042002) |
| **USDC** | `0x3600000000000000000000000000000000000000` |
| **Explorer** | [View on Arc Explorer](https://explorer.testnet.arc.io/address/0x5b16a6fd5a2f14d0c4d671bb5a14f9044fde89e5) |
| **Owner** | `0xD0b8aEEdf195499773415323cae517e5b8369F94` |
| **Fee address** | `0x45c99e421d37eA58a4ba239fE91c69f515cbd27e` |
| **Status** | Deployed + verified on Arc Testnet |
| **Audit** | Unaudited testnet prototype |

### Run contract tests

```bash
bun run contracts:test
```

### Build contracts

```bash
bun run contracts:build
```

### Deploy your own contract

```bash
# Set PRIVATE_KEY and FEE_ADDRESS in .env first
forge script contracts/script/DeployUsurp.s.sol \
  --rpc-url https://rpc.testnet.arc.io \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --verify \
  --verifier blockscout \
  --verifier-url https://explorer.testnet.arc.io/api \
  -vvvv
```

---

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS v3 |
| Web3 | wagmi v2, viem v2, ConnectKit |
| Contracts | Solidity 0.8.20, Foundry, OpenZeppelin 5.1.0 |
| Chain | Arc Testnet (chain ID 5042002) |
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
│   ├── config.ts                   wagmi config (Arc Testnet)
│   ├── lib/
│   │   ├── contract.ts             ABI + contract address
│   │   └── mock.ts                 Mock game state (VITE_MOCK_MODE)
│   ├── contexts/
│   │   ├── GameContext.tsx         Live/mock game state provider
│   │   ├── ThemeContext.tsx        Dark/light theme
│   │   └── EffectsContext.tsx      Effects on/off
│   ├── hooks/
│   │   ├── useGameState.ts         Live chain reads (5s poll)
│   │   ├── useGameFeed.ts          Event log (getLogs + watch)
│   │   ├── useGameStats.ts         Best hold + streak from events
│   │   ├── useSteal.ts             Approve + steal two-step
│   │   ├── useClaim.ts             Claim earnings
│   │   ├── useAdmin.ts             Admin writes + reads
│   │   ├── useWallet.ts            Address, balance, chain check
│   │   ├── useConfetti.ts          canvas-confetti wrapper
│   │   ├── useShake.ts             Screen shake
│   │   └── useEffects.ts           Effects preference
│   ├── components/
│   │   ├── Header.tsx              Sticky header
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
│   ├── DECISIONS.md                Technical decisions and open questions
│   ├── DEPLOY.md                   Testnet + mainnet deployment guide
│   └── SECURITY.md                 Threat model, bot analysis, known risks
└── public/
    ├── brand/                      Favicons, manifest, OG images
    ├── sitemap.xml
    └── robots.txt
```

---

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `VITE_CONTRACT_ADDRESS` | No | Contract address (defaults to deployed testnet address) |
| `VITE_MOCK_MODE` | No | `true` = use seeded mock state, no chain needed |
| `VITE_BLOCKED_REGIONS` | No | Comma-separated ISO 3166-1 alpha-2 codes to block (e.g. `US,GB`) |
| `PRIVATE_KEY` | Deploy only | Deployer wallet private key |
| `FEE_ADDRESS` | Deploy only | Wallet that receives 50% builder revenue |

Never commit `PRIVATE_KEY` or `FEE_ADDRESS`. They are in `.gitignore`.

---

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
- Status never conveyed by color alone (PotHealthChip: icon + label + color)
- Visible focus rings in both themes

---

## Docs

- [Architecture](docs/ARCHITECTURE.md) — state machine, accrual math, component tree
- [Security](docs/SECURITY.md) — threat model, bot analysis, top 5 risks
- [Decisions](docs/DECISIONS.md) — technical choices and open questions
- [Deploy](docs/DEPLOY.md) — testnet and mainnet deployment guide

---

## Disclaimer

Usurp is an experimental game on Arc Testnet. Test funds have no real value. Not financial advice. 18+ only. See [Disclaimer](src/pages/DisclaimerPage.tsx) for full terms.
