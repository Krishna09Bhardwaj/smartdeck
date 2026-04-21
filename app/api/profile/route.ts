import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('current_xp, total_xp, user_level, current_streak, longest_streak, last_study_date')
    .eq('id', user.id)
    .single()

  return NextResponse.json(profile ?? {
    current_xp: 0,
    total_xp: 0,
    user_level: 1,
    current_streak: 0,
    longest_streak: 0,
    last_study_date: null,
  })
}
