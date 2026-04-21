'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#09090b', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <span style={{ fontSize: 32 }}>📖</span>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#fafafa', marginTop: 12, letterSpacing: '-0.02em' }}>Welcome back</h1>
          <p style={{ color: '#a1a1aa', marginTop: 4, fontSize: 14 }}>Sign in to your SmartDeck account</p>
        </div>

        <div style={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 12, padding: 32 }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, color: '#a1a1aa', marginBottom: 6, fontWeight: 500 }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                style={{
                  width: '100%', padding: '10px 14px',
                  background: '#27272a', border: '1px solid #3f3f46',
                  borderRadius: 8, color: '#fafafa', fontSize: 14, outline: 'none',
                }}
              />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, color: '#a1a1aa', marginBottom: 6, fontWeight: 500 }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                style={{
                  width: '100%', padding: '10px 14px',
                  background: '#27272a', border: '1px solid #3f3f46',
                  borderRadius: 8, color: '#fafafa', fontSize: 14, outline: 'none',
                }}
              />
            </div>
            {error && (
              <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, marginBottom: 16 }}>
                <p style={{ fontSize: 13, color: '#ef4444' }}>{error}</p>
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '12px 24px',
                background: loading ? '#27272a' : '#6366f1',
                color: loading ? '#71717a' : '#fafafa',
                border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 200ms',
              }}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
          <p style={{ marginTop: 20, textAlign: 'center', fontSize: 14, color: '#71717a' }}>
            No account?{' '}
            <Link href="/signup" style={{ color: '#6366f1', textDecoration: 'none', fontWeight: 500 }}>Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
