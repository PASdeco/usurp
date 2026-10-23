/**
 * useWallet — central hook for USURP wallet state.
 * Provides: address, shortAddress, isConnected, isWrongChain,
 *           usdcBalance, formattedBalance, and parseUsurpError().
 */

import { useAccount, useReadContract, useSwitchChain } from 'wagmi'
import { erc20Abi } from 'viem'
import { useCallback } from 'react'
import { CHAIN_ID } from '../config'
import { getUsdc, buildTxExplorerUrl } from '../onchain-facts'
import { Amount, usdcDecimalsFor } from '../onchain-money'

const usdcFact = getUsdc(CHAIN_ID)
const USDC_ADDRESS = usdcFact?.address as `0x${string}` | undefined
const USDC_DECIMALS = usdcDecimalsFor(CHAIN_ID)

export function useWallet() {
  const { address, isConnected, chainId } = useAccount()
  const { switchChain, isPending: isSwitching } = useSwitchChain()

  const isWrongChain = isConnected && chainId !== CHAIN_ID

  // Read USDC ERC-20 balance — 6 decimal view (not native balance — Arc rule)
  const { data: rawBalance, isLoading: balanceLoading } = useReadContract({
    address:      USDC_ADDRESS,
    abi:          erc20Abi,
    functionName: 'balanceOf',
    args:         address ? [address] : undefined,
    chainId:      CHAIN_ID,
    query:        { enabled: !!address && !!USDC_ADDRESS },
  })

  const usdcBalance = rawBalance !== undefined
    ? Amount.fromRaw(rawBalance, USDC_DECIMALS)
    : undefined

  const formattedBalance = usdcBalance
    ? `$${usdcBalance.toFixed(2)}`
    : balanceLoading ? '…' : '$0.00'

  const shortAddress = address
    ? `${address.slice(0, 6)}…${address.slice(-4)}`
    : undefined

  const handleSwitchChain = useCallback(() => {
    switchChain({ chainId: CHAIN_ID })
  }, [switchChain])

  return {
    address,
    shortAddress,
    isConnected,
    isWrongChain,
    isSwitching,
    usdcBalance,
    formattedBalance,
    balanceLoading,
    switchChain: handleSwitchChain,
  }
}

// ─── Error parser ─────────────────────────────────────────────────────────────

export function parseUsurpError(error: unknown): { message: string; isUserRejection: boolean } {
  if (!error) return { message: 'Something went wrong.', isUserRejection: false }

  const msg = (error as { message?: string; shortMessage?: string })?.shortMessage
    ?? (error as { message?: string })?.message
    ?? (typeof error === 'object' ? JSON.stringify(error) : (error as string))

  const lower = msg.toLowerCase()

  // User cancelled — not an error, reset state silently
  if (lower.includes('user rejected') || lower.includes('user denied') ||
      (error as { code?: number })?.code === 4001) {
    return { message: 'Cancelled.', isUserRejection: true }
  }

  // Contract custom errors
  if (lower.includes('slippageexceeded') || lower.includes('slippage exceeded')) {
    return { message: 'The price just went up while you were signing. Review the new price and try again.', isUserRejection: false }
  }
  if (lower.includes('alreadyholder')) {
    return { message: "You're already the crown holder.", isUserRejection: false }
  }
  if (lower.includes('holdshieldactive')) {
    return { message: 'The crown was just stolen — wait a moment before stealing again.', isUserRejection: false }
  }
  if (lower.includes('nothingtoclaim')) {
    return { message: "Nothing to claim yet — keep holding to earn a drip.", isUserRejection: false }
  }
  if (lower.includes('resetnoteligible')) {
    return { message: "The round can't be reset yet — it's still active.", isUserRejection: false }
  }
  if (lower.includes('enforced pause') || lower.includes('pausable: paused')) {
    return { message: 'The game is currently paused. Claims are still available.', isUserRejection: false }
  }

  // Token / approval
  if (lower.includes('insufficient allowance') || lower.includes('erc20: insufficient allowance')) {
    return { message: 'USDC approval needed. Approve the contract to spend USDC and try again.', isUserRejection: false }
  }
  if (lower.includes('insufficient balance') || lower.includes('exceeds balance') ||
      lower.includes('transfer amount exceeds balance')) {
    return { message: "Insufficient USDC balance. Get test USDC from the faucet and try again.", isUserRejection: false }
  }

  // Network / RPC
  if (lower.includes('network') || lower.includes('timeout') || lower.includes('rpc')) {
    return { message: 'Network error. Check your connection and try again.', isUserRejection: false }
  }

  // Generic revert
  if (lower.includes('reverted')) {
    return { message: 'Transaction failed. The contract rejected it — check your USDC balance and try again.', isUserRejection: false }
  }

  return { message: 'Something went wrong. Please try again.', isUserRejection: false }
}

// Re-export for convenience
export { buildTxExplorerUrl }
