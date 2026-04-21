'use client'
import { useState, useRef, useCallback } from 'react'

interface FlashcardProps {
  question: string
  answer: string
  onRate: (quality: 1 | 3 | 4 | 5) => void
}

const ratingButtons = [
  { label: 'Forgot', quality: 1 as const, key: 'F', color: '#ef4444', bg: 'rgba(239,68,68,0.12)', border: '#ef444440' },
  { label: 'Hard',   quality: 3 as const, key: 'H', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: '#f59e0b40' },
  { label: 'Good',   quality: 4 as const, key: 'G', color: '#6366f1', bg: 'rgba(99,102,241,0.12)', border: '#6366f140' },
  { label: 'Easy',   quality: 5 as const, key: 'E', color: '#22c55e', bg: 'rgba(34,197,94,0.12)',  border: '#22c55e40' },
]

export default function Flashcard({ question, answer, onRate }: FlashcardProps) {
  const [flipped, setFlipped] = useState(false)
  const [drag, setDrag] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [flyOff, setFlyOff] = useState<{ x: number; y: number; rot: number } | null>(null)
  const [pressedBtn, setPressedBtn] = useState<number | null>(null)
  const startRef = useRef<{ x: number; y: number } | null>(null)
  const movedRef = useRef(false)

  const triggerRate = useCallback((quality: 1 | 3 | 4 | 5) => {
    setFlipped(false)
    setTimeout(() => onRate(quality), 150)
  }, [onRate])

  const triggerSwipe = useCallback((quality: 1 | 3 | 4 | 5, fx: number, fy: number, rot: number) => {
    setFlyOff({ x: fx, y: fy, rot })
    setTimeout(() => {
      setFlyOff(null)
      setDrag({ x: 0, y: 0 })
      onRate(quality)
    }, 380)
  }, [onRate])

  function handlePointerDown(e: React.PointerEvent) {
    if (flipped || flyOff) return
    startRef.current = { x: e.clientX, y: e.clientY }
    movedRef.current = false
    setIsDragging(true)
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!startRef.current || flyOff) return
    const dx = e.clientX - startRef.current.x
    const dy = e.clientY - startRef.current.y
    if (Math.abs(dx) > 8 || Math.abs(dy) > 8) movedRef.current = true
    setDrag({ x: dx, y: dy })
  }

  function handlePointerUp() {
    if (!startRef.current) return
    const { x, y } = drag
    setIsDragging(false)
    startRef.current = null

    if (!movedRef.current) {
      setDrag({ x: 0, y: 0 })
      setFlipped(f => !f)
      return
    }

    if (x > 80)  { triggerSwipe(5, 700, -80, 30);  return }
    if (x < -80) { triggerSwipe(3, -700, -80, -30); return }
    if (y < -80) { triggerSwipe(4, 0, -700, 0);     return }

    setDrag({ x: 0, y: 0 })
  }

  // Swipe overlay color
  const overlayColor = drag.x > 20 ? '#22c55e' : drag.x < -20 ? '#ef4444' : drag.y < -20 ? '#f59e0b' : 'transparent'
  const overlayOpacity = Math.min(Math.max(Math.abs(drag.x), Math.abs(Math.min(drag.y, 0))) / 80, 1) * 0.35

  const rotation = isDragging ? drag.x / 18 : 0
  const cardTransform = flyOff
    ? `translateX(${flyOff.x}px) translateY(${flyOff.y}px) rotate(${flyOff.rot}deg)`
    : isDragging
      ? `translateX(${drag.x}px) translateY(${drag.y * 0.4}px) rotate(${rotation}deg)`
      : `perspective(1000px) rotateY(${flipped ? 180 : 0}deg)`

  const cardTransition = flyOff
    ? 'transform 0.38s ease-in'
    : isDragging
      ? 'none'
      : 'transform 0.3s ease-out'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, userSelect: 'none' }}>
      {/* Card container */}
      <div style={{ width: '100%', maxWidth: 680, perspective: '1200px', minHeight: 300 }}>
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          style={{
            position: 'relative',
            width: '100%',
            minHeight: 300,
            transform: cardTransform,
            transition: cardTransition,
            transformStyle: 'preserve-3d',
            willChange: 'transform',
            cursor: flipped ? 'default' : isDragging ? 'grabbing' : 'grab',
          }}
        >
          {/* Swipe overlay */}
          {isDragging && overlayColor !== 'transparent' && (
            <div style={{
              position: 'absolute', inset: 0, zIndex: 10,
              borderRadius: 20, pointerEvents: 'none',
              background: overlayColor,
              opacity: overlayOpacity,
              transition: 'opacity 50ms',
            }} />
          )}

          {/* FRONT */}
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: 48,
            background: '#18181b',
            border: '1px solid #2a2a2e',
            borderRadius: 20,
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'translateZ(0)',
          }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', color: '#6366f1', marginBottom: 20, textTransform: 'uppercase' }}>
              Question
            </p>
            <p style={{ fontSize: 22, fontWeight: 600, color: '#ffffff', textAlign: 'center', lineHeight: 1.5 }}>
              {question}
            </p>
            <div style={{ marginTop: 'auto', paddingTop: 32, display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#52525b" strokeWidth="2"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>
              <span style={{ fontSize: 12, color: '#52525b' }}>Tap to flip · Swipe to rate</span>
            </div>
          </div>

          {/* BACK */}
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: 48,
            background: '#1e1e24',
            border: '1px solid #2a2a2e',
            borderRadius: 20,
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg) translateZ(0)',
          }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', color: '#6366f1', marginBottom: 20, textTransform: 'uppercase' }}>
              Answer
            </p>
            <p style={{ fontSize: 18, color: '#ffffff', textAlign: 'center', lineHeight: 1.6 }}>
              {answer}
            </p>
          </div>
        </div>
      </div>

      {/* Rating buttons — slide in after flip */}
      <div style={{
        width: '100%', maxWidth: 680,
        opacity: flipped ? 1 : 0,
        transform: flipped ? 'translateY(0)' : 'translateY(20px)',
        transition: 'opacity 250ms ease, transform 250ms ease',
        pointerEvents: flipped ? 'auto' : 'none',
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          {ratingButtons.map(({ label, quality, key, color, bg, border }) => (
            <div key={quality} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <button
                onClick={() => { setPressedBtn(quality); setTimeout(() => setPressedBtn(null), 150); triggerRate(quality) }}
                style={{
                  padding: '12px 8px',
                  background: pressedBtn === quality ? bg.replace('0.12', '0.22') : bg,
                  border: `1px solid ${border}`,
                  borderRadius: 10,
                  color,
                  fontSize: 14, fontWeight: 700,
                  cursor: 'pointer',
                  transform: pressedBtn === quality ? 'scale(0.95)' : 'scale(1)',
                  transition: 'all 150ms ease',
                  width: '100%',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = pressedBtn === quality ? 'scale(0.95)' : 'scale(1)' }}
              >
                {label}
              </button>
              <span style={{ textAlign: 'center', fontSize: 10, color: '#52525b', fontFamily: 'monospace' }}>{key}</span>
            </div>
          ))}
        </div>
      </div>

      {!flipped && (
        <p style={{ fontSize: 12, color: '#52525b', letterSpacing: '0.02em' }}>
          ← Hard · Tap to flip · Easy →
        </p>
      )}
    </div>
  )
}
