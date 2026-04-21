'use client'
import Link from 'next/link'
import { useState } from 'react'
import { BookMarked, FileUp, Sparkles, Brain, ChevronDown } from 'lucide-react'

const steps = [
  {
    num: '01',
    icon: FileUp,
    title: 'Upload any PDF',
    desc: 'Drop in any textbook, notes, or study material. Text-based PDFs work best.',
  },
  {
    num: '02',
    icon: Sparkles,
    title: 'AI generates your deck',
    desc: 'AI writes cards like an expert teacher — real questions that test understanding, not shallow bullets.',
  },
  {
    num: '03',
    icon: Brain,
    title: 'Study with spaced repetition',
    desc: 'The SM-2 algorithm shows you each card at exactly the right time — study less, remember more.',
  },
]

const faqs = [
  { q: 'Is it free?', a: 'Yes — completely free during this period. No credit card required.' },
  { q: 'What PDFs work best?', a: 'Text-based PDFs work best. Scanned image PDFs are not currently supported.' },
  { q: 'How long until I master something?', a: 'Typically 5–7 correct reviews over 2–3 weeks, depending on difficulty and your recall quality.' },
  { q: 'Can I edit generated cards?', a: 'Card editing is coming soon. For now, you can delete a deck and re-upload an improved PDF.' },
]

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ borderBottom: '1px solid #2a2a2e' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', padding: '20px 0',
          background: 'transparent', border: 'none', cursor: 'pointer',
          color: '#ffffff', fontSize: 15, fontWeight: 600, textAlign: 'left',
          transition: 'color 200ms ease',
        }}
      >
        {q}
        <ChevronDown
          size={18}
          color="#71717a"
          style={{ transition: 'transform 250ms ease', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }}
        />
      </button>
      <div style={{
        overflow: 'hidden',
        maxHeight: open ? 200 : 0,
        transition: 'max-height 300ms ease',
      }}>
        <p style={{ color: '#71717a', lineHeight: 1.7, paddingBottom: 20, fontSize: 14 }}>{a}</p>
      </div>
    </div>
  )
}

export default function HowItWorksPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#09090b', color: '#ffffff' }}>
      {/* Nav */}
      <header style={{
        borderBottom: '1px solid #2a2a2e', padding: '16px 32px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: '#111113', position: 'sticky', top: 0, zIndex: 10,
      }}>
        <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <BookMarked size={20} color="#6366f1" />
          <span style={{ fontWeight: 800, fontSize: 18, color: '#ffffff', letterSpacing: '-0.03em' }}>SmartDeck</span>
        </Link>
        <Link
          href="/login"
          style={{
            padding: '9px 20px', background: '#6366f1', color: '#ffffff',
            borderRadius: 8, textDecoration: 'none', fontSize: 14, fontWeight: 600,
            transition: 'all 200ms ease',
          }}
        >
          Sign in
        </Link>
      </header>

      {/* Hero */}
      <section style={{
        padding: '100px 32px 80px',
        textAlign: 'center',
        background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(99,102,241,0.08) 0%, transparent 70%)',
      }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <div style={{
            display: 'inline-block', padding: '4px 14px', borderRadius: 999,
            background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)',
            color: '#818cf8', fontSize: 12, fontWeight: 600, letterSpacing: '0.06em',
            textTransform: 'uppercase', marginBottom: 24,
          }}>
            Powered by Groq AI + SM-2 Algorithm
          </div>
          <h1 style={{ fontSize: 56, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 20, color: '#ffffff' }}>
            Study smarter,<br />
            <span style={{ color: '#6366f1' }}>not harder</span>
          </h1>
          <p style={{ fontSize: 18, color: '#71717a', lineHeight: 1.7, marginBottom: 40, maxWidth: 500, margin: '0 auto 40px' }}>
            SmartDeck uses AI and cognitive science to help you remember everything you learn — forever.
          </p>
          <Link
            href="/signup"
            style={{
              display: 'inline-block', padding: '14px 36px',
              background: '#6366f1', color: '#ffffff',
              borderRadius: 12, textDecoration: 'none', fontWeight: 700, fontSize: 16,
              boxShadow: '0 4px 30px rgba(99,102,241,0.4)',
              transition: 'all 200ms ease',
            }}
          >
            Get started free
          </Link>
        </div>
      </section>

      {/* 3 Steps */}
      <section style={{ padding: '0 32px 100px', maxWidth: 1040, margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', fontSize: 36, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 16, color: '#ffffff' }}>
          How it works
        </h2>
        <p style={{ textAlign: 'center', color: '#71717a', marginBottom: 48, fontSize: 15 }}>
          Three steps to never forgetting what you learn
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {steps.map(({ num, icon: Icon, title, desc }) => (
            <div key={title} style={{
              background: '#18181b', border: '1px solid #2a2a2e',
              borderRadius: 16, padding: 28,
              transition: 'all 200ms ease',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#ffffff' }}>{num}</span>
                </div>
                <Icon size={20} color="#6366f1" />
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 10, color: '#ffffff', letterSpacing: '-0.01em' }}>{title}</h3>
              <p style={{ color: '#71717a', lineHeight: 1.6, fontSize: 14 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Science / Forgetting Curve */}
      <section style={{ background: '#111113', borderTop: '1px solid #2a2a2e', borderBottom: '1px solid #2a2a2e', padding: '80px 32px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 16, color: '#ffffff' }}>
              Why spaced repetition works
            </h2>
            <p style={{ color: '#71717a', lineHeight: 1.7, marginBottom: 14, fontSize: 15 }}>
              Hermann Ebbinghaus discovered that without reviewing, you forget <strong style={{ color: '#ef4444' }}>70% of new information</strong> within 24 hours. This is the &ldquo;forgetting curve.&rdquo;
            </p>
            <p style={{ color: '#71717a', lineHeight: 1.7, fontSize: 15 }}>
              SmartDeck fights this by showing you each card right before you would forget it — reinforcing memory at exactly the right moment.
            </p>
          </div>
          {/* Forgetting curve SVG */}
          <div style={{ background: '#18181b', border: '1px solid #2a2a2e', borderRadius: 16, padding: 24 }}>
            <svg viewBox="0 0 320 180" style={{ width: '100%' }}>
              {/* Axes */}
              <line x1="30" y1="10" x2="30" y2="155" stroke="#3f3f46" strokeWidth="1.5"/>
              <line x1="30" y1="155" x2="305" y2="155" stroke="#3f3f46" strokeWidth="1.5"/>
              {/* Labels */}
              <text x="14" y="14" fill="#71717a" fontSize="9" textAnchor="middle">100%</text>
              <text x="18" y="158" fill="#71717a" fontSize="9">0%</text>
              <text x="165" y="175" fill="#71717a" fontSize="9" textAnchor="middle">Time →</text>
              <text x="8" y="85" fill="#71717a" fontSize="9" transform="rotate(-90 8 85)" textAnchor="middle">Memory</text>
              {/* Decay curve without reviews (red) */}
              <path
                d="M 30 15 Q 80 20 120 70 Q 170 120 230 148 Q 265 155 305 155"
                stroke="#ef4444" strokeWidth="1.5" fill="none" opacity="0.5"
              />
              {/* With spaced repetition (indigo) */}
              <path
                d="M 30 15 Q 60 18 90 55 L 90 30 Q 120 32 150 65 L 150 38 Q 190 40 220 75 L 220 45 Q 260 46 295 68"
                stroke="#6366f1" strokeWidth="2" fill="none"
              />
              {/* Review markers */}
              {[90, 150, 220].map(x => (
                <g key={x}>
                  <line x1={x} y1="25" x2={x} y2="80" stroke="#6366f1" strokeWidth="1" strokeDasharray="3,2" opacity="0.6"/>
                  <text x={x} y="22" fill="#6366f1" fontSize="8" textAnchor="middle">review</text>
                </g>
              ))}
              {/* Legend */}
              <line x1="35" y1="170" x2="55" y2="170" stroke="#ef4444" strokeWidth="1.5" opacity="0.5"/>
              <text x="58" y="173" fill="#71717a" fontSize="8">Without review</text>
              <line x1="140" y1="170" x2="160" y2="170" stroke="#6366f1" strokeWidth="2"/>
              <text x="163" y="173" fill="#71717a" fontSize="8">With SmartDeck</text>
            </svg>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: '80px 32px', maxWidth: 680, margin: '0 auto' }}>
        <h2 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 8, color: '#ffffff', textAlign: 'center' }}>FAQ</h2>
        <p style={{ color: '#71717a', textAlign: 'center', marginBottom: 48, fontSize: 14 }}>
          Everything you need to know
        </p>
        <div>
          {faqs.map(({ q, a }) => <FaqItem key={q} q={q} a={a} />)}
        </div>
      </section>

      {/* Footer CTA */}
      <section style={{
        padding: '60px 32px 80px', textAlign: 'center',
        background: 'radial-gradient(ellipse 60% 60% at 50% 100%, rgba(99,102,241,0.08) 0%, transparent 70%)',
      }}>
        <h2 style={{ fontSize: 32, fontWeight: 800, color: '#ffffff', letterSpacing: '-0.03em', marginBottom: 12 }}>
          Ready to study smarter?
        </h2>
        <p style={{ color: '#71717a', marginBottom: 32, fontSize: 15 }}>
          Upload your first PDF and get flashcards in under 60 seconds.
        </p>
        <Link
          href="/signup"
          style={{
            display: 'inline-block', padding: '14px 36px',
            background: '#6366f1', color: '#ffffff',
            borderRadius: 12, textDecoration: 'none', fontWeight: 700, fontSize: 16,
            boxShadow: '0 4px 30px rgba(99,102,241,0.35)',
          }}
        >
          Get started free
        </Link>
      </section>
    </div>
  )
}
