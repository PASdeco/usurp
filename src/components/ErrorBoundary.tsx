/**
 * ErrorBoundary — catches render errors and shows a friendly fallback.
 * Wrap around page content so a single page crash doesn't kill the whole app.
 */

import { Component, type ReactNode } from 'react'
import { IconAlert } from './icons'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  override componentDidCatch(error: Error, info: { componentStack: string }) {
    // Log to console in dev; hook up to error reporting service in prod
    console.error('[USURP ErrorBoundary]', error, info.componentStack)
  }

  override render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div
          role="alert"
          style={{
            maxWidth: 600,
            margin: '80px auto',
            padding: '40px 32px',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 20,
            textAlign: 'center',
          }}
        >
          <div style={{ color: 'var(--empty)', display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <IconAlert size={40} />
          </div>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 900,
              fontSize: 28,
              margin: '0 0 12px',
              color: 'var(--ink)',
            }}
          >
            Something went wrong
          </h2>
          <p style={{ color: 'var(--ink-muted)', fontSize: 15, margin: '0 0 24px' }}>
            The game hit an unexpected error. Refreshing the page usually fixes it.
          </p>
          {this.state.error && (
            <pre
              style={{
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: '12px 16px',
                fontSize: 12,
                fontFamily: 'var(--font-mono)',
                color: 'var(--ink-muted)',
                textAlign: 'left',
                overflowX: 'auto',
                marginBottom: 24,
              }}
            >
              {this.state.error.message}
            </pre>
          )}
          <button
            onClick={() => window.location.reload()}
            style={{
              background: 'var(--ruby)',
              color: 'var(--ruby-ink)',
              border: 'none',
              borderRadius: 12,
              padding: '12px 28px',
              fontFamily: 'var(--font-body)',
              fontWeight: 800,
              fontSize: 15,
              cursor: 'pointer',
              minHeight: 48,
            }}
          >
            Reload page
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
