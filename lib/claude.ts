import { GoogleGenerativeAI } from '@google/generative-ai'
import type { GeneratedCard } from '@/types'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

const PROMPT = `You are a skilled educator creating flashcards from a student's study material. Generate exactly 15-25 high-quality flashcards. Each card must have a clear, specific question and a thorough but concise answer (2-4 sentences). Cover key concepts, definitions, relationships, and important examples. Avoid trivial or redundant cards. Return ONLY a valid JSON array with no markdown, no code fences, no extra text: [{"question": "...", "answer": "..."}, ...]`

export async function generateFlashcards(pdfBuffer: Buffer): Promise<GeneratedCard[]> {
  const result = await model.generateContent([
    { inlineData: { data: pdfBuffer.toString('base64'), mimeType: 'application/pdf' } },
    PROMPT,
  ])

  const text = result.response.text().trim()
  const jsonMatch = text.match(/\[[\s\S]*\]/)
  if (!jsonMatch) throw new Error('Could not parse flashcard JSON from Gemini response')

  const cards: GeneratedCard[] = JSON.parse(jsonMatch[0])
  if (!Array.isArray(cards) || cards.length === 0) throw new Error('No cards generated')

  return cards.filter(
    (c) => typeof c.question === 'string' && typeof c.answer === 'string' && c.question && c.answer
  )
}
