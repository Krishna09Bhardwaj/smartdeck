'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
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

interface Profile {
  current_xp: number
  total_xp: number
  user_level: number
  current_streak: number
}

export default function Nav() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile>({ current_xp: 0, total_xp: 0, user_level: 1, current_streak: 0 })

  const fetchProfile = () => {
    fetch('/api/profile')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setProfile(d) })
      .catch(() => {})
  }

  useEffect(() => {
    fetchProfile()
    window.addEventListener('xp-updated', fetchProfile)
    return () => window.removeEventListener('xp-updated', fetchProfile)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const xpForLevel = 500
  const xpPct = Math.min((profile.current_xp / xpForLevel) * 100, 100)

  return (
    <aside style={{
      width: 240,
      minHeight: '100vh',
      background: '#111113',
      borderRight: '1px solid #2a2a2e',
      display: 'flex',
      flexDirection: 'column',
      padding: '20px 0',
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: '0 16px 12px' }}>
        <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', marginBottom: 12 }}>
          <BookMarked size={20} color="#6366f1" />
          <span style={{ fontWeight: 800, fontSize: 18, color: '#ffffff', letterSpacing: '-0.03em' }}>SmartDeck</span>
        </Link>

        {/* XP bar — replaces email, updates in real-time after each review */}
        <div style={{ background: '#1a1a2e', borderRadius: 10, padding: '10px 14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#ffffff' }}>
              Level {profile.user_level} learner
            </span>
            <span style={{ fontSize: 11, color: '#71717a', fontVariantNumeric: 'tabular-nums' }}>
              {profile.current_xp} / {xpForLevel} XP
            </span>
          </div>
          <div style={{ height: 6, background: '#2a2a3e', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${xpPct}%`,
              background: 'linear-gradient(90deg, #6366f1, #818cf8)',
              borderRadius: 999,
              transition: 'width 600ms ease-out',
            }} />
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 8 }} />

      {/* Nav items */}
      <nav style={{ flex: 1, padding: '0 8px' }}>
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href === '/dashboard' && (pathname === '/dashboard' || pathname.startsWith('/decks')))
          return (
            <Link
              key={label}
              href={href}
              prefetch
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 8, marginBottom: 2,
                textDecoration: 'none',
                background: active ? '#1e1e24' : 'transparent',
                borderLeft: active ? '3px solid #6366f1' : '3px solid transparent',
                color: active ? '#ffffff' : '#71717a',
                fontSize: 14, fontWeight: active ? 600 : 400,
                transition: 'all 200ms ease',
              }}
              onMouseEnter={e => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.background = '#1e1e24'
                  ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.background = 'transparent'
                  ;(e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
                }
              }}
            >
              <Icon size={18} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div style={{ padding: '0 12px', borderTop: '1px solid #2a2a2e', paddingTop: 16, marginTop: 8 }}>
        {/* Streak */}
        <Link
          href="/dashboard"
          style={{ textDecoration: 'none' }}
        >
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 12px', borderRadius: 8,
            background: '#1a1a0e',
            border: '1px solid #2a2a1e',
            marginBottom: 8,
            cursor: 'pointer',
            transition: 'all 200ms ease',
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)' }}
          >
            <Flame size={16} color="#f59e0b" />
            <span style={{ fontSize: 13, color: profile.current_streak > 0 ? '#f59e0b' : '#71717a', fontWeight: 600 }}>
              {profile.current_streak > 0 ? `${profile.current_streak} day streak` : 'Start your streak today'}
            </span>
          </div>
        </Link>

        <button
          onClick={handleSignOut}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, width: '100%',
            padding: '10px 12px', borderRadius: 8, border: 'none',
            background: 'transparent', color: '#71717a', fontSize: 14,
            cursor: 'pointer', transition: 'all 200ms ease',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#ffffff' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#71717a' }}
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </aside>
  )
}
