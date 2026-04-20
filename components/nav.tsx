'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { BookOpen, LayoutDashboard, TrendingUp, LogOut } from 'lucide-react'

const links = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/progress', label: 'Progress', icon: TrendingUp },
]

export default function Nav() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="w-56 shrink-0 border-r bg-white flex flex-col py-6 px-4 gap-2 min-h-screen">
      <Link href="/dashboard" className="flex items-center gap-2 px-2 mb-4">
        <BookOpen className="h-6 w-6 text-blue-600" />
        <span className="font-bold text-lg">SmartDeck</span>
      </Link>
      <nav className="flex-1 space-y-1">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              pathname === href
                ? 'bg-blue-50 text-blue-700'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>
      <Button variant="ghost" size="sm" onClick={signOut} className="justify-start gap-3 text-slate-600">
        <LogOut className="h-4 w-4" />
        Sign out
      </Button>
    </aside>
  )
}
