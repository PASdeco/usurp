/**
 * USURP Footer
 * – Short risk notice + "18+ only"
 * – Nav links: How it works, FAQ, Disclaimer, Terms, Privacy, History
 */

interface FooterProps {
  onNavigate: (page: string) => void
}

export function Footer({ onNavigate }: FooterProps) {
  const links = [
    { id: 'disclaimer',   label: 'Disclaimer' },
    { id: 'how-it-works', label: 'How it works & fees' },
    { id: 'faq',          label: 'FAQ' },
    { id: 'history',      label: 'History' },
    { id: 'terms',        label: 'Terms' },
    { id: 'privacy',      label: 'Privacy' },
  ]

  return (
    <footer
      style={{
        borderTop: '1px solid var(--border)',
        padding: '32px 24px',
        textAlign: 'center',
        fontSize: 13,
        color: 'var(--ink-muted)',
        fontFamily: 'var(--font-body)',
      }}
    >
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <p style={{ margin: '0 0 6px' }}>
          Usurp is an experimental game on Arc. Not financial advice. Play at your own risk.
        </p>
        <p style={{ margin: '0 0 16px', fontWeight: 700 }}>18+ only.</p>
        <nav
          aria-label="Footer navigation"
          style={{
            display: 'flex',
            gap: 18,
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          {links.map(l => (
            <button
              key={l.id}
              onClick={() => onNavigate(l.id)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--gold-text)',
                fontFamily: 'var(--font-body)',
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
                padding: '4px 2px',
                minHeight: 44,
                display: 'inline-flex',
                alignItems: 'center',
                textDecoration: 'none',
              }}
            >
              {l.label}
            </button>
          ))}
        </nav>
      </div>
    </footer>
  )
}
