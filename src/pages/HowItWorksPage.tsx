/**
 * How it works & fees page — full Appendix A copy
 */

import { IconInfo, IconExternalLink } from '../components/icons'

// ─── Shared section wrapper ───────────────────────────────────────────────────

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 20,
        padding: '28px 28px',
        marginBottom: 20,
      }}
      aria-label={title}
    >
      <h2
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 900,
          fontSize: 26,
          letterSpacing: '0.03em',
          color: 'var(--ink)',
          margin: '0 0 16px',
          lineHeight: 1.1,
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  )
}

interface PProps {
  children: React.ReactNode
  style?: React.CSSProperties
}

function P({ children, style }: PProps) {
  return (
    <p
      style={{
        margin: '0 0 12px',
        color: 'var(--ink)',
        fontSize: 15,
        lineHeight: 1.7,
        maxWidth: '65ch',
        ...style,
      }}
    >
      {children}
    </p>
  )
}

function BulletList({ items }: { items: React.ReactNode[] }) {
  return (
    <ul
      style={{
        margin: '0 0 12px',
        paddingLeft: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      {items.map((item, i) => (
        <li
          key={i}
          style={{ color: 'var(--ink)', fontSize: 15, lineHeight: 1.65 }}
        >
          {item}
        </li>
      ))}
    </ul>
  )
}

function Mono({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        fontFamily: 'var(--font-mono)',
        fontWeight: 700,
        color: 'var(--gold-text)',
        fontSize: '0.97em',
      }}
    >
      {children}
    </span>
  )
}

// ─── Worked example table ─────────────────────────────────────────────────────

function WorkedExample() {
  // Steal #4 at $0.22, 30-min hold
  const stealPrice = 0.13 * Math.pow(1.2, 3)  // ≈ 0.2246
  const pot50 = stealPrice * 0.5
  const builder50 = stealPrice * 0.5
  const dripPer30s = stealPrice * 0.02
  const breakevenMins = 25
  const holdMins = 30
  const earned = dripPer30s * (holdMins * 2)  // 2 drips per minute

  const fmt = (n: number) =>
    '$' + n.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 })

  const rows: [string, string, string][] = [
    ['Steal price (4th steal)', fmt(stealPrice), 'Paid to steal the crown'],
    ['To the pot (50%)', fmt(pot50), 'Funds the holder drip'],
    ['To the builder (50%)', fmt(builder50), 'Builder revenue'],
    ['Drip per 30 seconds', fmt(dripPer30s), '2% of your steal price'],
    ['Time to break-even', `~${breakevenMins} min`, 'At any steal price level'],
    [`Earned after ${holdMins} min hold`, fmt(earned), `${holdMins * 2} drips × ${fmt(dripPer30s)}`],
    ['Net (earned − paid)', fmt(earned - stealPrice), earned >= stealPrice ? 'Profit (held long enough)' : 'Loss (stolen too soon)'],
  ]

  return (
    <div style={{ overflowX: 'auto', marginBottom: 12 }}>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: 14,
          fontFamily: 'var(--font-body)',
        }}
        aria-label="Worked example: steal #4, 30-minute hold"
      >
        <thead>
          <tr>
            {['Item', 'Amount (USDC)', 'Note'].map(h => (
              <th
                key={h}
                style={{
                  textAlign: 'left',
                  padding: '8px 12px',
                  borderBottom: '2px solid var(--border)',
                  color: 'var(--ink-muted)',
                  fontWeight: 700,
                  fontSize: 12,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(([label, amount, note], i) => (
            <tr
              key={i}
              style={{
                borderBottom: '1px solid var(--border)',
                background: i % 2 === 0 ? 'transparent' : 'var(--surface-2)',
              }}
            >
              <td style={{ padding: '10px 12px', color: 'var(--ink)', fontWeight: 600 }}>{label}</td>
              <td
                style={{
                  padding: '10px 12px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  color: 'var(--gold-text)',
                }}
                className="tabular-nums"
              >
                {amount}
              </td>
              <td style={{ padding: '10px 12px', color: 'var(--ink-muted)' }}>{note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Price curve table ────────────────────────────────────────────────────────

function PriceCurveTable() {
  const rows: [number, number][] = []
  let p = 0.13
  for (let i = 0; i < 18; i++) {
    rows.push([i + 1, Math.min(p, 5.0)])
    p = p * 1.2
    if (p >= 5.0) break
  }
  rows.push([rows.length + 1, 5.0])  // cap

  return (
    <div style={{ overflowX: 'auto', marginBottom: 12 }}>
      <table
        style={{
          borderCollapse: 'collapse',
          fontSize: 14,
          fontFamily: 'var(--font-body)',
        }}
        aria-label="Price escalation curve"
      >
        <thead>
          <tr>
            {['Steal #', 'Price (USDC)'].map(h => (
              <th
                key={h}
                style={{
                  textAlign: 'left',
                  padding: '8px 16px',
                  borderBottom: '2px solid var(--border)',
                  color: 'var(--ink-muted)',
                  fontWeight: 700,
                  fontSize: 12,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(([n, price], i) => (
            <tr
              key={i}
              style={{
                borderBottom: '1px solid var(--border)',
                background: i % 2 === 0 ? 'transparent' : 'var(--surface-2)',
              }}
            >
              <td style={{ padding: '8px 16px', color: 'var(--ink-muted)' }}>#{n}</td>
              <td
                style={{
                  padding: '8px 16px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  color: price >= 5 ? 'var(--ruby)' : 'var(--gold-text)',
                }}
                className="tabular-nums"
              >
                ${price.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
                {price >= 5 && (
                  <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--ink-muted)', fontFamily: 'var(--font-body)' }}>
                    (cap)
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function HowItWorksPage() {
  return (
    <main
      style={{ maxWidth: 760, margin: '0 auto', padding: '40px 24px 64px' }}
      aria-label="How it works and fees"
    >
      {/* Hero heading */}
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
        HOW IT WORKS &amp; FEES
      </h1>
      <p
        style={{
          color: 'var(--ink-muted)',
          fontSize: 17,
          margin: '0 0 36px',
          lineHeight: 1.5,
        }}
      >
        Full rules, price curve, drip rate, fees and reset conditions. Everything you need to
        understand the game before you play.
      </p>

      {/* Network notice */}
      <div
        role="note"
        style={{
          background: 'var(--surface-3)',
          border: '1.5px solid var(--border-strong)',
          borderRadius: 14,
          padding: '14px 18px',
          marginBottom: 24,
          display: 'flex',
          alignItems: 'flex-start',
          gap: 10,
          fontSize: 14,
          color: 'var(--ink-muted)',
        }}
      >
        <IconInfo size={16} style={{ color: 'var(--gold)', marginTop: 2, flexShrink: 0 }} />
        <span>
          <strong style={{ color: 'var(--ink)' }}>Arc Mainnet — real USDC.</strong>{' '}
          Usurp runs on Arc Mainnet. All payments use real USDC. Play responsibly and only
          with funds you can afford to lose.
        </span>
      </div>

      {/* 1. How it works */}
      <Section title="How Usurp works">
        <P>
          There is one crown and one holder. Pay the current steal price to take the crown.
          While you hold it, a drip is paid to you from the shared pot. Anyone can steal the
          crown by paying the new, higher price. When your crown is stolen, you keep
          everything you earned.
        </P>
      </Section>

      {/* 2. The numbers */}
      <Section title="The numbers (readable in the contract)">
        <BulletList
          items={[
            <>Start price: <Mono>$0.13</Mono>.</>,
            <>Every steal costs <Mono>20%</Mono> more than the last. The price cap is <Mono>$5.00</Mono>.</>,
            <>Each steal payment is split: <Mono>50%</Mono> to the builder wallet, <Mono>50%</Mono> to the pot.</>,
            <>
              While you hold the crown, you earn a drip of <Mono>2%</Mono> of your own steal
              price every <Mono>30 seconds</Mono>, paid from the pot. That is about{' '}
              <Mono>25 minutes</Mono> to earn back what you paid, at any price.
            </>,
            <>
              The drip can never be more than what is in the pot. If the pot is empty, there
              is no drip until the next steal refills it.
            </>,
            <>You do not get your steal price back. Your income is the drip only.</>,
            <>
              The price resets to <Mono>$0.13</Mono> after <Mono>1 hour</Mono> with no
              steals, or when the pot stays empty for <Mono>10 minutes</Mono>. The builder
              then reseeds the pot.
            </>,
          ]}
        />
      </Section>

      {/* 3. Price curve */}
      <Section title="Price escalation curve">
        <P>
          Each steal costs exactly 20% more than the one before it, until the{' '}
          <Mono>$5.00</Mono> cap is reached. After the cap, every steal costs{' '}
          <Mono>$5.00</Mono> until a reset.
        </P>
        <PriceCurveTable />
        <P style={{ color: 'var(--ink-muted)', fontSize: 13 }}>
          All prices are in USDC. The exact value is computed on-chain as{' '}
          <code
            style={{
              fontFamily: 'var(--font-mono)',
              background: 'var(--surface-3)',
              padding: '2px 6px',
              borderRadius: 4,
              fontSize: 12,
            }}
          >
            min(startPrice × 1.2^steals, $5.00)
          </code>
          .
        </P>
      </Section>

      {/* 4. Worked example */}
      <Section title="Worked example">
        <P>
          Assume you are the 4th person to steal the crown in a fresh round, and you
          hold it for 30 minutes before being dethroned.
        </P>
        <WorkedExample />
        <P>
          You paid <Mono>~$0.2246</Mono> to steal and earned <Mono>~$0.2696</Mono> over
          30 minutes — a small profit. If you had been dethroned after only 10 minutes you
          would have earned <Mono>~$0.0898</Mono> — a loss of <Mono>~$0.1348</Mono>.
          Break-even is roughly 25 minutes at any price level.
        </P>
      </Section>

      {/* 5. Fees */}
      <Section title="Fees">
        <P>
          The builder receives <Mono>50%</Mono> of all steal payments. This is disclosed
          here and enforced in the contract. There are no other fees. You pay normal
          network gas in USDC on Arc. Gas on Arc is stable and predictable.
        </P>
        <P>There is no fee to claim your earnings. Claiming is a standard contract call.</P>
      </Section>

      {/* 6. What to expect / honest odds */}
      <Section title="What to expect — honest odds statement">
        <div
          role="note"
          style={{
            background: 'var(--surface-2)',
            border: '1.5px solid var(--border-strong)',
            borderRadius: 12,
            padding: '14px 18px',
            marginBottom: 16,
            display: 'flex',
            gap: 10,
            alignItems: 'flex-start',
          }}
        >
          <IconInfo size={16} style={{ color: 'var(--low)', marginTop: 2, flexShrink: 0 }} />
          <P style={{ margin: 0, color: 'var(--ink)' }}>
            The pot is funded only by steal payments and any builder seed. Because only half
            of each payment goes to the pot, players together can get back{' '}
            <strong>at most half of what they put in</strong>. Most players will lose a
            little, and a few who hold the crown for a long time may come out ahead.
            Earnings are not guaranteed, and you can lose everything you pay.
          </P>
        </div>
        <P>
          This is not an investment. The game is transparent about its economics so you can
          decide whether to play.
        </P>
      </Section>

      {/* 7. Pot health */}
      <Section title="Pot health">
        <P>
          The game shows one of three states for the shared pot:
        </P>
        <BulletList
          items={[
            <><strong style={{ color: 'var(--ok)' }}>Healthy</strong> — the pot can sustain the current drip rate comfortably.</>,
            <><strong style={{ color: 'var(--low)' }}>Low</strong> — the pot is running low. The drip continues but may stop soon.</>,
            <><strong style={{ color: 'var(--empty)' }}>Empty</strong> — the pot is empty. The drip is paused. The next steal refills it.</>,
          ]}
        />
        <P>
          The exact pot balance is not shown on the main screen, but it is always public on
          the blockchain and readable in the contract.
        </P>
      </Section>

      {/* 8. Resets */}
      <Section title="When does the game reset?">
        <P>The crown price resets to <Mono>$0.13</Mono> in two cases:</P>
        <BulletList
          items={[
            <>No steals have occurred for <Mono>1 hour</Mono>. The current holder keeps any unclaimed earnings.</>,
            <>The pot has been empty for <Mono>10 minutes</Mono>. This prevents the game stalling indefinitely with a worthless crown.</>,
          ]}
        />
        <P>
          After a reset, the builder reseeds the pot to a minimum amount before the new
          round can begin.
        </P>
      </Section>

      {/* 9. Verify */}
      <Section title="Verify it yourself">
        <P>
          All game logic is in a single deployed smart contract on Arc Mainnet.
          Every steal, drip, claim and reset is a public on-chain event.
        </P>
        <P>
          Contract address:{' '}
          <a
            href="https://explorer.arc.io/address/0xC47cc87cb5fe4EDAe581064045A79074264bC415"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--gold-text)', textDecoration: 'underline', fontFamily: 'var(--font-mono)', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 4 }}
          >
            0xC47cc87cb5fe4EDAe581064045A79074264bC415 <IconExternalLink size={12} />
          </a>
        </P>
      </Section>
    </main>
  )
}
