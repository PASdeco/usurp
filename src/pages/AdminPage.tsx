/**
 * AdminPage — /admin
 *
 * Visible only when the connected wallet is the contract owner or feeAddress.
 * Never shows private keys. Shows a warning banner on mainnet.
 *
 * Sections:
 *  1. Access guard (not admin → "not authorized" screen)
 *  2. Testnet / mainnet banner
 *  3. Solvency indicators (pot balance, fee accrued, paused state)
 *  4. Pause / Unpause
 *  5. Seed pot (onlyOwner)
 *  6. Withdraw fees (owner or feeAddress)
 *  7. Timelocked parameter changes with status
 *  8. Current live parameters
 */

import { useState, useCallback } from 'react'
import { useAdmin } from '../hooks/useAdmin'
import { useWallet } from '../hooks/useWallet'
import {
  IconShield, IconLoader, IconAlert,
  IconSuccess, IconLock, IconTimer, IconInfo,
} from '../components/icons'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtUsdc(n: number): string {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })
}

function fmtAddr(a: string): string {
  return a ? `${a.slice(0, 8)}…${a.slice(-6)}` : '—'
}

function fmtTimelock(effectiveAtMs: number): string {
  const now = Date.now()
  if (effectiveAtMs <= now) return 'Ready to apply'
  const diff = effectiveAtMs - now
  const h = Math.floor(diff / 3_600_000)
  const m = Math.floor((diff % 3_600_000) / 60_000)
  return `Ready in ${h}h ${m}m`
}

const IS_MAINNET = import.meta.env.VITE_IS_MAINNET === 'true'

// ─── Sub-components ───────────────────────────────────────────────────────────

function Card({ title, children, accent = false }: { title: string; children: React.ReactNode; accent?: boolean }) {
  return (
    <section
      aria-label={title}
      style={{
        background: 'var(--surface)',
        border: `1px solid ${accent ? 'var(--ruby)' : 'var(--border)'}`,
        borderRadius: 20,
        padding: '24px',
      }}
    >
      <h2 style={{
        margin: '0 0 16px',
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        letterSpacing: '0.2em',
        textTransform: 'uppercase',
        color: accent ? 'var(--empty)' : 'var(--ink-muted)',
        fontWeight: 700,
      }}>
        {title}
      </h2>
      {children}
    </section>
  )
}

function Stat({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div style={{ fontSize: 11, letterSpacing: '0.12em', color: 'var(--ink-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>
        {label}
      </div>
      <div style={{
        fontFamily: mono ? 'var(--font-mono)' : 'var(--font-display)',
        fontWeight: 900,
        fontSize: mono ? 16 : 28,
        color: 'var(--ink)',
        wordBreak: 'break-all',
      }}>
        {value}
      </div>
    </div>
  )
}

function ActionButton({
  onClick, disabled = false, loading = false, danger = false, children,
}: {
  onClick: () => void
  disabled?: boolean
  loading?: boolean
  danger?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        background: danger ? 'var(--ruby)' : 'var(--surface-2)',
        color: danger ? 'var(--ruby-ink)' : 'var(--ink)',
        border: danger ? 'none' : '1.5px solid var(--border)',
        borderRadius: 12,
        padding: '10px 20px',
        fontFamily: 'var(--font-body)',
        fontWeight: 800,
        fontSize: 14,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 7,
        minHeight: 44,
        opacity: disabled || loading ? 0.6 : 1,
        transition: 'opacity 0.15s',
      }}
    >
      {loading && <IconLoader size={14} style={{ animation: 'spin 1s linear infinite' }} />}
      {children}
    </button>
  )
}

function Input({
  value, onChange, placeholder, label,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
  label: string
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          background: 'var(--surface-3)',
          border: '1.5px solid var(--border)',
          borderRadius: 10,
          padding: '10px 14px',
          fontFamily: 'var(--font-mono)',
          fontSize: 14,
          color: 'var(--ink)',
          outline: 'none',
          width: '100%',
          boxSizing: 'border-box',
        }}
      />
    </div>
  )
}

function TimelockStatus({ effectiveAtMs, readyToApply }: { effectiveAtMs: number; readyToApply: boolean }) {
  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      background: readyToApply ? 'rgba(74,222,128,0.12)' : 'rgba(245,196,81,0.12)',
      border: `1px solid ${readyToApply ? 'var(--ok)' : 'var(--gold)'}`,
      borderRadius: 8,
      padding: '4px 10px',
      fontSize: 12,
      fontWeight: 700,
      color: readyToApply ? 'var(--ok)' : 'var(--gold-text)',
    }}>
      {readyToApply ? <IconSuccess size={13} /> : <IconTimer size={13} />}
      {fmtTimelock(effectiveAtMs)}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function AdminPage() {
  const { isConnected } = useWallet()
  const {
    adminState,
    pause, unpause,
    withdrawFees, seedPot,
    scheduleFeeAddress, applyFeeAddress,
    scheduleMinHold, applyMinHold,
    schedulePotLow, applyPotLow,
  } = useAdmin()

  // Local form state
  const [seedAmount, setSeedAmount]     = useState('')
  const [newFeeAddr, setNewFeeAddr]     = useState('')
  const [newMinHold, setNewMinHold]     = useState('')
  const [newPotLow, setNewPotLow]       = useState('')
  const [loading, setLoading]           = useState<Record<string, boolean>>({})

  const withLoading = useCallback(async (key: string, fn: () => Promise<unknown>) => {
    setLoading(l => ({ ...l, [key]: true }))
    try { await fn() } catch { /* toast already shown in useAdmin */ }
    finally { setLoading(l => ({ ...l, [key]: false })) }
  }, [])

  // ── Guard: not connected ──────────────────────────────────────────────────

  if (!isConnected) {
    return (
      <main style={{ maxWidth: 640, margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
        <IconShield size={48} style={{ color: 'var(--ink-muted)', marginBottom: 16 }} />
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 32, margin: '0 0 8px' }}>
          Admin panel
        </h1>
        <p style={{ color: 'var(--ink-muted)' }}>Connect your owner or fee wallet to access this page.</p>
      </main>
    )
  }

  // ── Guard: still loading owner from chain ─────────────────────────────────
  // ownerAddress = '' means the RPC read hasn't resolved yet — show a spinner
  // instead of the lock screen so a slow/flaky RPC doesn't block the admin.

  if (adminState.isLoading || (!adminState.ownerAddress && isConnected)) {
    return (
      <main style={{ maxWidth: 640, margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
        <IconLoader size={40} style={{ color: 'var(--gold)', marginBottom: 16, animation: 'spin 1s linear infinite' }} />
        <p style={{ color: 'var(--ink-muted)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>
          Reading contract ownership from Arc Mainnet…
        </p>
        <p style={{ color: 'var(--ink-muted)', fontSize: 12, marginTop: 8 }}>
          Owner: <code>{adminState.ownerAddress || 'loading…'}</code>
        </p>
      </main>
    )
  }

  // ── Guard: not admin ──────────────────────────────────────────────────────

  if (!adminState.isLoading && !adminState.isAdmin) {
    return (
      <main style={{ maxWidth: 640, margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
        <IconLock size={48} style={{ color: 'var(--empty)', marginBottom: 16 }} />
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 32, margin: '0 0 8px' }}>
          Not authorized
        </h1>
        <p style={{ color: 'var(--ink-muted)' }}>
          This page requires the contract owner or fee address wallet.
        </p>
      </main>
    )
  }

  const s = adminState

  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: '24px 24px 60px' }}>

      {/* ── Mainnet warning ───────────────────────────────────────────────── */}
      {IS_MAINNET && (
        <div
          role="alert"
          style={{
            background: 'rgba(217,30,72,0.12)',
            border: '1.5px solid var(--ruby)',
            borderRadius: 14,
            padding: '14px 20px',
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            color: 'var(--empty)',
            fontWeight: 700,
            fontSize: 14,
          }}
        >
          <IconAlert size={20} />
          You are on <strong>MAINNET</strong>. All actions involve real funds and are irreversible.
          Proceed with extreme care.
        </div>
      )}

      {/* ── Testnet notice ────────────────────────────────────────────────── */}
      {IS_MAINNET && (
        <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 12, padding: '10px 16px', marginBottom: 24, fontSize: 13, color: 'var(--ink-muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <IconInfo size={14} />
          Arc Mainnet — all actions involve real USDC.
        </div>
      )}

      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 40, margin: '0 0 24px', letterSpacing: '0.03em' }}>
        Admin Panel
      </h1>

      <div style={{ display: 'grid', gap: 20 }}>

        {/* ── Solvency overview ─────────────────────────────────────────── */}
        <Card title="Solvency overview">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 20 }}>
            <Stat label="Pot balance" value={fmtUsdc(s.potBalanceUsdc)} />
            <Stat label="Fees accrued" value={fmtUsdc(s.feeAccruedUsdc)} />
            <Stat label="Contract status" value={s.paused ? 'Paused' : 'Live'} />
            <Stat label="Your role" value={s.isOwner && s.isFeeAddress ? 'Owner + Fee' : s.isOwner ? 'Owner' : 'Fee address'} />
          </div>
        </Card>

        {/* ── Pause / Unpause ────────────────────────────────────────────── */}
        {s.isOwner && (
          <Card title="Game control" accent={s.paused}>
            <p style={{ margin: '0 0 16px', color: 'var(--ink-muted)', fontSize: 14 }}>
              Pausing blocks <strong>steal</strong> and <strong>reset</strong> but never blocks <strong>claim</strong> — players can always withdraw earned funds.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {s.paused ? (
                <ActionButton
                  onClick={() => { void withLoading('unpause', unpause) }}
                  loading={loading['unpause']}
                >
                  <IconSuccess size={15} /> Unpause game
                </ActionButton>
              ) : (
                <ActionButton
                  danger
                  onClick={() => { void withLoading('pause', pause) }}
                  loading={loading['pause']}
                >
                  <IconAlert size={15} /> Pause game
                </ActionButton>
              )}
            </div>
          </Card>
        )}

        {/* ── Seed pot ───────────────────────────────────────────────────── */}
        {s.isOwner && (
          <Card title="Seed pot">
            <p style={{ margin: '0 0 16px', color: 'var(--ink-muted)', fontSize: 14 }}>
              Add USDC directly to the pot. Make sure the contract has your approval first (or use a separate approval tx). Funds go straight to the holder drip pool.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'end', maxWidth: 400 }}>
              <Input
                label="Amount (USDC)"
                value={seedAmount}
                onChange={setSeedAmount}
                placeholder="e.g. 5.00"
              />
              <ActionButton
                onClick={() => {
                  if (!seedAmount) return
                  void withLoading('seed', () => seedPot(seedAmount).then(() => setSeedAmount('')))
                }}
                loading={loading['seed']}
                disabled={!seedAmount}
              >
                Seed
              </ActionButton>
            </div>
          </Card>
        )}

        {/* ── Withdraw fees ──────────────────────────────────────────────── */}
        <Card title="Builder fees">
          <p style={{ margin: '0 0 16px', color: 'var(--ink-muted)', fontSize: 14 }}>
            {fmtUsdc(s.feeAccruedUsdc)} is available to withdraw to the fee address (<span style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>{fmtAddr(s.feeAddress)}</span>).
          </p>
          <ActionButton
            onClick={() => { void withLoading('fees', withdrawFees) }}
            loading={loading['fees']}
            disabled={s.feeAccrued === 0n}
          >
            Withdraw {fmtUsdc(s.feeAccruedUsdc)} to fee address
          </ActionButton>
        </Card>

        {/* ── Timelocked parameter changes ───────────────────────────────── */}
        {s.isOwner && (
          <Card title="Timelocked parameters (2-day delay)">
            <div
              role="note"
              style={{ background: 'rgba(245,196,81,0.08)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', marginBottom: 20, fontSize: 13, color: 'var(--ink-muted)', display: 'flex', gap: 8 }}
            >
              <IconLock size={14} style={{ flexShrink: 0, marginTop: 2 }} />
              All parameter changes take effect 2 days after scheduling. You must call Apply after the timelock elapses.
            </div>

            {/* Fee address */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20, marginBottom: 20 }}>
              <h3 style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 800 }}>Fee address</h3>
              <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--ink-muted)' }}>
                Current: <span style={{ fontFamily: 'var(--font-mono)' }}>{fmtAddr(s.feeAddress)}</span>
              </p>
              {s.pendingFeeAddress && (
                <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 13, color: 'var(--ink-muted)' }}>
                    Pending: <span style={{ fontFamily: 'var(--font-mono)' }}>{fmtAddr(`0x${s.pendingFeeAddress.value.toString(16).padStart(40, '0')}`)}</span>
                  </span>
                  <TimelockStatus {...s.pendingFeeAddress} />
                  {s.pendingFeeAddress.readyToApply && (
                    <ActionButton
                      onClick={() => { void withLoading('applyFee', applyFeeAddress) }}
                      loading={loading['applyFee']}
                    >
                      Apply
                    </ActionButton>
                  )}
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'end', maxWidth: 500 }}>
                <Input label="New fee address (0x…)" value={newFeeAddr} onChange={setNewFeeAddr} placeholder="0x..." />
                <ActionButton
                  onClick={() => {
                    if (!newFeeAddr.startsWith('0x')) return
                    void withLoading('schedFee', () => scheduleFeeAddress(newFeeAddr).then(() => setNewFeeAddr('')))
                  }}
                  loading={loading['schedFee']}
                  disabled={!newFeeAddr.startsWith('0x')}
                >
                  Schedule
                </ActionButton>
              </div>
            </div>

            {/* Min hold before steal */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20, marginBottom: 20 }}>
              <h3 style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 800 }}>Min hold before steal (bot shield)</h3>
              <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--ink-muted)' }}>
                Current: <span style={{ fontFamily: 'var(--font-mono)' }}>{s.minHoldBeforeSteal.toString()}s</span>
                {' '}(0 = disabled)
              </p>
              {s.pendingMinHold && (
                <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 13, color: 'var(--ink-muted)' }}>Pending: {s.pendingMinHold.value.toString()}s</span>
                  <TimelockStatus {...s.pendingMinHold} />
                  {s.pendingMinHold.readyToApply && (
                    <ActionButton
                      onClick={() => { void withLoading('applyMinHold', applyMinHold) }}
                      loading={loading['applyMinHold']}
                    >
                      Apply
                    </ActionButton>
                  )}
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'end', maxWidth: 400 }}>
                <Input label="New value (seconds)" value={newMinHold} onChange={setNewMinHold} placeholder="e.g. 60" />
                <ActionButton
                  onClick={() => {
                    if (!newMinHold) return
                    void withLoading('schedMinHold', () => scheduleMinHold(newMinHold).then(() => setNewMinHold('')))
                  }}
                  loading={loading['schedMinHold']}
                  disabled={!newMinHold}
                >
                  Schedule
                </ActionButton>
              </div>
            </div>

            {/* Pot low threshold */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20 }}>
              <h3 style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 800 }}>Pot low threshold (drip intervals)</h3>
              <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--ink-muted)' }}>
                Current: <span style={{ fontFamily: 'var(--font-mono)' }}>{s.potLowThresholdIntervals.toString()} intervals</span>
                {' '}(pot covers &lt; N drip intervals → Low)
              </p>
              {s.pendingPotLowThreshold && (
                <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 13, color: 'var(--ink-muted)' }}>Pending: {s.pendingPotLowThreshold.value.toString()} intervals</span>
                  <TimelockStatus {...s.pendingPotLowThreshold} />
                  {s.pendingPotLowThreshold.readyToApply && (
                    <ActionButton
                      onClick={() => { void withLoading('applyPotLow', applyPotLow) }}
                      loading={loading['applyPotLow']}
                    >
                      Apply
                    </ActionButton>
                  )}
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'end', maxWidth: 400 }}>
                <Input label="New value (intervals)" value={newPotLow} onChange={setNewPotLow} placeholder="e.g. 5" />
                <ActionButton
                  onClick={() => {
                    if (!newPotLow) return
                    void withLoading('schedPotLow', () => schedulePotLow(newPotLow).then(() => setNewPotLow('')))
                  }}
                  loading={loading['schedPotLow']}
                  disabled={!newPotLow}
                >
                  Schedule
                </ActionButton>
              </div>
            </div>
          </Card>
        )}

        {/* ── Current parameters ─────────────────────────────────────────── */}
        <Card title="Current live parameters">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <Stat label="Owner" value={fmtAddr(s.ownerAddress)} mono />
            <Stat label="Fee address" value={fmtAddr(s.feeAddress)} mono />
            <Stat label="Min hold (s)" value={s.minHoldBeforeSteal.toString()} mono />
            <Stat label="Pot low threshold" value={`${s.potLowThresholdIntervals.toString()} intervals`} mono />
            <Stat label="Contract" value={fmtAddr(String(import.meta.env.VITE_MAINNET_CONTRACT_ADDRESS ?? import.meta.env.VITE_CONTRACT_ADDRESS ?? '0xC47cc87cb5fe4EDAe581064045A79074264bC415'))} mono />
          </div>
          <p style={{ margin: '16px 0 0', fontSize: 13, color: 'var(--ink-muted)' }}>
            Start price: $0.13 · Increase: 20% · Cap: $5.00 · Split: 50/50 · Drip: 2% per 30s · Idle reset: 1h · Empty reset: 10min.{' '}
            <em>These constants are in the contract source and can only be changed by redeployment.</em>
          </p>
        </Card>

      </div>
    </main>
  )
}
