/**
 * 404 — custom not-found page
 */

interface NotFoundPageProps {
  onNavigate: (page: string) => void
}

export function NotFoundPage({ onNavigate }: NotFoundPageProps) {
  return (
    <main
      style={{
        maxWidth: 540,
        margin: '80px auto',
        padding: '0 24px',
        textAlign: 'center',
      }}
      aria-label="Page not found"
    >
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 900,
          fontSize: 112,
          color: 'var(--gold)',
          lineHeight: 1,
          marginBottom: 4,
          letterSpacing: '-0.02em',
        }}
        aria-hidden="true"
      >
        404
      </div>
      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 900,
          fontSize: 36,
          color: 'var(--ink)',
          margin: '0 0 12px',
          letterSpacing: '0.03em',
        }}
      >
        PAGE NOT FOUND
      </h1>
      <p
        style={{
          color: 'var(--ink-muted)',
          fontSize: 16,
          marginBottom: 32,
          lineHeight: 1.5,
        }}
      >
        The throne is elsewhere. This page doesn't exist.
      </p>
      <button
        onClick={() => onNavigate('home')}
        style={{
          background: 'var(--ruby)',
          color: 'var(--ruby-ink)',
          border: 'none',
          borderRadius: 12,
          padding: '14px 32px',
          fontFamily: 'var(--font-body)',
          fontWeight: 800,
          fontSize: 15,
          cursor: 'pointer',
          minHeight: 48,
        }}
        className="ruby-glow"
      >
        Back to the throne
      </button>
    </main>
  )
}
