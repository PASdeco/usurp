/**
 * wagmi + ConnectKit configuration for USURP.
 *
 * VITE_NETWORK=mainnet  → Arc Mainnet (chain 5042, rpc.mainnet.arc.io)
 * VITE_NETWORK=testnet  → Arc Testnet (chain 5042002, rpc.testnet.arc.io) [default]
 *
 * Arc note: native currency is USDC (18 decimals in native view, 6 in ERC-20 view).
 * The CONTRACT uses the ERC-20 view (6 decimals). Never mix the two.
 */

import { createConfig, http } from 'wagmi'
import { mainnet } from 'wagmi/chains'
import { arcTestnet } from 'viem/chains'
import { defineChain } from 'viem'
import { getDefaultConfig } from 'connectkit'
import { registerChain } from './tracing'

// Arc Mainnet chain definition
export const arcMainnet = defineChain({
  id: 5042,
  name: 'Arc',
  nativeCurrency: { name: 'USD Coin', symbol: 'USDC', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.mainnet.arc.io'] },
  },
  blockExplorers: {
    default: { name: 'Arc Explorer', url: 'https://explorer.arc.io' },
  },
})

const IS_MAINNET = import.meta.env.VITE_NETWORK === 'mainnet'

export const CHAIN_ID    = IS_MAINNET ? arcMainnet.id : arcTestnet.id
export const TARGET_CHAIN = IS_MAINNET ? arcMainnet    : arcTestnet
export const IS_TESTNET  = !IS_MAINNET

// Pre-register chain RPC URLs so trace events show correct chain names
registerChain(arcTestnet.id,  arcTestnet.rpcUrls.default.http[0])
registerChain(arcMainnet.id,  arcMainnet.rpcUrls.default.http[0])

const walletConnectProjectId: string =
  (import.meta.env.VITE_WALLETCONNECT_PROJECT_ID as string | undefined) ?? 'usurp-dev-placeholder'

export const config = createConfig(
  getDefaultConfig({
    chains: [TARGET_CHAIN, mainnet],
    transports: {
      [arcTestnet.id]:  http('https://rpc.testnet.arc.io'),
      [arcMainnet.id]:  http('https://rpc.mainnet.arc.io'),
      [mainnet.id]:     http(),
    },
    walletConnectProjectId,
    appName:        'USURP',
    appDescription: 'One crown. One holder. Pay to steal it.',
    appUrl:         typeof window !== 'undefined' ? window.location.origin : 'https://usurp-arena.vercel.app',
    appIcon:        typeof window !== 'undefined' ? `${window.location.origin}/favicon.svg` : undefined,
  }),
)
