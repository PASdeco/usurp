/**
 * FAQ page — all 20 questions from Appendix B, accordion style
 */

import { useState } from 'react'
import { IconChevronRight } from '../components/icons'

interface FaqItem {
  q: string
  a: React.ReactNode
}

const FAQ_ITEMS: FaqItem[] = [
  {
    q: 'What is Usurp?',
    a: 'A game where one player holds a public crown and earns a slow drip from a shared pot until someone steals it.',
  },
  {
    q: 'How do I play?',
    a: 'Connect a wallet, make sure you have USDC for the steal price and a little extra for gas, then press "Steal the Crown". Gas on Arc is paid in USDC and is very cheap.',
  },
  {
    q: 'What does stealing cost?',
    a: (
      <>
        It starts at <strong>$0.13</strong> and rises <strong>20%</strong> with every steal,
        up to a <strong>$5.00</strong> cap. The price resets to $0.13 after an hour with no
        steals, or when the pot has been empty for 10 minutes.
      </>
    ),
  },
  {
    q: 'Where does my money go?',
    a: '50% goes to the builder wallet and 50% goes to the shared pot that pays the holder\'s drip. Both splits are fixed in the contract.',
  },
  {
    q: 'How much can I earn?',
    a: (
      <>
        While you hold the crown you earn <strong>2% of your steal price every 30 seconds</strong>,
        as long as the pot has funds. It takes about 25 minutes to earn back your steal price.
        You can earn more by holding longer, or nothing if you are stolen from quickly.
      </>
    ),
  },
  {
    q: 'Will I make money?',
    a: 'Not necessarily, and most players will lose a little. Together, players get back at most half of what they pay in. Nothing is guaranteed.',
  },
  {
    q: 'Do I get my steal price back when I\'m dethroned?',
    a: 'No. You keep the drip you earned while you held the crown, but the steal price itself is not refunded.',
  },
  {
    q: 'What happens if the pot is empty?',
    a: 'The drip pauses until the next steal refills it. The game will show "Empty" in the pot health indicator and tell you "Pot is empty. The next steal refills it."',
  },
  {
    q: 'When does the price reset?',
    a: 'After 1 hour with no steals, or when the pot has been empty for 10 minutes. After a reset, the price returns to $0.13.',
  },
  {
    q: 'When do I get my earnings?',
    a: 'Earnings accumulate in the contract. Press "Claim" to withdraw them at any time. You can claim even if the game is paused.',
  },
  {
    q: 'Why is there no transaction every 30 seconds?',
    a: 'Earnings are calculated from elapsed time on-chain. The drip builds up without any extra transactions — you just claim the accumulated total when you\'re ready.',
  },
  {
    q: 'What does "Healthy / Low / Empty" mean?',
    a: 'It shows whether the pot can keep paying the current holder\'s drip. Healthy means plenty of funds. Low means it\'s running short. Empty means the drip is paused. The exact balance is always public in the contract.',
  },
  {
    q: 'Is the contract safe?',
    a: (
      <>
        The contract uses standard safety patterns (ReentrancyGuard, Pausable,
        Ownable2Step from OpenZeppelin) and is deployed on Arc Mainnet. However, no software
        is risk-free. <strong>Current status: unaudited.</strong> An independent audit is
        planned. See the Disclaimer for full risk disclosures.
      </>
    ),
  },
  {
    q: 'Who runs Usurp?',
    a: (
      <>
        Usurp is built by ycee, an independent developer. Contact:{' '}
        <a href="mailto:contact@usurp-arena.vercel.app" style={{ color: 'var(--gold-text)' }}>a4bailout@gmail.com</a>.{' '}
        Usurp is not affiliated with Circle or Arc.
      </>
    ),
  },
  {
    q: 'Is this gambling or an investment?',
    a: 'Usurp is a game, not an investment product. Rules about games of chance differ between countries. You are responsible for making sure it is legal where you live. See the Disclaimer.',
  },
  {
    q: 'Who can play?',
    a: 'You must be 18 or older and not in a restricted jurisdiction. By entering the game you confirm both.',
  },
  {
    q: 'What network does Usurp run on?',
    a: 'Usurp runs on Arc Mainnet — Circle\'s USDC-native blockchain. All payments use real USDC. Make sure you are connected to Arc Mainnet (chain ID 5042) in your wallet.',
  },
  {
    q: 'What is Usurp Arena?',
    a: 'A planned duel mode where challengers face the holder in a 60-second contest judged by an AI panel. It is not live yet — sign up to be notified on the home screen.',
  },
  {
    q: 'What if a transaction fails or the price changed?',
    a: 'Prices can rise between when you click "Steal" and when your transaction confirms, if someone else steals first. The contract protects you from paying more than you approved. The game will show the new price — review it and try again.',
  },
  {
    q: 'How do I contact support?',
    a: (
      <>
        Email <a href="mailto:[REDACTED_EMAIL]" style={{ color: 'var(--gold-text)' }}>[REDACTED_EMAIL]</a> for support.
      </>
    ),
  },
]

// ─── Accordion item ───────────────────────────────────────────────────────────

function FaqAccordionItem({
  item,
  index,
  isOpen,
  onToggle,
}: {
  item: FaqItem
  index: number
  isOpen: boolean
  onToggle: () => void
}) {
  const id = `faq-answer-${index}`
  const btnId = `faq-btn-${index}`

  return (
    <div
      style={{
        borderBottom: '1px solid var(--border)',
      }}
    >
      <button
        id={btnId}
        aria-expanded={isOpen}
        aria-controls={id}
        onClick={onToggle}
        style={{
          width: '100%',
          background: 'none',
          border: 'none',
          padding: '18px 0',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 16,
          cursor: 'pointer',
          textAlign: 'left',
          fontFamily: 'var(--font-body)',
          color: 'var(--ink)',
          fontWeight: 700,
          fontSize: 15,
          lineHeight: 1.4,
          minHeight: 44,
        }}
      >
        <span>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              fontSize: 12,
              color: 'var(--gold-text)',
              marginRight: 10,
            }}
          >
            {String(index + 1).padStart(2, '0')}
          </span>
          {item.q}
        </span>
        <span
          aria-hidden="true"
          style={{
            color: 'var(--ink-muted)',
            flexShrink: 0,
            marginTop: 2,
            transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
          }}
        >
          <IconChevronRight size={18} />
        </span>
      </button>

      <div
        id={id}
        role="region"
        aria-labelledby={btnId}
        hidden={!isOpen}
      >
        <div
          style={{
            padding: '0 0 20px',
            color: 'var(--ink-muted)',
            fontSize: 15,
            lineHeight: 1.7,
            maxWidth: '65ch',
          }}
        >
          {item.a}
        </div>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function FaqPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const toggle = (i: number) => setOpenIndex(openIndex === i ? null : i)

  return (
    <main
      style={{ maxWidth: 760, margin: '0 auto', padding: '40px 24px 64px' }}
      aria-label="Frequently asked questions"
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
        FAQ
      </h1>
      <p
        style={{
          color: 'var(--ink-muted)',
          fontSize: 17,
          margin: '0 0 36px',
          lineHeight: 1.5,
        }}
      >
        Common questions about how Usurp works, the numbers, and what to expect.
      </p>

      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 20,
          padding: '8px 28px',
        }}
      >
        {FAQ_ITEMS.map((item, i) => (
          <FaqAccordionItem
            key={i}
            item={item}
            index={i}
            isOpen={openIndex === i}
            onToggle={() => toggle(i)}
          />
        ))}
      </div>
    </main>
  )
}
