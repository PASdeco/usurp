/**
 * Standalone replacements for Arc Studio sandbox-only helpers.
 * Values sourced from official Arc documentation — update here if they change.
 *
 * Replaces: @/onchain-facts (getUsdc, requireChain), @/onchain-money (Amount)
 *
 * Arc Mainnet  (chain 5042):    USDC 0x3600...0000, 6 dec, explorer.arc.io
 * Arc Testnet  (chain 5042002): USDC 0x3600...0000, 6 dec, explorer.testnet.arc.io
 *
 * buildTxExplorerUrl(txHash, chainId) — returns a link to the tx on the correct explorer.
 */

const IS_MAINNET = (import.meta.env.VITE_NETWORK ?? 'mainnet') === 'mainnet'

const ARC_USDC = '0x3600000000000000000000000000000000000000' as const
const ARC_DECIMALS = 6
const EXPLORER_BASE = IS_MAINNET
  ? 'https://explorer.arc.io'
  : 'https://explorer.testnet.arc.io'

/** Returns the USDC token info for the given chain ID. Matches Arc Studio onchain-facts API. */
export function getUsdc(_chainId?: number): { address: `0x${string}`; decimals: number } {
  return { address: ARC_USDC, decimals: ARC_DECIMALS }
}

/** Returns the USDC decimal count (always 6 on Arc). */
export function usdcDecimalsFor(_chainId?: number): number {
  return ARC_DECIMALS
}

/** Minimal Amount helper matching the Arc Studio onchain-money API surface used in this project. */
export class Amount {
  private value: number
  constructor(value: number) { this.value = value }

  static fromRaw(raw: bigint, decimals: number): Amount {
    return new Amount(Number(raw) / Math.pow(10, decimals))
  }

  toFixed(digits: number): string {
    return this.value.toFixed(digits)
  }

  valueOf(): number { return this.value }
  toString(): string { return String(this.value) }
}

/** Build an explorer URL for a transaction hash. */
export function buildTxExplorerUrl(hash: string, _chainId?: number): string {
  return `${EXPLORER_BASE}/tx/${hash}`
}

/** Build an explorer URL for an address. */
export function buildAddressExplorerUrl(address: string, _chainId?: number): string {
  return `${EXPLORER_BASE}/address/${address}`
}
