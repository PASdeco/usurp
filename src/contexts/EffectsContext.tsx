/**
 * EffectsContext — provides effectsOn + toggle to the whole tree.
 * Wrap once near the root; consume with useEffectsCtx() anywhere.
 */

import { createContext, useContext, type ReactNode } from 'react'
import { useEffects } from '../hooks/useEffects'

interface EffectsContextValue {
  effectsOn: boolean
  toggle: () => void
  prefersReduced: boolean
}

const EffectsContext = createContext<EffectsContextValue | null>(null)

export function EffectsProvider({ children }: { children: ReactNode }) {
  const effects = useEffects()
  return <EffectsContext.Provider value={effects}>{children}</EffectsContext.Provider>
}

export function useEffectsCtx(): EffectsContextValue {
  const ctx = useContext(EffectsContext)
  if (!ctx) throw new Error('useEffectsCtx must be inside EffectsProvider')
  return ctx
}
