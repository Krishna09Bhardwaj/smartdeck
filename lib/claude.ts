import Anthropic from '@anthropic-ai/sdk'
import type { GeneratedCard } from '@/types'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `You are a skilled educator creating flashcards from a student's study material. Generate exactly 15-25 high-quality flashcards. Each card must have a clear, specific question and a thorough but concise answer (2-4 sentences). Cover key concepts, definitions, relationships, and important examples. Avoid trivial or redundant cards. Return ONLY a valid JSON array: [{"question": "...", "answer": "..."}, ...]`

export async function generateFlashcards(extractedText: string): Promise<GeneratedCard[]> {
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: `Generate flashcards from this study material:\n\n${extractedText}`,
      },
    ],
    system: SYSTEM_PROMPT,
  })

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response type from Claude')

  const text = content.text.trim()
  const jsonMatch = text.match(/\[[\s\S]*\]/)
  if (!jsonMatch) throw new Error('Could not parse flashcard JSON from Claude response')

  const cards: GeneratedCard[] = JSON.parse(jsonMatch[0])
  if (!Array.isArray(cards) || cards.length === 0) throw new Error('No cards generated')

  return cards.filter(
    (c) => typeof c.question === 'string' && typeof c.answer === 'string' && c.question && c.answer
  )
}
