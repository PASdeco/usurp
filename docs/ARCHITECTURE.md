# USURP — Architecture

> State machine, accrual math, component tree, trust model, and extension points.

---

## 1. System overview

```
┌─────────────────────────────────────┐
│          React frontend             │
│  (Vite + wagmi + ConnectKit)        │
│                                     │
│  useGameState  ──────────────────►  │
│  useGameFeed   ──────────────────►  │  Arc Testnet RPC
│  useAdmin      ──────────────────►  │  (chain ID 5042002)
│  useSteal      ──────────────────►  │
│  useClaim      ──────────────────►  │
└─────────────────────────────────────┘
              │  reads/writes
              ▼
┌─────────────────────────────────────┐
│         Usurp.sol                   │
│   Arc Testnet                       │
│   0x5B16a6fd5a2f14D0c4D671bB5A14f9044fdE89e5 │
│                                     │
│   USDC ERC-20 (6 dec)               │
│   0x3600000000000000000000000000000000000000 │
└─────────────────────────────────────┘
```

---

## 2. Contract state machine

```
        ┌─────────────────────────────────────┐
        │           VACANT                    │
        │  holder = address(0)                │
        │  currentPrice = START_PRICE         │
        └──────────────┬──────────────────────┘
                       │ steal()
                       ▼
        ┌─────────────────────────────────────┐
        │           ACTIVE                    │
        │  holder = msg.sender                │
        │  pot > 0: drip accrues every 30s    │◄──┐
        │  pot = 0: drip paused               │   │ steal()
        └────────┬────────────────────────────┘   │ (prev holder
                 │                                │  drip settled)
                 │ idle ≥ 1h                      │
                 │ OR pot empty ≥ 10 min          │
                 ▼                                │
        ┌─────────────────────────────────────┐   │
        │           RESETTING                 │   │
        │  reset() callable by anyone         │   │
        │  settles final drip                 │───┘
        │  → back to VACANT                   │
        └─────────────────────────────────────┘
```

Pause overlays every state: `pause()` blocks `steal()` and `reset()`, but never blocks `claim()`.

---

## 3. Drip accrual math

```
dripPerInterval = holderStealPrice × DRIP_BPS / 10000
                = holderStealPrice × 200 / 10000
                = holderStealPrice × 0.02

intervalsElapsed = floor((block.timestamp - accrualStart) / DRIP_INTERVAL)
                 = floor(elapsedSeconds / 30)

accrued = min(intervalsElapsed × dripPerInterval, pot)
```

Key properties:
- Drip is always whole-interval; fractional intervals carry over to the next settlement.
- `accrued` is capped at `pot` so the contract can never over-pay.
- No drip catch-up: intervals where pot was empty are permanently lost.
- After `seedPot()`, `accrualStart` is set to `block.timestamp` — no retroactive drip.

Break-even: holder earns back their steal price when `accrued ≥ holderStealPrice`, which requires:
```
intervalsElapsed ≥ 10000 / DRIP_BPS = 50 intervals = 50 × 30s = 1500s ≈ 25 minutes
```

---

## 4. Price escalation

```
nextPrice = min(
  floor(currentPrice × (10000 + PRICE_INCREASE_BPS) / 10000),
  PRICE_CAP
)
         = min(floor(currentPrice × 12000 / 10000), 5_000_000)
```

Price curve (USDC, 6-decimal):

| Steal # | Price       |
|---------|-------------|
| 1       | $0.13       |
| 2       | $0.156      |
| 3       | $0.187      |
| 5       | $0.272      |
| 10      | $0.806      |
| 15      | $2.385      |
| 18      | $5.00 (cap) |

---

## 5. Steal payment split

```
feeAmt = pricePaid × SPLIT_BPS / 10000   (50% → feeAccrued)
potAmt = pricePaid - feeAmt               (50% → pot, captures odd-wei remainder)
```

The builder can withdraw `feeAccrued` at any time via `withdrawFees()`, callable by `feeAddress` or `owner`.

---

## 6. Solvency invariant

At all times: `USDC.balanceOf(address(this)) ≥ pot + feeAccrued + Σ pending[all]`

This is enforced by:
- All incoming USDC via `transferFrom` in `steal()` and `seedPot()`.
- All outgoing USDC via pull-only `claim()` and `withdrawFees()`.
- No loops over unbounded arrays.
- Drip capped at `pot`.

The invariant was verified in Foundry invariant tests (256 runs × 500 calls).

---

## 7. Frontend architecture

```
App
├── ThemeProvider       (CSS data-theme toggle, no-flash script)
├── EffectsProvider     (shake/confetti on/off, persisted to LS)
├── WagmiProvider + QueryProvider
│   └── ConnectKitProvider
│       └── GameProvider
│           ├── LiveGameProvider (when VITE_MOCK_MODE != true)
│           │   ├── useGameState  (getState + earnedSoFar, 5s poll)
│           │   ├── useGameFeed   (getLogs + watchContractEvent)
│           │   ├── useGameStats  (bestHold + streak from feed)
│           │   ├── useSteal      (approve + steal two-step)
│           │   └── useClaim
│           └── MockGameProvider (when VITE_MOCK_MODE=true)
└── AppInner
    ├── RegionNotice
    ├── AgeGate (focus-trapped, LS-persisted)
    ├── Header (logo, network pill, nav, theme toggle, effects toggle, wallet)
    ├── WrongNetworkBanner
    ├── ErrorBoundary
    │   └── [page content]
    └── Footer
```

---

## 8. Data flow: steal()

```
User clicks STEAL
  → handleSteal()
  → useSteal.steal(stealPriceRaw, userAddress, currentAllowance)
    → if allowance < stealPriceRaw:
        writeContract approve(USURP_ADDRESS, stealPriceRaw)  // step: 'approving'
        await waitForTransactionReceipt
    → writeContract steal(maxPrice = stealPriceRaw * 101 / 100)  // 1% slippage buffer
    // step: 'stealing' → 'confirming'
    await waitForTransactionReceipt
    → toast.success + fireConfetti + triggerShake
    → refetch()  // invalidates useGameState cache
```

---

## 9. Trust assumptions

| Actor | Trust level | Controls |
|---|---|---|
| Owner (deployer wallet) | High | pause/unpause, seedPot, schedule/apply param changes, schedule authorizedCaller |
| feeAddress | Medium | withdrawFees only |
| authorizedCaller | None (unset) | Phase 2 only; awardCrown (unset = reverts) |
| Anyone | Untrusted | steal (price-guarded), claim (own funds only), reset (condition-gated) |
| Arc Testnet nodes | Semi-trusted | block.timestamp (±15s in practice) |

---

## 10. Extension points

- **Phase 2 — Usurp Arena:** `awardCrown(address winner)` is already in the contract, gated behind `authorizedCaller` (currently `address(0)`). Enable by deploying the Arena judging contract and calling `applyAuthorizedCaller()` after the 2-day timelock.
- **Levels / daily rewards:** `FeedEvent` stream is already captured client-side; a `usePlayerStats` hook computes streak and best-hold. Daily-rewards logic can extend this without contract changes.
- **Push notifications:** no server needed for "you were dethroned" — the `Stolen` event includes `indexed prevHolder`. Any off-chain listener (Push Protocol, XMTP, a simple webhook) can watch for events where `prevHolder == subscribedAddress`.
- **Indexer:** current feed reads last 2000 blocks via `getLogs` — covers several hours. For longer history, add a lightweight indexer (Ponder, The Graph subgraph) and swap `useGameFeed` to read from it.
