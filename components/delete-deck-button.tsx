'use client'
import { useState } from 'react'
import { Trash2 } from 'lucide-react'

export default function DeleteDeckButton({ action }: { action: () => Promise<void> }) {
  const [hovered, setHovered] = useState(false)
  return (
    <form action={action}>
      <button
        type="submit"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          padding: '10px 12px', background: 'transparent',
          border: `1px solid ${hovered ? '#ef4444' : '#2a2a2e'}`,
          borderRadius: 10,
          color: hovered ? '#ef4444' : '#71717a',
          cursor: 'pointer', display: 'flex',
          alignItems: 'center', transition: 'all 200ms ease',
        }}
      >
        <Trash2 size={15} />
      </button>
    </form>
  )
}
