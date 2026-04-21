import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { calculateSM2 } from '@/lib/sm2'
import type { ReviewQuality } from '@/types'

const XP_MAP: Record<number, number> = { 5: 15, 4: 10, 3: 5, 1: 2 }
const RESPONSE_TYPE: Record<number, string> = { 5: 'easy', 4: 'good', 3: 'hard', 1: 'forgot' }

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { card_id, quality } = body as { card_id: string; quality: ReviewQuality }

  if (!card_id || typeof card_id !== 'string' || ![1, 3, 4, 5].includes(quality)) {
    return NextResponse.json({ error: 'Invalid card_id or quality' }, { status: 400 })
  }

  // Verify the card belongs to a deck owned by this user (IDOR prevention)
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

  // Fetch existing SM-2 state
  const { data: existing } = await supabase
    .from('card_reviews')
    .select('*')
    .eq('card_id', card_id)
    .eq('user_id', user.id)
    .single()

  const currentState = existing ?? { ease_factor: 2.5, interval_days: 1, repetitions: 0 }
  const next = calculateSM2({ ...currentState, quality })

  const { error: reviewError } = await supabase
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
        response_type: RESPONSE_TYPE[quality] ?? 'good',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'card_id,user_id' }
    )

  if (reviewError) return NextResponse.json({ error: reviewError.message }, { status: 500 })

  // XP + streak update (non-fatal — wrapped in try/catch so review still succeeds if profiles table missing)
  let xpEarned = 0
  let newLevel = 1
  let newTotalXp = 0
  let newCurrentXp = 0
  let newStreak = 0
  let leveledUp = false

  try {
    xpEarned = XP_MAP[quality] ?? 2
    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    const lastStudyDate = profile?.last_study_date
    const prevStreak = profile?.current_streak ?? 0
    const prevLevel = profile?.user_level ?? 1

    newStreak = lastStudyDate === today
      ? prevStreak
      : lastStudyDate === yesterday
        ? prevStreak + 1
        : 1

    newTotalXp = (profile?.total_xp ?? 0) + xpEarned
    newLevel = Math.floor(newTotalXp / 500) + 1
    newCurrentXp = newTotalXp % 500
    leveledUp = newLevel > prevLevel

    await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        current_xp: newCurrentXp,
        total_xp: newTotalXp,
        user_level: newLevel,
        current_streak: newStreak,
        longest_streak: Math.max(profile?.longest_streak ?? 0, newStreak),
        last_study_date: today,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' })
  } catch {
    // profiles table not yet created — degrade gracefully
  }

  return NextResponse.json({
    next_review_date: next.next_review_date,
    interval_days: next.interval_days,
    xp_earned: xpEarned,
    new_total_xp: newTotalXp,
    new_current_xp: newCurrentXp,
    new_level: newLevel,
    leveled_up: leveledUp,
    current_streak: newStreak,
  })
}
