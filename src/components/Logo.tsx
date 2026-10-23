/**
 * USURP Logo components
 *
 * CrownMark  — the crown SVG only (favicon, wallet modal, avatars)
 * Logo       — crown + "USURP" wordmark, picks variant by theme
 *
 * Dark variant: gold gradient crown, no outline (matches usurp-logo-on-dark.png)
 * Light variant: deeper gold crown with 2.5px dark outline (matches usurp-logo-light.png)
 */

import { useTheme } from '../contexts/ThemeContext'

// ─── Shared crown path ────────────────────────────────────────────────────────
// Points derived from the uploaded PNG:
//  – Five-point crown silhouette
//  – Rounded band at the base
// Viewport: 0 0 64 56

interface CrownMarkProps {
  /** px size of the crown SVG (width; height is proportional) */
  size?: number
  /** Override theme detection (e.g. for favicon which is always dark) */
  variant?: 'dark' | 'light'
  className?: string
  role?: string
  'aria-label'?: string
  'aria-hidden'?: boolean
}

export function CrownMark({
  size = 40,
  variant,
  className,
  role = 'img',
  'aria-label': ariaLabel = 'USURP crown',
  'aria-hidden': ariaHidden,
}: CrownMarkProps) {
  const { theme } = useTheme()
  const v = variant ?? theme
  const w = size
  const h = Math.round(size * (56 / 64))

  if (v === 'light') {
    // Light: deeper gold gradient + dark outline (paint-order trick: stroke behind fill)
    return (
      <svg
        width={w}
        height={h}
        viewBox="0 0 64 56"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        role={role}
        aria-label={ariaLabel}
        aria-hidden={ariaHidden}
      >
        <defs>
          <linearGradient id="crown-grad-light" x1="32" y1="4" x2="32" y2="54" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#F0B429" />
            <stop offset="100%" stopColor="#8A5A00" />
          </linearGradient>
        </defs>
        {/* Outline layer (dark stroke painted first via paint-order) */}
        <path
          d="M8 44 L3 10 L19 25 L32 4 L45 25 L61 10 L56 44 Z"
          fill="url(#crown-grad-light)"
          stroke="#14111C"
          strokeWidth="4.5"
          strokeLinejoin="round"
          strokeLinecap="round"
          paintOrder="stroke fill"
        />
        <rect
          x="7"
          y="47"
          width="50"
          height="7"
          rx="3.5"
          fill="url(#crown-grad-light)"
          stroke="#14111C"
          strokeWidth="4.5"
          paintOrder="stroke fill"
        />
      </svg>
    )
  }

  // Dark: warm gold gradient, no outline
  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 64 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role={role}
      aria-label={ariaLabel}
      aria-hidden={ariaHidden}
    >
      <defs>
        <linearGradient id="crown-grad-dark" x1="32" y1="4" x2="32" y2="54" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFE08A" />
          <stop offset="100%" stopColor="#B8801F" />
        </linearGradient>
      </defs>
      <path
        d="M8 44 L3 10 L19 25 L32 4 L45 25 L61 10 L56 44 Z"
        fill="url(#crown-grad-dark)"
      />
      <rect
        x="7"
        y="47"
        width="50"
        height="7"
        rx="3.5"
        fill="url(#crown-grad-dark)"
      />
    </svg>
  )
}

// ─── Hero crown (larger, with drop-shadow glow) ────────────────────────────────

interface HeroCrownProps {
  size?: number
  className?: string
}

export function HeroCrown({ size = 132, className }: HeroCrownProps) {
  const { theme } = useTheme()
  const w = size
  const h = Math.round(size * (56 / 64))

  if (theme === 'light') {
    return (
      <svg
        width={w}
        height={h}
        viewBox="0 0 64 56"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        role="img"
        aria-label="The crown"
      >
        <defs>
          <linearGradient id="hero-crown-light" x1="32" y1="4" x2="32" y2="54" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#F0B429" />
            <stop offset="100%" stopColor="#8A5A00" />
          </linearGradient>
          <filter id="hero-glow-light" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        <path
          d="M8 44 L3 10 L19 25 L32 4 L45 25 L61 10 L56 44 Z"
          fill="url(#hero-crown-light)"
          stroke="#14111C"
          strokeWidth="4.5"
          strokeLinejoin="round"
          strokeLinecap="round"
          paintOrder="stroke fill"
          filter="url(#hero-glow-light)"
        />
        <rect
          x="7"
          y="47"
          width="50"
          height="7"
          rx="3.5"
          fill="url(#hero-crown-light)"
          stroke="#14111C"
          strokeWidth="4.5"
          paintOrder="stroke fill"
        />
      </svg>
    )
  }

  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 64 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="The crown"
    >
      <defs>
        <linearGradient id="hero-crown-dark" x1="32" y1="4" x2="32" y2="54" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFE08A" />
          <stop offset="100%" stopColor="#B8801F" />
        </linearGradient>
        <filter id="hero-glow-dark" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path
        d="M8 44 L3 10 L19 25 L32 4 L45 25 L61 10 L56 44 Z"
        fill="url(#hero-crown-dark)"
        filter="url(#hero-glow-dark)"
      />
      <rect
        x="7"
        y="47"
        width="50"
        height="7"
        rx="3.5"
        fill="url(#hero-crown-dark)"
      />
    </svg>
  )
}

// ─── Full Logo (mark + wordmark) ───────────────────────────────────────────────

interface LogoProps {
  /** Mark-only: omit the wordmark */
  markOnly?: boolean
  /** Crown size in px (wordmark scales proportionally) */
  crownSize?: number
  className?: string
  variant?: 'dark' | 'light'
}

export function Logo({ markOnly = false, crownSize = 34, className, variant }: LogoProps) {
  const { theme } = useTheme()
  const v = variant ?? theme
  const wordmarkColor = v === 'dark' ? '#F4EFE6' : '#14111C'

  if (markOnly) {
    return <CrownMark size={crownSize} variant={v} className={className} aria-hidden />
  }

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        fontFamily: "'Big Shoulders Display', sans-serif",
        fontWeight: 900,
        fontSize: crownSize + 'px',
        letterSpacing: '0.04em',
        color: wordmarkColor,
        userSelect: 'none',
        textDecoration: 'none',
      }}
      aria-label="USURP"
    >
      <CrownMark size={crownSize} variant={v} aria-hidden />
      <span>USURP</span>
    </div>
  )
}
