'use client'
import { createContext, useContext, useState } from 'react'

interface FocusCtx {
  focusMode: boolean
  setFocusMode: (v: boolean) => void
}

const FocusContext = createContext<FocusCtx>({ focusMode: false, setFocusMode: () => {} })

export function FocusProvider({ children }: { children: React.ReactNode }) {
  const [focusMode, setFocusMode] = useState(false)
  return (
    <FocusContext.Provider value={{ focusMode, setFocusMode }}>
      {children}
    </FocusContext.Provider>
  )
}

export const useFocus = () => useContext(FocusContext)
