/**
 * useConfetti — fires a one-time canvas-confetti burst if effects are on.
 * Returns a stable `fire()` callback safe to pass as a dependency.
 */

import { useCallback } from 'react'
import confetti from 'canvas-confetti'
import { useEffectsCtx } from '../contexts/EffectsContext'

export function useConfetti() {
  const { effectsOn } = useEffectsCtx()

  const fire = useCallback(() => {
    if (!effectsOn) return
    void confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.5 },
      colors: ['#F5C451', '#FFE08A', '#B8801F', '#FFFFFF', '#D91E48'],
      gravity: 0.9,
      ticks: 200,
      startVelocity: 35,
    })
  }, [effectsOn])

  return { fire }
}
