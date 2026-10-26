/**
 * useGameFeed — reads Stolen, Claimed and RoundReset events.
 * Polls via getLogs every 10s (eth_newFilter not supported on Arc RPC).
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { TARGET_CHAIN } from '../config'
import { USURP_ADDRESS } from '../lib/contract'
import type { FeedEvent } from '../lib/mock'
import { usdcDecimalsFor, Amount } from '../onchain-shim'
import { createPublicClient, http, parseAbiItem } from 'viem'

const USDC_DECIMALS = usdcDecimalsFor()
const MAX_FEED = 50
const POLL_INTERVAL = 10_000 // 10 seconds

function rawToUsdc(raw: bigint): number {
  return Number(Amount.fromRaw(raw, USDC_DECIMALS).toFixed(6))
}

function shortAddr(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

// Use the RPC from TARGET_CHAIN (env-driven: mainnet or testnet)
const publicClient = createPublicClient({
  chain: TARGET_CHAIN,
  transport: http(TARGET_CHAIN.rpcUrls.default.http[0]),
})

export interface UseGameFeedReturn {
  feed: FeedEvent[]
  isLoading: boolean
}

export function useGameFeed(): UseGameFeedReturn {
  const [feed, setFeed] = useState<FeedEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const seenIds = useRef(new Set<string>())
  const lastBlockRef = useRef<bigint>(0n)

  const mergeEvents = useCallback((newEvents: FeedEvent[]) => {
    const fresh = newEvents.filter(e => !seenIds.current.has(e.id))
    if (fresh.length === 0) return
    fresh.forEach(e => seenIds.current.add(e.id))
    setFeed(prev =>
      [...fresh, ...prev].sort((a, b) => b.at - a.at).slice(0, MAX_FEED)
    )
  }, [])

  const fetchLogs = useCallback(async (fromBlock: bigint) => {
    const [stolenLogs, claimedLogs, resetLogs] = await Promise.all([
      publicClient.getLogs({
        address: USURP_ADDRESS,
        event: parseAbiItem('event Stolen(address indexed newHolder, address indexed prevHolder, uint256 pricePaid, uint256 nextPrice, uint256 round)'),
        fromBlock,
        toBlock: 'latest',
      }),
      publicClient.getLogs({
        address: USURP_ADDRESS,
        event: parseAbiItem('event Claimed(address indexed holder, uint256 amount)'),
        fromBlock,
        toBlock: 'latest',
      }),
      publicClient.getLogs({
        address: USURP_ADDRESS,
        event: parseAbiItem('event RoundReset(uint256 indexed round, uint256 timestamp)'),
        fromBlock,
        toBlock: 'latest',
      }),
    ])

    const events: FeedEvent[] = []

    for (const log of stolenLogs) {
      const args = log.args as { newHolder: `0x${string}`; pricePaid: bigint }
      // Use block timestamp approximation: block * avg_block_time
      const blockMs = Number(log.blockNumber ?? 0n) * 2000 + 1_700_000_000_000
      events.push({
        id: `stolen-${log.transactionHash}-${log.logIndex}`,
        type: 'steal',
        actor: shortAddr(args.newHolder),
        amount: rawToUsdc(args.pricePaid),
        at: blockMs,
      })
    }
    for (const log of claimedLogs) {
      const args = log.args as { holder: `0x${string}`; amount: bigint }
      const blockMs = Number(log.blockNumber ?? 0n) * 2000 + 1_700_000_000_000
      events.push({
        id: `claimed-${log.transactionHash}-${log.logIndex}`,
        type: 'claim',
        actor: shortAddr(args.holder),
        amount: rawToUsdc(args.amount),
        at: blockMs,
      })
    }
    for (const log of resetLogs) {
      const args = log.args as { timestamp: bigint }
      events.push({
        id: `reset-${log.transactionHash}-${log.logIndex}`,
        type: 'reset',
        actor: '',
        at: Number(args.timestamp) * 1000,
      })
    }

    return events
  }, [])

  // ── Initial fetch (last 2000 blocks) ──────────────────────────────────────
  useEffect(() => {
    let cancelled = false

    async function init() {
      try {
        const latest = await publicClient.getBlockNumber()
        lastBlockRef.current = latest
        const fromBlock = latest > 2000n ? latest - 2000n : 0n
        const events = await fetchLogs(fromBlock)
        if (!cancelled) mergeEvents(events)
      } catch {
        // RPC unavailable — feed stays empty until next poll
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void init()
    return () => { cancelled = true }
  }, [fetchLogs, mergeEvents])

  // ── Polling for new events every 10s ──────────────────────────────────────
  useEffect(() => {
    let cancelled = false

    const id = setInterval(async () => {
      try {
        const latest = await publicClient.getBlockNumber()
        const from = lastBlockRef.current > 0n ? lastBlockRef.current + 1n : latest - 10n
        if (latest < from) return
        lastBlockRef.current = latest
        const events = await fetchLogs(from)
        if (!cancelled) mergeEvents(events)
      } catch {
        // swallow polling errors
      }
    }, POLL_INTERVAL)

    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [fetchLogs, mergeEvents])

  return { feed, isLoading }
}
