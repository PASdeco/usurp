/**
 * Privacy Policy
 */

export function PrivacyPage() {
  return (
    <main
      style={{ maxWidth: 760, margin: '0 auto', padding: '40px 24px 64px' }}
      aria-label="Privacy policy"
    >
      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 900,
          fontSize: 48,
          letterSpacing: '0.03em',
          color: 'var(--ink)',
          margin: '0 0 8px',
          lineHeight: 1,
        }}
      >
        PRIVACY POLICY
      </h1>
      <p style={{ color: 'var(--ink-muted)', fontSize: 17, margin: '0 0 28px', lineHeight: 1.5 }}>
        Last updated: October 21, 2026
      </p>

      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 20,
          padding: '28px',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
          color: 'var(--ink)',
          fontSize: 15,
          lineHeight: 1.7,
        }}
      >
        <section aria-label="What data we collect">
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 22, margin: '0 0 10px' }}>
            1. What Data We Collect
          </h2>
          <p style={{ margin: 0, color: 'var(--ink-muted)' }}>
            Usurp is a non-custodial game. It does not collect names, email addresses, or payment
            card data. On-chain activity — wallet addresses, transaction hashes, and amounts — is
            public by the nature of the blockchain and is not collected or stored by Usurp. If you
            submit your email via the Arena waitlist form, that email address is stored solely to
            notify you about the Arena launch and will not be shared with third parties or used for
            marketing.
          </p>
        </section>

        <section aria-label="Blockchain data">
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 22, margin: '0 0 10px' }}>
            2. Blockchain Data
          </h2>
          <p style={{ margin: 0, color: 'var(--ink-muted)' }}>
            All transactions are recorded permanently on-chain and are publicly visible to anyone.
            Wallet addresses are pseudonymous but not anonymous. Usurp does not and cannot delete
            on-chain data — once submitted, transactions are irreversible.
          </p>
        </section>

        <section aria-label="Analytics">
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 22, margin: '0 0 10px' }}>
            3. Analytics
          </h2>
          <p style={{ margin: 0, color: 'var(--ink-muted)' }}>
            Usurp does not use third-party analytics or tracking cookies. No personal identifiers
            are collected for analytical purposes. Basic, anonymous page-load counts may be
            recorded by the hosting provider (Vercel) as part of standard infrastructure logs.
          </p>
        </section>

        <section aria-label="Third parties">
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 22, margin: '0 0 10px' }}>
            4. Third Parties
          </h2>
          <p style={{ margin: 0, color: 'var(--ink-muted)' }}>
            The game uses Google Fonts (loaded over CDN), Vercel (hosting), and public RPC
            providers to communicate with Arc Testnet. Each of these providers operates under
            their own privacy policies. Usurp does not sell or share your data with any third
            party for advertising or profiling purposes.
          </p>
        </section>

        <section aria-label="Your rights">
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 22, margin: '0 0 10px' }}>
            5. Your Rights
          </h2>
          <p style={{ margin: 0, color: 'var(--ink-muted)' }}>
            Depending on where you live, you may have rights to access, correct, or delete
            personal data we hold (such as an Arena waitlist email). To exercise these rights,
            contact us at{' '}
            <a
              href="mailto:[REDACTED_EMAIL]"
              style={{ color: 'var(--gold-text)', textDecoration: 'underline', textUnderlineOffset: 3 }}
            >
              [REDACTED_EMAIL]
            </a>
            . Note that on-chain data cannot be deleted as it is permanently recorded on the
            blockchain.
          </p>
        </section>

        <section aria-label="Contact">
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 22, margin: '0 0 10px' }}>
            6. Contact
          </h2>
          <p style={{ margin: 0, color: 'var(--ink-muted)' }}>
            ycee ·{' '}
            <a
              href="mailto:[REDACTED_EMAIL]"
              style={{ color: 'var(--gold-text)', textDecoration: 'underline', textUnderlineOffset: 3 }}
            >
              [REDACTED_EMAIL]
            </a>
          </p>
        </section>
      </div>
    </main>
  )
}
