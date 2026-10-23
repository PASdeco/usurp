/**
 * Icon set for USURP.
 * All icons from lucide-react with consistent 1.75 stroke-width.
 * Re-exported with USURP-specific aliases where helpful.
 */

import {
  Crown,
  Wallet,
  Zap,
  Swords,
  Timer,
  Trophy,
  Flame,
  ShieldCheck,
  Info,
  Sun,
  Moon,
  ExternalLink,
  Copy,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Menu,
  History,
  Settings,
  Lock,
  ChevronRight,
  type LucideProps,
} from 'lucide-react'

export const ICON_STROKE = 1.75

// Convenience wrapper that applies the standard stroke
function icon(Icon: React.FC<LucideProps>) {
  return function UsurpIcon({ size = 18, className, style, ...rest }: LucideProps) {
    return (
      <Icon
        size={size}
        strokeWidth={ICON_STROKE}
        className={className}
        style={style}
        {...rest}
      />
    )
  }
}

export const IconCrown        = icon(Crown)
export const IconWallet       = icon(Wallet)
export const IconSteal        = icon(Zap)          // steal action
export const IconZap          = icon(Zap)          // generic zap (effects toggle)
export const IconRevenge      = icon(Swords)        // revenge / Arena
export const IconTimer        = icon(Timer)
export const IconTrophy       = icon(Trophy)
export const IconStreak       = icon(Flame)
export const IconShield       = icon(ShieldCheck)
export const IconInfo         = icon(Info)
export const IconSun          = icon(Sun)
export const IconMoon         = icon(Moon)
export const IconExternalLink = icon(ExternalLink)
export const IconCopy         = icon(Copy)
export const IconSuccess      = icon(CheckCircle2)
export const IconError        = icon(XCircle)
export const IconAlert        = icon(AlertTriangle)
export const IconLoader       = icon(Loader2)
export const IconMenu         = icon(Menu)
export const IconHistory      = icon(History)
export const IconSettings     = icon(Settings)
export const IconLock         = icon(Lock)
export const IconChevronRight = icon(ChevronRight)

// ─── Pot Health Chip ──────────────────────────────────────────────────────────

import type { PotHealth } from '../lib/mock'

const POT_CONFIG = {
  healthy: {
    Icon: IconSuccess,
    label: 'Healthy',
    color: 'var(--ok)',
    emptyLine: null,
  },
  low: {
    Icon: IconAlert,
    label: 'Low',
    color: 'var(--low)',
    emptyLine: null,
  },
  empty: {
    Icon: IconError,
    label: 'Empty',
    color: 'var(--empty)',
    emptyLine: 'Pot is empty. The next steal refills it.',
  },
} as const

interface PotHealthChipProps {
  health: PotHealth
  showEmptyLine?: boolean
}

export function PotHealthChip({ health, showEmptyLine = false }: PotHealthChipProps) {
  const { Icon, label, color, emptyLine } = POT_CONFIG[health]
  return (
    <span style={{ display: 'inline-flex', flexDirection: 'column', gap: 4 }}>
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          color,
          fontWeight: 800,
          fontSize: 14,
        }}
        role="status"
        aria-label={`Pot health: ${label}`}
      >
        <Icon size={16} style={{ color }} />
        {label}
      </span>
      {showEmptyLine && emptyLine && (
        <span
          style={{
            fontSize: 12,
            color: 'var(--ink-muted)',
            fontStyle: 'italic',
          }}
          aria-live="polite"
        >
          {emptyLine}
        </span>
      )}
    </span>
  )
}

// ─── Streak Squares ───────────────────────────────────────────────────────────

interface StreakSquaresProps {
  filled: number
  total?: number
}

export function StreakSquares({ filled, total = 7 }: StreakSquaresProps) {
  return (
    <span
      role="img"
      aria-label={`${filled} of ${total} days streak`}
      style={{ display: 'flex', gap: 8 }}
    >
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          aria-hidden="true"
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: i < filled ? 'var(--gold)' : 'transparent',
            border: i < filled ? 'none' : '2px solid var(--border)',
            boxSizing: 'border-box',
            display: 'inline-block',
          }}
        />
      ))}
    </span>
  )
}
