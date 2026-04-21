'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { UploadCloud, X, FileText } from 'lucide-react'

const STATUS_MESSAGES = [
  "Reading your PDF...",
  "Identifying key concepts...",
  "Writing questions like a great teacher...",
  "Checking for edge cases...",
  "Building your deck...",
]

export default function NewDeckPage() {
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<'idle' | 'generating' | 'error'>('idle')
  const [error, setError] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [currentMsgIndex, setCurrentMsgIndex] = useState(0)
  const [fakeProgress, setFakeProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const isLoading = status === 'generating'

  useEffect(() => {
    if (!isLoading) return
    setCurrentMsgIndex(0)
    setFakeProgress(0)

    const msgInterval = setInterval(() => {
      setCurrentMsgIndex(i => (i + 1) % STATUS_MESSAGES.length)
    }, 2000)

    // Fake progress: 0 -> 85 over 20s
    const start = Date.now()
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - start
      const pct = Math.min(85, (elapsed / 20000) * 85)
      setFakeProgress(pct)
    }, 200)

    return () => {
      clearInterval(msgInterval)
      clearInterval(progressInterval)
    }
  }, [isLoading])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file || !title) return

    if (file.size > 10 * 1024 * 1024) {
      setError('File must be under 10 MB')
      return
    }

    setError('')
    setStatus('generating')

    const form = new FormData()
    form.append('file', file)
    form.append('title', title)
    if (description) form.append('description', description)

    try {
      const res = await fetch('/api/generate', { method: 'POST', body: form })
      let data: Record<string, string> = {}
      try {
        data = await res.json()
      } catch {
        const text = await res.text().catch(() => 'no body')
        setError(`Server error (${res.status}): ${text.slice(0, 200)}`)
        setStatus('error')
        return
      }
      if (!res.ok) {
        setError(data.error ?? `Error ${res.status}`)
        setStatus('error')
        return
      }
      router.push(`/decks/${data.deck_id}`)
    } catch (err) {
      setError(`Request failed: ${err instanceof Error ? err.message : String(err)}`)
      setStatus('error')
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped && dropped.type === 'application/pdf') {
      setFile(dropped)
    }
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0]
    if (selected) setFile(selected)
  }

  return (
    <div style={{ padding: 32, maxWidth: 640, margin: '0 auto' }}>
      {/* Loading overlay */}
      {isLoading && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(9,9,11,0.95)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          zIndex: 50
        }}>
          <div style={{ fontSize: 48, marginBottom: 24, animation: 'pulse 1.5s infinite' }}>📚</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fafafa', marginBottom: 8 }}>
            {STATUS_MESSAGES[currentMsgIndex]}
          </h2>
          <div style={{ width: 300, height: 4, background: '#27272a', borderRadius: 2, overflow: 'hidden', marginTop: 16 }}>
            <div style={{ height: '100%', background: '#6366f1', borderRadius: 2, width: `${fakeProgress}%`, transition: 'width 500ms ease' }} />
          </div>
          <p style={{ color: '#71717a', fontSize: 13, marginTop: 12 }}>{Math.round(fakeProgress)}% complete</p>
        </div>
      )}

      <h1 style={{ fontSize: 28, fontWeight: 700, color: '#fafafa', letterSpacing: '-0.02em', marginBottom: 8 }}>
        Create a new deck
      </h1>
      <p style={{ color: '#a1a1aa', marginBottom: 32, fontSize: 14 }}>
        AI will generate 15–25 high-quality flashcards from your PDF.
      </p>

      <div style={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 12, padding: 32 }}>
        <form onSubmit={handleSubmit}>
          {/* Title */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, color: '#a1a1aa', marginBottom: 6, fontWeight: 500 }}>
              Deck title *
            </label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Chapter 5: Cell Biology"
              required
              disabled={isLoading}
              style={{
                width: '100%', padding: '10px 14px',
                background: '#27272a', border: '1px solid #3f3f46',
                borderRadius: 8, color: '#fafafa', fontSize: 14,
                outline: 'none',
              }}
            />
          </div>

          {/* Description */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, color: '#a1a1aa', marginBottom: 6, fontWeight: 500 }}>
              Description <span style={{ color: '#71717a' }}>(optional)</span>
            </label>
            <input
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="e.g. Class 10 Biology revision"
              disabled={isLoading}
              style={{
                width: '100%', padding: '10px 14px',
                background: '#27272a', border: '1px solid #3f3f46',
                borderRadius: 8, color: '#fafafa', fontSize: 14,
                outline: 'none',
              }}
            />
          </div>

          {/* Dropzone */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 13, color: '#a1a1aa', marginBottom: 6, fontWeight: 500 }}>
              PDF file *
            </label>
            {file ? (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '14px 16px', background: '#27272a',
                border: '1px solid #3f3f46', borderRadius: 8
              }}>
                <FileText size={20} color="#6366f1" />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, color: '#fafafa', fontWeight: 500 }}>{file.name}</p>
                  <p style={{ fontSize: 12, color: '#71717a' }}>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#71717a', padding: 4 }}
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${dragOver ? '#6366f1' : '#3f3f46'}`,
                  borderRadius: 12, padding: '40px 24px', textAlign: 'center',
                  cursor: 'pointer', transition: 'border-color 200ms',
                  background: dragOver ? 'rgba(99,102,241,0.05)' : 'transparent',
                }}
              >
                <UploadCloud size={40} color={dragOver ? '#6366f1' : '#3f3f46'} style={{ margin: '0 auto 12px' }} />
                <p style={{ fontSize: 16, fontWeight: 600, color: '#fafafa', marginBottom: 4 }}>
                  Drop your PDF here
                </p>
                <p style={{ fontSize: 14, color: '#a1a1aa', marginBottom: 8 }}>or click to browse</p>
                <p style={{ fontSize: 12, color: '#71717a' }}>Max 10MB · Text-based PDFs only</p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileInput}
              style={{ display: 'none' }}
            />
          </div>

          {error && (
            <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, marginBottom: 16 }}>
              <p style={{ fontSize: 13, color: '#ef4444' }}>{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={!file || !title || isLoading}
            style={{
              width: '100%', padding: '12px 24px',
              background: !file || !title || isLoading ? '#27272a' : '#6366f1',
              color: !file || !title || isLoading ? '#71717a' : '#fafafa',
              border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600,
              cursor: !file || !title || isLoading ? 'not-allowed' : 'pointer',
              transition: 'all 200ms',
            }}
          >
            {isLoading ? 'Generating…' : 'Generate flashcards'}
          </button>
        </form>
      </div>
    </div>
  )
}
