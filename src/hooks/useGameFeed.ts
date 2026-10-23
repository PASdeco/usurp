/**
 * useGameFeed — reads Stolen, Claimed and RoundReset events.
 * getLogs on mount + useWatchContractEvent for live updates.
 */

import { useWatchContractEvent } from 'wagmi'
import { useState, useEffect, useCallback, useRef } from 'react'
import { CHAIN_ID } from '../config'
import { USURP_ADDRESS, USURP_ABI } from '../lib/contract'
import type { FeedEvent } from '../lib/mock'
import { usdcDecimalsFor, Amount } from '../onchain-money'
import { createPublicClient, http, parseAbiItem } from 'viem'
import { arcTestnet } from 'viem/chains'

const USDC_DECIMALS = usdcDecimalsFor(CHAIN_ID)
const MAX_FEED = 50

function rawToUsdc(raw: bigint): number {
  return Number(Amount.fromRaw(raw, USDC_DECIMALS).toFixed(6))
}

function shortAddr(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

const publicClient = createPublicClient({
  chain: arcTestnet,
  transport: http('https://rpc.testnet.arc.io'),
})

export interface UseGameFeedReturn {
  feed: FeedEvent[]
  isLoading: boolean
}

export function useGameFeed(): UseGameFeedReturn {
  const [feed, setFeed] = useState<FeedEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  // Use a ref-based set to deduplicate without triggering re-renders on every event
  const seenIds = useRef(new Set<string>())

  const mergeEvents = useCallback((newEvents: FeedEvent[]) => {
    const fresh = newEvents.filter(e => !seenIds.current.has(e.id))
    if (fresh.length === 0) return
    fresh.forEach(e => seenIds.current.add(e.id))
    setFeed(prev =>
      [...fresh, ...prev].sort((a, b) => b.at - a.at).slice(0, MAX_FEED)
    )
  }, [])

  // ── Historical getLogs on mount ────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false

    async function fetchHistory() {
      try {
        const latest = await publicClient.getBlockNumber()
        const fromBlock = latest > 2000n ? latest - 2000n : 0n

        const [stolenLogs, claimedLogs, resetLogs] = await Promise.all([
          publicClient.getLogs({
            address: USURP_ADDRESS,
            event: parseAbiItem('event Stolen(address indexed newHolder, address indexed prevHolder, uint256 pricePaid, uint256 nextPrice, uint256 round)'),
            fromBlock, toBlock: 'latest',
          }),
          publicClient.getLogs({
            address: USURP_ADDRESS,
            event: parseAbiItem('event Claimed(address indexed holder, uint256 amount)'),
            fromBlock, toBlock: 'latest',
          }),
          publicClient.getLogs({
            address: USURP_ADDRESS,
            event: parseAbiItem('event RoundReset(uint256 indexed round, uint256 timestamp)'),
            fromBlock, toBlock: 'latest',
          }),
        ])

        if (cancelled) return

        const events: FeedEvent[] = []

        for (const log of stolenLogs) {
          const args = log.args as { newHolder: `0x${string}`; pricePaid: bigint }
          events.push({
            id: `stolen-${log.transactionHash}-${log.logIndex}`,
            type: 'steal',
            actor: shortAddr(args.newHolder),
            amount: rawToUsdc(args.pricePaid),
            at: Number(log.blockNumber) * 2000 + 1_700_000_000_000,
          })
        }
        for (const log of claimedLogs) {
          const args = log.args as { holder: `0x${string}`; amount: bigint }
          events.push({
            id: `claimed-${log.transactionHash}-${log.logIndex}`,
            type: 'claim',
            actor: shortAddr(args.holder),
            amount: rawToUsdc(args.amount),
            at: Number(log.blockNumber) * 2000 + 1_700_000_000_000,
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

        mergeEvents(events)
      } catch {
        // RPC unavailable on first load — watch events will fill the feed
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void fetchHistory()
    return () => { cancelled = true }
  }, [mergeEvents])

  // ── Live watch events ──────────────────────────────────────────────────────
  useWatchContractEvent({
    address: USURP_ADDRESS,
    abi: USURP_ABI,
    eventName: 'Stolen',
    chainId: CHAIN_ID,
    onLogs(logs) {
      mergeEvents(logs.map(log => {
        const args = log.args as { newHolder: `0x${string}`; pricePaid: bigint }
        return {
          id: `stolen-${log.transactionHash}-${log.logIndex ?? 0}`,
          type: 'steal' as const,
          actor: shortAddr(args.newHolder),
          amount: rawToUsdc(args.pricePaid),
          at: Date.now(),
        }
      }))
    },
  })

  useWatchContractEvent({
    address: USURP_ADDRESS,
    abi: USURP_ABI,
    eventName: 'Claimed',
    chainId: CHAIN_ID,
    onLogs(logs) {
      mergeEvents(logs.map(log => {
        const args = log.args as { holder: `0x${string}`; amount: bigint }
        return {
          id: `claimed-${log.transactionHash}-${log.logIndex ?? 0}`,
          type: 'claim' as const,
          actor: shortAddr(args.holder),
          amount: rawToUsdc(args.amount),
          at: Date.now(),
        }
      }))
    },
  })

  useWatchContractEvent({
    address: USURP_ADDRESS,
    abi: USURP_ABI,
    eventName: 'RoundReset',
    chainId: CHAIN_ID,
    onLogs(logs) {
      mergeEvents(logs.map(log => {
        const args = log.args as { timestamp: bigint }
        return {
          id: `reset-${log.transactionHash}-${log.logIndex ?? 0}`,
          type: 'reset' as const,
          actor: '',
          at: Number(args.timestamp) * 1000,
        }
      }))
    },
  })

  return { feed, isLoading }
}
