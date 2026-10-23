/**
 * USURP Header
 * – Logo (left)
 * – Network pill, nav links, theme toggle, WalletButton (right)
 * – Responsive: nav collapses on mobile
 */

import { useState } from 'react'
import { Logo } from './Logo'
import { WalletButton } from './WalletButton'
import { EffectsToggle } from './EffectsToggle'
import { IconSun, IconMoon, IconMenu } from './icons'
import { useTheme } from '../contexts/ThemeContext'

interface HeaderProps {
  onNavigate: (page: string) => void
  currentPage: string
}

export function Header({ onNavigate, currentPage }: HeaderProps) {
  const { theme, toggle } = useTheme()
  const [mobileOpen, setMobileOpen] = useState(false)

  const navLinks = [
    { id: 'how-it-works', label: 'How it works & fees' },
    { id: 'faq',          label: 'FAQ' },
    { id: 'disclaimer',   label: 'Disclaimer' },
  ]

  const NavLink = ({ id, label }: { id: string; label: string }) => (
    <button
      onClick={() => { onNavigate(id); setMobileOpen(false) }}
      style={{
        background: 'none',
        border: 'none',
        color: currentPage === id ? 'var(--gold-text)' : 'var(--ink-muted)',
        fontFamily: 'var(--font-body)',
        fontWeight: 700,
        fontSize: 14,
        cursor: 'pointer',
        padding: '4px 2px',
        borderBottom: currentPage === id ? '2px solid var(--gold)' : '2px solid transparent',
        transition: 'color 0.15s, border-color 0.15s',
        minHeight: 44,
        display: 'flex',
        alignItems: 'center',
        whiteSpace: 'nowrap',
      }}
      aria-current={currentPage === id ? 'page' : undefined}
    >
      {label}
    </button>
  )

  return (
    <header
      style={{
        borderBottom: '1px solid var(--border)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'var(--surface)',
        backdropFilter: 'blur(16px) saturate(160%)',
        WebkitBackdropFilter: 'blur(16px) saturate(160%)',
      }}
    >
      <div
        style={{
          maxWidth: 1240,
          margin: '0 auto',
          padding: '0 24px',
          height: 68,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 14,
        }}
      >
        {/* Logo */}
        <button
          onClick={() => onNavigate('home')}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
          }}
          aria-label="USURP – go to home"
        >
          <Logo crownSize={32} />
        </button>

        {/* Desktop nav */}
        <nav
          aria-label="Main navigation"
          style={{
            display: 'flex',
            gap: 16,
            alignItems: 'center',
            flexWrap: 'nowrap',
          }}
          className="hidden-mobile"
        >
          {/* Network pill */}
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              border: '1px solid var(--border)',
              borderRadius: 999,
              padding: '7px 14px',
              color: 'var(--ink-muted)',
              fontSize: 13,
              fontWeight: 700,
              fontFamily: 'var(--font-body)',
              whiteSpace: 'nowrap',
            }}
            aria-label={`Connected to ${import.meta.env.VITE_NETWORK === 'mainnet' ? 'Arc Mainnet' : 'Arc Testnet'}, using USDC`}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: 'var(--ok)',
                flexShrink: 0,
              }}
              aria-hidden="true"
            />
            {import.meta.env.VITE_NETWORK === 'mainnet' ? 'Arc' : 'Arc Testnet'} · USDC
          </span>

          {navLinks.map(l => <NavLink key={l.id} id={l.id} label={l.label} />)}

          {/* Theme toggle */}
          <button
            onClick={toggle}
            style={{
              background: 'none',
              border: '1.5px solid var(--border)',
              borderRadius: 10,
              padding: '9px',
              color: 'var(--ink-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: 44,
              minHeight: 44,
              transition: 'border-color 0.15s, color 0.15s',
              flexShrink: 0,
            }}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <IconSun size={17} /> : <IconMoon size={17} />}
          </button>

          {/* Effects toggle */}
          <EffectsToggle />

          {/* Live wallet button */}
          <WalletButton />
        </nav>

        {/* Mobile: right-side controls */}
        <div
          style={{ display: 'flex', gap: 10, alignItems: 'center' }}
          className="mobile-only"
        >
          <button
            onClick={toggle}
            style={{
              background: 'none',
              border: '1.5px solid var(--border)',
              borderRadius: 10,
              padding: 9,
              color: 'var(--ink-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: 44,
              minHeight: 44,
            }}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <IconSun size={17} /> : <IconMoon size={17} />}
          </button>

          <button
            onClick={() => setMobileOpen(o => !o)}
            style={{
              background: 'none',
              border: '1.5px solid var(--border)',
              borderRadius: 10,
              padding: 9,
              color: 'var(--ink-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: 44,
              minHeight: 44,
            }}
            aria-label="Open navigation menu"
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
          >
            <IconMenu size={18} />
          </button>
        </div>
      </div>

      {/* Mobile dropdown nav */}
      {mobileOpen && (
        <nav
          id="mobile-nav"
          aria-label="Mobile navigation"
          style={{
            borderTop: '1px solid var(--border)',
            padding: '12px 24px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            background: 'var(--surface)',
          }}
        >
          {/* Network pill */}
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              border: '1px solid var(--border)',
              borderRadius: 999,
              padding: '7px 14px',
              color: 'var(--ink-muted)',
              fontSize: 13,
              fontWeight: 700,
              marginBottom: 8,
              alignSelf: 'flex-start',
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--ok)' }} aria-hidden="true" />
            {import.meta.env.VITE_NETWORK === 'mainnet' ? 'Arc' : 'Arc Testnet'} · USDC
          </span>

          {navLinks.map(l => (
            <button
              key={l.id}
              onClick={() => { onNavigate(l.id); setMobileOpen(false) }}
              style={{
                background: 'none',
                border: 'none',
                color: currentPage === l.id ? 'var(--gold-text)' : 'var(--ink)',
                fontFamily: 'var(--font-body)',
                fontWeight: 700,
                fontSize: 15,
                cursor: 'pointer',
                textAlign: 'left',
                padding: '11px 0',
                borderBottom: '1px solid var(--border)',
                minHeight: 44,
              }}
            >
              {l.label}
            </button>
          ))}

          {/* Wallet button in mobile menu */}
          <div style={{ marginTop: 12 }}>
            <WalletButton />
          </div>
        </nav>
      )}
    </header>
  )
}
