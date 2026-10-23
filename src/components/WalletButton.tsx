/**
 * WalletButton — custom ConnectKit trigger for the USURP header.
 *
 * Disconnected: gold-bordered "Connect wallet" button → opens ConnectKit modal.
 * Connected:    glass pill showing truncated address + USDC balance + copy + disconnect.
 */

import { useState, useCallback } from 'react'
import { ConnectKitButton } from 'connectkit'
import { useDisconnect } from 'wagmi'
import { IconCopy, IconSuccess, IconWallet } from './icons'
import { useWallet } from '../hooks/useWallet'

export function WalletButton() {
  const { address, shortAddress, isConnected, isWrongChain, formattedBalance } = useWallet()
  const { disconnect } = useDisconnect()
  const [copied, setCopied] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  const copyAddress = useCallback(async () => {
    if (!address) return
    await navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }, [address])

  return (
    <ConnectKitButton.Custom>
      {({ isConnected: ckConnected, show }) => {
        if (!ckConnected || !isConnected) {
          return (
            <button
              onClick={show}
              style={{
                background: 'transparent',
                color: 'var(--ink)',
                border: '1.5px solid var(--gold)',
                borderRadius: 10,
                padding: '10px 20px',
                fontFamily: 'var(--font-body)',
                fontWeight: 800,
                fontSize: 14,
                cursor: 'pointer',
                minHeight: 44,
                transition: 'background 0.15s, color 0.15s',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: 7,
              }}
              aria-label="Connect your wallet"
            >
              <IconWallet size={15} aria-hidden="true" />
              Connect wallet
            </button>
          )
        }

        // Connected state
        return (
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowMenu(o => !o)}
              aria-expanded={showMenu}
              aria-haspopup="menu"
              aria-label={`Wallet connected: ${address}. USDC balance: ${formattedBalance}. Click to manage.`}
              style={{
                background: isWrongChain ? 'rgba(255,107,122,0.12)' : 'var(--surface-2)',
                border: `1.5px solid ${isWrongChain ? 'var(--empty)' : 'var(--border-strong)'}`,
                borderRadius: 10,
                padding: '8px 14px',
                fontFamily: 'var(--font-body)',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
                minHeight: 44,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                color: 'var(--ink)',
                transition: 'border-color 0.15s',
              }}
            >
              {/* Status dot */}
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: isWrongChain ? 'var(--empty)' : 'var(--ok)',
                  flexShrink: 0,
                }}
                aria-hidden="true"
              />
              {/* Address */}
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                {shortAddress}
              </span>
              {/* Divider */}
              <span style={{ color: 'var(--border-strong)' }}>·</span>
              {/* USDC balance */}
              <span style={{ color: 'var(--gold-text)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                {formattedBalance}
              </span>
            </button>

            {/* Dropdown menu */}
            {showMenu && (
              <>
                {/* Backdrop */}
                <div
                  style={{ position: 'fixed', inset: 0, zIndex: 98 }}
                  onClick={() => setShowMenu(false)}
                  aria-hidden="true"
                />
                <div
                  role="menu"
                  aria-label="Wallet options"
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 14,
                    padding: '8px',
                    minWidth: 220,
                    zIndex: 99,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.32)',
                  }}
                >
                  {/* Full address row */}
                  <div
                    style={{
                      padding: '8px 10px 4px',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11,
                      color: 'var(--ink-muted)',
                      wordBreak: 'break-all',
                    }}
                  >
                    {address}
                  </div>

                  {/* Copy */}
                  <button
                    role="menuitem"
                    onClick={() => { void copyAddress(); setShowMenu(false) }}
                    style={menuItemStyle}
                    aria-label="Copy wallet address"
                  >
                    {copied
                      ? <IconSuccess size={15} aria-hidden="true" />
                      : <IconCopy size={15} aria-hidden="true" />}
                    {copied ? 'Copied!' : 'Copy address'}
                  </button>

                  {/* USDC balance line */}
                  <div
                    style={{
                      padding: '6px 10px',
                      fontSize: 13,
                      color: 'var(--ink-muted)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      borderTop: '1px solid var(--border)',
                      marginTop: 4,
                    }}
                  >
                    <span>USDC balance</span>
                    <span style={{ color: 'var(--gold-text)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                      {formattedBalance}
                    </span>
                  </div>

                  {/* Faucet hint if low balance */}
                  <div
                    style={{
                      padding: '4px 10px 8px',
                      fontSize: 12,
                      color: 'var(--ink-muted)',
                      borderBottom: '1px solid var(--border)',
                    }}
                  >
                    Need test USDC?{' '}
                    <a
                      href="https://faucet.circle.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: 'var(--gold-text)' }}
                      onClick={() => setShowMenu(false)}
                    >
                      Get from faucet
                    </a>
                    {' '}or use the Arc Studio sidebar.
                  </div>

                  {/* Disconnect */}
                  <button
                    role="menuitem"
                    onClick={() => { disconnect(); setShowMenu(false) }}
                    style={{ ...menuItemStyle, color: 'var(--empty)', marginTop: 4 }}
                    aria-label="Disconnect wallet"
                  >
                    Disconnect
                  </button>
                </div>
              </>
            )}
          </div>
        )
      }}
    </ConnectKitButton.Custom>
  )
}

const menuItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  width: '100%',
  background: 'none',
  border: 'none',
  borderRadius: 8,
  padding: '9px 10px',
  fontFamily: 'var(--font-body)',
  fontWeight: 700,
  fontSize: 13,
  color: 'var(--ink)',
  cursor: 'pointer',
  textAlign: 'left',
  minHeight: 36,
  transition: 'background 0.12s',
}
