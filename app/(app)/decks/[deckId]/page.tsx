import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Play, Trash2 } from 'lucide-react'
import DeckCardRow from '@/components/deck-card-row'

function computeRetention(updatedAt: string, intervalDays: number): number {
  const daysSince = (Date.now() - new Date(updatedAt).getTime()) / 86400000
  return Math.exp(-daysSince / (Math.max(intervalDays, 1) * 0.7)) * 100
}

export default async function DeckPage({
  params,
}: {
  params: Promise<{ deckId: string }>
}) {
  const { deckId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: deck } = await supabase
    .from('decks')
    .select('*')
    .eq('id', deckId)
    .eq('user_id', user.id)
    .single()

  if (!deck) notFound()

  const { data: cards } = await supabase
    .from('cards')
    .select('*, card_reviews(*)')
    .eq('deck_id', deckId)
    .order('position')

  const today = new Date().toISOString().split('T')[0]

  type ReviewRow = { next_review_date: string; user_id: string; interval_days: number; updated_at: string }

  const enriched = (cards ?? []).map(card => {
    const reviews = card.card_reviews as ReviewRow[]
    const userReview = reviews.find(r => r.user_id === user.id)
    const isDue = !userReview || userReview.next_review_date <= today
    const isMastered = userReview && userReview.interval_days >= 21

    let retention = 0
    let retentionClass: 'new' | 'strong' | 'fading' | 'risk' = 'new'
    if (userReview) {
      retention = computeRetention(userReview.updated_at, userReview.interval_days)
      retentionClass = retention >= 70 ? 'strong' : retention >= 40 ? 'fading' : 'risk'
    }

    return { card, userReview, isDue, isMastered, retention, retentionClass }
  })

  const dueCards = enriched.filter(c => c.isDue)
  const masteredCount = enriched.filter(c => c.isMastered).length
  const strongCount = enriched.filter(c => c.retentionClass === 'strong').length
  const fadingCount = enriched.filter(c => c.retentionClass === 'fading').length
  const riskCount = enriched.filter(c => c.retentionClass === 'risk' || c.retentionClass === 'new').length
  const totalCards = enriched.length

  async function deleteDeck() {
    'use server'
    const s = await createClient()
    const { data: { user: u } } = await s.auth.getUser()
    if (!u) return
    await s.from('decks').delete().eq('id', deckId).eq('user_id', u.id)
    redirect('/dashboard')
  }

  return (
    <div style={{ padding: 32, maxWidth: 800, margin: '0 auto' }}>
      {/* Back */}
      <Link
        href="/dashboard"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          color: '#71717a', textDecoration: 'none', fontSize: 13, fontWeight: 500,
          marginBottom: 24, transition: 'color 200ms ease',
        }}
      >
        <ArrowLeft size={14} /> Dashboard
      </Link>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#ffffff', letterSpacing: '-0.03em', lineHeight: 1.2, marginBottom: 6 }}>
            <span style={{ color: '#6366f1' }}>&gt;&gt; </span>{deck.title}
          </h1>
          {deck.description && (
            <p style={{ fontSize: 14, color: '#71717a', lineHeight: 1.5 }}>{deck.description}</p>
          )}
        </div>
        <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
          {dueCards.length > 0 && (
            <Link
              href={`/decks/${deckId}/study`}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '10px 20px', background: '#6366f1', color: '#ffffff',
                borderRadius: 10, textDecoration: 'none', fontWeight: 600, fontSize: 13,
                boxShadow: '0 4px 20px rgba(99,102,241,0.25)', transition: 'all 200ms ease',
              }}
            >
              <Play size={13} fill="#ffffff" />
              Study ({dueCards.length} due)
            </Link>
          )}
          <form action={deleteDeck}>
            <button
              type="submit"
              style={{
                padding: '10px 12px', background: 'transparent',
                border: '1px solid #2a2a2e', borderRadius: 10,
                color: '#71717a', cursor: 'pointer', display: 'flex',
                alignItems: 'center', transition: 'all 200ms ease',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = '#ef4444'
                ;(e.currentTarget as HTMLElement).style.color = '#ef4444'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = '#2a2a2e'
                ;(e.currentTarget as HTMLElement).style.color = '#71717a'
              }}
            >
              <Trash2 size={15} />
            </button>
          </form>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 28 }}>
        {[
          { label: 'Total Cards', value: totalCards, color: '#ffffff' },
          { label: 'Due Today', value: dueCards.length, color: dueCards.length > 0 ? '#f59e0b' : '#ffffff' },
          { label: 'Mastered', value: masteredCount, color: '#22c55e' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: '#18181b', border: '1px solid #2a2a2e', borderRadius: 12, padding: '16px 20px', textAlign: 'center' }}>
            <p style={{ fontSize: 28, fontWeight: 800, color, fontVariantNumeric: 'tabular-nums' }}>{value}</p>
            <p style={{ fontSize: 11, color: '#71717a', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Retention Risk section */}
      {totalCards > 0 && (
        <div style={{ background: '#18181b', border: '1px solid #2a2a2e', borderRadius: 16, padding: 20, marginBottom: 28 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
            Retention Health
          </h3>

          {/* Counters */}
          <div style={{ display: 'flex', gap: 20, marginBottom: 14 }}>
            {[
              { label: 'Strong', count: strongCount, color: '#22c55e' },
              { label: 'Fading', count: fadingCount, color: '#f59e0b' },
              { label: 'At Risk', count: riskCount, color: '#ef4444' },
            ].map(({ label, count, color }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
                <span style={{ fontSize: 13, color: '#ffffff', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{count}</span>
                <span style={{ fontSize: 13, color: '#71717a' }}>{label}</span>
              </div>
            ))}
          </div>

          {/* Stacked health bar */}
          <div style={{ height: 6, background: '#27272a', borderRadius: 999, overflow: 'hidden', display: 'flex', marginBottom: 16 }}>
            <div style={{ width: `${(strongCount / totalCards) * 100}%`, background: '#22c55e', transition: 'width 800ms ease' }} />
            <div style={{ width: `${(fadingCount / totalCards) * 100}%`, background: '#f59e0b', transition: 'width 800ms ease' }} />
            <div style={{ width: `${(riskCount / totalCards) * 100}%`, background: '#ef4444', transition: 'width 800ms ease' }} />
          </div>

          {riskCount > 0 && (
            <Link
              href={`/decks/${deckId}/study`}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '8px 16px',
                background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
                color: '#ef4444', borderRadius: 8,
                textDecoration: 'none', fontWeight: 600, fontSize: 13,
                transition: 'all 200ms ease',
              }}
            >
              <Play size={12} fill="#ef4444" />
              Review {riskCount} at-risk card{riskCount === 1 ? '' : 's'} now
            </Link>
          )}
        </div>
      )}

      {/* Card list */}
      {dueCards.length === 0 && totalCards > 0 && (
        <div style={{
          padding: '14px 20px', background: 'rgba(34,197,94,0.08)',
          border: '1px solid rgba(34,197,94,0.2)', borderRadius: 10, marginBottom: 20,
        }}>
          <p style={{ color: '#22c55e', fontWeight: 600, fontSize: 14 }}>All caught up! No cards due today.</p>
        </div>
      )}

      <div>
        <h2 style={{ fontSize: 13, fontWeight: 600, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
          All cards ({totalCards})
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {enriched.map(({ card, userReview, isDue, isMastered }) => (
            <DeckCardRow
              key={card.id}
              question={card.question}
              answer={card.answer}
              isDue={isDue}
              isMastered={!!isMastered}
              nextDate={userReview?.next_review_date}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
