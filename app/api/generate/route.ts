import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { extractTextFromPDF, truncateText, isTextExtractable } from '@/lib/pdf-parser'
import { generateFlashcards } from '@/lib/claude'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file = formData.get('file') as File | null
  const title = formData.get('title') as string | null
  const description = formData.get('description') as string | null

  if (!file || !title) {
    return NextResponse.json({ error: 'File and title are required' }, { status: 400 })
  }

  if (file.type !== 'application/pdf') {
    return NextResponse.json({ error: 'Only PDF files are supported' }, { status: 400 })
  }

  const MAX_SIZE = 10 * 1024 * 1024
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File must be under 10MB' }, { status: 400 })
  }

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  let extractedText: string
  try {
    extractedText = await extractTextFromPDF(buffer)
  } catch {
    return NextResponse.json(
      { error: 'Failed to read PDF. Make sure it is not password-protected.' },
      { status: 422 }
    )
  }

  if (!isTextExtractable(extractedText)) {
    return NextResponse.json(
      { error: 'Could not extract text from this PDF. It may be a scanned image. Please upload a text-based PDF.' },
      { status: 422 }
    )
  }

  const truncated = truncateText(extractedText)

  let cards: Array<{ question: string; answer: string }>
  try {
    cards = await generateFlashcards(truncated)
  } catch (e) {
    console.error('Claude generation failed:', e)
    return NextResponse.json({ error: 'AI generation failed. Please try again.' }, { status: 500 })
  }

  const { data: deck, error: deckError } = await supabase
    .from('decks')
    .insert({
      user_id: user.id,
      title: title.trim(),
      description: description?.trim() ?? null,
      card_count: cards.length,
    })
    .select()
    .single()

  if (deckError || !deck) {
    return NextResponse.json({ error: 'Failed to create deck' }, { status: 500 })
  }

  const cardRows = cards.map((c, i) => ({
    deck_id: deck.id,
    question: c.question,
    answer: c.answer,
    position: i,
  }))

  const { error: cardsError } = await supabase.from('cards').insert(cardRows)
  if (cardsError) {
    await supabase.from('decks').delete().eq('id', deck.id)
    return NextResponse.json({ error: 'Failed to save cards' }, { status: 500 })
  }

  return NextResponse.json({ deck_id: deck.id, card_count: cards.length }, { status: 201 })
}
