import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { calculateSM2 } from '@/lib/sm2'
import type { ReviewQuality } from '@/types'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { card_id, quality } = body as { card_id: string; quality: ReviewQuality }

  if (!card_id || typeof card_id !== 'string' || ![1, 3, 4, 5].includes(quality)) {
    return NextResponse.json({ error: 'Invalid card_id or quality' }, { status: 400 })
  }

  // Verify the card belongs to a deck owned by this user (prevents IDOR)
  const { data: card } = await supabase
    .from('cards')
    .select('id, deck_id, decks!inner(user_id)')
    .eq('id', card_id)
    .single()

  if (!card) return NextResponse.json({ error: 'Card not found' }, { status: 404 })

  const decks = card.decks as unknown as { user_id: string } | { user_id: string }[]
  const deckUserId = Array.isArray(decks) ? decks[0]?.user_id : decks?.user_id
  if (deckUserId !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: existing } = await supabase
    .from('card_reviews')
    .select('*')
    .eq('card_id', card_id)
    .eq('user_id', user.id)
    .single()

  const currentState = existing ?? { ease_factor: 2.5, interval_days: 1, repetitions: 0 }
  const next = calculateSM2({ ...currentState, quality })

  const { error } = await supabase
    .from('card_reviews')
    .upsert(
      {
        card_id,
        user_id: user.id,
        ease_factor: next.ease_factor,
        interval_days: next.interval_days,
        repetitions: next.repetitions,
        next_review_date: next.next_review_date,
        last_quality: quality,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'card_id,user_id' }
    )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({
    next_review_date: next.next_review_date,
    interval_days: next.interval_days,
  })
}
