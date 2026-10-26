/**
 * useGameState — reads live contract state and maps it to GameState.
 * Polls getState() + earnedSoFar() every 5 seconds via wagmi refetchInterval.
 *
 * Arc rule: amounts use the 6-decimal ERC-20 view. Never useBalance().
 * Chain: Arc Mainnet (5042) or Arc Testnet (5042002) via VITE_NETWORK env var.
 */

import { useReadContract } from 'wagmi'
import { useMemo } from 'react'
import { CHAIN_ID } from '../config'
import { USURP_ADDRESS, USURP_ABI } from '../lib/contract'
import { usdcDecimalsFor } from '../onchain-shim'
import { Amount } from '../onchain-shim'
import type { GameState, PotHealth } from '../lib/mock'

const USDC_DECIMALS = usdcDecimalsFor(CHAIN_ID)
const REFETCH_INTERVAL = 5_000
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

// ─── Pure helpers (no side effects) ──────────────────────────────────────────

function rawToUsdc(raw: bigint): number {
  return Number(Amount.fromRaw(raw, USDC_DECIMALS).toFixed(6))
}

function shortAddr(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

function calcBreakEvenPct(earned: number, stealPrice: number): number {
  if (stealPrice <= 0) return 0
  return Math.min(100, Math.round((earned / stealPrice) * 100))
}

function potHealthLabel(raw: number): PotHealth {
  if (raw === 2) return 'empty'
  if (raw === 1) return 'low'
  return 'healthy'
}

// ─── Extended GameState with raw fields ──────────────────────────────────────

export interface LiveGameState extends GameState {
  stealPriceRaw: bigint
  isLoading: boolean
  error: Error | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  refetch: () => void | Promise<any>
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useGameState(connectedAddress?: `0x${string}`): LiveGameState {
  const {
    data: rawState,
    isLoading,
    error: stateError,
    refetch,
  } = useReadContract({
    address: USURP_ADDRESS,
    abi: USURP_ABI,
    functionName: 'getState',
    chainId: CHAIN_ID,
    query: { refetchInterval: REFETCH_INTERVAL, staleTime: 2_000 },
  })

  const { data: earnedRaw } = useReadContract({
    address: USURP_ADDRESS,
    abi: USURP_ABI,
    functionName: 'earnedSoFar',
    args: connectedAddress ? [connectedAddress] : undefined,
    chainId: CHAIN_ID,
    query: {
      enabled: !!connectedAddress,
      refetchInterval: REFETCH_INTERVAL,
      staleTime: 2_000,
    },
  })

  return useMemo<LiveGameState>(() => {
    const FALLBACK_PRICE_RAW = BigInt(130_000)
    const FALLBACK_RESET_OFFSET = 3_600_000
    // Stable fallback — no Date.now() in memo (purity rule)
    const FALLBACK_TS = 0

    const loading = isLoading || !rawState

    const fallback: LiveGameState = {
      holder:          ZERO_ADDRESS,
      holderDisplay:   '—',
      stealPrice:      0.13,
      stealPriceRaw:   FALLBACK_PRICE_RAW,
      prevStealPrice:  0.13,
      potBalance:      0,
      pendingEarnings: 0,
      heldSince:       FALLBACK_TS,
      breakEvenPct:    0,
      roundSteals:     1,
      bestHoldMins:    0,
      streak:          0,
      potHealth:       'empty',
      paused:          false,
      resetAt:         FALLBACK_TS + FALLBACK_RESET_OFFSET,
      feed:            [],
      isLoading:       loading,
      error:           stateError,
      refetch,
    }

    if (loading || !rawState) return fallback

    const s = rawState

    const stealPriceRaw    = s.currentPrice
    const stealPrice       = rawToUsdc(stealPriceRaw)
    const holderStealPrice = rawToUsdc(s.holderStealPrice)
    const potBalance       = rawToUsdc(s.pot)
    const holder           = s.holder as string
    const hasHolder        = holder !== ZERO_ADDRESS

    const earnedUsdc = earnedRaw !== undefined ? rawToUsdc(earnedRaw) : 0
    const pendingEarnings = hasHolder ? earnedUsdc : 0

    const stealPriceForBreakEven = holderStealPrice > 0 ? holderStealPrice : stealPrice
    const breakEvenPct = calcBreakEvenPct(pendingEarnings, stealPriceForBreakEven)

    const heldSinceMs  = hasHolder ? Number(s.accrualStart) * 1000 : 0
    const lastStealMs  = Number(s.lastStealTime) * 1000
    const resetAt      = lastStealMs + 3_600_000

    const isMe = connectedAddress
      ? holder.toLowerCase() === connectedAddress.toLowerCase()
      : false

    const holderDisplay = !hasHolder
      ? 'No holder'
      : isMe
      ? 'You'
      : shortAddr(holder)

    return {
      holder,
      holderDisplay,
      stealPrice,
      stealPriceRaw,
      prevStealPrice: stealPrice,
      potBalance,
      pendingEarnings,
      heldSince:    heldSinceMs,
      breakEvenPct,
      roundSteals:  Number(s.round),
      bestHoldMins: 0,
      streak:       0,
      potHealth:    potHealthLabel(s.potHealthValue),
      paused:       s.paused,
      resetAt,
      feed:         [],
      isLoading:    false,
      error:        stateError,
      refetch,
    }
  }, [rawState, isLoading, stateError, earnedRaw, connectedAddress, refetch])
}
