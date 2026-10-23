/**
 * EffectsToggle — compact header button toggling visual effects on/off.
 * Shows a spark/zap icon when on, a crossed-out variant when off.
 * Always visible (users without prefers-reduced-motion may still want to disable).
 */

import { useEffectsCtx } from '../contexts/EffectsContext'
import { IconZap } from './icons'

export function EffectsToggle() {
  const { effectsOn, toggle } = useEffectsCtx()

  return (
    <button
      onClick={toggle}
      title={effectsOn ? 'Disable effects' : 'Enable effects'}
      aria-label={effectsOn ? 'Effects on — click to disable' : 'Effects off — click to enable'}
      aria-pressed={effectsOn}
      style={{
        background: 'transparent',
        border: '1.5px solid var(--border)',
        borderRadius: 10,
        width: 44,
        height: 44,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        color: effectsOn ? 'var(--gold)' : 'var(--ink-muted)',
        transition: 'color 0.15s, border-color 0.15s',
        flexShrink: 0,
        position: 'relative',
      }}
    >
      <IconZap size={18} />
      {/* Strikethrough line when off */}
      {!effectsOn && (
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <svg width="44" height="44" viewBox="0 0 44 44" aria-hidden="true">
            <line x1="10" y1="10" x2="34" y2="34" stroke="var(--ink-muted)" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </span>
      )}
    </button>
  )
}
