/**
 * useGameStats — derives best-hold and streak from event logs.
 *
 * Best hold:
 *   Between consecutive Stolen events, the hold duration for the outgoing holder
 *   is (nextStealTime - prevStealTime). We take the maximum across all events.
 *   The current hold (if ongoing) is compared with nowMs.
 *
 * 7-day streak (for the connected address):
 *   A "day" counts if the address was either the holder or made a steal
 *   that was recorded in the Stolen event. We look at unique calendar days
 *   (UTC) in the last 7 where the address appears, then count the trailing
 *   consecutive streak ending today.
 *
 * Source: FeedEvent array from useGameFeed (client-side from logs).
 * No indexer required — the last 2000 blocks cover several hours.
 */

import { useMemo, useState, useEffect } from 'react'
import type { FeedEvent } from '../lib/mock'

const MS_PER_DAY = 86_400_000

function utcDay(ms: number): number {
  return Math.floor(ms / MS_PER_DAY)
}

export function useGameStats(
  feed: FeedEvent[],
  connectedAddress: string | undefined,
  currentHoldSinceMs: number,
) {
  // Tick nowMs once per minute — fine for streak/best-hold which aren't sub-second
  // Initialize lazily via function to avoid Date.now() purity violation in render
  const [nowMs, setNowMs] = useState<number>(() => 0)
  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 60_000)
    return () => clearInterval(id)
  }, [])

  return useMemo(() => {
    // ── Best hold ────────────────────────────────────────────────────────────
    // Steal events are in reverse-chronological order from useGameFeed.
    // Reverse to get chronological order.
    const steals = [...feed]
      .filter(e => e.type === 'steal')
      .sort((a, b) => a.at - b.at)

    let bestHoldSec = 0
    for (let i = 1; i < steals.length; i++) {
      const duration = steals[i].at - steals[i - 1].at
      if (duration > bestHoldSec) bestHoldSec = duration
    }
    // Also consider the current ongoing hold
    if (currentHoldSinceMs > 0 && steals.length > 0) {
      const ongoingDuration = nowMs - currentHoldSinceMs
      if (ongoingDuration > bestHoldSec) bestHoldSec = ongoingDuration
    }

    const bestHoldMins = bestHoldSec / 60_000

    // ── 7-day streak ─────────────────────────────────────────────────────────
    let streak = 0
    if (connectedAddress) {
      const addr = connectedAddress.toLowerCase()
      const todayDay = utcDay(nowMs)

      // Collect unique UTC days where this address appears in the feed
      const activeDays = new Set<number>()
      for (const ev of feed) {
        if (ev.actor && ev.actor.toLowerCase().startsWith(addr.slice(0, 6))) {
          activeDays.add(utcDay(ev.at))
        }
      }

      // Count consecutive days ending today (backward)
      let d = todayDay
      while (activeDays.has(d)) {
        streak++
        d--
      }
    }

    return { bestHoldMins, streak: Math.min(streak, 7) }
  }, [feed, connectedAddress, nowMs, currentHoldSinceMs])
}
