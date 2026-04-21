export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  const { extractText } = await import('unpdf')
  const { text } = await extractText(new Uint8Array(buffer), { mergePages: true })
  return text
}

export function truncateText(text: string, maxChars = 15000): string {
  return text.slice(0, maxChars)
}

export function isTextExtractable(text: string): boolean {
  return text.trim().length >= 100
}
