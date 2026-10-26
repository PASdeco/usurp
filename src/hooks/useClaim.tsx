/**
 * useClaim — calls claim() on the Usurp contract.
 * Available to any address with pending earnings (current holder or dethroned player).
 * No pause guard — claim is always callable regardless of game state.
 * Explorer links use buildTxExplorerUrl(hash, chainId) from onchain-shim.
 */

import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { CHAIN_ID } from '../config'
import { USURP_ADDRESS, USURP_ABI } from '../lib/contract'
import { buildTxExplorerUrl } from '../onchain-shim'
import { parseUsurpError } from './useWallet'

export type ClaimStep = 'idle' | 'confirming' | 'success' | 'error'

export interface UseClaimReturn {
  step: ClaimStep
  claim: () => void
  isLoading: boolean
  txHash: `0x${string}` | undefined
}

export function useClaim(onSuccess?: () => void): UseClaimReturn {
  const [step, setStep] = useState<ClaimStep>('idle')

  const { writeContractAsync, data: txHash } = useWriteContract()
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash: txHash })

  const claimAsync = useCallback(async () => {
    try {
      setStep('confirming')
      const hash = await writeContractAsync({
        address: USURP_ADDRESS,
        abi: USURP_ABI,
        functionName: 'claim',
        chainId: CHAIN_ID,
      })
      toast.success('Earnings claimed!', {
        description: (
          <a
            href={buildTxExplorerUrl(hash)}
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
  }, [writeContractAsync, onSuccess])

  const claim = useCallback(() => { void claimAsync() }, [claimAsync])

  return {
    step,
    claim,
    isLoading: step === 'confirming' || isConfirming,
    txHash,
  }
}
