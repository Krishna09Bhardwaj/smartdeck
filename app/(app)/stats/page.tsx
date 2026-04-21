'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface DeckRow { id: string; title: string; card_count: number; mastery_pct: number }
interface StatsData {
  total_reviews: number
  current_streak: number
  longest_streak: number
  mastery_percentage: number
  daily_reviews: { date: string; count: number }[]
  deck_breakdown: DeckRow[]
}

function heatColor(count: number): string {
  if (count === 0) return '#1a1a1a'
  if (count <= 5) return '#312e81'
  if (count <= 15) return '#4338ca'
  if (count <= 30) return '#6366f1'
  return '#a5b4fc'
}

function generateLast365Days(): string[] {
  const dates: string[] = []
  for (let i = 364; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000)
    dates.push(d.toISOString().slice(0, 10))
  }
  return dates
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export default function StatsPage() {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [hoveredCell, setHoveredCell] = useState<{ date: string; count: number } | null>(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    fetch('/api/stats')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setStats(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{ padding: 32 }}>
      <div style={{ height: 32, width: 160, background: '#1e1e24', borderRadius: 8, marginBottom: 32, animation: 'pulse 1.5s infinite' }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        {[1,2,3,4].map(i => <div key={i} style={{ height: 100, background: '#18181b', border: '1px solid #2a2a2e', borderRadius: 16, animation: 'pulse 1.5s infinite' }} />)}
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
    </div>
  )

  if (!stats) return <div style={{ padding: 32, color: '#71717a' }}>Failed to load stats.</div>

  const dailyMap: Record<string, number> = {}
  for (const { date, count } of stats.daily_reviews) dailyMap[date] = count

  const allDates = generateLast365Days()
  const firstDayOfWeek = new Date(allDates[0]).getDay()
  const padded: (string | null)[] = [...Array(firstDayOfWeek).fill(null), ...allDates]
  const weeks: (string | null)[][] = []
  for (let i = 0; i < padded.length; i += 7) weeks.push(padded.slice(i, i + 7))

  // Month labels: find which week index each month starts
  const monthLabels: { label: string; weekIdx: number }[] = []
  let lastMonth = -1
  weeks.forEach((week, wi) => {
    const firstDate = week.find(d => d !== null)
    if (firstDate) {
      const m = new Date(firstDate).getMonth()
      if (m !== lastMonth) { monthLabels.push({ label: MONTHS[m], weekIdx: wi }); lastMonth = m }
    }
  })

  const statCards = [
    { label: 'Total Reviews', value: stats.total_reviews, color: '#ffffff' },
    { label: 'Current Streak', value: `${stats.current_streak}d`, color: '#f59e0b' },
    { label: 'Longest Streak', value: `${stats.longest_streak}d`, color: '#22c55e' },
    { label: 'Mastery', value: `${stats.mastery_percentage}%`, color: '#6366f1' },
  ]

  const formatDate = (d: string) => {
    const dt = new Date(d + 'T00:00:00')
    return dt.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
  }

  return (
    <div style={{ padding: 32, maxWidth: 1100, margin: '0 auto' }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, color: '#ffffff', letterSpacing: '-0.03em', marginBottom: 32 }}>
        <span style={{ color: '#6366f1' }}>&gt;&gt; </span>Your Stats
      </h1>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 40 }}>
        {statCards.map(({ label, value, color }) => (
          <div key={label} style={{
            background: '#18181b', border: '1px solid #2a2a2e',
            borderRadius: 16, padding: '20px 24px',
            transition: 'all 200ms ease', cursor: 'default',
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLElement).style.borderColor = '#6366f1' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.borderColor = '#2a2a2e' }}
          >
            <p style={{ fontSize: 13, color: '#71717a', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500 }}>{label}</p>
            <p style={{ fontSize: 40, fontWeight: 800, color, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Heatmap */}
      <div style={{ background: '#18181b', border: '1px solid #2a2a2e', borderRadius: 16, padding: 28, marginBottom: 32, position: 'relative', overflow: 'hidden' }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: '#ffffff', marginBottom: 20 }}>Study Activity</h2>

        {/* Tooltip */}
        {hoveredCell && (
          <div style={{
            position: 'fixed', zIndex: 100,
            left: tooltipPos.x + 12, top: tooltipPos.y - 36,
            background: '#18181b', border: '1px solid #2a2a2e',
            borderRadius: 8, padding: '5px 10px',
            fontSize: 12, color: '#ffffff', fontWeight: 500,
            pointerEvents: 'none', whiteSpace: 'nowrap',
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          }}>
            {formatDate(hoveredCell.date)} · {hoveredCell.count} card{hoveredCell.count === 1 ? '' : 's'} studied
          </div>
        )}

        <div style={{ overflowX: 'auto' }}>
          <div style={{ minWidth: 'max-content' }}>
            {/* Month labels */}
            <div style={{ display: 'flex', marginLeft: 24, marginBottom: 6 }}>
              {weeks.map((_, wi) => {
                const label = monthLabels.find(m => m.weekIdx === wi)
                return (
                  <div key={wi} style={{ width: 15, marginRight: 3, flexShrink: 0 }}>
                    {label && <span style={{ fontSize: 10, color: '#71717a', whiteSpace: 'nowrap' }}>{label.label}</span>}
                  </div>
                )
              })}
            </div>

            <div style={{ display: 'flex', gap: 0 }}>
              {/* Day labels */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginRight: 6, paddingTop: 0 }}>
                {['', 'M', '', 'W', '', 'F', ''].map((d, i) => (
                  <div key={i} style={{ height: 12, fontSize: 9, color: '#71717a', lineHeight: '12px', width: 12 }}>{d}</div>
                ))}
              </div>

              {/* Grid */}
              <div style={{ display: 'flex', gap: 3 }}>
                {weeks.map((week, wi) => (
                  <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {week.map((date, di) => {
                      const count = date ? (dailyMap[date] ?? 0) : 0
                      return (
                        <div
                          key={`${wi}-${di}`}
                          onMouseEnter={e => { if (date) { setHoveredCell({ date, count }); setTooltipPos({ x: e.clientX, y: e.clientY }) } }}
                          onMouseLeave={() => setHoveredCell(null)}
                          style={{
                            width: 12, height: 12, borderRadius: 2,
                            background: date ? heatColor(count) : 'transparent',
                            cursor: date ? 'default' : 'default',
                            transition: 'background 200ms ease',
                          }}
                        />
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 16 }}>
          <span style={{ fontSize: 10, color: '#71717a' }}>Less</span>
          {[0, 3, 10, 20, 35].map(count => (
            <div key={count} style={{ width: 12, height: 12, borderRadius: 2, background: heatColor(count) }} />
          ))}
          <span style={{ fontSize: 10, color: '#71717a' }}>More</span>
          <span style={{ fontSize: 11, color: '#71717a', marginLeft: 12 }}>
            Last 365 days — {stats.total_reviews} total reviews
          </span>
        </div>
      </div>

      {/* Deck breakdown */}
      {stats.deck_breakdown && stats.deck_breakdown.length > 0 && (
        <div style={{ background: '#18181b', border: '1px solid #2a2a2e', borderRadius: 16, padding: 28 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#ffffff', marginBottom: 20 }}>Deck Breakdown</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {stats.deck_breakdown.map((deck, i) => (
              <DeckBreakdownRow key={deck.id} deck={deck} index={i} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function DeckBreakdownRow({ deck, index }: { deck: DeckRow; index: number }) {
  const [hovered, setHovered] = useState(false)
  return (
    <Link
      href={`/decks/${deck.id}`}
      style={{ textDecoration: 'none' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{
        display: 'flex', alignItems: 'center', gap: 16,
        padding: '14px 16px',
        background: hovered ? '#1e1e24' : 'transparent',
        borderLeft: hovered ? '3px solid #6366f1' : '3px solid transparent',
        borderRadius: 10,
        transition: 'all 200ms ease',
        cursor: 'pointer',
        animationDelay: `${index * 50}ms`,
      }}>
        <span style={{ fontSize: 14, fontWeight: 500, color: '#ffffff', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {deck.title}
        </span>
        <span style={{ fontSize: 12, color: '#71717a', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
          {deck.card_count} cards
        </span>
        <div style={{ width: 120, flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 11, color: '#71717a' }}>Mastery</span>
            <span style={{ fontSize: 11, color: '#22c55e', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{deck.mastery_pct}%</span>
          </div>
          <div style={{ height: 6, background: '#27272a', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{
              height: '100%', background: '#22c55e', borderRadius: 999,
              width: `${deck.mastery_pct}%`, transition: 'width 800ms ease',
            }} />
          </div>
        </div>
      </div>
    </Link>
  )
}
