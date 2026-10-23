/**
 * USURP — App root
 * Hash-based router: no dependency on react-router.
 * ThemeProvider and MockProvider wrap everything here.
 */

import { useState, useEffect } from 'react'
import { ThemeProvider } from './contexts/ThemeContext'
import { GameProvider } from './contexts/GameContext'
import { EffectsProvider } from './contexts/EffectsContext'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { WrongNetworkBanner } from './components/WrongNetworkBanner'
import { AgeGate, useAgeGate } from './components/AgeGate'
import { ErrorBoundary } from './components/ErrorBoundary'
import { ThroneScreen } from './components/ThroneScreen'
import { HowItWorksPage } from './pages/HowItWorksPage'
import { FaqPage } from './pages/FaqPage'
import { DisclaimerPage } from './pages/DisclaimerPage'
import { TermsPage } from './pages/TermsPage'
import { PrivacyPage } from './pages/PrivacyPage'
import { HistoryPage } from './pages/HistoryPage'
import { PlayerPage } from './pages/PlayerPage'
import { AdminPage } from './pages/AdminPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { RegionNotice } from './components/RegionNotice'

type Page = 'home' | 'how-it-works' | 'faq' | 'disclaimer' | 'terms' | 'privacy' | 'history' | 'player' | 'admin' | 'not-found'

const VALID_PAGES: Page[] = ['home', 'how-it-works', 'faq', 'disclaimer', 'terms', 'privacy', 'history', 'player', 'admin']

function readHash(): Page {
  const hash = window.location.hash.replace('#', '').replace(/^\//, '')
  if (!hash || hash === 'home') return 'home'
  // Player route: /p/0x...
  if (hash.startsWith('p/')) return 'player'
  if (VALID_PAGES.includes(hash as Page)) return hash as Page
  return 'not-found'
}

function readPlayerAddress(): string | undefined {
  const hash = window.location.hash.replace('#', '').replace(/^\//, '')
  if (hash.startsWith('p/')) return hash.slice(2)
  return undefined
}

function AppInner() {
  const [page, setPage] = useState<Page>(readHash)
  const [gatePassed, acceptGate] = useAgeGate()
  const [gateAccepted, setGateAccepted] = useState(gatePassed)

  // Sync hash on navigate
  const navigate = (p: string) => {
    const target = p === 'home' ? '' : p
    window.location.hash = target ? `/${target}` : ''
    setPage(VALID_PAGES.includes(p as Page) ? (p as Page) : 'not-found')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Listen to back/forward
  useEffect(() => {
    const handler = () => setPage(readHash())
    window.addEventListener('hashchange', handler)
    return () => window.removeEventListener('hashchange', handler)
  }, [])

  const handleAcceptGate = () => {
    acceptGate()
    setGateAccepted(true)
  }

  const renderPage = () => {
    switch (page) {
      case 'home':         return <ThroneScreen onNavigate={navigate} />
      case 'how-it-works': return <HowItWorksPage />
      case 'faq':          return <FaqPage />
      case 'disclaimer':   return <DisclaimerPage />
      case 'terms':        return <TermsPage />
      case 'privacy':      return <PrivacyPage />
      case 'history':      return <HistoryPage />
      case 'player':       return <PlayerPage address={readPlayerAddress()} onNavigate={navigate} />
      case 'admin':        return <AdminPage />
      default:             return <NotFoundPage onNavigate={navigate} />
    }
  }

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: 'var(--bg)',
        color: 'var(--ink)',
        fontFamily: 'var(--font-body)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Region block — checked first, overrides everything */}
      <RegionNotice />

      {/* Age gate — blocks everything until accepted */}
      {!gateAccepted && <AgeGate onAccept={handleAcceptGate} />}

      <Header onNavigate={navigate} currentPage={page} />
      <WrongNetworkBanner />

      <div style={{ flex: 1 }}>
        <ErrorBoundary>
          {renderPage()}
        </ErrorBoundary>
      </div>

      <Footer onNavigate={navigate} />
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <EffectsProvider>
        <GameProvider>
          <AppInner />
        </GameProvider>
      </EffectsProvider>
    </ThemeProvider>
  )
}
