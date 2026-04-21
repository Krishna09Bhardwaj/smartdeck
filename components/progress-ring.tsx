interface ProgressRingProps {
  value: number
  size?: number
  strokeWidth?: number
  label?: string
}

export default function ProgressRing({ value, size = 80, strokeWidth = 8, label }: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#27272a"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#6366f1"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      <span style={{ fontSize: 13, fontWeight: 700, color: '#ffffff', marginTop: -4, fontVariantNumeric: 'tabular-nums' }}>
        {Math.round(value)}%
      </span>
      {label && <span style={{ fontSize: 11, color: '#71717a' }}>{label}</span>}
    </div>
  )
}
