'use client'
import { useEffect, useState } from 'react'

interface XPToastProps {
  amount: number
  onDone: () => void
}

export default function XPToast({ amount, onDone }: XPToastProps) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => { setVisible(false); setTimeout(onDone, 200) }, 1200)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div
      style={{
        position: 'fixed',
        top: 80,
        right: 24,
        zIndex: 9999,
        background: 'rgba(34,197,94,0.15)',
        border: '1px solid #22c55e40',
        borderRadius: 10,
        padding: '8px 16px',
        color: '#22c55e',
        fontWeight: 700,
        fontSize: 14,
        fontVariantNumeric: 'tabular-nums',
        pointerEvents: 'none',
        transition: 'opacity 200ms ease, transform 1200ms ease',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(-40px)',
      }}
    >
      +{amount} XP
    </div>
  )
}
