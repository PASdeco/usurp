/**
 * useShake — returns a boolean `shaking` that goes true for 220ms
 * when trigger() is called, if effects are on.
 *
 * Apply the `data-shake` attribute or the `shake` CSS class to the element
 * you want to shake (see index.css @keyframes shake).
 */

import { useState, useCallback, useRef } from 'react'
import { useEffectsCtx } from '../contexts/EffectsContext'

export function useShake() {
  const { effectsOn } = useEffectsCtx()
  const [shaking, setShaking] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const trigger = useCallback(() => {
    if (!effectsOn) return
    if (timerRef.current) clearTimeout(timerRef.current)
    setShaking(true)
    timerRef.current = setTimeout(() => setShaking(false), 220)
  }, [effectsOn])

  return { shaking, trigger }
}
