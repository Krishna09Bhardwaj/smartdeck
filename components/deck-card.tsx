'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import type { Deck } from '@/types'

interface DeckCardProps {
  deck: Deck
  dueCount: number
  masteryPct: number
  index?: number
}

export default function DeckCard({ deck, dueCount, masteryPct, index = 0 }: DeckCardProps) {
  const [hovered, setHovered] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), index * 60)
    return () => clearTimeout(t)
  }, [index])

  return (
    <div style={{
      opacity: mounted ? 1 : 0,
      transform: mounted ? 'translateY(0)' : 'translateY(16px)',
      transition: `opacity 300ms ease ${index * 60}ms, transform 300ms ease ${index * 60}ms`,
    }}>
      <Link href={`/decks/${deck.id}`} style={{ textDecoration: 'none', display: 'block' }}>
        <div
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{
            background: hovered ? '#1e1e24' : '#18181b',
            border: `1px solid ${hovered ? '#6366f1' : '#2a2a2e'}`,
            borderRadius: 16,
            padding: 24,
            cursor: 'pointer',
            transition: 'all 200ms ease',
            transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
            boxShadow: hovered ? '0 0 0 1px #6366f1, 0 8px 30px rgba(0,0,0,0.4)' : 'none',
          }}
        >
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#ffffff', marginBottom: 6, lineHeight: 1.3, letterSpacing: '-0.01em' }}>
            {deck.title}
          </h3>
          {deck.description && (
            <p style={{ fontSize: 13, color: '#71717a', marginBottom: 14, lineHeight: 1.5,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {deck.description}
            </p>
          )}

          {/* Badges */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 18, flexWrap: 'wrap' }}>
            <span style={{
              fontSize: 11, padding: '3px 8px', borderRadius: 6,
              background: '#1e1e24', color: '#71717a', fontWeight: 600,
              border: '1px solid #2a2a2e',
            }}>
              {deck.card_count} cards
            </span>
            {dueCount > 0 && (
              <span style={{
                fontSize: 11, padding: '3px 8px', borderRadius: 6,
                background: 'rgba(245,158,11,0.1)', color: '#f59e0b',
                border: '1px solid rgba(245,158,11,0.25)', fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: '0.04em',
              }}>
                {dueCount} due
              </span>
            )}
            {masteryPct >= 80 && (
              <span style={{
                fontSize: 11, padding: '3px 8px', borderRadius: 6,
                background: 'rgba(34,197,94,0.1)', color: '#22c55e',
                border: '1px solid rgba(34,197,94,0.25)', fontWeight: 600,
              }}>
                Mastered
              </span>
            )}
          </div>

          {/* Mastery bar */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Mastery</span>
              <span style={{ fontSize: 11, color: '#a1a1aa', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{masteryPct}%</span>
            </div>
            <div style={{ height: 4, background: '#27272a', borderRadius: 999, overflow: 'hidden' }}>
              <div style={{
                height: '100%', background: '#22c55e', borderRadius: 999,
                width: `${masteryPct}%`, transition: 'width 800ms ease-out',
              }} />
            </div>
          </div>

          {/* Study button */}
          {dueCount > 0 ? (
            <Link
              href={`/decks/${deck.id}/study`}
              onClick={e => e.stopPropagation()}
              style={{
                display: 'block', textAlign: 'center', padding: '10px 16px',
                background: '#6366f1', color: '#ffffff', borderRadius: 10,
                textDecoration: 'none', fontWeight: 600, fontSize: 13,
                transition: 'all 200ms ease',
              }}
            >
              Study now
            </Link>
          ) : (
            <p style={{ textAlign: 'center', fontSize: 13, color: '#22c55e', fontWeight: 600, padding: '10px 0' }}>
              All caught up ✓
            </p>
          )}
        </div>
      </Link>
    </div>
  )
}
