/**
 * useBreakEvenMilestone — fires a one-time confetti burst and returns a
 * `showBanner` flag when the break-even ring crosses 100%.
 *
 * The banner auto-dismisses after 5 seconds.
 * Uses a ref to track "fired" so it only triggers once per hold.
 * resets when pct drops below 90 (new hold started).
 */

import { useEffect, useRef, useReducer } from 'react'

interface State {
  showBanner: boolean
  firedForHold: boolean
}

type Action =
  | { type: 'FIRE' }
  | { type: 'DISMISS' }
  | { type: 'RESET' }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'FIRE':    return { showBanner: true, firedForHold: true }
    case 'DISMISS': return { ...state, showBanner: false }
    case 'RESET':   return { showBanner: false, firedForHold: false }
    default:        return state
  }
}

export function useBreakEvenMilestone(
  pct: number,
  fireConfetti: () => void,
) {
  const [state, dispatch] = useReducer(reducer, { showBanner: false, firedForHold: false })
  const bannerTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Fire once when pct first hits 100
  const prevPctRef = useRef(pct)
  useEffect(() => {
    const prev = prevPctRef.current
    prevPctRef.current = pct

    if (pct >= 100 && !state.firedForHold) {
      dispatch({ type: 'FIRE' })
      fireConfetti()
      if (bannerTimer.current) clearTimeout(bannerTimer.current)
      bannerTimer.current = setTimeout(() => dispatch({ type: 'DISMISS' }), 5000)
    }

    // Reset when a new hold starts (pct drops back well below 100)
    if (pct < 90 && prev >= 90) {
      dispatch({ type: 'RESET' })
    }
  }, [pct, fireConfetti, state.firedForHold])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (bannerTimer.current) clearTimeout(bannerTimer.current)
    }
  }, [])

  return { showBanner: state.showBanner }
}
