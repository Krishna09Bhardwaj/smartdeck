import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  _: Request,
  { params }: { params: Promise<{ deckId: string }> }
) {
  const { deckId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: deck } = await supabase
    .from('decks')
    .select('id')
    .eq('id', deckId)
    .eq('user_id', user.id)
    .single()
  if (!deck) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const today = new Date().toISOString().split('T')[0]

  const { data: allCards, error } = await supabase
    .from('cards')
    .select('*, card_reviews(*)')
    .eq('deck_id', deckId)
    .order('position')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const due = allCards?.filter(card => {
    const reviews = card.card_reviews as Array<{ next_review_date: string; user_id: string }>
    const userReview = reviews.find(r => r.user_id === user.id)
    if (!userReview) return true
    return userReview.next_review_date <= today
  }) ?? []

  return NextResponse.json(due)
}
