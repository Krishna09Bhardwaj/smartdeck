import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { BookOpen, Brain, TrendingUp } from 'lucide-react'

const features = [
  {
    icon: BookOpen,
    title: 'Upload any PDF',
    body: 'Textbooks, notes, revision sheets — Claude reads them and writes cards that feel like they came from a great teacher.',
  },
  {
    icon: Brain,
    title: 'AI-generated flashcards',
    body: 'Key concepts, definitions, relationships, and worked examples — not shallow bullet points.',
  },
  {
    icon: TrendingUp,
    title: 'Spaced repetition',
    body: 'The SM-2 algorithm schedules each card individually. Hard cards come back sooner. Mastered ones fade into the background.',
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <header className="px-6 py-4 flex items-center justify-between max-w-5xl mx-auto">
        <div className="flex items-center gap-2 font-bold text-lg">
          <BookOpen className="h-6 w-6 text-blue-600" />
          SmartDeck
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm">Sign in</Button>
          </Link>
          <Link href="/signup">
            <Button size="sm">Get started</Button>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-20 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 border border-blue-100">
          Powered by Claude AI
        </div>
        <h1 className="text-5xl font-extrabold text-slate-900 leading-tight mb-5">
          Upload a PDF.<br />
          <span className="text-blue-600">Study smarter.</span>
        </h1>
        <p className="text-xl text-slate-500 mb-10 max-w-2xl mx-auto">
          SmartDeck turns any study material into AI-generated flashcards and schedules your
          reviews so you always know exactly what to study next.
        </p>
        <Link href="/signup">
          <Button size="lg" className="text-base px-8 py-6 rounded-xl shadow-lg">
            Create your first deck — it&apos;s free
          </Button>
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24">
          {features.map(({ icon: Icon, title, body }) => (
            <div key={title} className="bg-white rounded-2xl border p-6 text-left shadow-sm">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
                <Icon className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">{title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
