'use client'
import { useEffect, useState } from 'react'

interface StatsData {
  total_reviews: number
  current_streak: number
  longest_streak: number
  mastery_percentage: number
  daily_reviews: { date: string; count: number }[]
}

function getHeatmapColor(count: number): string {
  if (count === 0) return '#27272a'
  if (count <= 5) return '#4338ca'
  if (count <= 15) return '#6366f1'
  if (count <= 30) return '#818cf8'
  return '#a5b4fc'
}

function generateLast365Days(): string[] {
  const dates: string[] = []
  for (let i = 364; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
    dates.push(d.toISOString().slice(0, 10))
  }
  return dates
}

export default function StatsPage() {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/stats')
      .then(r => r.json())
      .then(data => { setStats(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div style={{ padding: 32 }}>
        <div style={{ height: 32, width: 180, background: '#27272a', borderRadius: 8, marginBottom: 24, animation: 'pulse 1.5s infinite' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
          {[1,2,3,4].map(i => (
            <div key={i} style={{ height: 90, background: '#18181b', border: '1px solid #3f3f46', borderRadius: 12, animation: 'pulse 1.5s infinite' }} />
          ))}
        </div>
        <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
      </div>
    )
  }

  if (!stats) return (
    <div style={{ padding: 32, color: '#71717a' }}>Failed to load stats.</div>
  )

  const dailyMap: Record<string, number> = {}
  for (const { date, count } of stats.daily_reviews) {
    dailyMap[date] = count
  }

  const allDates = generateLast365Days()
  // Pad to start on Sunday
  const firstDayOfWeek = new Date(allDates[0]).getDay()
  const paddedDates: (string | null)[] = [
    ...Array(firstDayOfWeek).fill(null),
    ...allDates,
  ]
  // Split into weeks of 7
  const weeks: (string | null)[][] = []
  for (let i = 0; i < paddedDates.length; i += 7) {
    weeks.push(paddedDates.slice(i, i + 7))
  }

  const statCards = [
    { label: 'Total Reviews', value: stats.total_reviews, color: '#6366f1' },
    { label: 'Current Streak', value: `${stats.current_streak}d`, color: '#f59e0b' },
    { label: 'Longest Streak', value: `${stats.longest_streak}d`, color: '#22c55e' },
    { label: 'Mastery', value: `${stats.mastery_percentage}%`, color: '#818cf8' },
  ]

  return (
    <div style={{ padding: 32, maxWidth: 1100, margin: '0 auto' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: '#fafafa', letterSpacing: '-0.02em', marginBottom: 32 }}>
        Your Stats
      </h1>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 40 }}>
        {statCards.map(({ label, value, color }) => (
          <div
            key={label}
            style={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 12, padding: '20px 24px' }}
          >
            <p style={{ fontSize: 13, color: '#a1a1aa', marginBottom: 8 }}>{label}</p>
            <p style={{ fontSize: 32, fontWeight: 700, color }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Heatmap */}
      <div style={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 12, padding: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: '#fafafa', marginBottom: 20 }}>Study Activity</h2>
        <div style={{ overflowX: 'auto' }}>
          <div style={{ display: 'flex', gap: 3, minWidth: 'max-content' }}>
            {weeks.map((week, wi) => (
              <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {week.map((date, di) => (
                  <div
                    key={`${wi}-${di}`}
                    title={date ? `${date}: ${dailyMap[date] ?? 0} reviews` : ''}
                    style={{
                      width: 12, height: 12, borderRadius: 2,
                      background: date ? getHeatmapColor(dailyMap[date] ?? 0) : 'transparent',
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16 }}>
          <span style={{ fontSize: 11, color: '#71717a' }}>Less</span>
          {[0, 3, 10, 20, 35].map(count => (
            <div
              key={count}
              style={{ width: 12, height: 12, borderRadius: 2, background: getHeatmapColor(count) }}
            />
          ))}
          <span style={{ fontSize: 11, color: '#71717a' }}>More</span>
        </div>

        <p style={{ fontSize: 12, color: '#71717a', marginTop: 12 }}>
          Last 365 days — {stats.total_reviews} total reviews
        </p>
      </div>
    </div>
  )
}
