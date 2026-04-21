'use client'
import { useState } from 'react'

interface DeckCardRowProps {
  question: string
  answer: string
  isDue: boolean
  isMastered: boolean
  nextDate?: string
}

export default function DeckCardRow({ question, answer, isDue, isMastered, nextDate }: DeckCardRowProps) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '16px 20px',
        background: hovered ? '#1e1e24' : '#18181b',
        border: `1px solid ${hovered ? '#6366f1' : '#2a2a2e'}`,
        borderLeft: hovered ? '3px solid #6366f1' : '3px solid transparent',
        borderRadius: 12,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 16,
        cursor: 'default',
        transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
        boxShadow: hovered ? '0 4px 20px rgba(0,0,0,0.4)' : 'none',
        transition: 'all 200ms ease',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 15, fontWeight: 500, color: '#ffffff', lineHeight: 1.4, marginBottom: 4 }}>
          {question}
        </p>
        <p style={{
          fontSize: 13, color: '#71717a', lineHeight: 1.4,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {answer}
        </p>
      </div>
      <div style={{ flexShrink: 0 }}>
        {isMastered ? (
          <span style={{
            fontSize: 11, padding: '3px 8px',
            background: 'rgba(34,197,94,0.1)', color: '#22c55e',
            border: '1px solid rgba(34,197,94,0.25)',
            borderRadius: 6, fontWeight: 600, textTransform: 'uppercase',
          }}>
            Mastered
          </span>
        ) : isDue ? (
          <span style={{
            fontSize: 11, padding: '3px 8px',
            background: 'rgba(245,158,11,0.1)', color: '#f59e0b',
            border: '1px solid rgba(245,158,11,0.25)',
            borderRadius: 6, fontWeight: 600, textTransform: 'uppercase',
          }}>
            Due
          </span>
        ) : (
          <span style={{
            fontSize: 11, padding: '3px 8px',
            background: '#1e1e24', color: '#71717a',
            border: '1px solid #2a2a2e',
            borderRadius: 6, fontVariantNumeric: 'tabular-nums',
          }}>
            {nextDate ?? '—'}
          </span>
        )}
      </div>
    </div>
  )
}
