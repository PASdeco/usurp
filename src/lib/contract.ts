/**
 * USURP contract address + full ABI for the frontend.
 *
 * Mainnet:  0xC47cc87cb5fe4EDAe581064045A79074264bC415  (Arc Mainnet, chain 5042)
 * Testnet:  0x5B16a6fd5a2f14D0c4D671bB5A14f9044fdE89e5  (Arc Testnet, chain 5042002)
 *
 * Active address is resolved from VITE_NETWORK env var at build time.
 * ABI is the full contract surface — generated from forge build output.
 */

const IS_MAINNET = import.meta.env.VITE_NETWORK === 'mainnet'

export const USURP_ADDRESS: `0x${string}` = IS_MAINNET
  ? ((import.meta.env.VITE_MAINNET_CONTRACT_ADDRESS as `0x${string}` | undefined)
      ?? '0xC47cc87cb5fe4EDAe581064045A79074264bC415')
  : ((import.meta.env.VITE_CONTRACT_ADDRESS as `0x${string}` | undefined)
      ?? '0x5B16a6fd5a2f14D0c4D671bB5A14f9044fdE89e5')

export const USDC_ADDRESS: `0x${string}` = '0x3600000000000000000000000000000000000000'

// ─── Minimal ABI (functions + events the UI calls) ───────────────────────────

export const USURP_ABI = [
  // ── Views ──────────────────────────────────────────────────────────────────
  {
    name: 'getState',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'holder',           type: 'address' },
          { name: 'currentPrice',     type: 'uint256' },
          { name: 'pot',              type: 'uint256' },
          { name: 'lastStealTime',    type: 'uint256' },
          { name: 'holderStealPrice', type: 'uint256' },
          { name: 'accrualStart',     type: 'uint256' },
          { name: 'round',            type: 'uint256' },
          { name: 'feeAddress',       type: 'address' },
          { name: 'feeAccrued',       type: 'uint256' },
          { name: 'paused',           type: 'bool'    },
          { name: 'potEmptySince',    type: 'uint256' },
          { name: 'authorizedCaller', type: 'address' },
          { name: 'potHealthValue',   type: 'uint8'   },
        ],
      },
    ],
  },
  {
    name: 'earnedSoFar',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'addr', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'nextDripAt',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'breakEvenAt',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'potHealth',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
  },
  {
    name: 'currentPrice',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'pending',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'paused',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'bool' }],
  },
  // ── Writes ─────────────────────────────────────────────────────────────────
  {
    name: 'steal',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'maxPrice', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'claim',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
  {
    name: 'reset',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
  {
    name: 'seedPot',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'amount', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'withdrawFees',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
  {
    name: 'pause',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
  {
    name: 'unpause',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
  // ── Admin writes ───────────────────────────────────────────────────────────
  {
    name: 'setFeeAddress',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'newFeeAddress', type: 'address' }],
    outputs: [],
  },
  {
    name: 'applyFeeAddress',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
  {
    name: 'setMinHoldBeforeSteal',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'newValue', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'applyMinHoldBeforeSteal',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
  {
    name: 'setPotLowThresholdIntervals',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'newValue', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'applyPotLowThresholdIntervals',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
  // ── Admin views ────────────────────────────────────────────────────────────
  {
    name: 'owner',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    name: 'feeAddress',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    name: 'feeAccrued',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'pot',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'minHoldBeforeSteal',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'potLowThresholdIntervals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'pendingFeeAddress',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: 'value', type: 'uint256' }, { name: 'effectiveAt', type: 'uint256' }],
  },
  {
    name: 'pendingMinHold',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: 'value', type: 'uint256' }, { name: 'effectiveAt', type: 'uint256' }],
  },
  {
    name: 'pendingPotLowThreshold',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: 'value', type: 'uint256' }, { name: 'effectiveAt', type: 'uint256' }],
  },
  {
    name: 'pendingOwner',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  },
  // ── Events ─────────────────────────────────────────────────────────────────
  {
    name: 'Stolen',
    type: 'event',
    inputs: [
      { name: 'newHolder',  type: 'address', indexed: true  },
      { name: 'prevHolder', type: 'address', indexed: true  },
      { name: 'pricePaid',  type: 'uint256', indexed: false },
      { name: 'nextPrice',  type: 'uint256', indexed: false },
      { name: 'round',      type: 'uint256', indexed: false },
    ],
  },
  {
    name: 'Claimed',
    type: 'event',
    inputs: [
      { name: 'holder', type: 'address', indexed: true  },
      { name: 'amount', type: 'uint256', indexed: false },
    ],
  },
  {
    name: 'RoundReset',
    type: 'event',
    inputs: [
      { name: 'round',     type: 'uint256', indexed: true  },
      { name: 'timestamp', type: 'uint256', indexed: false },
    ],
  },
] as const
