'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'

interface FlashcardProps {
  question: string
  answer: string
  onRate: (quality: 1 | 3 | 4 | 5) => void
}

const ratingButtons = [
  { label: 'Forgot', quality: 1 as const, color: 'bg-red-100 hover:bg-red-200 text-red-700 border-red-200' },
  { label: 'Hard', quality: 3 as const, color: 'bg-orange-100 hover:bg-orange-200 text-orange-700 border-orange-200' },
  { label: 'Good', quality: 4 as const, color: 'bg-blue-100 hover:bg-blue-200 text-blue-700 border-blue-200' },
  { label: 'Easy', quality: 5 as const, color: 'bg-green-100 hover:bg-green-200 text-green-700 border-green-200' },
]

export default function Flashcard({ question, answer, onRate }: FlashcardProps) {
  const [flipped, setFlipped] = useState(false)

  function handleRate(quality: 1 | 3 | 4 | 5) {
    setFlipped(false)
    setTimeout(() => onRate(quality), 150)
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div
        className="w-full max-w-2xl cursor-pointer"
        style={{ perspective: '1000px', minHeight: '280px' }}
        onClick={() => setFlipped(f => !f)}
      >
        <motion.div
          className="relative w-full"
          style={{ transformStyle: 'preserve-3d', minHeight: '280px' }}
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.45, ease: 'easeInOut' }}
        >
          {/* Front */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-white rounded-2xl shadow-lg border border-slate-200"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">Question</p>
            <p className="text-xl font-medium text-slate-800 text-center leading-relaxed">{question}</p>
            <p className="mt-6 text-sm text-slate-400">Tap to reveal answer</p>
          </div>
          {/* Back */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-blue-50 rounded-2xl shadow-lg border border-blue-200"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-400 mb-4">Answer</p>
            <p className="text-lg text-slate-800 text-center leading-relaxed">{answer}</p>
          </div>
        </motion.div>
      </div>

      {flipped && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-3"
        >
          {ratingButtons.map(({ label, quality, color }) => (
            <button
              key={quality}
              onClick={() => handleRate(quality)}
              className={`px-5 py-2.5 rounded-xl border text-sm font-semibold transition-all ${color}`}
            >
              {label}
            </button>
          ))}
        </motion.div>
      )}
      {!flipped && (
        <p className="text-sm text-slate-400">Click the card to see the answer</p>
      )}
    </div>
  )
}
