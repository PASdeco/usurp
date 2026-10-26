/**
 * useAdmin — reads contract admin state and exposes write actions.
 *
 * isAdmin: true when connected wallet is the contract owner OR feeAddress.
 * All write actions use wagmi writeContractAsync + toast feedback.
 * Never exposes private keys or seed phrases.
 */

import { useCallback } from 'react'
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseUnits, erc20Abi } from 'viem'
import { toast } from 'sonner'
import { CHAIN_ID } from '../config'
import { USURP_ADDRESS, USURP_ABI } from '../lib/contract'
import { useWallet } from './useWallet'
import { getUsdc } from '../onchain-shim'

const USDC_DECIMALS = 6
const REFETCH = 5_000

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PendingParam {
  value: bigint
  effectiveAt: bigint        // unix seconds
  effectiveAtMs: number      // unix ms
  readyToApply: boolean
}

export interface AdminState {
  isAdmin: boolean
  isFeeAddress: boolean
  isOwner: boolean
  ownerAddress: string
  feeAddress: string
  feeAccrued: bigint
  feeAccruedUsdc: number
  potBalance: bigint
  potBalanceUsdc: number
  minHoldBeforeSteal: bigint
  potLowThresholdIntervals: bigint
  pendingFeeAddress: PendingParam | null
  pendingMinHold: PendingParam | null
  pendingPotLowThreshold: PendingParam | null
  isLoading: boolean
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function rawToUsdc(raw: bigint): number {
  return Number(raw) / 10 ** USDC_DECIMALS
}

function parsePending(raw: readonly [bigint, bigint] | undefined): PendingParam | null {
  if (!raw) return null
  const [value, effectiveAt] = raw
  if (effectiveAt === 0n) return null
  const effectiveAtMs = Number(effectiveAt) * 1000
  return {
    value,
    effectiveAt,
    effectiveAtMs,
    readyToApply: Date.now() >= effectiveAtMs,
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAdmin() {
  const { address } = useWallet()
  const { writeContractAsync } = useWriteContract()

  // Reads
  const { data: owner, isLoading: l1 } = useReadContract({
    address: USURP_ADDRESS, abi: USURP_ABI, functionName: 'owner',
    chainId: CHAIN_ID, query: { refetchInterval: REFETCH, retry: 5, retryDelay: 2000 },
  })
  const { data: feeAddr, isLoading: l2 } = useReadContract({
    address: USURP_ADDRESS, abi: USURP_ABI, functionName: 'feeAddress',
    chainId: CHAIN_ID, query: { refetchInterval: REFETCH, retry: 5, retryDelay: 2000 },
  })
  const { data: feeAccruedRaw, isLoading: l3 } = useReadContract({
    address: USURP_ADDRESS, abi: USURP_ABI, functionName: 'feeAccrued',
    chainId: CHAIN_ID, query: { refetchInterval: REFETCH },
  })
  const { data: potRaw, isLoading: l4 } = useReadContract({
    address: USURP_ADDRESS, abi: USURP_ABI, functionName: 'pot',
    chainId: CHAIN_ID, query: { refetchInterval: REFETCH },
  })
  const { data: minHoldRaw } = useReadContract({
    address: USURP_ADDRESS, abi: USURP_ABI, functionName: 'minHoldBeforeSteal',
    chainId: CHAIN_ID, query: { refetchInterval: REFETCH },
  })
  const { data: potLowRaw } = useReadContract({
    address: USURP_ADDRESS, abi: USURP_ABI, functionName: 'potLowThresholdIntervals',
    chainId: CHAIN_ID, query: { refetchInterval: REFETCH },
  })
  const { data: pFeeAddr } = useReadContract({
    address: USURP_ADDRESS, abi: USURP_ABI, functionName: 'pendingFeeAddress',
    chainId: CHAIN_ID, query: { refetchInterval: REFETCH },
  })
  const { data: pMinHold } = useReadContract({
    address: USURP_ADDRESS, abi: USURP_ABI, functionName: 'pendingMinHold',
    chainId: CHAIN_ID, query: { refetchInterval: REFETCH },
  })
  const { data: pPotLow } = useReadContract({
    address: USURP_ADDRESS, abi: USURP_ABI, functionName: 'pendingPotLowThreshold',
    chainId: CHAIN_ID, query: { refetchInterval: REFETCH },
  })

  const ownerAddress = (owner as string | undefined) ?? ''
  const feeAddress   = (feeAddr as string | undefined) ?? ''
  const isOwner      = !!address && ownerAddress.toLowerCase() === address.toLowerCase()
  const isFeeAddress = !!address && feeAddress.toLowerCase() === address.toLowerCase()
  const isAdmin      = isOwner || isFeeAddress

  const adminState: AdminState = {
    isAdmin,
    isFeeAddress,
    isOwner,
    ownerAddress,
    feeAddress,
    feeAccrued: (feeAccruedRaw) ?? 0n,
    feeAccruedUsdc: rawToUsdc((feeAccruedRaw) ?? 0n),
    potBalance: (potRaw) ?? 0n,
    potBalanceUsdc: rawToUsdc((potRaw) ?? 0n),
    minHoldBeforeSteal: (minHoldRaw) ?? 0n,
    potLowThresholdIntervals: (potLowRaw) ?? 5n,
    pendingFeeAddress: parsePending(pFeeAddr),
    pendingMinHold: parsePending(pMinHold),
    pendingPotLowThreshold: parsePending(pPotLow),
    isLoading: l1 || l2 || l3 || l4,
  }

  // ── Write helpers ──────────────────────────────────────────────────────────

  const call = useCallback(async (
    functionName: string,
    args: readonly unknown[],
    label: string,
  ) => {
    try {
      const hash = await writeContractAsync({
        address: USURP_ADDRESS,
        abi: USURP_ABI,
        functionName: functionName as 'pause',
        args: (args as unknown) as readonly [],
        chainId: CHAIN_ID,
      })
      toast.success(`${label} submitted`, {
        description: `Tx: ${hash.slice(0, 10)}…`,
      })
      return hash
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Transaction failed'
      if (!msg.includes('User rejected')) {
        toast.error(`${label} failed`, { description: msg.slice(0, 80) })
      }
      throw err
    }
  }, [writeContractAsync])

  const withdrawFees = useCallback(
    () => call('withdrawFees', [], 'Withdraw fees'),
    [call],
  )

  const seedPot = useCallback(
    async (amountUsdc: string) => {
      const raw = parseUnits(amountUsdc, USDC_DECIMALS)
      const usdcAddress = getUsdc(CHAIN_ID)?.address as `0x${string}` | undefined
      if (!usdcAddress) { toast.error('USDC address not found for this chain'); return }
      // Step 1: approve the contract to pull the USDC
      toast.info('Step 1 of 2: Approve USDC spend…')
      await writeContractAsync({
        address: usdcAddress,
        abi: erc20Abi,
        functionName: 'approve',
        args: [USURP_ADDRESS, raw],
        chainId: CHAIN_ID,
      })
      // Step 2: call seedPot
      toast.info('Step 2 of 2: Seeding the pot…')
      return call('seedPot', [raw], `Pot seeded +$${amountUsdc} USDC`)
    },
    [call, writeContractAsync],
  )

  const scheduleFeeAddress = useCallback(
    (addr: string) => call('setFeeAddress', [addr], 'Schedule fee address change'),
    [call],
  )
  const applyFeeAddress = useCallback(
    () => call('applyFeeAddress', [], 'Apply fee address'),
    [call],
  )

  const scheduleMinHold = useCallback(
    (seconds: string) => call('setMinHoldBeforeSteal', [BigInt(seconds)], 'Schedule min-hold change'),
    [call],
  )
  const applyMinHold = useCallback(
    () => call('applyMinHoldBeforeSteal', [], 'Apply min-hold'),
    [call],
  )

  const schedulePotLow = useCallback(
    (intervals: string) => call('setPotLowThresholdIntervals', [BigInt(intervals)], 'Schedule pot-low threshold change'),
    [call],
  )
  const applyPotLow = useCallback(
    () => call('applyPotLowThresholdIntervals', [], 'Apply pot-low threshold'),
    [call],
  )

  // Tx hash tracking (last write) for receipt polling
  const { data: lastHash } = useWriteContract()
  useWaitForTransactionReceipt({ hash: lastHash })

  return {
    adminState,
    withdrawFees,
    seedPot,
    scheduleFeeAddress,
    applyFeeAddress,
    scheduleMinHold,
    applyMinHold,
    schedulePotLow,
    applyPotLow,
  }
}
