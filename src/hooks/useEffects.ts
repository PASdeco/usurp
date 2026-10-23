/**
 * useEffects — effects enabled/disabled preference.
 *
 * Sources of truth (in priority order):
 * 1. User toggle (persisted to localStorage)
 * 2. prefers-reduced-motion media query
 *
 * When prefers-reduced-motion: reduce is set, effects start OFF
 * and the toggle is still available for advanced users who want them.
 */

import { useState, useEffect, useCallback } from 'react'

const LS_KEY = 'usurp:effects'

function getPrefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function readPersistedEffects(): boolean | null {
  try {
    const v = localStorage.getItem(LS_KEY)
    if (v === 'true') return true
    if (v === 'false') return false
  } catch { /* ignore */ }
  return null
}

export function useEffects() {
  const [effectsOn, setEffectsOn] = useState<boolean>(() => {
    const persisted = readPersistedEffects()
    if (persisted !== null) return persisted
    return !getPrefersReducedMotion()
  })

  const [prefersReduced, setPrefersReduced] = useState<boolean>(getPrefersReducedMotion)

  // Track system preference changes
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handler = (e: MediaQueryListEvent) => {
      setPrefersReduced(e.matches)
      // If user hasn't explicitly overridden, follow the system
      const persisted = readPersistedEffects()
      if (persisted === null) {
        setEffectsOn(!e.matches)
      }
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const toggle = useCallback(() => {
    setEffectsOn(prev => {
      const next = !prev
      try { localStorage.setItem(LS_KEY, String(next)) } catch { /* ignore */ }
      return next
    })
  }, [])

  return { effectsOn, toggle, prefersReduced }
}
