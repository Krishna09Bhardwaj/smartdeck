import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import StudySession from '@/components/study-session'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

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
      <div className="p-8 max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
        <p className="text-4xl">✅</p>
        <h1 className="text-xl font-bold">All caught up!</h1>
        <p className="text-slate-500">No cards are due for review in this deck today.</p>
        <Link href={`/decks/${deckId}`}>
          <Button variant="outline">Back to deck</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-lg font-semibold text-slate-700 mb-6">{deck.title}</h1>
      <StudySession cards={dueCards} deckId={deckId} />
    </div>
  )
}
