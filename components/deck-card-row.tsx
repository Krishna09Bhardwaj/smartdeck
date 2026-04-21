'use client'
import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

interface DeckCardRowProps {
  question: string
  answer: string
  isDue: boolean
  isMastered: boolean
  nextDate?: string
}

export default function DeckCardRow({ question, answer, isDue, isMastered, nextDate }: DeckCardRowProps) {
  const [hovered, setHovered] = useState(false)
  const [expanded, setExpanded] = useState(false)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => setExpanded(e => !e)}
      style={{
        padding: '16px 20px',
        background: expanded ? '#1e1e24' : hovered ? '#1a1a20' : '#18181b',
        border: `1px solid ${expanded ? '#6366f1' : hovered ? '#6366f1' : '#2a2a2e'}`,
        borderLeft: `3px solid ${expanded || hovered ? '#6366f1' : 'transparent'}`,
        borderRadius: 12,
        cursor: 'pointer',
        transition: 'all 200ms ease',
        transform: hovered && !expanded ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: expanded ? '0 0 0 1px rgba(99,102,241,0.15), 0 4px 20px rgba(0,0,0,0.3)' : hovered ? '0 4px 20px rgba(0,0,0,0.2)' : 'none',
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 15, fontWeight: 500, color: '#ffffff', lineHeight: 1.4, marginBottom: expanded ? 0 : 4 }}>
            {question}
          </p>
          {!expanded && (
            <p style={{
              fontSize: 13, color: '#71717a', lineHeight: 1.4,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {answer}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {isMastered ? (
            <span style={{
              fontSize: 11, padding: '3px 8px',
              background: 'rgba(34,197,94,0.1)', color: '#22c55e',
              border: '1px solid rgba(34,197,94,0.25)',
              borderRadius: 6, fontWeight: 600, textTransform: 'uppercase',
            }}>Mastered</span>
          ) : isDue ? (
            <span style={{
              fontSize: 11, padding: '3px 8px',
              background: 'rgba(245,158,11,0.1)', color: '#f59e0b',
              border: '1px solid rgba(245,158,11,0.25)',
              borderRadius: 6, fontWeight: 600, textTransform: 'uppercase',
            }}>Due</span>
          ) : (
            <span style={{
              fontSize: 11, padding: '3px 8px',
              background: '#1e1e24', color: '#71717a',
              border: '1px solid #2a2a2e',
              borderRadius: 6, fontVariantNumeric: 'tabular-nums',
            }}>{nextDate ?? '—'}</span>
          )}
          <ChevronDown
            size={16}
            color="#71717a"
            style={{
              transition: 'transform 200ms ease',
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              flexShrink: 0,
            }}
          />
        </div>
      </div>

      {/* Expanded answer */}
      {expanded && (
        <div style={{
          marginTop: 14,
          paddingTop: 14,
          borderTop: '1px solid #2a2a2e',
        }}>
          <p style={{ fontSize: 11, color: '#6366f1', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
            Answer
          </p>
          <p style={{ fontSize: 14, color: '#a1a1aa', lineHeight: 1.7 }}>
            {answer}
          </p>
        </div>
      )}
    </div>
  )
}
