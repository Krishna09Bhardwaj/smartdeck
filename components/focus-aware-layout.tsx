'use client'
import { useFocus } from './focus-provider'
import Nav from './nav'

export default function FocusAwareLayout({ children }: { children: React.ReactNode }) {
  const { focusMode } = useFocus()
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#09090b' }}>
      {!focusMode && <Nav />}
      <main style={{ flex: 1, overflowY: 'auto', minWidth: 0 }}>{children}</main>
    </div>
  )
}
