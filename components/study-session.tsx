'use client'
import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Flashcard from './flashcard'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
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

  if (done) {
    const forgot = results.filter(r => r.quality === 1).length
    const hard = results.filter(r => r.quality === 3).length
    const good = results.filter(r => r.quality === 4).length
    const easy = results.filter(r => r.quality === 5).length

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center"
      >
        <div className="text-5xl">🎉</div>
        <h2 className="text-2xl font-bold">Session complete!</h2>
        <p className="text-slate-500">You reviewed {cards.length} cards</p>
        <div className="grid grid-cols-4 gap-3 mt-2">
          {[
            { label: 'Forgot', count: forgot, color: 'text-red-600' },
            { label: 'Hard', count: hard, color: 'text-orange-600' },
            { label: 'Good', count: good, color: 'text-blue-600' },
            { label: 'Easy', count: easy, color: 'text-green-600' },
          ].map(({ label, count, color }) => (
            <div key={label} className="bg-white rounded-xl p-4 border shadow-sm">
              <p className={`text-2xl font-bold ${color}`}>{count}</p>
              <p className="text-xs text-slate-500 mt-1">{label}</p>
            </div>
          ))}
        </div>
        <div className="flex gap-3 mt-4">
          <Button variant="outline" onClick={() => router.push(`/decks/${deckId}`)}>
            Back to deck
          </Button>
          <Button onClick={() => router.push('/dashboard')}>Dashboard</Button>
        </div>
      </motion.div>
    )
  }

  const progress = Math.round((index / cards.length) * 100)
  const card = cards[index]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-500">{index + 1} / {cards.length}</span>
        <div className="flex-1 mx-4">
          <Progress value={progress} className="h-2" />
        </div>
        <Button variant="ghost" size="sm" onClick={() => router.push(`/decks/${deckId}`)}>
          Exit
        </Button>
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
