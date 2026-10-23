/**
 * GameContext — unified game state for USURP.
 *
 * In mock mode:  serves one of the three seeded GameState scenarios.
 * In live mode:  reads from the Usurp contract via useGameState + useGameFeed,
 *                exposes steal() and claim() actions.
 *
 * ThroneScreen and other game components read from useGame() only —
 * they don't care whether the data is live or mock.
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
} from 'react'
import { MOCK_MODE, MOCK_SCENARIOS, DEFAULT_MOCK, type GameState } from '../lib/mock'
import { useGameState } from '../hooks/useGameState'
import { useGameFeed } from '../hooks/useGameFeed'
import { useGameStats } from '../hooks/useGameStats'
import { useSteal, type UseStealReturn } from '../hooks/useSteal'
import { useClaim, type UseClaimReturn } from '../hooks/useClaim'
import { useWallet } from '../hooks/useWallet'

// ─── Context shape ────────────────────────────────────────────────────────────

interface GameContextValue {
  gameState: GameState
  mockMode: boolean
  scenario: string
  setScenario: (s: string) => void
  isLoading: boolean
  stealHook: UseStealReturn
  claimHook: UseClaimReturn
  /** Trigger a manual refresh of game state (fire-and-forget) */
  refresh: () => void

  /** Address of the previous holder (to show revenge button) */
  prevHolder: string | null
}

const GameContext = createContext<GameContextValue | null>(null)

// ─── Live provider (non-mock) ─────────────────────────────────────────────────

function LiveGameProvider({ children }: { children: ReactNode }) {
  const { address } = useWallet()
  const liveState   = useGameState(address)
  const { feed, isLoading: feedLoading } = useGameFeed()

  // Track previous holder for revenge button
  const [prevHolder, setPrevHolder] = useState<string | null>(null)
  const prevHolderRef = useRef(liveState.holder)

  useEffect(() => {
    const newHolder = liveState.holder
    const old = prevHolderRef.current
    if (old && old !== newHolder && address &&
        old.toLowerCase() === address.toLowerCase()) {
      // We just got dethroned — store prev holder so revenge shows
      setPrevHolder(old)
    }
    prevHolderRef.current = newHolder
  }, [liveState.holder, address])

  // Derive best hold and streak from event logs
  const stats = useGameStats(feed, address, liveState.heldSince)

  const gameState: GameState = {
    ...liveState,
    feed,
    bestHoldMins: stats.bestHoldMins,
    streak: stats.streak,
  }

  const refetchVoid = useCallback(() => { void liveState.refetch() }, [liveState])
  const stealHook = useSteal(refetchVoid)
  const claimHook = useClaim(refetchVoid)

  const value: GameContextValue = {
    gameState,
    mockMode: false,
    scenario: 'live',
    setScenario: () => {},
    isLoading: liveState.isLoading || feedLoading,
    stealHook,
    claimHook,
    refresh: refetchVoid,
    prevHolder,
  }

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

// ─── Mock provider ────────────────────────────────────────────────────────────

function MockGameProvider({ children }: { children: ReactNode }) {
  const [scenario, setScenario] = useState('healthy')
  const gameState = MOCK_SCENARIOS[scenario] ?? DEFAULT_MOCK

  // Stub steal/claim hooks for mock mode
  const stealHook: UseStealReturn = {
    step: 'idle',
    steal: (_price: bigint, _addr: `0x${string}`, _allowance: bigint) => {},
    isLoading: false,
    txHash: undefined,
    reset: () => {},
  }
  const claimHook: UseClaimReturn = {
    step: 'idle',
    claim: () => {},
    isLoading: false,
    txHash: undefined,
  }

  const value: GameContextValue = {
    gameState,
    mockMode: true,
    scenario,
    setScenario,
    isLoading: false,
    stealHook,
    claimHook,
    refresh: () => {},
    prevHolder: null,
  }

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

// ─── Exported provider ────────────────────────────────────────────────────────

export function GameProvider({ children }: { children: ReactNode }) {
  return MOCK_MODE
    ? <MockGameProvider>{children}</MockGameProvider>
    : <LiveGameProvider>{children}</LiveGameProvider>
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame must be used inside <GameProvider>')
  return ctx
}
