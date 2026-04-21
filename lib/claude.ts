import Groq from 'groq-sdk'
import type { GeneratedCard } from '@/types'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

const SYSTEM_PROMPT = `You are a skilled educator creating flashcards from a student's study material. Generate exactly 15-25 high-quality flashcards. Each card must have a clear, specific question and a thorough but concise answer (2-4 sentences). Cover key concepts, definitions, relationships, and important examples. Avoid trivial or redundant cards. Return ONLY a valid JSON array with no markdown, no code fences, no extra text: [{"question": "...", "answer": "..."}, ...]`

export async function generateFlashcards(extractedText: string): Promise<GeneratedCard[]> {
  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: `Study material:\n\n${extractedText}` },
    ],
    temperature: 0.3,
    max_tokens: 4096,
  })

  const text = completion.choices[0]?.message?.content?.trim() ?? ''
  const jsonMatch = text.match(/\[[\s\S]*\]/)
  if (!jsonMatch) throw new Error('Could not parse flashcard JSON from Groq response')

  const cards: GeneratedCard[] = JSON.parse(jsonMatch[0])
  if (!Array.isArray(cards) || cards.length === 0) throw new Error('No cards generated')

  return cards.filter(
    (c) => typeof c.question === 'string' && typeof c.answer === 'string' && c.question && c.answer
  )
}
