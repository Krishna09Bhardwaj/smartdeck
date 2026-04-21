'use client'
import { useEffect } from 'react'

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', padding: 32, textAlign: 'center',
    }}>
      <p style={{ fontSize: 48, marginBottom: 16 }}>⚠️</p>
      <h2 style={{ fontSize: 24, fontWeight: 700, color: '#fafafa', marginBottom: 8 }}>
        Something went wrong
      </h2>
      <p style={{ color: '#71717a', marginBottom: 24, maxWidth: 400 }}>
        {error.message || 'An unexpected error occurred.'}
      </p>
      <button
        onClick={reset}
        style={{
          padding: '10px 24px', background: '#6366f1', color: '#fafafa',
          borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 500, fontSize: 14,
        }}
      >
        Try again
      </button>
    </div>
  )
}
