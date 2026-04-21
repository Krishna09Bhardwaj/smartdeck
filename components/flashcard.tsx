'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'

interface FlashcardProps {
  question: string
  answer: string
  onRate: (quality: 1 | 3 | 4 | 5) => void
}

const ratingButtons = [
  { label: 'Forgot', quality: 1 as const, key: 'F', bg: '#ef4444', color: '#fafafa' },
  { label: 'Hard', quality: 3 as const, key: 'H', bg: '#f59e0b', color: '#09090b' },
  { label: 'Good', quality: 4 as const, key: 'G', bg: '#6366f1', color: '#fafafa' },
  { label: 'Easy', quality: 5 as const, key: 'E', bg: '#22c55e', color: '#fafafa' },
]

export default function Flashcard({ question, answer, onRate }: FlashcardProps) {
  const [flipped, setFlipped] = useState(false)

  function handleRate(quality: 1 | 3 | 4 | 5) {
    setFlipped(false)
    setTimeout(() => onRate(quality), 150)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
      {/* Card */}
      <div
        style={{ width: '100%', maxWidth: 640, cursor: 'pointer', perspective: '1000px', minHeight: 280 }}
        onClick={() => setFlipped(f => !f)}
      >
        <motion.div
          style={{
            position: 'relative', width: '100%', minHeight: 280,
            transformStyle: 'preserve-3d',
            willChange: 'transform',
          }}
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          {/* Front */}
          <div
            style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              padding: 40, background: '#18181b', borderRadius: 16,
              border: '1px solid #3f3f46',
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'translateZ(0)',
            }}
          >
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', color: '#71717a', marginBottom: 16, textTransform: 'uppercase' }}>
              Question
            </p>
            <p style={{ fontSize: 20, fontWeight: 500, color: '#fafafa', textAlign: 'center', lineHeight: 1.6 }}>
              {question}
            </p>
            <p style={{ marginTop: 24, fontSize: 13, color: '#71717a' }}>TAP TO REVEAL</p>
          </div>

          {/* Back */}
          <div
            style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              padding: 40, background: '#27272a', borderRadius: 16,
              border: '1px solid #3f3f46',
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg) translateZ(0)',
            }}
          >
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', color: '#6366f1', marginBottom: 16, textTransform: 'uppercase' }}>
              Answer
            </p>
            <p style={{ fontSize: 17, color: '#fafafa', textAlign: 'center', lineHeight: 1.6 }}>
              {answer}
            </p>
          </div>
        </motion.div>
      </div>

      {/* Rating buttons */}
      <motion.div
        style={{ display: 'flex', gap: 12, flexDirection: 'column', alignItems: 'center' }}
        animate={{ opacity: flipped ? 1 : 0, y: flipped ? 0 : 16 }}
        transition={{ duration: 0.2 }}
      >
        <div style={{ display: 'flex', gap: 10 }}>
          {ratingButtons.map(({ label, quality, bg, color }) => (
            <button
              key={quality}
              onClick={() => handleRate(quality)}
              disabled={!flipped}
              style={{
                padding: '10px 20px', background: bg, color, border: 'none',
                borderRadius: 10, fontSize: 14, fontWeight: 600,
                cursor: flipped ? 'pointer' : 'default',
                transition: 'all 200ms', minWidth: 80,
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {ratingButtons.map(({ key: shortcut, quality }) => (
            <div
              key={quality}
              style={{ textAlign: 'center', width: 80, fontSize: 11, color: '#71717a', fontFamily: 'monospace' }}
            >
              {shortcut}
            </div>
          ))}
        </div>
      </motion.div>

      {!flipped && (
        <p style={{ fontSize: 13, color: '#71717a' }}>Click the card to reveal the answer</p>
      )}
    </div>
  )
}
