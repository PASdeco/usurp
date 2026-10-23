/**
 * useSteal — two-step flow: approve USDC then call steal(maxPrice).
 *
 * Step 1: approve(usurpAddress, stealPriceRaw) on the USDC ERC-20
 * Step 2: steal(maxPrice) on the Usurp contract
 *
 * maxPrice = stealPriceRaw * 101 / 100 (1% slippage buffer).
 * Payments are ERC-20 transferFrom — NOT msg.value (Arc rule).
 */

import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { useState, useCallback } from 'react'
import { erc20Abi } from 'viem'
import { toast } from 'sonner'
import { CHAIN_ID } from '../config'
import { USURP_ADDRESS, USURP_ABI } from '../lib/contract'
import { getUsdc, buildTxExplorerUrl } from '../onchain-facts'
import { parseUsurpError } from './useWallet'

const usdcFact = getUsdc(CHAIN_ID)
const USDC_ADDRESS = usdcFact?.address as `0x${string}`

export type StealStep = 'idle' | 'approving' | 'stealing' | 'confirming' | 'success' | 'error'

export interface UseStealReturn {
  step: StealStep
  steal: (stealPriceRaw: bigint, address: `0x${string}`, currentAllowance: bigint) => void
  isLoading: boolean
  txHash: `0x${string}` | undefined
  reset: () => void
}

export function useSteal(onSuccess?: () => void): UseStealReturn {
  const [step, setStep] = useState<StealStep>('idle')

  // ── Approve write ─────────────────────────────────────────────────────────
  const { writeContractAsync: approveAsync } = useWriteContract()

  // ── Steal write ───────────────────────────────────────────────────────────
  const {
    writeContractAsync: stealAsync,
    data: stealTxHash,
  } = useWriteContract()

  useWaitForTransactionReceipt({ hash: stealTxHash })

  // ── Main entry point — fully async, no effect chains ─────────────────────
  const steal = useCallback(async (
    stealPriceRaw: bigint,
    _address: `0x${string}`,
    currentAllowance: bigint,
  ) => {
    try {
      // Step 1: approve if needed
      if (currentAllowance < stealPriceRaw) {
        setStep('approving')
        await approveAsync({
          address: USDC_ADDRESS,
          abi: erc20Abi,
          functionName: 'approve',
          args: [USURP_ADDRESS, stealPriceRaw],
          chainId: CHAIN_ID,
        })
      }

      // Step 2: steal
      const maxPrice = (stealPriceRaw * 101n) / 100n
      setStep('stealing')
      const txHash = await stealAsync({
        address: USURP_ADDRESS,
        abi: USURP_ABI,
        functionName: 'steal',
        args: [maxPrice],
        chainId: CHAIN_ID,
      })

      setStep('confirming')
      toast.success('Crown stolen!', {
        description: (
          <a
            href={buildTxExplorerUrl(CHAIN_ID, txHash)}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--gold-text)' }}
          >
            View on explorer
          </a>
        ) as unknown as string,
        duration: 6000,
      })
      setStep('success')
      onSuccess?.()
      setTimeout(() => setStep('idle'), 4000)
    } catch (err: unknown) {
      const parsed = parseUsurpError(err)
      if (!parsed.isUserRejection) toast.error(parsed.message)
      setStep('idle')
    }
  }, [approveAsync, stealAsync, onSuccess])

  const stealSync = useCallback(
    (stealPriceRaw: bigint, address: `0x${string}`, currentAllowance: bigint) => {
      void steal(stealPriceRaw, address, currentAllowance)
    },
    [steal],
  )

  const reset = useCallback(() => setStep('idle'), [])

  return {
    step,
    steal: stealSync,
    isLoading: step !== 'idle' && step !== 'success' && step !== 'error',
    txHash: stealTxHash,
    reset,
  }
}
