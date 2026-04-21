'use client'
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
    }
  }

  if (success) {
    return (
      <div style={{ minHeight: '100vh', background: '#09090b', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <div style={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 12, padding: 40, maxWidth: 420, width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📬</div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#fafafa', marginBottom: 8, letterSpacing: '-0.02em' }}>Check your email</h2>
          <p style={{ color: '#a1a1aa', lineHeight: 1.6, marginBottom: 24 }}>
            We sent a confirmation link to <strong style={{ color: '#fafafa' }}>{email}</strong>. Click it to activate your account.
          </p>
          <Link
            href="/login"
            style={{
              display: 'block', padding: '10px 24px',
              border: '1px solid #3f3f46', color: '#fafafa',
              borderRadius: 8, textDecoration: 'none', fontWeight: 500, fontSize: 14,
            }}
          >
            Back to login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#09090b', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <span style={{ fontSize: 32 }}>📖</span>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#fafafa', marginTop: 12, letterSpacing: '-0.02em' }}>Create account</h1>
          <p style={{ color: '#a1a1aa', marginTop: 4, fontSize: 14 }}>Start learning smarter with SmartDeck</p>
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
                placeholder="Min. 8 characters"
                minLength={8}
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
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>
          <p style={{ marginTop: 20, textAlign: 'center', fontSize: 14, color: '#71717a' }}>
            Have an account?{' '}
            <Link href="/login" style={{ color: '#6366f1', textDecoration: 'none', fontWeight: 500 }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
