/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Big Shoulders Display', 'system-ui', 'sans-serif'],
        body:    ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        mono:    ['JetBrains Mono', 'Menlo', 'monospace'],
      },
      colors: {
        // Map CSS vars → Tailwind utility classes
        bg:            'var(--bg)',
        surface:       'var(--surface)',
        'surface-2':   'var(--surface-2)',
        'surface-3':   'var(--surface-3)',
        border:        'var(--border)',
        'border-strong': 'var(--border-strong)',
        ink:           'var(--ink)',
        'ink-muted':   'var(--ink-muted)',
        gold:          'var(--gold)',
        'gold-text':   'var(--gold-text)',
        'gold-ink':    'var(--gold-ink)',
        ruby:          'var(--ruby)',
        'ruby-ink':    'var(--ruby-ink)',
        ok:            'var(--ok)',
        low:           'var(--low)',
        empty:         'var(--empty)',
        danger:        'var(--danger)',
        'ring-track':  'var(--ring-track)',
      },
      borderRadius: {
        panel: 'var(--radius-panel)',
        'panel-sm': '14px',
        'panel-xs': '10px',
      },
      boxShadow: {
        ruby:  '0 0 0 1px var(--ruby), 0 0 24px rgba(217,30,72,0.45), 0 4px 32px rgba(217,30,72,0.3)',
        gold:  '0 0 0 1px var(--gold), 0 0 20px rgba(245,196,81,0.35)',
        panel: '0 2px 24px rgba(0,0,0,0.22)',
      },
      animation: {
        'pulse-gold': 'pulse-gold 2.4s ease-in-out infinite',
        'spin-slow':  'spin 3s linear infinite',
        'fade-in':    'fade-in 0.3s ease forwards',
        'slide-up':   'slide-up 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards',
      },
      keyframes: {
        'pulse-gold': {
          '0%, 100%': { opacity: '1' },
          '50%':       { opacity: '0.65' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
