'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const STEPS = [
  {
    title: 'Welcome to SmartDeck 👋',
    body: "You're about to study smarter. Here's how it works in 30 seconds.",
  },
  {
    title: 'Upload a PDF, get flashcards',
    body: 'Drop in any study material and AI generates 15–25 targeted flashcards instantly.',
  },
  {
    title: 'The app remembers for you',
    body: 'Spaced repetition shows each card right before you forget it — so you study less and remember more.',
  },
]

export default function OnboardingModal({ hasDecks }: { hasDecks: boolean }) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (!hasDecks && !localStorage.getItem('onboarding_completed')) {
      setShow(true)
    }
  }, [hasDecks])

  function finish() {
    localStorage.setItem('onboarding_completed', '1')
    setShow(false)
    router.push('/decks/new')
  }

  if (!show) return null

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(9,9,11,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div style={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 16, padding: 40, maxWidth: 480, width: '90%' }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 32 }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{ height: 3, flex: 1, borderRadius: 2, background: i <= step ? '#6366f1' : '#27272a', transition: 'background 300ms' }} />
          ))}
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 12 }}>{STEPS[step].title}</h2>
        <p style={{ color: '#a1a1aa', lineHeight: 1.6, marginBottom: 32 }}>{STEPS[step].body}</p>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          {step < STEPS.length - 1 ? (
            <button onClick={() => setStep(s => s + 1)} style={{ padding: '10px 24px', background: '#6366f1', color: '#fafafa', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 500 }}>
              Next →
            </button>
          ) : (
            <button onClick={finish} style={{ padding: '10px 24px', background: '#6366f1', color: '#fafafa', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 500 }}>
              Got it, let&apos;s go! →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
