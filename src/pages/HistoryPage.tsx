/**
 * /history — Full activity feed
 * Reads live on-chain events via useGameFeed.
 * Falls back to mock feed in mock mode via useGame().
 */

import { useMemo, useState } from 'react'
import { useGame } from '../contexts/GameContext'
import { useGameFeed } from '../hooks/useGameFeed'
import { buildTxExplorerUrl } from '../onchain-shim'
import { CHAIN_ID } from '../config'
import { MOCK_MODE } from '../lib/mock'
import { IconExternalLink, IconLoader } from '../components/icons'
import type { FeedEvent } from '../lib/mock'

function timeAgo(ms: number): string {
  const diff = Date.now() - ms
  if (diff < 60_000)    return `${Math.floor(diff / 1000)}s ago`
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
  return `${Math.floor(diff / 3_600_000)}h ago`
}

type FilterType = 'All' | 'Steals' | 'Resets' | 'Claims'

function EventRow({ ev }: { ev: FeedEvent }) {
  // Extract tx hash from id format "stolen-0x...-logIndex"
  const parts = ev.id.split('-')
  const txHash = parts.length >= 2 && parts[1]?.startsWith('0x')
    ? (parts[1] as `0x${string}`)
    : null

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 16,
        padding: '14px 24px',
        borderTop: '1px solid var(--border)',
        fontSize: 14,
        flexWrap: 'wrap',
      }}
    >
      <span>
        {ev.type === 'steal' && (
          <>
            <strong style={{ fontFamily: 'var(--font-mono)' }}>{ev.actor}</strong>
            {' '}stole the crown
            {ev.amount != null && (
              <> ·{' '}
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--gold-text)', fontWeight: 700 }}>
                  ${ev.amount.toFixed(4)}
                </span>
              </>
            )}
          </>
        )}
        {ev.type === 'reset' && (
          <>Round reset · price back to{' '}
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--gold-text)' }}>$0.13</span>
          </>
        )}
        {ev.type === 'claim' && (
          <>
            <strong style={{ fontFamily: 'var(--font-mono)' }}>{ev.actor}</strong>
            {' '}claimed
            {ev.amount != null && (
              <> <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--gold-text)' }}>${ev.amount.toFixed(4)}</span></>
            )}
          </>
        )}
      </span>

      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0, flexWrap: 'wrap' }}>
        <span style={{ color: 'var(--ink-muted)', fontSize: 13, fontFamily: 'var(--font-mono)' }}>
          {timeAgo(ev.at)}
        </span>

        {/* Explorer link */}
        {txHash && !MOCK_MODE && (
          <a
            href={buildTxExplorerUrl(txHash)}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--ink-muted)', display: 'flex', alignItems: 'center', gap: 3 }}
            aria-label="View transaction on explorer"
          >
            <IconExternalLink size={13} />
          </a>
        )}

        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            padding: '3px 8px',
            borderRadius: 6,
            background:
              ev.type === 'steal' ? 'rgba(217,30,72,0.12)' :
              ev.type === 'reset' ? 'rgba(245,196,81,0.12)' :
              'rgba(74,222,128,0.12)',
            color:
              ev.type === 'steal' ? 'var(--ruby)' :
              ev.type === 'reset' ? 'var(--gold-text)' :
              'var(--ok)',
          }}
        >
          {ev.type}
        </span>
      </div>
    </div>
  )
}

export function HistoryPage() {
  const { gameState, mockMode } = useGame()
  const liveFeed = useGameFeed()
  const [filter, setFilter] = useState<FilterType>('All')

  // Use live feed in live mode, mock feed in mock mode
  const rawFeed: FeedEvent[] = mockMode ? gameState.feed : liveFeed.feed
  const feedLoading = !mockMode && liveFeed.isLoading

  const filteredFeed = useMemo(() => {
    if (filter === 'All') return rawFeed
    const typeMap: Record<FilterType, string> = {
      All: '', Steals: 'steal', Resets: 'reset', Claims: 'claim',
    }
    return rawFeed.filter(ev => ev.type === typeMap[filter])
  }, [rawFeed, filter])

  const filters: FilterType[] = ['All', 'Steals', 'Resets', 'Claims']

  return (
    <main
      style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px 64px' }}
      aria-label="Activity history"
    >
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 48, letterSpacing: '0.03em', color: 'var(--ink)', margin: '0 0 8px', lineHeight: 1 }}>
        HISTORY
      </h1>
      <p style={{ color: 'var(--ink-muted)', fontSize: 17, margin: '0 0 32px' }}>
        All steals, resets and claims on Arc Testnet.
      </p>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }} role="group" aria-label="Filter activity by type">
        {filters.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            aria-pressed={filter === f}
            style={{
              background: filter === f ? 'var(--gold)' : 'var(--surface)',
              color: filter === f ? 'var(--gold-ink)' : 'var(--ink-muted)',
              border: '1px solid var(--border)',
              borderRadius: 999,
              padding: '7px 16px',
              fontFamily: 'var(--font-body)',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              minHeight: 36,
            }}
          >
            {f}
          </button>
        ))}
      </div>

      <div
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: '8px 0' }}
        aria-label="Activity feed"
        aria-live="polite"
      >
        {feedLoading ? (
          <div style={{ padding: '28px', display: 'flex', alignItems: 'center', gap: 10, color: 'var(--ink-muted)', fontSize: 14 }}>
            <IconLoader size={16} style={{ animation: 'spin 1s linear infinite' }} />
            Loading events from chain…
          </div>
        ) : filteredFeed.length === 0 ? (
          <p style={{ padding: '28px', color: 'var(--ink-muted)', fontSize: 15, margin: 0 }}>
            No activity yet.
          </p>
        ) : (
          filteredFeed.map(ev => <EventRow key={ev.id} ev={ev} />)
        )}
      </div>
    </main>
  )
}
