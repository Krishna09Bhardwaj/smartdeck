import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Play, Trash2 } from 'lucide-react'

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

  const dueCards = (cards ?? []).filter(card => {
    const reviews = card.card_reviews as Array<{ next_review_date: string; user_id: string }>
    const userReview = reviews.find(r => r.user_id === user.id)
    return !userReview || userReview.next_review_date <= today
  })

  const masteredCount = (cards ?? []).filter(card => {
    const reviews = card.card_reviews as Array<{ next_review_date: string; user_id: string; interval_days: number }>
    const userReview = reviews.find(r => r.user_id === user.id)
    return userReview && userReview.interval_days >= 21
  }).length

  async function deleteDeck() {
    'use server'
    const s = await createClient()
    const { data: { user: u } } = await s.auth.getUser()
    if (!u) return
    await s.from('decks').delete().eq('id', deckId).eq('user_id', u.id)
    redirect('/dashboard')
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Dashboard
          </Button>
        </Link>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{deck.title}</h1>
          {deck.description && <p className="text-slate-500 mt-1">{deck.description}</p>}
        </div>
        <div className="flex gap-2 items-center">
          {dueCards.length > 0 && (
            <Link href={`/decks/${deckId}/study`}>
              <Button className="gap-2">
                <Play className="h-4 w-4" />
                Study ({dueCards.length} due)
              </Button>
            </Link>
          )}
          <form action={deleteDeck}>
            <Button
              type="submit"
              variant="ghost"
              size="icon"
              className="text-red-400 hover:text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-slate-900">{cards?.length ?? 0}</p>
            <p className="text-xs text-slate-500 mt-1">Total cards</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{dueCards.length}</p>
            <p className="text-xs text-slate-500 mt-1">Due today</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-green-600">{masteredCount}</p>
            <p className="text-xs text-slate-500 mt-1">Mastered</p>
          </CardContent>
        </Card>
      </div>

      {dueCards.length === 0 && (cards?.length ?? 0) > 0 && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl mb-6 text-center">
          <p className="text-green-700 font-medium">All caught up! No cards due today.</p>
        </div>
      )}

      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
          All cards
        </h2>
        {(cards ?? []).map(card => {
          const reviews = card.card_reviews as Array<{
            next_review_date: string
            user_id: string
            interval_days: number
          }>
          const userReview = reviews.find(r => r.user_id === user.id)
          const isDue = !userReview || userReview.next_review_date <= today
          const isMastered = userReview && userReview.interval_days >= 21

          return (
            <div
              key={card.id}
              className="p-4 bg-white rounded-xl border border-slate-100 flex items-start justify-between gap-4"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 line-clamp-2">{card.question}</p>
                <p className="text-xs text-slate-400 mt-1 line-clamp-1">{card.answer}</p>
              </div>
              <div className="shrink-0">
                {isMastered ? (
                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">
                    Mastered
                  </Badge>
                ) : isDue ? (
                  <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200">
                    Due
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-slate-400">
                    {userReview?.next_review_date}
                  </Badge>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
