import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Play } from 'lucide-react'
import type { Deck } from '@/types'
import OnboardingModal from '@/components/onboarding-modal'
import DeckCard from '@/components/deck-card'

async function getDeckDueCount(
  deckId: string,
  userId: string,
  supabase: Awaited<ReturnType<typeof createClient>>
) {
  const today = new Date().toISOString().split('T')[0]
  const { data: cards } = await supabase
    .from('cards')
    .select('id, card_reviews(next_review_date, user_id)')
    .eq('deck_id', deckId)
  if (!cards) return 0
  return cards.filter(card => {
    const reviews = card.card_reviews as Array<{ next_review_date: string; user_id: string }>
    const userReview = reviews.find(r => r.user_id === userId)
    return !userReview || userReview.next_review_date <= today
  }).length
}

function extractName(email: string): string {
  const local = email.split('@')[0]
  const nameOnly = local.replace(/\d+.*$/, '').replace(/[._-]/g, ' ').trim()
  return nameOnly
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .filter(Boolean)
    .join(' ') || 'there'
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const hour = new Date().getUTCHours() + 5 // IST offset approximation
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const name = extractName(user.email ?? '')

  const { data: decks } = await supabase
    .from('decks')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const decksWithDue = await Promise.all(
    (decks ?? []).map(async (deck: Deck) => {
      const dueCount = await getDeckDueCount(deck.id, user.id, supabase)
      const totalCards = deck.card_count
      let masteryPct = 0
      if (totalCards > 0) {
        const { data: cardIds } = await supabase
          .from('cards').select('id').eq('deck_id', deck.id)
        const ids = (cardIds ?? []).map((c: { id: string }) => c.id)
        if (ids.length > 0) {
          const { count: masteredCount } = await supabase
            .from('card_reviews')
            .select('card_id', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .gte('interval_days', 21)
            .in('card_id', ids)
          masteryPct = Math.round(((masteredCount ?? 0) / totalCards) * 100)
        }
      }
      return { deck, dueCount, masteryPct }
    })
  )

  const totalDue = decksWithDue.reduce((sum, d) => sum + d.dueCount, 0)
  const totalDecks = (decks ?? []).length
  const totalCards = (decks ?? []).reduce((sum: number, d: Deck) => sum + d.card_count, 0)

  const { count: totalMastered } = await supabase
    .from('card_reviews')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('interval_days', 21)

  // Find first deck with due cards for study all button
  const firstDueDeck = decksWithDue.find(d => d.dueCount > 0)

  return (
    <div style={{ padding: 32, maxWidth: 1200, margin: '0 auto' }}>
      <OnboardingModal hasDecks={totalDecks > 0} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 36 }}>
        <div>
          {/* >> prefix in indigo */}
          <h1 style={{ fontSize: 32, fontWeight: 800, color: '#ffffff', letterSpacing: '-0.03em', lineHeight: 1.2 }}>
            <span style={{ color: '#6366f1' }}>&gt;&gt; </span>
            {greeting}, {name} 👋
          </h1>
          <p style={{ fontSize: 15, color: '#71717a', marginTop: 8, fontWeight: 400 }}>
            {totalDue > 0
              ? `You have ${totalDue} card${totalDue === 1 ? '' : 's'} due today. Let's go.`
              : totalDecks > 0
                ? 'All caught up for today — come back tomorrow!'
                : 'Upload a PDF to create your first deck.'}
          </p>
        </div>

        {/* Study / New deck buttons */}
        <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
          {totalDue > 0 && firstDueDeck ? (
            <Link
              href={`/decks/${firstDueDeck.deck.id}/study`}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '12px 24px',
                background: '#6366f1',
                color: '#ffffff',
                borderRadius: 10,
                textDecoration: 'none',
                fontWeight: 600, fontSize: 14,
                transition: 'all 200ms ease',
                boxShadow: '0 4px 20px rgba(99,102,241,0.25)',
              }}
            >
              <Play size={15} fill="#ffffff" />
              Study ({totalDue} due)
            </Link>
          ) : totalDecks > 0 ? (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '12px 24px', background: 'rgba(34,197,94,0.1)',
              border: '1px solid #22c55e30',
              color: '#22c55e', borderRadius: 10, fontWeight: 600, fontSize: 14,
            }}>
              All caught up ✓
            </div>
          ) : null}
          <Link
            href="/decks/new"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '12px 20px',
              background: '#1e1e24',
              border: '1px solid #2a2a2e',
              color: '#ffffff',
              borderRadius: 10,
              textDecoration: 'none',
              fontWeight: 500, fontSize: 14,
              transition: 'all 200ms ease',
            }}
          >
            + New Deck
          </Link>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 36 }}>
        {[
          {
            label: 'Total Decks',
            value: totalDecks,
            color: '#ffffff',
            glow: undefined,
          },
          {
            label: 'Cards Due Today',
            value: totalDue,
            color: totalDue > 0 ? '#f59e0b' : '#ffffff',
            glow: totalDue > 0 ? '0 0 0 1px rgba(245,158,11,0.15)' : undefined,
          },
          {
            label: 'Total Mastered',
            value: totalMastered ?? 0,
            color: '#22c55e',
            glow: '0 0 0 1px rgba(34,197,94,0.12)',
          },
          {
            label: 'Total Cards',
            value: totalCards,
            color: '#ffffff',
            glow: undefined,
          },
        ].map(({ label, value, color, glow }) => (
          <div
            key={label}
            style={{
              background: '#18181b',
              border: '1px solid #2a2a2e',
              borderRadius: 16,
              padding: '20px 24px',
              boxShadow: glow,
              transition: 'all 200ms ease',
              cursor: 'default',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'
              ;(e.currentTarget as HTMLElement).style.borderColor = '#6366f1'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
              ;(e.currentTarget as HTMLElement).style.borderColor = '#2a2a2e'
            }}
          >
            <p style={{ fontSize: 13, color: '#71717a', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500 }}>
              {label}
            </p>
            <p style={{ fontSize: 48, fontWeight: 800, color, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Deck grid */}
      {decksWithDue.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 32px' }}>
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none" style={{ margin: '0 auto 24px', display: 'block' }}>
            <rect x="10" y="20" width="60" height="45" rx="6" stroke="#2a2a2e" strokeWidth="2" fill="none"/>
            <path d="M10 32 H70" stroke="#2a2a2e" strokeWidth="2"/>
            <path d="M25 20 L25 15 Q40 8 55 15 L55 20" stroke="#2a2a2e" strokeWidth="2" fill="none"/>
            <path d="M30 44 H50 M30 52 H45" stroke="#6366f1" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: '#ffffff', letterSpacing: '-0.03em', marginBottom: 8 }}>
            Your first deck is one PDF away
          </h2>
          <p style={{ color: '#71717a', marginBottom: 28, lineHeight: 1.6 }}>
            Upload any PDF and AI will turn it into smart flashcards in seconds
          </p>
          <Link
            href="/decks/new"
            style={{
              display: 'inline-block', padding: '12px 28px',
              background: '#6366f1', color: '#ffffff',
              borderRadius: 10, textDecoration: 'none', fontWeight: 600, fontSize: 15,
              boxShadow: '0 4px 20px rgba(99,102,241,0.3)',
              transition: 'all 200ms ease',
            }}
          >
            Upload PDF
          </Link>
        </div>
      ) : (
        <div>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
            Your Decks
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {decksWithDue.map(({ deck, dueCount, masteryPct }, i) => (
              <DeckCard key={deck.id} deck={deck} dueCount={dueCount} masteryPct={masteryPct} index={i} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
