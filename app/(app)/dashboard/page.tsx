import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import type { Deck } from '@/types'
import OnboardingModal from '@/components/onboarding-modal'

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

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

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
          .from('cards')
          .select('id')
          .eq('deck_id', deck.id)
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

  // Get total mastered across all decks
  const { count: totalMastered } = await supabase
    .from('card_reviews')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('interval_days', 21)

  const statCards = [
    { label: 'Total Decks', value: totalDecks, color: '#6366f1' },
    { label: 'Cards Due Today', value: totalDue, color: '#f59e0b' },
    { label: 'Total Mastered', value: totalMastered ?? 0, color: '#22c55e' },
    { label: 'Total Cards', value: totalCards, color: '#a1a1aa' },
  ]

  return (
    <div style={{ padding: 32, maxWidth: 1200, margin: '0 auto' }}>
      <OnboardingModal hasDecks={totalDecks > 0} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#fafafa', letterSpacing: '-0.02em' }}>Dashboard</h1>
          {totalDue > 0 && (
            <p style={{ fontSize: 14, color: '#f59e0b', marginTop: 4, fontWeight: 500 }}>
              {totalDue} card{totalDue === 1 ? '' : 's'} due for review today
            </p>
          )}
          {totalDue === 0 && totalDecks > 0 && (
            <p style={{ fontSize: 14, color: '#22c55e', marginTop: 4, fontWeight: 500 }}>All caught up for today!</p>
          )}
        </div>
        <Link
          href="/decks/new"
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 20px', background: '#6366f1', color: '#fafafa',
            borderRadius: 8, textDecoration: 'none', fontWeight: 500, fontSize: 14,
          }}
        >
          <Plus size={16} />
          New Deck
        </Link>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        {statCards.map(({ label, value, color }) => (
          <div
            key={label}
            style={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 12, padding: '20px 24px' }}
          >
            <p style={{ fontSize: 13, color: '#a1a1aa', marginBottom: 8 }}>{label}</p>
            <p style={{ fontSize: 28, fontWeight: 700, color }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Deck grid */}
      {decksWithDue.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 32px' }}>
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none" style={{ margin: '0 auto 24px', display: 'block' }}>
            <rect x="10" y="20" width="60" height="45" rx="6" stroke="#3f3f46" strokeWidth="2" fill="none"/>
            <path d="M10 32 H70" stroke="#3f3f46" strokeWidth="2"/>
            <path d="M25 20 L25 15 Q40 8 55 15 L55 20" stroke="#3f3f46" strokeWidth="2" fill="none"/>
            <path d="M30 44 H50 M30 52 H45" stroke="#6366f1" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#fafafa', letterSpacing: '-0.02em', marginBottom: 8 }}>
            Your first deck is one PDF away
          </h2>
          <p style={{ color: '#a1a1aa', marginBottom: 24, lineHeight: 1.6 }}>
            Upload any PDF and AI will turn it into smart flashcards in seconds
          </p>
          <a
            href="/decks/new"
            style={{ display: 'inline-block', padding: '12px 24px', background: '#6366f1', color: '#fafafa', borderRadius: 8, textDecoration: 'none', fontWeight: 500 }}
          >
            Upload PDF
          </a>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {decksWithDue.map(({ deck, dueCount, masteryPct }) => (
            <Link
              key={deck.id}
              href={`/decks/${deck.id}`}
              style={{ textDecoration: 'none' }}
            >
              <div
                style={{
                  background: '#18181b',
                  border: '1px solid #3f3f46',
                  borderRadius: 12,
                  padding: 24,
                  cursor: 'pointer',
                  transition: 'border-color 200ms',
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#6366f1')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = '#3f3f46')}
              >
                {/* Title */}
                <h3 style={{ fontSize: 16, fontWeight: 600, color: '#fafafa', marginBottom: 6, lineHeight: 1.3 }}>
                  {deck.title}
                </h3>
                {deck.description && (
                  <p style={{ fontSize: 13, color: '#71717a', marginBottom: 12, lineHeight: 1.5 }}>
                    {deck.description}
                  </p>
                )}

                {/* Badges */}
                <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 20, background: '#27272a', color: '#a1a1aa', fontWeight: 500 }}>
                    {deck.card_count} cards
                  </span>
                  {dueCount > 0 && (
                    <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 20, background: 'rgba(245,158,11,0.15)', color: '#f59e0b', fontWeight: 500 }}>
                      {dueCount} due
                    </span>
                  )}
                  {masteryPct >= 80 && (
                    <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 20, background: 'rgba(34,197,94,0.15)', color: '#22c55e', fontWeight: 500 }}>
                      Mastered
                    </span>
                  )}
                </div>

                {/* Mastery bar */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 11, color: '#71717a' }}>Mastery</span>
                    <span style={{ fontSize: 11, color: '#a1a1aa', fontWeight: 500 }}>{masteryPct}%</span>
                  </div>
                  <div style={{ height: 4, background: '#27272a', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: '#22c55e', borderRadius: 2, width: `${masteryPct}%`, transition: 'width 500ms ease' }} />
                  </div>
                </div>

                {/* Study button */}
                {dueCount > 0 ? (
                  <Link
                    href={`/decks/${deck.id}/study`}
                    onClick={e => e.stopPropagation()}
                    style={{
                      display: 'block', textAlign: 'center', padding: '9px 16px',
                      background: '#6366f1', color: '#fafafa', borderRadius: 8,
                      textDecoration: 'none', fontWeight: 500, fontSize: 13,
                    }}
                  >
                    Study now
                  </Link>
                ) : (
                  <p style={{ textAlign: 'center', fontSize: 13, color: '#22c55e', fontWeight: 500, padding: '9px 0' }}>
                    All caught up ✓
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
