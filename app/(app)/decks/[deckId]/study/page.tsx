import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import StudySession from '@/components/study-session'
import Link from 'next/link'

export default async function StudyPage({
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

  if (!deck) redirect('/dashboard')

  const today = new Date().toISOString().split('T')[0]

  const { data: allCards } = await supabase
    .from('cards')
    .select('*, card_reviews(*)')
    .eq('deck_id', deckId)
    .order('position')

  const dueCards = (allCards ?? []).filter(card => {
    const reviews = card.card_reviews as Array<{ next_review_date: string; user_id: string }>
    const userReview = reviews.find(r => r.user_id === user.id)
    return !userReview || userReview.next_review_date <= today
  })

  if (dueCards.length === 0) {
    return (
      <div style={{
        padding: 32, maxWidth: 640, margin: '0 auto',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', minHeight: '60vh', textAlign: 'center', gap: 16
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'rgba(34,197,94,0.15)', border: '2px solid #22c55e',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 28
        }}>✅</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#fafafa' }}>All caught up!</h1>
        <p style={{ color: '#a1a1aa', maxWidth: 300 }}>No cards are due for review in this deck today.</p>
        <Link
          href={`/decks/${deckId}`}
          style={{
            padding: '10px 24px', border: '1px solid #3f3f46',
            color: '#fafafa', borderRadius: 8, textDecoration: 'none',
            fontSize: 14, fontWeight: 500,
          }}
        >
          Back to deck
        </Link>
      </div>
    )
  }

  return (
    <div style={{ padding: 32, maxWidth: 720, margin: '0 auto' }}>
      <h1 style={{ fontSize: 18, fontWeight: 600, color: '#a1a1aa', marginBottom: 24 }}>{deck.title}</h1>
      <StudySession cards={dueCards} deckId={deckId} />
    </div>
  )
}
