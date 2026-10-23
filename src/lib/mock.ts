/**
 * Mock game state for USURP.
 * Set VITE_MOCK_MODE=true in .env to use this instead of live chain data.
 */

export const MOCK_MODE = import.meta.env.VITE_MOCK_MODE === 'true'

export type PotHealth = 'healthy' | 'low' | 'empty'

export interface FeedEvent {
  id: string
  type: 'steal' | 'claim' | 'reset' | 'drip'
  actor: string
  amount?: number   // USDC amount, 2dp
  at: number        // unix ms
}

export interface GameState {
  /** Current crown holder (EVM address) */
  holder: string
  /** Display name or truncated address */
  holderDisplay: string
  /** Current steal price in USDC */
  stealPrice: number
  /** Previous steal price (so UI can show escalation) */
  prevStealPrice: number
  /** Pot balance in USDC */
  potBalance: number
  /** Holder's accumulated unclaimed earnings in USDC */
  pendingEarnings: number
  /** Unix ms when the current holder stole the crown */
  heldSince: number
  /** Break-even % ring (0–100) */
  breakEvenPct: number
  /** Total steals in this round */
  roundSteals: number
  /** Longest hold in minutes this round */
  bestHoldMins: number
  /** Current holder's streak (days) */
  streak: number
  /** Pot health bucket */
  potHealth: PotHealth
  /** Whether the contract is paused */
  paused: boolean
  /** Unix ms when the round/price resets (no steal in 1h) */
  resetAt: number
  /** Recent activity feed */
  feed: FeedEvent[]
}

// ─── Three seeded mock scenarios ─────────────────────────────────────────────

const now = Date.now()
const MIN = 60_000

/** Scenario A: normal healthy state */
export const MOCK_HEALTHY: GameState = {
  holder:        '0xaBcD1234eFgH5678iJkL9012mNoP3456qRsT7890',
  holderDisplay: '0xaBcD…7890',
  stealPrice:    0.13 * Math.pow(1.2, 3), // 3 steals in → ~$0.22
  prevStealPrice: 0.13 * Math.pow(1.2, 2),
  potBalance:    1.84,
  pendingEarnings: 0.042,
  heldSince:     now - 18 * MIN,
  breakEvenPct:  72,
  roundSteals:   3,
  bestHoldMins:  28,
  streak:        4,
  potHealth:     'healthy',
  paused:        false,
  resetAt:       now + 42 * MIN,
  feed: [
    { id: 'f1', type: 'steal', actor: '0xaBcD…7890', amount: 0.22, at: now - 18 * MIN },
    { id: 'f2', type: 'steal', actor: '0x9Ef0…1234', amount: 0.19, at: now - 41 * MIN },
    { id: 'f3', type: 'steal', actor: '0x5678…abCD', amount: 0.16, at: now - 65 * MIN },
    { id: 'f4', type: 'steal', actor: '0x9Ef0…1234', amount: 0.13, at: now - 88 * MIN },
  ],
}

/** Scenario B: low pot */
export const MOCK_LOW: GameState = {
  ...MOCK_HEALTHY,
  potBalance:    0.18,
  potHealth:     'low',
  stealPrice:    0.13 * Math.pow(1.2, 8), // ~$0.57
  prevStealPrice: 0.13 * Math.pow(1.2, 7),
  breakEvenPct:  38,
  pendingEarnings: 0.009,
}

/** Scenario C: empty pot */
export const MOCK_EMPTY: GameState = {
  ...MOCK_HEALTHY,
  potBalance:    0,
  potHealth:     'empty',
  pendingEarnings: 0,
  breakEvenPct:  15,
}

export const MOCK_SCENARIOS: Record<string, GameState> = {
  healthy: MOCK_HEALTHY,
  low:     MOCK_LOW,
  empty:   MOCK_EMPTY,
}

export const DEFAULT_MOCK = MOCK_HEALTHY
