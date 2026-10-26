# USURP — Security

> Threat model, known risks, and bot analysis. Last updated: October 2026.
> **This contract is live on Arc Mainnet. A professional audit is strongly recommended before significant TVL accumulates.**

---

## 1. Audit status

| Stage | Status |
|---|---|
| Internal review (Arc Studio) | Done — 2 findings fixed (see below) |
| Slither static analysis | Done — 4 false-positive categories documented |
| Foundry unit + fuzz + invariant tests | Done — 66/66 pass |
| Independent professional audit | **Not done** — strongly recommended before significant TVL |

### Findings fixed

| # | Finding | Severity | Fix |
|---|---------|----------|-----|
| F-01 | `renounceOwnership()` permanently bricks pause/unpause | High | Override to always revert with `Unauthorized()` |
| F-02 | `reset()` callable while paused, mutates critical game state during emergency | High | Added `whenNotPaused` modifier |

---

## 2. Threat model

### 2.1 Reentrancy
- All state-changing functions have `nonReentrant`.
- Checks-effects-interactions strictly followed: `transferFrom`/`transfer` is always the last operation.
- No callbacks or untrusted external calls mid-function.

### 2.2 Price manipulation
- `steal(maxPrice)` includes a caller-specified slippage cap. If price rose while the tx was in flight, the call reverts with `SlippageExceeded`.
- The frontend adds a 1% slippage buffer.

### 2.3 Owner privilege abuse
- `owner` can: pause, unpause, seedPot, schedule/apply parameter changes.
- `owner` CANNOT: steal user funds, change the split above 50%, bypass the timelock.
- `renounceOwnership` is disabled — the game can always be unpaused.
- For mainnet: owner should be a multi-sig (Gnosis Safe 2-of-3 minimum).

### 2.4 Fee address change
- `setFeeAddress` is timelocked (2 days). A malicious fee address swap requires 2 days of on-chain visibility before it takes effect.
- `withdrawFees` only pays to the registered `feeAddress` regardless of who calls it.

### 2.5 Integer overflow / underflow
- Solidity 0.8.20: all arithmetic reverts on overflow by default.
- No unchecked blocks except where explicitly safe (none in this contract).

### 2.6 Timestamp dependence
- `block.timestamp` used for drip intervals, reset timers, and timelocks.
- Arc block time is ~2 seconds. Miner/validator can manipulate timestamp by ±15 seconds.
- A 15-second manipulation yields at most 0.5 extra drip interval on a 30-second boundary — negligible.
- Timelocks (2 days) are vastly larger than any timestamp manipulation.

### 2.7 Front-running
- Steal price is deterministic and public. Front-running steals the same outcome (the attacker pays the same price and becomes holder). No unique MEV opportunity.
- The `minHoldBeforeSteal` parameter (default 0 on testnet) can be set > 0 to require a minimum hold before the next steal is allowed, reducing bot profitability.

---

## 3. Bot analysis

### 3.1 Profitable bot strategies

**Strategy A — idle-period snipe:**
- Wait for the price to reset to $0.13 after 1 hour of inactivity.
- Immediately steal at $0.13 and hold for 25 minutes to break even.
- If no one steals in those 25 minutes, the bot profits.
- **Risk:** another bot or player steals first. **Mitigation:** `minHoldBeforeSteal` (default 0).

**Strategy B — price-cap hold:**
- Steal when price is at cap ($5.00). Drip rate = $5.00 × 2% = $0.10 per 30s = $0.20/min.
- Break-even at 25 minutes = $5.00 earned. Every additional minute = +$0.20.
- Only profitable if no one steals during the hold. At cap, each steal is also $5.00, so the next player pays equally.

**Strategy C — pot drain watch:**
- Monitor pot health. When pot is nearly empty, don't steal (no drip income until refill).
- After builder `seedPot()`, front-run to steal at the current price.
- **Impact:** Low; pot seed events are public and easily observable.

### 3.2 Bot mitigations built in

| Parameter | Default | Purpose |
|---|---|---|
| `minHoldBeforeSteal` | 0 (testnet) | Require N seconds between steals. Set to 30–120s on mainnet to deter instant-flip bots. |
| `IDLE_RESET_TIME` | 3600s | 1h idle window before reset. Long enough to deter idle-wait bots in practice. |
| Slippage check in `steal()` | Required | Prevents bots from unknowingly paying more than their model expects. |

### 3.3 Bot economics summary
- Bots can profit if hold time > break-even time AND no one steals during that hold.
- The game is designed so human players can also profit (same conditions). Bots are not uniquely advantaged except by speed.
- At high steal rates (steal every <12 min), the pot may empty. Monitor and seed proactively.

---

## 4. Known risks

| # | Risk | Severity | Status |
|---|------|----------|--------|
| R-01 | No professional audit | Critical | Mitigated by scope (testnet only until audited) |
| R-02 | Bot sniping at price reset | Medium | Mitigated by `minHoldBeforeSteal` (0 on testnet, set > 0 for mainnet) |
| R-03 | Pot drain leaving holder with no income | Medium | UI shows Empty state; builder monitors and seeds |
| R-04 | USDC depeg or Arc network downtime | Medium | Third-party risk; disclosed in Disclaimer |
| R-05 | awardCrown Phase 2 hook (privileged bypass) | Medium | Gated behind `authorizedCaller = address(0)` until explicitly enabled; requires audit before enabling |
| R-06 | Owner key compromise | High | Mitigated on mainnet by multi-sig ownership |
| R-07 | Regulatory / legal risk in some jurisdictions | Medium | Age gate + region block + Disclaimer; legal review required before mainnet |
| R-08 | Google Fonts CDN — privacy and availability | Low | Self-host fonts for production |
| R-09 | No on-chain randomness | Info | Game does not use randomness; not applicable |

---

## 5. Top 5 risks (pre-mainnet)

1. **No professional audit** — the contract holds user funds. Do not launch on mainnet without an independent audit from a reputable firm.
2. **Owner key is a single EOA (testnet)** — transfer ownership to a multi-sig before mainnet.
3. **Bot economics at reset boundary** — calibrate `minHoldBeforeSteal` based on testnet data before mainnet.
4. **Pot drain** — at low steal rates the pot may empty, making the game unplayable. Set up monitoring alerts and a seeding schedule.
5. **awardCrown (Phase 2)** — this function can award the crown without payment. It is inert until `authorizedCaller` is set, but it must receive a dedicated security review before being enabled.

---

## 6. Solvency simulation

A Foundry simulation script (`contracts/script/Simulate.s.sol`) runs 200 random steals with random idle gaps and reports pot-health distribution. Key findings from testnet:
- Pot stays above Low for ~18 minutes at the starting price ($0.13) with one steal every 5 minutes.
- At the price cap ($5.00), pot drains in about 12–15 minutes without a new steal.
- **Recommendation:** seed the pot to at least $5.00 before launch, and monitor for pot-empty periods longer than 5 minutes.
