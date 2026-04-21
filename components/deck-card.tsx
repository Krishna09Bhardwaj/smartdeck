'use client'
import Link from 'next/link'
import { useState } from 'react'
import type { Deck } from '@/types'

interface DeckCardProps {
  deck: Deck
  dueCount: number
  masteryPct: number
}

export default function DeckCard({ deck, dueCount, masteryPct }: DeckCardProps) {
  const [hovered, setHovered] = useState(false)

  return (
    <Link href={`/decks/${deck.id}`} style={{ textDecoration: 'none' }}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: '#18181b',
          border: `1px solid ${hovered ? '#6366f1' : '#3f3f46'}`,
          borderRadius: 12,
          padding: 24,
          cursor: 'pointer',
          transition: 'border-color 200ms',
          height: '100%',
        }}
      >
        <h3 style={{ fontSize: 16, fontWeight: 600, color: '#fafafa', marginBottom: 6, lineHeight: 1.3 }}>
          {deck.title}
        </h3>
        {deck.description && (
          <p style={{ fontSize: 13, color: '#71717a', marginBottom: 12, lineHeight: 1.5 }}>
            {deck.description}
          </p>
        )}

        <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 20, background: '#27272a', color: '#a1a1aa', fontWeight: 500 }}>
            {deck.card_count} cards
          </span>
          {dueCount > 0 && (
            <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 20, background: 'rgba(245,158,11,0.15)', color: '#f59e0b', fontWeight: 500 }}>
              {dueCount} due
            </span>
          )}
          {masteryPct >= 80 && (
            <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 20, background: 'rgba(34,197,94,0.15)', color: '#22c55e', fontWeight: 500 }}>
              Mastered
            </span>
          )}
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 11, color: '#71717a' }}>Mastery</span>
            <span style={{ fontSize: 11, color: '#a1a1aa', fontWeight: 500 }}>{masteryPct}%</span>
          </div>
          <div style={{ height: 4, background: '#27272a', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', background: '#22c55e', borderRadius: 2, width: `${masteryPct}%`, transition: 'width 500ms ease' }} />
          </div>
        </div>

        {dueCount > 0 ? (
          <Link
            href={`/decks/${deck.id}/study`}
            onClick={e => e.stopPropagation()}
            style={{
              display: 'block', textAlign: 'center', padding: '9px 16px',
              background: '#6366f1', color: '#fafafa', borderRadius: 8,
              textDecoration: 'none', fontWeight: 500, fontSize: 13,
            }}
          >
            Study now
          </Link>
        ) : (
          <p style={{ textAlign: 'center', fontSize: 13, color: '#22c55e', fontWeight: 500, padding: '9px 0' }}>
            All caught up ✓
          </p>
        )}
      </div>
    </Link>
  )
}
