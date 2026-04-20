export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  // Use the internal lib path to avoid pdf-parse reading test files on init (breaks serverless)
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require('pdf-parse/lib/pdf-parse.js') as (buffer: Buffer) => Promise<{ text: string; numpages: number }>
  const data = await pdfParse(buffer)
  return data.text
}

export function truncateText(text: string, maxChars = 15000): string {
  return text.slice(0, maxChars)
}

export function isTextExtractable(text: string): boolean {
  return text.trim().length >= 100
}
