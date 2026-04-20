import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import DeckCard from '@/components/deck-card'
import { Plus } from 'lucide-react'
import type { Deck } from '@/types'

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
    (decks ?? []).map(async (deck: Deck) => ({
      deck,
      dueCount: await getDeckDueCount(deck.id, user.id, supabase),
    }))
  )

  const totalDue = decksWithDue.reduce((sum, d) => sum + d.dueCount, 0)

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Your Decks</h1>
          {totalDue > 0 && (
            <p className="text-sm text-blue-600 mt-1 font-medium">
              {totalDue} card{totalDue === 1 ? '' : 's'} due for review today
            </p>
          )}
          {totalDue === 0 && (decks ?? []).length > 0 && (
            <p className="text-sm text-green-600 mt-1 font-medium">All caught up for today!</p>
          )}
        </div>
        <Link href="/decks/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Deck
          </Button>
        </Link>
      </div>

      {decksWithDue.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <p className="text-lg font-medium mb-2">No decks yet</p>
          <p className="text-sm mb-6">Upload a PDF to generate your first flashcard deck</p>
          <Link href="/decks/new">
            <Button>Create your first deck</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {decksWithDue.map(({ deck, dueCount }) => (
            <DeckCard key={deck.id} deck={deck} dueCount={dueCount} />
          ))}
        </div>
      )}
    </div>
  )
}
