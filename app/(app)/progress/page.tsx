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
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900 mb-8">Your Progress</h1>

      <div className="grid grid-cols-3 gap-6 mb-10">
        <div className="bg-white rounded-2xl border p-6 text-center shadow-sm">
          <p className="text-3xl font-bold text-slate-900">{totalCards}</p>
          <p className="text-sm text-slate-500 mt-1">Total cards</p>
        </div>
        <div className="bg-white rounded-2xl border p-6 text-center shadow-sm">
          <p className="text-3xl font-bold text-green-600">{totalMastered}</p>
          <p className="text-sm text-slate-500 mt-1">Mastered</p>
        </div>
        <div className="bg-white rounded-2xl border p-6 text-center shadow-sm">
          <p className="text-3xl font-bold text-blue-600">{totalDue}</p>
          <p className="text-sm text-slate-500 mt-1">Due today</p>
        </div>
      </div>

      {totalCards > 0 && (
        <div className="flex justify-center mb-10">
          <div className="bg-white rounded-2xl border p-6 shadow-sm text-center">
            <ProgressRing value={overallPct} size={120} strokeWidth={10} />
            <p className="text-sm text-slate-500 mt-3">Overall mastery</p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">By deck</h2>
        {deckStats.map(({ deck, total, mastered, due, masteryPct }) => (
          <Link key={deck.id} href={`/decks/${deck.id}`}>
            <div className="bg-white rounded-xl border p-5 flex items-center gap-5 hover:shadow-md transition-shadow cursor-pointer">
              <ProgressRing value={masteryPct} size={64} strokeWidth={6} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800 truncate">{deck.title}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {mastered}/{total} mastered · {due} due today
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-lg font-bold text-blue-600">{masteryPct}%</p>
                <p className="text-xs text-slate-400">mastery</p>
              </div>
            </div>
          </Link>
        ))}
        {deckStats.length === 0 && (
          <p className="text-center text-slate-400 py-12">
            No decks yet. Create one to start tracking progress.
          </p>
        )}
      </div>
    </div>
  )
}
