/**
 * /p/[address] — Player stats
 * Reads Stolen and Claimed events for the given address.
 */

import { useMemo, useState, useEffect } from 'react'
import { useGameFeed } from '../hooks/useGameFeed'
import { buildTxExplorerUrl } from '../onchain-shim'
import { CHAIN_ID } from '../config'
import { MOCK_MODE } from '../lib/mock'
import { IconLoader, IconExternalLink } from '../components/icons'

interface PlayerPageProps {
  address?: string
  onNavigate: (page: string) => void
}

function fmt2(n: number) {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function PlayerPage({ address, onNavigate }: PlayerPageProps) {
  const display = address
    ? address.slice(0, 6) + '…' + address.slice(-4)
    : 'Unknown'

  const { feed, isLoading } = useGameFeed()
  const [nowMs, setNowMs] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 30_000)
    return () => clearInterval(id)
  }, [])

  const stats = useMemo(() => {
    if (!address || feed.length === 0) return null
    const lc = address.toLowerCase()

    const myStealEvents = feed.filter(
      e => e.type === 'steal' && e.actor.toLowerCase().startsWith(lc.slice(0, 6).toLowerCase())
    )
    const myClaimEvents = feed.filter(
      e => e.type === 'claim' && e.actor.toLowerCase().startsWith(lc.slice(0, 6).toLowerCase())
    )

    const totalSteals  = myStealEvents.length
    const totalClaimed = myClaimEvents.reduce((sum, e) => sum + (e.amount ?? 0), 0)

    // Best hold: largest gap between consecutive steals by this player
    // (simplified: use timestamp diffs)
    let bestHoldMs = 0
    for (let i = 0; i < myStealEvents.length - 1; i++) {
      const diff = myStealEvents[i].at - myStealEvents[i + 1].at
      if (diff > bestHoldMs) bestHoldMs = diff
    }
    const bestHoldMins = Math.floor(bestHoldMs / 60_000)

    return { totalSteals, totalClaimed, bestHoldMins }
  }, [address, feed])

  const recentActivity = useMemo(() => {
    if (!address) return []
    const lc = address.toLowerCase()
    return feed
      .filter(e => e.actor.toLowerCase().startsWith(lc.slice(0, 6).toLowerCase()))
      .slice(0, 10)
  }, [address, feed])

  return (
    <main
      style={{ maxWidth: 700, margin: '0 auto', padding: '40px 24px 64px' }}
      aria-label={`Player profile for ${display}`}
    >
      <button
        onClick={() => onNavigate('home')}
        style={{ background: 'none', border: 'none', color: 'var(--ink-muted)', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 13, cursor: 'pointer', padding: 0, marginBottom: 28, display: 'flex', alignItems: 'center', gap: 6, minHeight: 44 }}
      >
        ← Back to throne
      </button>

      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 40, letterSpacing: '0.03em', color: 'var(--ink)', margin: '0 0 6px', lineHeight: 1 }}>
        PLAYER STATS
      </h1>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 700, color: 'var(--ink-muted)', marginBottom: 32, wordBreak: 'break-all' }}>
        {address ?? '—'}
      </div>

      {isLoading && !MOCK_MODE ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--ink-muted)', fontSize: 14 }}>
          <IconLoader size={16} style={{ animation: 'spin 1s linear infinite' }} />
          Loading stats…
        </div>
      ) : (
        <>
          {/* Stats grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 32 }}>
            {[
              { label: 'Total steals',    value: stats ? String(stats.totalSteals)         : '—' },
              { label: 'Best hold',       value: stats ? `${stats.bestHoldMins}m`          : '—' },
              { label: 'Total claimed',   value: stats ? fmt2(stats.totalClaimed)          : '—' },
              { label: 'Current streak',  value: '—' },
            ].map(({ label, value }) => (
              <div key={label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '20px' }}>
                <div style={{ fontSize: 11, letterSpacing: '0.14em', color: 'var(--ink-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 32, color: 'var(--ink)' }} className="tabular-nums">{value}</div>
              </div>
            ))}
          </div>

          {/* Recent activity */}
          {recentActivity.length > 0 && (
            <section>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.2em', color: 'var(--ink-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: 12 }}>
                Recent activity
              </div>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
                {recentActivity.map(ev => {
                  const parts = ev.id.split('-')
                  const txHash = parts.length >= 2 && parts[1]?.startsWith('0x') ? parts[1] as `0x${string}` : null
                  return (
                    <div key={ev.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '12px 20px', borderTop: '1px solid var(--border)', fontSize: 14 }}>
                      <span>
                        {ev.type === 'steal' && <>Stole the crown {ev.amount != null && <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--gold-text)' }}>${ev.amount.toFixed(2)}</span>}</>}
                        {ev.type === 'claim' && <>Claimed {ev.amount != null && <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--gold-text)' }}>${ev.amount.toFixed(2)}</span>}</>}
                      </span>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <span style={{ color: 'var(--ink-muted)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
                          {ev.at > 0 ? `${Math.floor((nowMs - ev.at) / 60_000)}m ago` : '—'}
                        </span>
                        {txHash && !MOCK_MODE && (
                          <a href={buildTxExplorerUrl(txHash)} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--ink-muted)' }}>
                            <IconExternalLink size={13} />
                          </a>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )}
        </>
      )}
    </main>
  )
}
