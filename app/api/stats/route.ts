import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Total reviews
  const { count: total_reviews } = await supabase
    .from('card_reviews')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  // Total mastered cards
  const { count: mastered_cards } = await supabase
    .from('card_reviews')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('interval_days', 21)

  // Get all user's decks for total card count
  const { data: userDecks } = await supabase
    .from('decks')
    .select('card_count')
    .eq('user_id', user.id)

  const total_cards = (userDecks ?? []).reduce((sum: number, d: { card_count: number }) => sum + d.card_count, 0)

  // Daily reviews for heatmap (last 365 days)
  const { data: dailyData } = await supabase
    .from('card_reviews')
    .select('reviewed_at')
    .eq('user_id', user.id)
    .gte('reviewed_at', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString())

  // Group by date
  const dailyMap: Record<string, number> = {}
  for (const row of (dailyData ?? [])) {
    const date = (row.reviewed_at as string).slice(0, 10)
    dailyMap[date] = (dailyMap[date] ?? 0) + 1
  }
  const daily_reviews = Object.entries(dailyMap).map(([date, count]) => ({ date, count }))

  // Calculate streak
  const sortedDates = Object.keys(dailyMap).sort().reverse()
  let current_streak = 0
  let longest_streak = 0
  let tempStreak = 0
  const today = new Date().toISOString().slice(0, 10)

  if (sortedDates.length > 0 && (sortedDates[0] === today || sortedDates[0] === new Date(Date.now() - 86400000).toISOString().slice(0, 10))) {
    let prev = sortedDates[0]
    for (const date of sortedDates) {
      const diffDays = Math.round((new Date(prev).getTime() - new Date(date).getTime()) / 86400000)
      if (diffDays <= 1) {
        tempStreak++
        if (tempStreak > longest_streak) longest_streak = tempStreak
      } else {
        if (current_streak === 0) current_streak = tempStreak
        tempStreak = 1
      }
      prev = date
    }
    if (current_streak === 0) current_streak = tempStreak
  }

  return NextResponse.json({
    total_reviews: total_reviews ?? 0,
    current_streak,
    longest_streak,
    mastery_percentage: total_cards > 0 ? Math.round(((mastered_cards ?? 0) / total_cards) * 100) : 0,
    daily_reviews,
  })
}
