/**
 * Terms of Use
 */

export function TermsPage() {
  return (
    <main
      style={{ maxWidth: 760, margin: '0 auto', padding: '40px 24px 64px' }}
      aria-label="Terms of use"
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
        TERMS OF USE
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
        <section aria-label="Acceptance of terms">
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 22, margin: '0 0 10px' }}>
            1. Acceptance of Terms
          </h2>
          <p style={{ margin: 0, color: 'var(--ink-muted)' }}>
            By accessing or using Usurp, you agree to these Terms of Use and the Disclaimer. If
            you do not agree with any part of these terms, do not use the game. Continued use of
            Usurp after any changes to these terms constitutes acceptance of those changes.
          </p>
        </section>

        <section aria-label="Eligibility">
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 22, margin: '0 0 10px' }}>
            2. Eligibility
          </h2>
          <p style={{ margin: 0, color: 'var(--ink-muted)' }}>
            You must be at least 18 years old, or the legal age of majority in your jurisdiction
            if higher. You must not be located in a jurisdiction where participation is prohibited
            by law. You are solely responsible for determining whether your participation is
            lawful where you live.
          </p>
        </section>

        <section aria-label="Nature of the game">
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 22, margin: '0 0 10px' }}>
            3. Nature of the Game
          </h2>
          <p style={{ margin: 0, color: 'var(--ink-muted)' }}>
            Usurp is an experimental smart-contract game running on Arc Testnet with test funds
            only. It is not a financial product, investment vehicle, savings product, or gambling
            service. Nothing in the game constitutes financial, legal, or investment advice.
            Players collectively receive at most half of what they pay in — see the{' '}
            <a
              href="#how-it-works"
              style={{ color: 'var(--gold-text)', textDecoration: 'underline', textUnderlineOffset: 3 }}
            >
              How it works &amp; fees
            </a>{' '}
            page for full details.
          </p>
        </section>

        <section aria-label="Risk">
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 22, margin: '0 0 10px' }}>
            4. Risk
          </h2>
          <p style={{ margin: 0, color: 'var(--ink-muted)' }}>
            Smart contracts can contain bugs. The blockchain may be congested, reorganized, or
            unavailable. The game may be paused or terminated at any time. You may lose all funds
            you commit. Only play with money you can afford to lose. See the{' '}
            <a
              href="#disclaimer"
              style={{ color: 'var(--gold-text)', textDecoration: 'underline', textUnderlineOffset: 3 }}
            >
              Disclaimer
            </a>{' '}
            for full risk disclosures.
          </p>
        </section>

        <section aria-label="Intellectual property">
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 22, margin: '0 0 10px' }}>
            5. Intellectual Property
          </h2>
          <p style={{ margin: 0, color: 'var(--ink-muted)' }}>
            The Usurp name, logo, and frontend are owned by ycee. The smart contract source code
            is deployed and verified on Arc Testnet. You may not reproduce, copy, or resell any
            part of Usurp without explicit written permission.
          </p>
        </section>

        <section aria-label="Limitation of liability">
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 22, margin: '0 0 10px' }}>
            6. Limitation of Liability
          </h2>
          <p style={{ margin: 0, color: 'var(--ink-muted)' }}>
            To the maximum extent permitted by applicable law, ycee and anyone involved in making
            Usurp shall not be liable for any direct, indirect, incidental, or consequential
            losses arising from your use of or inability to use the game, including loss of funds,
            lost earnings, smart contract bugs, downtime, or third-party actions.
          </p>
        </section>

        <section aria-label="Governing law">
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 22, margin: '0 0 10px' }}>
            7. Governing Law
          </h2>
          <p style={{ margin: 0, color: 'var(--ink-muted)' }}>
            These terms are governed by applicable law. If any provision is found unenforceable,
            the remaining provisions continue in full force. Usurp reserves the right to update
            these terms at any time; continued use constitutes acceptance.
          </p>
        </section>

        <section aria-label="Contact">
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 22, margin: '0 0 10px' }}>
            8. Contact
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
