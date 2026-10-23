/**
 * WrongNetworkBanner
 * Shows a sticky banner when the wallet is connected to the wrong chain.
 * Offers a one-click "Switch to Arc Testnet" button.
 */

import { IconAlert } from './icons'
import { useWallet } from '../hooks/useWallet'

export function WrongNetworkBanner() {
  const { isConnected, isWrongChain, isSwitching, switchChain } = useWallet()

  if (!isConnected || !isWrongChain) return null

  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        background: 'var(--empty)',
        color: '#fff',
        padding: '10px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        fontSize: 14,
        fontWeight: 700,
        fontFamily: 'var(--font-body)',
        zIndex: 49,
        flexWrap: 'wrap',
      }}
    >
      <IconAlert size={16} aria-hidden="true" />
      <span>Your wallet is on the wrong network.</span>
      <button
        onClick={switchChain}
        disabled={isSwitching}
        style={{
          background: 'rgba(0,0,0,0.25)',
          color: '#fff',
          border: '1.5px solid rgba(255,255,255,0.5)',
          borderRadius: 8,
          padding: '5px 14px',
          fontFamily: 'var(--font-body)',
          fontWeight: 800,
          fontSize: 13,
          cursor: isSwitching ? 'wait' : 'pointer',
          minHeight: 32,
          whiteSpace: 'nowrap',
        }}
        aria-label={`Switch wallet to Arc ${import.meta.env.VITE_NETWORK === 'mainnet' ? 'Mainnet' : 'Testnet'}`}
      >
        {isSwitching ? 'Switching…' : `Switch to Arc ${import.meta.env.VITE_NETWORK === 'mainnet' ? 'Mainnet' : 'Testnet'}`}
      </button>
    </div>
  )
}
