/**
 * /disclaimer — Appendix C
 * DRAFT — must be reviewed by a qualified lawyer before mainnet launch.
 */

import React from 'react'

// ─── Shared layout primitives ─────────────────────────────────────────────────

function PageTitle({ children }: { children: React.ReactNode }) {
  return (
    <h1
      style={{
        fontFamily: 'var(--font-display)',
        fontWeight: 900,
        fontSize: 'clamp(36px, 6vw, 56px)',
        letterSpacing: '0.03em',
        color: 'var(--ink)',
        margin: '0 0 6px',
        lineHeight: 1.05,
      }}
    >
      {children}
    </h1>
  )
}

function Section({
  n,
  title,
  children,
}: {
  n: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section
      aria-labelledby={`disc-${n}`}
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 20,
        padding: '24px 28px',
        marginBottom: 16,
      }}
    >
      <h2
        id={`disc-${n}`}
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 900,
          fontSize: 20,
          letterSpacing: '0.02em',
          color: 'var(--ink)',
          margin: '0 0 10px',
          display: 'flex',
          gap: 12,
          alignItems: 'baseline',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 13,
            fontWeight: 700,
            color: 'var(--gold-text)',
            letterSpacing: '0.1em',
            minWidth: 28,
          }}
        >
          {n}.
        </span>
        {title.toUpperCase()}
      </h2>
      <div
        style={{
          color: 'var(--ink)',
          fontSize: 15,
          lineHeight: 1.75,
          maxWidth: '68ch',
        }}
      >
        {children}
      </div>
    </section>
  )
}


// ─── Page ─────────────────────────────────────────────────────────────────────

export function DisclaimerPage() {
  return (
    <main
      style={{ maxWidth: 800, margin: '0 auto', padding: '40px 24px 80px' }}
      aria-label="Disclaimer"
    >


      <PageTitle>DISCLAIMER</PageTitle>
      <p
        style={{
          color: 'var(--ink-muted)',
          fontSize: 15,
          margin: '6px 0 32px',
          lineHeight: 1.6,
        }}
      >
        Please read this disclaimer carefully before using Usurp.
      </p>

      <Section n="1" title="Experimental software">
        Usurp is an experimental game running on the Arc blockchain. It is provided "as is" and "as
        available", without warranties of any kind, express or implied.
      </Section>

      <Section n="2" title="Not financial advice">
        Nothing on this site is financial, investment, legal or tax advice. Usurp is not an
        investment product, and nothing on it should be read as a promise of profit or income.
      </Section>

      <Section n="3" title="Risk of loss">
        You can lose all the money you pay into the game. Players collectively receive{' '}
        <strong>at most half</strong> of what they pay in. Most players are expected to lose money,
        and earnings depend on how long you hold the crown and on other players' activity. Earnings
        are not guaranteed. Only play with money you can afford to lose.
      </Section>

      <Section n="4" title="Smart contract and blockchain risk">
        Smart contracts can contain bugs, and blockchains can fail, be congested, be reorganized,
        change, or be attacked. Transactions are generally irreversible. The contract is currently
        an unaudited mainnet contract. You are responsible for your wallet, keys, gas and
        transactions.
      </Section>

      <Section n="5" title="Stablecoin and third-party risk">
        The game uses USDC and the Arc network, which are operated by third parties. Usurp has no
        control over them and is not responsible for loss caused by their failure, freezes,
        depegging, downtime or changes. Usurp is not affiliated with, endorsed by, or sponsored by
        Circle or Arc.
      </Section>

      <Section n="6" title="Pot, fees and resets">
        The builder receives <strong>50% of every steal payment</strong>. The pot may run empty, in
        which case no drip is paid. Parameters may be changed by the builder only as described in
        the contract and on the{' '}
        <a
          href="#how-it-works"
          style={{
            color: 'var(--gold-text)',
            textDecoration: 'underline',
            textUnderlineOffset: 3,
          }}
        >
          How it works &amp; fees
        </a>{' '}
        page. Parameter changes are subject to a 2-day timelock enforced in the contract, during
        which the scheduled change is publicly visible on-chain.
      </Section>

      <Section n="7" title="Mainnet — real funds">
        Usurp runs on <strong>Arc Mainnet</strong>. All payments use real USDC with real monetary
        value. Transactions are irreversible. The game may be paused, reset or taken offline at
        any time. Only play with funds you can afford to lose entirely.
      </Section>

      <Section n="8" title="Eligibility and legality">
        You must be at least <strong>18 years old</strong> (or the legal age of majority where you
        live, if higher). Laws about games, gambling and digital assets vary by location. It is your
        responsibility to make sure that playing is lawful for you. Usurp is not available in
        restricted regions and may block access. You must not use it where it is prohibited.
      </Section>

      <Section n="9" title="No guarantee of availability">
        The site and game may be unavailable, paused or changed at any time, including pausing
        steals to protect users. Claiming earned funds is intended to remain available while the
        contract is operating.
      </Section>

      <Section n="10" title="Limitation of liability">
        To the maximum extent allowed by law, the builder and anyone involved in making Usurp are
        not liable for any loss, damage, or claim arising from your use of the game, including loss
        of funds, lost profits, errors, downtime, or third-party actions.
      </Section>

      <Section n="11" title="Changes">
        This disclaimer may change. Continued use of Usurp means you accept the updated version.
      </Section>

      <Section n="12" title="Contact">
        ycee ·{' '}
        <a
          href="mailto:ycee@usurp-arena.vercel.app"
          style={{ color: 'var(--gold-text)', textDecoration: 'underline', textUnderlineOffset: 3 }}
        >
          [REDACTED_EMAIL]
        </a>
      </Section>

      <p
        style={{
          marginTop: 32,
          color: 'var(--ink-muted)',
          fontSize: 13,
          fontFamily: 'var(--font-mono)',
        }}
      >
        Last updated: October 23, 2026
      </p>
    </main>
  )
}
