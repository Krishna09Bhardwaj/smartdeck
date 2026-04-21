import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProgressRing from '@/components/progress-ring'
import Link from 'next/link'
import type { Deck } from '@/types'

export default async function ProgressPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: decks } = await supabase
    .from('decks')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const today = new Date().toISOString().split('T')[0]

  const deckStats = await Promise.all(
    (decks ?? []).map(async (deck: Deck) => {
      const { data: cards } = await supabase
        .from('cards')
        .select('id, card_reviews(next_review_date, user_id, interval_days)')
        .eq('deck_id', deck.id)

      const total = cards?.length ?? 0

      const mastered = cards?.filter(c => {
        const reviews = c.card_reviews as Array<{ user_id: string; interval_days: number }>
        return reviews.some(r => r.user_id === user.id && r.interval_days >= 21)
      }).length ?? 0

      const due = cards?.filter(c => {
        const reviews = c.card_reviews as Array<{ user_id: string; next_review_date: string }>
        const userReview = reviews.find(r => r.user_id === user.id)
        return !userReview || userReview.next_review_date <= today
      }).length ?? 0

      const masteryPct = total > 0 ? Math.round((mastered / total) * 100) : 0

      return { deck, total, mastered, due, masteryPct }
    })
  )

  const totalCards = deckStats.reduce((s, d) => s + d.total, 0)
  const totalMastered = deckStats.reduce((s, d) => s + d.mastered, 0)
  const totalDue = deckStats.reduce((s, d) => s + d.due, 0)
  const overallPct = totalCards > 0 ? Math.round((totalMastered / totalCards) * 100) : 0

  return (
    <div style={{ padding: 32, maxWidth: 900, margin: '0 auto' }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, color: '#ffffff', letterSpacing: '-0.03em', marginBottom: 32 }}>
        <span style={{ color: '#6366f1' }}>&gt;&gt; </span>Your Progress
      </h1>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
        {[
          { label: 'Total Cards', value: totalCards, color: '#ffffff' },
          { label: 'Mastered', value: totalMastered, color: '#22c55e' },
          { label: 'Due Today', value: totalDue, color: totalDue > 0 ? '#f59e0b' : '#ffffff' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{
            background: '#18181b',
            border: '1px solid #2a2a2e',
            borderRadius: 16,
            padding: '24px',
            textAlign: 'center',
            transition: 'all 200ms ease',
          }}>
            <p style={{ fontSize: 48, fontWeight: 800, color, fontVariantNumeric: 'tabular-nums', lineHeight: 1, marginBottom: 8 }}>
              {value}
            </p>
            <p style={{ fontSize: 13, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500 }}>
              {label}
            </p>
          </div>
        ))}
      </div>

      {/* Overall mastery ring */}
      {totalCards > 0 && (
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
          <div style={{
            background: '#18181b',
            border: '1px solid #2a2a2e',
            borderRadius: 20,
            padding: '28px 48px',
            textAlign: 'center',
          }}>
            <ProgressRing value={overallPct} size={120} strokeWidth={10} />
            <p style={{ fontSize: 13, color: '#a1a1aa', marginTop: 12, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500 }}>
              Overall mastery
            </p>
          </div>
        </div>
      )}

      {/* By deck */}
      <div>
        <h2 style={{ fontSize: 12, fontWeight: 600, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
          By Deck
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {deckStats.map(({ deck, total, mastered, due, masteryPct }) => (
            <Link key={deck.id} href={`/decks/${deck.id}`} style={{ textDecoration: 'none' }}>
              <div style={{
                background: '#18181b',
                border: '1px solid #2a2a2e',
                borderRadius: 14,
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                cursor: 'pointer',
                transition: 'all 200ms ease',
              }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = '#6366f1'
                  ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = '#2a2a2e'
                  ;(e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
                }}
              >
                <ProgressRing value={masteryPct} size={64} strokeWidth={6} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 600, color: '#ffffff', fontSize: 15, marginBottom: 4, textTransform: 'capitalize', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {deck.title}
                  </p>
                  <p style={{ fontSize: 12, color: '#71717a' }}>
                    {mastered}/{total} mastered · {due} due today
                  </p>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ fontSize: 20, fontWeight: 800, color: '#6366f1', fontVariantNumeric: 'tabular-nums' }}>{masteryPct}%</p>
                  <p style={{ fontSize: 11, color: '#71717a' }}>mastery</p>
                </div>
              </div>
            </Link>
          ))}
          {deckStats.length === 0 && (
            <p style={{ textAlign: 'center', color: '#71717a', padding: '48px 0' }}>
              No decks yet. Create one to start tracking progress.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
