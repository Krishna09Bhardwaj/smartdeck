'use client'
import { useState, useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Maximize2, Minimize2, X } from 'lucide-react'
import Flashcard from './flashcard'
import XPToast from './xp-toast'
import { useFocus } from './focus-provider'
import type { Card, ReviewQuality } from '@/types'

interface StudySessionProps {
  cards: Card[]
  deckId: string
}

interface SessionResult {
  cardId: string
  quality: ReviewQuality
  xpEarned: number
}

interface XPToastData {
  id: number
  amount: number
}

const CONFETTI_COLORS = ['#6366f1', '#f59e0b', '#22c55e', '#ef4444', '#818cf8', '#fbbf24']

function Confetti() {
  const pieces = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    dx: (Math.random() - 0.5) * 320,
    dy: -(Math.random() * 220 + 80),
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    size: Math.random() * 8 + 5,
    rot: Math.random() * 360,
    delay: Math.random() * 0.3,
  }))

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {pieces.map(p => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            width: p.size,
            height: p.size,
            background: p.color,
            borderRadius: 2,
            animation: `confetti-piece 2s ease-out ${p.delay}s forwards`,
            // CSS custom properties for per-piece animation
            // @ts-expect-error CSS custom properties
            '--dx': `${p.dx}px`,
            '--dy': `${p.dy}px`,
            '--rot': `${p.rot}deg`,
          }}
        />
      ))}
      <style>{`
        @keyframes confetti-piece {
          0%   { transform: translate(0,0) rotate(0deg); opacity: 1; }
          100% { transform: translate(var(--dx), var(--dy)) rotate(var(--rot)); opacity: 0; }
        }
      `}</style>
    </div>
  )
}

export default function StudySession({ cards, deckId }: StudySessionProps) {
  const [index, setIndex] = useState(0)
  const [results, setResults] = useState<SessionResult[]>([])
  const [done, setDone] = useState(false)
  const [toasts, setToasts] = useState<XPToastData[]>([])
  const [sessionXP, setSessionXP] = useState(0)
  const [finalLevel, setFinalLevel] = useState(1)
  const [leveledUp, setLeveledUp] = useState(false)
  const [finalStreak, setFinalStreak] = useState(0)
  const [finalCurrentXP, setFinalCurrentXP] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const toastIdRef = useRef(0)
  const router = useRouter()
  const { focusMode, setFocusMode } = useFocus()
  const startTime = useRef(Date.now())

  // Session timer
  useEffect(() => {
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  // Cleanup focus mode on unmount
  useEffect(() => () => setFocusMode(false), [setFocusMode])

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  const handleRate = useCallback(async (quality: ReviewQuality) => {
    const card = cards[index]
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ card_id: card.id, quality }),
    })
    const data = await res.json()

    const xpEarned = data.xp_earned ?? 0
    setSessionXP(x => x + xpEarned)
    if (data.leveled_up) { setLeveledUp(true); setFinalLevel(data.new_level) }
    if (data.current_streak) setFinalStreak(data.current_streak)
    if (typeof data.new_current_xp === 'number') setFinalCurrentXP(data.new_current_xp)

    if (xpEarned > 0) {
      const id = ++toastIdRef.current
      setToasts(t => [...t, { id, amount: xpEarned }])
    }

    const result: SessionResult = { cardId: card.id, quality, xpEarned }
    setResults(r => [...r, result])

    if (index + 1 >= cards.length) {
      if (timerRef.current) clearInterval(timerRef.current)
      setDone(true)
      setFocusMode(false)
    } else {
      setIndex(i => i + 1)
    }
  }, [index, cards, setFocusMode])

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key.toLowerCase() === 'f') handleRate(1)
      else if (e.key.toLowerCase() === 'h') handleRate(3)
      else if (e.key.toLowerCase() === 'g') handleRate(4)
      else if (e.key.toLowerCase() === 'e') handleRate(5)
      else if (e.key === 'Escape' && focusMode) setFocusMode(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleRate, focusMode, setFocusMode])

  // SESSION COMPLETE
  if (done) {
    const correct = results.filter(r => r.quality >= 4).length
    const accuracy = Math.round((correct / results.length) * 100)
    const timeTaken = Math.round((Date.now() - startTime.current) / 1000)

    return (
      <>
        <Confetti />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', minHeight: '70vh', gap: 28, textAlign: 'center',
            padding: '0 24px',
          }}
        >
          {/* Animated check */}
          <div style={{ position: 'relative', width: 80, height: 80 }}>
            <svg width="80" height="80" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="36" fill="none" stroke="#22c55e" strokeWidth="3"
                style={{ strokeDasharray: 226, strokeDashoffset: 0, animation: 'dash-circle 0.6s ease-out forwards' }} />
              <path d="M24 40 L35 51 L56 30" stroke="#22c55e" strokeWidth="3" fill="none"
                strokeLinecap="round" strokeLinejoin="round"
                style={{ strokeDasharray: 50, strokeDashoffset: 0, animation: 'dash-check 0.4s 0.4s ease-out forwards' }} />
            </svg>
            <style>{`
              @keyframes dash-circle { from { stroke-dashoffset: 226; } to { stroke-dashoffset: 0; } }
              @keyframes dash-check  { from { stroke-dashoffset: 50;  } to { stroke-dashoffset: 0; } }
            `}</style>
          </div>

          <div>
            <h2 style={{ fontSize: 32, fontWeight: 800, color: '#ffffff', letterSpacing: '-0.03em', marginBottom: 8 }}>
              Session complete! 🎉
            </h2>
            {finalStreak > 1 && (
              <p style={{ color: '#f59e0b', fontWeight: 700, fontSize: 16 }}>🔥 {finalStreak} day streak!</p>
            )}
            {leveledUp && (
              <p style={{ color: '#6366f1', fontWeight: 700, fontSize: 15, marginTop: 4 }}>
                ⬆️ Level up! You are now Level {finalLevel}
              </p>
            )}
          </div>

          {/* Stats grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, width: '100%', maxWidth: 560 }}>
            {[
              { label: 'Cards', value: cards.length, color: '#ffffff' },
              { label: 'Accuracy', value: `${accuracy}%`, color: '#22c55e' },
              { label: 'XP earned', value: `+${sessionXP}`, color: '#6366f1' },
              { label: 'Time', value: formatTime(timeTaken), color: '#a1a1aa' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ background: '#18181b', border: '1px solid #2a2a2e', borderRadius: 12, padding: '14px 10px' }}>
                <p style={{ fontSize: 22, fontWeight: 800, color, fontVariantNumeric: 'tabular-nums' }}>{value}</p>
                <p style={{ fontSize: 11, color: '#71717a', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</p>
              </div>
            ))}
          </div>

          {/* XP bar */}
          {sessionXP > 0 && (
            <div style={{ width: '100%', maxWidth: 380, background: '#1a1a2e', borderRadius: 10, padding: '10px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 12 }}>
                <span style={{ color: '#ffffff', fontWeight: 600 }}>Level {finalLevel}</span>
                <span style={{ color: '#71717a' }}>{finalCurrentXP} / 500 XP</span>
              </div>
              <div style={{ height: 6, background: '#2a2a3e', borderRadius: 999 }}>
                <div style={{
                  height: '100%', background: 'linear-gradient(90deg,#6366f1,#818cf8)',
                  borderRadius: 999, width: `${Math.min((finalCurrentXP / 500) * 100, 100)}%`,
                  transition: 'width 800ms ease-out',
                }} />
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={() => router.push('/dashboard')}
              style={{
                padding: '12px 24px', background: 'transparent',
                border: '1px solid #3f3f46', color: '#a1a1aa',
                borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 500,
                transition: 'all 200ms ease',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#6366f1'; (e.currentTarget as HTMLElement).style.color = '#ffffff' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#3f3f46'; (e.currentTarget as HTMLElement).style.color = '#a1a1aa' }}
            >
              Back to dashboard
            </button>
            <button
              onClick={() => router.push(`/decks/${deckId}`)}
              style={{
                padding: '12px 24px', background: '#6366f1',
                border: 'none', color: '#ffffff',
                borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 600,
                transition: 'all 200ms ease',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#4f46e5'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#6366f1'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)' }}
            >
              Study more
            </button>
          </div>
        </motion.div>
      </>
    )
  }

  const progress = Math.round((index / cards.length) * 100)
  const card = cards[index]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* XP toasts */}
      {toasts.map(t => (
        <XPToast key={t.id} amount={t.amount} onDone={() => setToasts(ts => ts.filter(x => x.id !== t.id))} />
      ))}

      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {focusMode && (
          <div style={{ fontFamily: 'monospace', fontSize: 15, color: '#71717a', fontVariantNumeric: 'tabular-nums', marginRight: 8 }}>
            {formatTime(elapsed)}
          </div>
        )}
        <span style={{ fontSize: 13, color: '#71717a', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
          {index + 1} / {cards.length}
        </span>
        <div style={{ flex: 1, height: 4, background: '#27272a', borderRadius: 999, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            background: 'linear-gradient(90deg,#6366f1,#818cf8)',
            borderRadius: 999,
            width: `${progress}%`,
            transition: 'width 300ms ease',
          }} />
        </div>
        <button
          onClick={() => setFocusMode(!focusMode)}
          title={focusMode ? 'Exit focus mode' : 'Focus mode'}
          style={{
            background: 'transparent', border: '1px solid #2a2a2e',
            borderRadius: 6, color: '#71717a', cursor: 'pointer',
            padding: '5px 8px', display: 'flex', alignItems: 'center',
            transition: 'all 200ms ease',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#6366f1'; (e.currentTarget as HTMLElement).style.borderColor = '#6366f1' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#71717a'; (e.currentTarget as HTMLElement).style.borderColor = '#2a2a2e' }}
        >
          {focusMode ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
        </button>
        <button
          onClick={() => router.push(`/decks/${deckId}`)}
          style={{
            padding: '5px 14px', background: 'transparent', border: '1px solid #2a2a2e',
            color: '#71717a', borderRadius: 6, fontSize: 13, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 4, transition: 'all 200ms ease',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#ffffff'; (e.currentTarget as HTMLElement).style.borderColor = '#6366f1' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#71717a'; (e.currentTarget as HTMLElement).style.borderColor = '#2a2a2e' }}
        >
          <X size={12} /> Exit
        </button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={card.id}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.18 }}
        >
          <Flashcard question={card.question} answer={card.answer} onRate={handleRate} />
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
