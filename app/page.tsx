import Link from 'next/link'
import { BookOpen, Brain, TrendingUp, BookMarked } from 'lucide-react'

const features = [
  {
    icon: BookOpen,
    title: 'Upload any PDF',
    body: 'Textbooks, notes, revision sheets — Groq reads them and writes cards that feel like they came from a great teacher.',
  },
  {
    icon: Brain,
    title: 'AI-generated flashcards',
    body: 'Key concepts, definitions, relationships, and worked examples — not shallow bullet points.',
  },
  {
    icon: TrendingUp,
    title: 'Spaced repetition',
    body: 'The SM-2 algorithm schedules each card individually. Hard cards come back sooner. Mastered ones fade into the background.',
  },
]

export default function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#09090b', color: '#fafafa', fontFamily: 'Inter, -apple-system, sans-serif' }}>
      {/* Header */}
      <header style={{ padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <BookMarked size={22} color="#6366f1" />
          <span style={{ fontWeight: 800, fontSize: 18, color: '#ffffff', letterSpacing: '-0.03em' }}>SmartDeck</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/login" style={{
            padding: '8px 16px', background: 'transparent',
            border: '1px solid #2a2a2e', color: '#a1a1aa',
            borderRadius: 8, textDecoration: 'none', fontSize: 14, fontWeight: 500,
            transition: 'all 200ms ease',
          }}>
            Sign in
          </Link>
          <Link href="/signup" style={{
            padding: '8px 18px', background: '#6366f1',
            color: '#ffffff', borderRadius: 8, textDecoration: 'none',
            fontSize: 14, fontWeight: 600,
            boxShadow: '0 4px 20px rgba(99,102,241,0.3)',
            transition: 'all 200ms ease',
          }}>
            Get started
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main style={{ maxWidth: 900, margin: '0 auto', padding: '80px 32px 40px', textAlign: 'center' }}>
        {/* Badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)',
          color: '#818cf8', fontSize: 12, fontWeight: 600,
          padding: '5px 14px', borderRadius: 999, marginBottom: 28,
          letterSpacing: '0.04em',
        }}>
          Powered by Groq AI
        </div>

        <h1 style={{ fontSize: 56, fontWeight: 800, color: '#ffffff', letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: 20 }}>
          Upload a PDF.<br />
          <span style={{ color: '#6366f1' }}>Study smarter.</span>
        </h1>

        <p style={{ fontSize: 18, color: '#71717a', marginBottom: 40, maxWidth: 600, margin: '0 auto 40px', lineHeight: 1.6 }}>
          SmartDeck turns any study material into AI-generated flashcards and schedules your
          reviews so you always know exactly what to study next.
        </p>

        <Link href="/signup" style={{
          display: 'inline-block', padding: '14px 32px',
          background: '#6366f1', color: '#ffffff',
          borderRadius: 12, textDecoration: 'none',
          fontWeight: 700, fontSize: 16,
          boxShadow: '0 4px 30px rgba(99,102,241,0.35)',
          transition: 'all 200ms ease',
        }}>
          Create your first deck — it&apos;s free
        </Link>

        {/* Feature cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 80 }}>
          {features.map(({ icon: Icon, title, body }) => (
            <div key={title} style={{
              background: '#18181b', border: '1px solid #2a2a2e',
              borderRadius: 16, padding: 24, textAlign: 'left',
              transition: 'all 200ms ease',
            }}>
              <div style={{
                width: 40, height: 40, background: 'rgba(99,102,241,0.1)',
                border: '1px solid rgba(99,102,241,0.2)',
                borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
              }}>
                <Icon size={18} color="#6366f1" />
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#ffffff', marginBottom: 8 }}>{title}</h3>
              <p style={{ fontSize: 13, color: '#71717a', lineHeight: 1.6 }}>{body}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer style={{ textAlign: 'center', padding: '40px 32px', color: '#3f3f46', fontSize: 13 }}>
        SmartDeck · Built for Cuemath AI Builder Challenge
      </footer>
    </div>
  )
}
