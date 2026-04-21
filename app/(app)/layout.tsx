import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { FocusProvider } from '@/components/focus-provider'
import FocusAwareLayout from '@/components/focus-aware-layout'

export const dynamic = 'force-dynamic'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <FocusProvider>
      <FocusAwareLayout>{children}</FocusAwareLayout>
    </FocusProvider>
  )
}
