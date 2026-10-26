/**
 * ThroneScreen — main game view.
 *
 * Data from useGame() — mock or live, same interface.
 * Effects (shake, confetti, crown pulse, break-even milestone) gated by useEffectsCtx().
 * Live earnings tick every ~250ms client-side between chain reads.
 * Steal = approve + steal two-step; Claim = single tx.
 * Revenge button shown only when the connected wallet was last dethroned.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useModal } from 'connectkit'
import { useReadContract } from 'wagmi'
import { erc20Abi } from 'viem'
import { useGame } from '../contexts/GameContext'
import { useWallet } from '../hooks/useWallet'
import { useConfetti } from '../hooks/useConfetti'
import { useShake } from '../hooks/useShake'
import { useBreakEvenMilestone } from '../hooks/useBreakEvenMilestone'
import { useEffectsCtx } from '../contexts/EffectsContext'
import { getUsdc } from '../onchain-shim'
import { CHAIN_ID } from '../config'
import { USURP_ADDRESS } from '../lib/contract'
import { HeroCrown } from './Logo'
import {
  StreakSquares,
  IconRevenge, IconSteal, IconWallet,
  IconLoader, IconSuccess, IconTrophy,
} from './icons'
import type { LiveGameState } from '../hooks/useGameState'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 })
}

function fmt2(n: number): string {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtHold(elapsed: number): string {
  const h  = Math.floor(elapsed / 3600)
  const m  = Math.floor((elapsed % 3600) / 60)
  const sc = elapsed % 60
  return [h, m, sc].map(v => String(v).padStart(2, '0')).join(':')
}

function fmtHoldShort(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function timeAgo(diffMs: number): string {
  if (diffMs < 60_000)   return `${Math.floor(diffMs / 1000)}s ago`
  if (diffMs < 3600_000) return `${Math.floor(diffMs / 60_000)}m ago`
  return `${Math.floor(diffMs / 3600_000)}h ago`
}

// ─── Break-even ring ──────────────────────────────────────────────────────────

function BreakEvenRing({ pct }: { pct: number }) {
  const R    = 58
  const circ = 2 * Math.PI * R
  const clampedPct = Math.max(0, Math.min(100, pct))
  const dash = (clampedPct / 100) * circ
  const isComplete = pct >= 100

  return (
    <div
      style={{ position: 'relative', width: 148, height: 148, flexShrink: 0 }}
      role="img"
      aria-label={`Break-even progress: ${Math.round(clampedPct)}%`}
    >
      <svg width="148" height="148" viewBox="0 0 148 148" aria-hidden="true">
        <circle cx="74" cy="74" r={R} fill="none" stroke="var(--ring-track)" strokeWidth="12" />
        <circle
          cx="74" cy="74" r={R}
          fill="none"
          stroke={isComplete ? 'var(--ok)' : 'var(--gold)'}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          transform="rotate(-90 74 74)"
          style={{ transition: 'stroke-dasharray 0.6s ease, stroke 0.3s ease' }}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 900,
            fontSize: 36,
            lineHeight: 1,
            color: isComplete ? 'var(--ok)' : 'var(--ink)',
          }}
          className="tabular-nums"
        >
          {Math.round(clampedPct)}%
        </span>
        <span style={{ fontSize: 10, letterSpacing: '0.12em', color: 'var(--ink-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
          {isComplete ? 'BREAK-EVEN' : 'Break-even'}
        </span>
      </div>
    </div>
  )
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────

function SkeletonBlock({ w = '100%', h = 20 }: { w?: string | number; h?: number }) {
  return (
    <div
      aria-hidden="true"
      style={{
        width: w, height: h,
        background: 'var(--surface-2)',
        borderRadius: 6,
        animation: 'pulse 1.4s ease-in-out infinite',
      }}
    />
  )
}

// ─── Steal button label ───────────────────────────────────────────────────────

function StealLabel({
  isConnected, isWrongChain, isLoading, step, stealPrice,
}: {
  isConnected: boolean
  isWrongChain: boolean
  isLoading: boolean
  step: string
  stealPrice: number
}) {
  if (!isConnected) {
    return (
      <span style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 24, letterSpacing: '0.06em' }}>
        <IconWallet size={20} />
        CONNECT TO STEAL · {fmt2(stealPrice)}
      </span>
    )
  }
  if (isWrongChain) {
    return (
      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 26, letterSpacing: '0.06em' }}>
        WRONG NETWORK
      </span>
    )
  }
  if (isLoading) {
    const labels: Record<string, string> = {
      'checking-allowance': 'Checking…',
      'approving':          'Approve USDC…',
      'stealing':           'Stealing…',
      'confirming':         'Confirming…',
      'success':            'Stolen!',
    }
    return (
      <span style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 26, letterSpacing: '0.06em' }}>
        {step === 'success' ? <IconSuccess size={22} /> : <IconLoader size={22} style={{ animation: 'spin 1s linear infinite' }} />}
        {labels[step] ?? 'Processing…'}
      </span>
    )
  }
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 28, letterSpacing: '0.06em' }}>
      <IconSteal size={22} />
      STEAL THE CROWN · {fmt2(stealPrice)}
    </span>
  )
}

// ─── Live earnings ticker ─────────────────────────────────────────────────────

const DRIP_BPS      = 200
const DRIP_INTERVAL = 30   // seconds

function useLiveEarnings(
  baseEarnings: number,
  holderStealPrice: number,
  potBalance: number,
  accrualStart: number,
  isHolder: boolean,
) {
  // frozen when pot is empty — nothing to drip
  const isFrozen = potBalance <= 0

  const [displayed, setDisplayed] = useState(baseEarnings)
  const baseRef   = useRef(baseEarnings)
  const frozenVal = useRef<number>(baseEarnings)

  // Keep frozenVal current while NOT frozen
  useEffect(() => {
    if (!isFrozen) frozenVal.current = displayed
  })

  // Sync baseRef on every chain read
  useEffect(() => { baseRef.current = baseEarnings }, [baseEarnings])

  // Accept chain reads when not frozen and no drip conditions
  useEffect(() => {
    if (isFrozen) return
    if (!isHolder || holderStealPrice <= 0) setDisplayed(baseEarnings)
  }, [baseEarnings, isHolder, holderStealPrice, isFrozen])

  // Ticker — runs only when pot has funds, holder exists, price known
  useEffect(() => {
    if (isFrozen || !isHolder || holderStealPrice <= 0) return

    const dripPerInterval = holderStealPrice * DRIP_BPS / 10000
    const dripPerMs = dripPerInterval / (DRIP_INTERVAL * 1000)
    const startMs = Date.now()

    const id = setInterval(() => {
      const elapsed = Date.now() - startMs
      const accrued = elapsed * dripPerMs
      setDisplayed(Math.min(baseRef.current + accrued, baseRef.current + potBalance))
    }, 250)

    return () => clearInterval(id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHolder, potBalance, holderStealPrice, accrualStart, isFrozen])

  return isFrozen ? frozenVal.current : displayed
}

// ─── Main component ───────────────────────────────────────────────────────────

interface ThroneScreenProps {
  onNavigate: (page: string) => void
}

export function ThroneScreen({ onNavigate }: ThroneScreenProps) {
  const {
    gameState, mockMode, scenario, setScenario,
    isLoading, stealHook, claimHook, prevHolder,
  } = useGame()

  const g = gameState
  const { address, isConnected, isWrongChain } = useWallet()
  const { setOpen } = useModal()
  const openConnectModal = useCallback(() => setOpen(true), [setOpen])

  // Effects
  const { effectsOn } = useEffectsCtx()
  const { fire: fireConfetti } = useConfetti()
  const { shaking, trigger: triggerShake } = useShake()

  // Break-even milestone (fires confetti + banner once at 100%)
  const { showBanner: showBreakEvenBanner } = useBreakEvenMilestone(
    g.breakEvenPct,
    fireConfetti,
  )

  // Read current USDC allowance
  const usdcFact = getUsdc(CHAIN_ID)
  const USDC_ADDRESS = usdcFact?.address as `0x${string}` | undefined
  const { data: allowanceRaw } = useReadContract({
    address: USDC_ADDRESS,
    abi: erc20Abi,
    functionName: 'allowance',
    args: address && USDC_ADDRESS ? [address, USURP_ADDRESS] : undefined,
    chainId: CHAIN_ID,
    query: { enabled: !!address && !!USDC_ADDRESS, refetchInterval: 5000 },
  })
  const currentAllowance = allowanceRaw ?? 0n

  // Hold timer ticks every second — freezes when pot is empty
  const timerFrozen = g.potBalance <= 0
  const [nowMs, setNowMs] = useState(() => Date.now())
  useEffect(() => {
    if (timerFrozen) return
    const id = setInterval(() => setNowMs(Date.now()), 1000)
    return () => clearInterval(id)
  }, [timerFrozen])

  const isHolder = isConnected && address
    ? g.holder.toLowerCase() === address.toLowerCase()
    : false

  const showRevenge = isConnected && address && prevHolder
    ? prevHolder.toLowerCase() === address.toLowerCase()
    : false

  // Live earnings ticker
  const accrualStart = g.heldSince
  const liveEarnings = useLiveEarnings(
    g.pendingEarnings,
    g.stealPrice,
    g.potBalance,
    accrualStart,
    isHolder,
  )

  // Track previous stealHook.step to detect steal success
  const prevStepRef = useRef(stealHook.step)
  useEffect(() => {
    if (prevStepRef.current !== 'success' && stealHook.step === 'success') {
      triggerShake()
      fireConfetti()
    }
    prevStepRef.current = stealHook.step
  }, [stealHook.step, triggerShake, fireConfetti])

  // Steal handler
  const handleSteal = useCallback(() => {
    if (!isConnected) { openConnectModal(); return }
    if (!address || isWrongChain || stealHook.isLoading) return
    if (mockMode) return
    const raw = (g as Partial<LiveGameState>).stealPriceRaw
    if (!raw) return
    stealHook.steal(raw, address, currentAllowance)
  }, [isConnected, address, isWrongChain, g, stealHook, openConnectModal, mockMode, currentAllowance])

  // Claim handler
  const handleClaim = useCallback(() => {
    if (!isConnected) { openConnectModal(); return }
    if (mockMode) return
    claimHook.claim()
  }, [isConnected, claimHook, openConnectModal, mockMode])

  const handleRevenge = useCallback(() => { handleSteal() }, [handleSteal])

  const stealDisabled = stealHook.isLoading || isWrongChain

  return (
    <main
      className={shaking && effectsOn ? 'screen-shake' : ''}
      style={{ maxWidth: 1240, margin: '0 auto', padding: '24px 24px 40px' }}
      aria-label="USURP game"
    >
      {/* Break-even milestone banner */}
      {showBreakEvenBanner && (
        <div
          role="status"
          aria-live="polite"
          className="break-even-banner"
          style={{
            background: 'rgba(74, 222, 128, 0.12)',
            border: '1px solid var(--ok)',
            borderRadius: 12,
            padding: '12px 20px',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: 14,
            fontWeight: 700,
            color: 'var(--ok)',
          }}
        >
          <IconTrophy size={18} />
          Break-even reached! You have earned back what you paid.
        </div>
      )}

      {/* Mock mode banner */}
      {mockMode && (
        <div
          role="status"
          aria-live="polite"
          style={{
            background: 'var(--surface-2)',
            border: '1.5px dashed var(--border-strong)',
            borderRadius: 12,
            padding: '10px 16px',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 10,
          }}
        >
          <span style={{ fontSize: 13, color: 'var(--ink-muted)', fontWeight: 600 }}>
            Mock mode — no chain connection
          </span>
          <span style={{ display: 'flex', gap: 8 }}>
            {['healthy', 'low', 'empty'].map(s => (
              <button
                key={s}
                onClick={() => setScenario(s)}
                style={{
                  background: scenario === s ? 'var(--gold)' : 'transparent',
                  color: scenario === s ? 'var(--gold-ink)' : 'var(--ink-muted)',
                  border: '1.5px solid var(--border)',
                  borderRadius: 8,
                  padding: '4px 12px',
                  fontFamily: 'var(--font-body)',
                  fontWeight: 700,
                  fontSize: 12,
                  cursor: 'pointer',
                  minHeight: 32,
                  textTransform: 'capitalize',
                }}
              >
                {s}
              </button>
            ))}
          </span>
        </div>
      )}

      {/* Testnet notice */}
      <div
        role="note"
        style={{
          background: 'var(--surface-3)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: '10px 16px',
          marginBottom: 20,
          fontSize: 13,
          color: 'var(--ink-muted)',
          textAlign: 'center',
        }}
      >
        {import.meta.env.VITE_NETWORK === 'mainnet'
          ? 'Arc Mainnet — real USDC. Play responsibly.'
          : 'Arc Testnet — test funds only. No real money at stake.'}{' '}
        <button
          onClick={() => onNavigate('how-it-works')}
          style={{ background: 'none', border: 'none', color: 'var(--gold-text)', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 13, cursor: 'pointer', padding: 0 }}
        >
          How it works
        </button>
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 24, alignItems: 'start' }}>

        {/* ── LEFT: Crown hero panel ──────────────────────────────────────── */}
        <section
          aria-label="Crown holder and steal action"
          style={{
            background: 'radial-gradient(circle at 50% 0%, var(--hero-glow), transparent 62%), var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 24,
            padding: '36px 32px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.2em', color: 'var(--ink-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: 4 }}>
            Current holder
          </div>

          {/* Crown — pulse while you're the holder */}
          <div
            style={{ display: 'flex', justifyContent: 'center', margin: '16px 0 12px' }}
            className={isHolder && effectsOn ? 'crown-pulse' : 'crown-glow'}
          >
            <HeroCrown size={120} />
          </div>

          {/* Holder address */}
          {isLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}><SkeletonBlock w={180} h={24} /></div>
          ) : (
            <div
              style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 700, color: isHolder ? 'var(--gold)' : 'var(--ink)', marginBottom: 4 }}
              aria-label={`Holder address: ${g.holderDisplay}`}
            >
              {g.holderDisplay}
            </div>
          )}

          {/* Hold time */}
          <div style={{ fontSize: 14, color: 'var(--ink-muted)', marginBottom: 28 }}>
            Holding for{' '}
            <span
              style={{ fontFamily: 'var(--font-mono)', color: 'var(--ink)' }}
              aria-live="polite"
              aria-label={`Hold time: ${!g.heldSince ? '00:00:00' : fmtHold(Math.max(0, Math.floor((nowMs - g.heldSince) / 1000)))}`}
            >
              {isLoading || !g.heldSince ? '00:00:00' : fmtHold(Math.max(0, Math.floor((nowMs - g.heldSince) / 1000)))}
            </span>
          </div>

          {/* Ring + earnings */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 32, flexWrap: 'wrap', marginBottom: 32 }}>
            {isLoading
              ? <SkeletonBlock w={148} h={148} />
              : <BreakEvenRing pct={g.breakEvenPct} />
            }
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 11, letterSpacing: '0.14em', color: 'var(--ink-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>
                Earned this hold
              </div>
              {isLoading ? (
                <SkeletonBlock w={160} h={40} />
              ) : (
                <div
                  style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 36, color: 'var(--gold)', lineHeight: 1 }}
                  className="tabular-nums gold-glow"
                  aria-live="polite"
                  aria-label={`Pending earnings: ${fmt(liveEarnings)}`}
                >
                  +{fmt(liveEarnings)}
                </div>
              )}

              {/* Claim button — only shown to the connected holder */}
              {isHolder && !isLoading && (
                <button
                  onClick={handleClaim}
                  disabled={claimHook.isLoading}
                  style={{
                    marginTop: 12,
                    background: 'transparent',
                    color: 'var(--gold-text)',
                    border: '1.5px solid var(--gold)',
                    borderRadius: 10,
                    padding: '8px 18px',
                    fontFamily: 'var(--font-body)',
                    fontWeight: 800,
                    fontSize: 13,
                    cursor: claimHook.isLoading ? 'wait' : 'pointer',
                    minHeight: 38,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 7,
                    opacity: claimHook.isLoading ? 0.7 : 1,
                  }}
                  aria-label="Claim earned USDC"
                >
                  {claimHook.isLoading
                    ? <><IconLoader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Claiming…</>
                    : 'Claim earnings'}
                </button>
              )}
            </div>
          </div>

          {/* STEAL button */}
          <button
            onClick={handleSteal}
            disabled={isConnected ? stealDisabled : false}
            style={{
              width: '100%',
              background: stealDisabled && isConnected ? 'var(--border-strong)' : 'var(--ruby)',
              color: 'var(--ruby-ink)',
              border: 'none',
              borderRadius: 16,
              padding: '20px 24px',
              minHeight: 72,
              cursor: stealDisabled && isConnected ? 'not-allowed' : 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              opacity: stealDisabled && isConnected ? 0.6 : 1,
              transition: 'opacity 0.2s, background 0.2s',
            }}
            className={stealDisabled && isConnected ? '' : 'ruby-glow'}
            aria-label={
              !isConnected ? 'Connect wallet to steal the crown'
              : isWrongChain ? `Switch to Arc ${import.meta.env.VITE_NETWORK === 'mainnet' ? '' : 'Testnet '}to steal`
              : `Steal the crown for ${fmt2(g.stealPrice)} USDC`
            }
          >
            <StealLabel
              isConnected={isConnected}
              isWrongChain={isWrongChain}
              isLoading={stealHook.isLoading}
              step={stealHook.step}
              stealPrice={g.stealPrice}
            />
          </button>

          {/* Revenge button */}
          {showRevenge && (
            <button
              onClick={handleRevenge}
              disabled={stealHook.isLoading}
              style={{
                marginTop: 12,
                width: '100%',
                background: 'transparent',
                color: 'var(--ink)',
                border: '1.5px solid var(--border-strong)',
                borderRadius: 12,
                padding: '12px',
                fontFamily: 'var(--font-body)',
                fontWeight: 700,
                fontSize: 15,
                cursor: stealHook.isLoading ? 'wait' : 'pointer',
                minHeight: 48,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
              aria-label="Take revenge: steal the crown back"
            >
              <IconRevenge size={16} />
              You were dethroned. Take revenge
            </button>
          )}
        </section>

        {/* ── RIGHT: Stats column ────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Dethroned claim card — shown when not current holder but has pending earnings */}
          {isConnected && !isHolder && !isLoading && g.pendingEarnings > 0 && (
            <section
              aria-label="Claim your earnings"
              style={{
                background: 'linear-gradient(135deg, rgba(245,196,81,0.08) 0%, transparent 100%)',
                border: '1.5px solid var(--gold)',
                borderRadius: 20,
                padding: '20px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
                flexWrap: 'wrap',
              }}
            >
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.2em', color: 'var(--ink-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: 4 }}>
                  Your earnings
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 24, color: 'var(--gold)' }}>
                  +{fmt(g.pendingEarnings)}
                </div>
                <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 4 }}>
                  Earned while you held the crown
                </div>
              </div>
              <button
                onClick={handleClaim}
                disabled={claimHook.isLoading}
                style={{
                  background: 'var(--gold)',
                  color: 'var(--gold-ink)',
                  border: 'none',
                  borderRadius: 12,
                  padding: '12px 24px',
                  fontFamily: 'var(--font-body)',
                  fontWeight: 800,
                  fontSize: 15,
                  cursor: claimHook.isLoading ? 'wait' : 'pointer',
                  minHeight: 48,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  opacity: claimHook.isLoading ? 0.7 : 1,
                  flexShrink: 0,
                }}
                aria-label="Claim your earned USDC"
              >
                {claimHook.isLoading
                  ? <><IconLoader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Claiming…</>
                  : <><IconSuccess size={14} /> Claim {fmt(g.pendingEarnings)}</>
                }
              </button>
            </section>
          )}

          {/* Round stats */}
          <section
            aria-label="Round statistics"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: '24px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}
          >
            <div>
              <div style={{ fontSize: 11, letterSpacing: '0.14em', color: 'var(--ink-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Round</div>
              {isLoading
                ? <SkeletonBlock w={60} h={40} />
                : <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 36 }} className="tabular-nums">#{g.roundSteals}</div>
              }
            </div>
            <div>
              <div style={{ fontSize: 11, letterSpacing: '0.14em', color: 'var(--ink-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Best hold</div>
              {isLoading
                ? <SkeletonBlock w={80} h={40} />
                : (
                  <div
                    style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 36 }}
                    className="tabular-nums"
                    aria-label={`Best hold: ${fmtHoldShort(g.bestHoldMins * 60)}`}
                  >
                    {fmtHoldShort(Math.floor(g.bestHoldMins) * 60)}
                  </div>
                )
              }
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <div style={{ fontSize: 11, letterSpacing: '0.14em', color: 'var(--ink-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 10 }}>
                7-day streak
              </div>
              <StreakSquares filled={g.streak} total={7} />
            </div>
          </section>

          {/* Live feed */}
          <section
            aria-label="Live activity feed"
            aria-live="polite"
            aria-atomic="false"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: '24px' }}
          >
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.2em', color: 'var(--ink-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: 12 }}>
              Live feed
            </div>

            {isLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[1, 2, 3].map(i => <SkeletonBlock key={i} h={20} />)}
              </div>
            ) : g.feed.length === 0 ? (
              <p style={{ color: 'var(--ink-muted)', fontSize: 14, margin: 0 }}>No activity yet.</p>
            ) : (
              g.feed.slice(0, 8).map(ev => (
                <div
                  key={ev.id}
                  style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '12px 0', borderTop: '1px solid var(--border)', fontSize: 14 }}
                >
                  <span>
                    {ev.type === 'steal' && (
                      <>
                        <strong style={{ fontFamily: 'var(--font-mono)' }}>{ev.actor}</strong>
                        {' '}stole the crown ·{' '}
                        <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--gold)' }} className="tabular-nums">
                          {ev.amount != null ? fmt2(ev.amount) : ''}
                        </span>
                      </>
                    )}
                    {ev.type === 'reset' && (
                      <>Round reset · price back to <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--gold)' }}>$0.13</span></>
                    )}
                    {ev.type === 'claim' && (
                      <>
                        <strong style={{ fontFamily: 'var(--font-mono)' }}>{ev.actor}</strong>
                        {' '}claimed{' '}
                        <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--gold)' }}>
                          {ev.amount != null ? fmt2(ev.amount) : ''}
                        </span>
                      </>
                    )}
                  </span>
                  <span style={{ color: 'var(--ink-muted)', fontSize: 13, whiteSpace: 'nowrap', fontFamily: 'var(--font-mono)' }}>
                    {timeAgo(nowMs - ev.at)}
                  </span>
                </div>
              ))
            )}
          </section>
        </div>
      </div>

      {/* ── Arena teaser ─────────────────────────────────────────────────── */}
      <section
        aria-label="Usurp Arena — coming soon"
        style={{ marginTop: 24, border: '1.5px dashed var(--border-strong)', borderRadius: 24, padding: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 24, background: 'var(--surface-3)' }}
      >
        <div style={{ maxWidth: 640 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.2em', color: 'var(--gold-text)', textTransform: 'uppercase', fontWeight: 700, marginBottom: 8 }}>
            Coming soon
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 42, letterSpacing: '0.03em', lineHeight: 1, margin: '0 0 10px', color: 'var(--ink)' }}>
            USURP ARENA
          </h2>
          <p style={{ margin: 0, color: 'var(--ink-muted)', fontSize: 16 }}>
            Challenge the holder to a 60-second duel. AI validators judge it against a published rubric.
          </p>
        </div>
        <a
          href="https://forms.gle/notify-arena"
          target="_blank"
          rel="noopener noreferrer"
          style={{ background: 'transparent', color: 'var(--gold-text)', border: '1.5px solid var(--gold)', borderRadius: 12, padding: '14px 26px', fontFamily: 'var(--font-body)', fontWeight: 800, fontSize: 14, cursor: 'pointer', minHeight: 52, display: 'inline-flex', alignItems: 'center', whiteSpace: 'nowrap', textDecoration: 'none' }}
          aria-label="Get notified when Usurp Arena launches"
        >
          Notify me
        </a>
      </section>
    </main>
  )
}
