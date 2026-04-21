'use client'
import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Flashcard from './flashcard'
import type { Card, ReviewQuality } from '@/types'

interface StudySessionProps {
  cards: Card[]
  deckId: string
}

interface SessionResult {
  cardId: string
  quality: ReviewQuality
  nextDate: string
}

export default function StudySession({ cards, deckId }: StudySessionProps) {
  const [index, setIndex] = useState(0)
  const [results, setResults] = useState<SessionResult[]>([])
  const [done, setDone] = useState(false)
  const router = useRouter()

  const handleRate = useCallback(async (quality: ReviewQuality) => {
    const card = cards[index]
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ card_id: card.id, quality }),
    })
    const data = await res.json()
    setResults(r => [...r, { cardId: card.id, quality, nextDate: data.next_review_date }])
    if (index + 1 >= cards.length) {
      setDone(true)
    } else {
      setIndex(i => i + 1)
    }
  }, [index, cards])

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const key = e.key.toLowerCase()
      if (key === 'f') handleRate(1)
      else if (key === 'h') handleRate(3)
      else if (key === 'g') handleRate(4)
      else if (key === 'e') handleRate(5)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleRate])

  if (done) {
    const forgot = results.filter(r => r.quality === 1).length
    const hard = results.filter(r => r.quality === 3).length
    const good = results.filter(r => r.quality === 4).length
    const easy = results.filter(r => r.quality === 5).length

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 24, textAlign: 'center' }}
      >
        {/* Check circle */}
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: 'rgba(34,197,94,0.15)', border: '2px solid #22c55e',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <path d="M8 18 L15 25 L28 11" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        <div>
          <h2 style={{ fontSize: 28, fontWeight: 700, color: '#fafafa', letterSpacing: '-0.02em', marginBottom: 8 }}>
            Session complete!
          </h2>
          <p style={{ color: '#a1a1aa', fontSize: 15 }}>You reviewed {cards.length} card{cards.length === 1 ? '' : 's'}</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {[
            { label: 'Forgot', count: forgot, color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
            { label: 'Hard', count: hard, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
            { label: 'Good', count: good, color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
            { label: 'Easy', count: easy, color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
          ].map(({ label, count, color, bg }) => (
            <div key={label} style={{ background: bg, borderRadius: 12, padding: '16px 20px', border: `1px solid ${color}30` }}>
              <p style={{ fontSize: 28, fontWeight: 700, color }}>{count}</p>
              <p style={{ fontSize: 12, color: '#a1a1aa', marginTop: 4 }}>{label}</p>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          <button
            onClick={() => router.push(`/decks/${deckId}`)}
            style={{
              padding: '10px 24px', background: 'transparent',
              border: '1px solid #3f3f46', color: '#fafafa',
              borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 500,
            }}
          >
            Back to deck
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            style={{
              padding: '10px 24px', background: '#6366f1',
              border: 'none', color: '#fafafa',
              borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 500,
            }}
          >
            Dashboard
          </button>
        </div>
      </motion.div>
    )
  }

  const progress = Math.round((index / cards.length) * 100)
  const card = cards[index]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Progress bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <span style={{ fontSize: 13, color: '#a1a1aa', whiteSpace: 'nowrap' }}>
          Card {index + 1} of {cards.length}
        </span>
        <div style={{ flex: 1, height: 3, background: '#27272a', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{
            height: '100%', background: '#6366f1', borderRadius: 2,
            width: `${progress}%`, transition: 'width 300ms ease'
          }} />
        </div>
        <button
          onClick={() => router.push(`/decks/${deckId}`)}
          style={{
            padding: '6px 14px', background: 'transparent', border: '1px solid #3f3f46',
            color: '#a1a1aa', borderRadius: 6, fontSize: 13, cursor: 'pointer',
          }}
        >
          Exit
        </button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={card.id}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.2 }}
        >
          <Flashcard
            question={card.question}
            answer={card.answer}
            onRate={handleRate}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
