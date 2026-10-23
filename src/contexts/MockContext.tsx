import { createContext, useContext, useState, type ReactNode } from 'react'
import {
  MOCK_MODE,
  DEFAULT_MOCK,
  MOCK_SCENARIOS,
  type GameState,
  type PotHealth,
} from '../lib/mock'

interface MockContextValue {
  mockMode: boolean
  gameState: GameState
  scenario: string
  setScenario: (s: string) => void
}

const MockContext = createContext<MockContextValue | null>(null)

export function MockProvider({ children }: { children: ReactNode }) {
  const [scenario, setScenario] = useState<string>('healthy')

  const gameState: GameState =
    MOCK_MODE ? (MOCK_SCENARIOS[scenario] ?? DEFAULT_MOCK) : DEFAULT_MOCK

  return (
    <MockContext.Provider value={{ mockMode: MOCK_MODE, gameState, scenario, setScenario }}>
      {children}
    </MockContext.Provider>
  )
}

export function useMock(): MockContextValue {
  const ctx = useContext(MockContext)
  if (!ctx) throw new Error('useMock must be used inside MockProvider')
  return ctx
}

export type { GameState, PotHealth }
