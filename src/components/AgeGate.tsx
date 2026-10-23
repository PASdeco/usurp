/**
 * Age Gate modal
 * Shown on first visit. Requires the user to confirm:
 *  – 18+ years old
 *  – Not in a restricted region
 *  – Understands this uses test funds (testnet)
 *
 * Persisted to localStorage. Focus-trapped. Keyboard accessible.
 */

import { useEffect, useRef } from 'react'
import { CrownMark } from './Logo'
import { IconShield } from './icons'

const STORAGE_KEY = 'usurp-age-gate-v1'

export function useAgeGate(): [boolean, () => void] {
  const passed = (() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === '1'
    } catch {
      return false
    }
  })()

  const accept = () => {
    try {
      localStorage.setItem(STORAGE_KEY, '1')
    } catch {
      // ignore
    }
  }

  return [passed, accept]
}

interface AgeGateProps {
  onAccept: () => void
}

export function AgeGate({ onAccept }: AgeGateProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const acceptBtnRef = useRef<HTMLButtonElement>(null)

  // Focus the accept button on mount
  useEffect(() => {
    acceptBtnRef.current?.focus()
  }, [])

  // Focus trap
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const focusable = el.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const first = focusable[0]
    const last  = focusable[focusable.length - 1]

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last?.focus()
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault()
          first?.focus()
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    /* Backdrop */
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="age-gate-title"
      aria-describedby="age-gate-desc"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        background: 'rgba(7,6,11,0.88)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        ref={containerRef}
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border-strong)',
          borderRadius: 24,
          padding: '40px 32px',
          maxWidth: 440,
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 8px 64px rgba(0,0,0,0.5)',
          animation: 'slide-up 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards',
        }}
      >
        {/* Crown mark */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
          <CrownMark size={56} aria-hidden />
        </div>

        <h1
          id="age-gate-title"
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 900,
            fontSize: 32,
            letterSpacing: '0.04em',
            color: 'var(--ink)',
            margin: '0 0 10px',
          }}
        >
          USURP
        </h1>

        <p
          id="age-gate-desc"
          style={{
            color: 'var(--ink-muted)',
            fontSize: 15,
            margin: '0 0 28px',
            lineHeight: 1.6,
          }}
        >
          A real-time game on Arc Testnet. Test funds only — no real money is at stake.
        </p>

        {/* Checklist */}
        <ul
          style={{
            listStyle: 'none',
            padding: 0,
            margin: '0 0 32px',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            textAlign: 'left',
          }}
        >
          {[
            'I am at least 18 years old',
            'I am not in a jurisdiction where this is restricted',
            'I understand this runs on Arc Testnet with test funds only',
            'I understand this is an experiment and I play at my own risk',
          ].map((item, i) => (
            <li
              key={i}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                fontSize: 14,
                color: 'var(--ink)',
              }}
            >
              <IconShield
                size={16}
                style={{ color: 'var(--gold)', marginTop: 2, flexShrink: 0 }}
              />
              {item}
            </li>
          ))}
        </ul>

        <button
          ref={acceptBtnRef}
          onClick={onAccept}
          style={{
            width: '100%',
            background: 'var(--ruby)',
            color: 'var(--ruby-ink)',
            border: 'none',
            borderRadius: 14,
            padding: '18px 24px',
            fontFamily: 'var(--font-display)',
            fontWeight: 900,
            fontSize: 22,
            letterSpacing: '0.06em',
            cursor: 'pointer',
            minHeight: 60,
          }}
          className="ruby-glow"
        >
          I UNDERSTAND — ENTER
        </button>

        <p
          style={{
            marginTop: 16,
            fontSize: 12,
            color: 'var(--ink-muted)',
            lineHeight: 1.5,
          }}
        >
          By entering you accept the{' '}
          <span style={{ color: 'var(--gold-text)', cursor: 'pointer' }}>Terms</span>{' '}
          and{' '}
          <span style={{ color: 'var(--gold-text)', cursor: 'pointer' }}>Disclaimer</span>.
        </p>
      </div>
    </div>
  )
}
