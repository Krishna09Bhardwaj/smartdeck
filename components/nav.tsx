'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import {
  BookMarked, LayoutDashboard, BookOpen, TrendingUp,
  BarChart2, HelpCircle, Flame, LogOut
} from 'lucide-react'
import { useEffect, useState } from 'react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard', label: 'My Decks', icon: BookOpen },
  { href: '/progress', label: 'Progress', icon: TrendingUp },
  { href: '/stats', label: 'Stats', icon: BarChart2 },
  { href: '/how-it-works', label: 'How it works', icon: HelpCircle },
]

export default function Nav() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const streak = 0

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setEmail(data.user.email ?? '')
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside style={{ width: 240, minHeight: '100vh', background: '#18181b', borderRight: '1px solid #3f3f46', display: 'flex', flexDirection: 'column', padding: '24px 0' }}>
      {/* Logo */}
      <div style={{ padding: '0 20px 24px' }}>
        <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <BookMarked size={20} color="#6366f1" />
          <span style={{ fontWeight: 700, fontSize: 18, color: '#fafafa', letterSpacing: '-0.02em' }}>SmartDeck</span>
        </Link>
        <p style={{ fontSize: 12, color: '#71717a', marginTop: 6, paddingLeft: 28 }}>{email}</p>
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: '0 12px' }}>
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href === '/dashboard' && pathname.startsWith('/decks'))
          return (
            <Link
              key={label}
              href={href}
              prefetch
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 8, marginBottom: 2,
                textDecoration: 'none',
                background: isActive ? '#27272a' : 'transparent',
                borderLeft: isActive ? '3px solid #6366f1' : '3px solid transparent',
                color: isActive ? '#fafafa' : '#a1a1aa',
                fontSize: 14, fontWeight: isActive ? 500 : 400,
                transition: 'all 200ms',
              }}
            >
              <Icon size={16} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div style={{ padding: '0 20px', borderTop: '1px solid #3f3f46', paddingTop: 16, marginTop: 8 }}>
        {/* Streak widget */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 8, background: '#27272a', marginBottom: 8 }}>
          <Flame size={16} color="#f59e0b" />
          <span style={{ fontSize: 13, color: streak > 0 ? '#f59e0b' : '#71717a', fontWeight: 500 }}>
            {streak > 0 ? `${streak} day streak` : 'Start your streak today'}
          </span>
        </div>
        <button
          onClick={handleSignOut}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, width: '100%',
            padding: '10px 12px', borderRadius: 8, border: 'none',
            background: 'transparent', color: '#71717a', fontSize: 14,
            cursor: 'pointer', transition: 'all 200ms',
          }}
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </aside>
  )
}
