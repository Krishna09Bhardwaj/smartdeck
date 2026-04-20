'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import UploadZone from '@/components/upload-zone'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

export default function NewDeckPage() {
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<'idle' | 'generating' | 'error'>('idle')
  const [error, setError] = useState('')
  const router = useRouter()

  const isLoading = status === 'generating'

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
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong')
        setStatus('error')
        return
      }
      router.push(`/decks/${data.deck_id}`)
    } catch {
      setError('Network error. Please try again.')
      setStatus('error')
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Create a new deck</h1>

      <Card>
        <CardHeader>
          <CardTitle>Upload your study material</CardTitle>
          <CardDescription>
            Gemini AI will generate 15–25 high-quality flashcards from your PDF.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="title">Deck title</Label>
              <Input
                id="title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Chapter 5: Cell Biology"
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Input
                id="description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="e.g. Class 10 Biology revision"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label>PDF file</Label>
              <UploadZone
                onFileSelect={setFile}
                selectedFile={file}
                onClear={() => setFile(null)}
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            {isLoading && (
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                <p className="text-sm text-blue-700">
                  Gemini is generating your flashcards… (this takes ~15 seconds)
                </p>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={!file || !title || isLoading}>
              {isLoading ? 'Generating…' : 'Generate flashcards'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
