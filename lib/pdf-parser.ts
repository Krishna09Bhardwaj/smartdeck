import pdfParse from 'pdf-parse'

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
