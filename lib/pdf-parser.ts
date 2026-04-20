// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse') as (buffer: Buffer) => Promise<{ text: string; numpages: number }>

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  const data = await pdfParse(buffer)
  return data.text
}

export function truncateText(text: string, maxChars = 15000): string {
  return text.slice(0, maxChars)
}

export function isTextExtractable(text: string): boolean {
  return text.trim().length >= 100
}
