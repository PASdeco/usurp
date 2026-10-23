/**
 * RegionNotice — checks VITE_BLOCKED_REGIONS against the browser locale
 * and shows a blocking notice if the user appears to be in a restricted region.
 *
 * This is a client-side soft block only (locale-based). For a hard block,
 * implement edge middleware (see docs/DEPLOY.md — region restriction section).
 *
 * VITE_BLOCKED_REGIONS = comma-separated ISO 3166-1 alpha-2 codes, e.g. "US,CN,KP"
 * Leave empty or unset to allow all regions.
 *
 * The locale check is a best-effort hint. It is NOT a legal compliance measure
 * on its own — see docs/DEPLOY.md for the required server-side implementation.
 */

import { useMemo } from 'react'
import { IconShield, IconInfo } from './icons'

const BLOCKED_RAW = import.meta.env.VITE_BLOCKED_REGIONS as string | undefined

function getCountryFromLocale(): string | null {
  try {
    const locales = navigator.languages ?? [navigator.language]
    for (const locale of locales) {
      // Locale tags like "en-US", "zh-CN" → "US", "CN"
      const parts = locale.split('-')
      if (parts.length >= 2) {
        const country = parts[parts.length - 1].toUpperCase()
        if (/^[A-Z]{2}$/.test(country)) return country
      }
    }
  } catch { /* ignore */ }
  return null
}

export function useRegionBlocked(): boolean {
  return useMemo(() => {
    if (!BLOCKED_RAW) return false
    const blocked = BLOCKED_RAW.split(',').map(s => s.trim().toUpperCase()).filter(Boolean)
    if (blocked.length === 0) return false
    const country = getCountryFromLocale()
    if (!country) return false
    return blocked.includes(country)
  }, [])
}

export function RegionNotice() {
  const isBlocked = useRegionBlocked()
  if (!isBlocked) return null

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="region-block-title"
      aria-describedby="region-block-desc"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'var(--bg)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
        textAlign: 'center',
      }}
    >
      <IconShield size={56} style={{ color: 'var(--empty)', marginBottom: 24 }} />
      <h1
        id="region-block-title"
        style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 36, margin: '0 0 12px' }}
      >
        Not available in your region
      </h1>
      <p
        id="region-block-desc"
        style={{ maxWidth: 520, color: 'var(--ink-muted)', fontSize: 16, margin: '0 0 24px', lineHeight: 1.6 }}
      >
        Usurp is not available in your location due to legal or regulatory restrictions.
        If you believe this is an error, please review the{' '}
        <a href="#/disclaimer" style={{ color: 'var(--gold-text)' }}>Disclaimer</a>.
      </p>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 13,
          color: 'var(--ink-muted)',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 10,
          padding: '10px 16px',
        }}
      >
        <IconInfo size={14} />
        This check is locale-based only. A server-side block may also be in effect.
      </div>
    </div>
  )
}
