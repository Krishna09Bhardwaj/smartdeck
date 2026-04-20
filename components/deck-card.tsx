import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BookOpen, ChevronRight } from 'lucide-react'
import type { Deck } from '@/types'

interface DeckCardProps {
  deck: Deck
  dueCount?: number
}

export default function DeckCard({ deck, dueCount = 0 }: DeckCardProps) {
  return (
    <Link href={`/decks/${deck.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer group h-full">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-blue-500 shrink-0" />
              <CardTitle className="text-base font-semibold line-clamp-2">{deck.title}</CardTitle>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500 transition-colors shrink-0" />
          </div>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <span className="text-sm text-slate-500">{deck.card_count} cards</span>
          {dueCount > 0 && (
            <Badge className="bg-blue-600 hover:bg-blue-700">
              {dueCount} due
            </Badge>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
