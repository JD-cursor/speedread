import { createDocument } from '../storage/documentsRepo'
import type { Document } from '../core/types'

export type FileFormat = 'pdf' | 'docx' | 'epub' | 'txt'

export function detectFormat(filename: string): FileFormat | null {
  const ext = filename.toLowerCase().split('.').pop()
  switch (ext) {
    case 'pdf':
      return 'pdf'
    case 'docx':
      return 'docx'
    case 'epub':
      return 'epub'
    default:
      return null
  }
}

export async function ingestText(text: string, title?: string): Promise<Document> {
  if (!text || text.trim().length === 0) {
    throw new Error('No text content provided')
  }
  
  const documentTitle = title || `Pasted Text - ${new Date().toLocaleString()}`
  return createDocument(documentTitle, 'txt', text)
}

export async function ingestFile(file: File): Promise<Document> {
  const format = detectFormat(file.name)
  if (!format) {
    throw new Error(`Unsupported file format: ${file.name}`)
  }
  
  let text: string
  
  switch (format) {
    case 'pdf':
      text = await extractPdfText(file)
      break
    case 'docx':
      text = await extractDocxText(file)
      break
    case 'epub':
      text = await extractEpubText(file)
      break
  }
  
  if (!text || text.trim().length === 0) {
    throw new Error('No text content found in file')
  }
  
  return createDocument(file.name, format, text)
}

async function extractPdfText(file: File): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist')
  
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`
  
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  
  const textParts: string[] = []
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const pageText = content.items
      .map((item: any) => item.str)
      .join(' ')
    textParts.push(pageText)
  }
  
  return textParts.join('\n\n')
}

async function extractDocxText(file: File): Promise<string> {
  const mammoth = await import('mammoth')
  
  const arrayBuffer = await file.arrayBuffer()
  const result = await mammoth.extractRawText({ arrayBuffer })
  
  return result.value
}

async function extractEpubText(file: File): Promise<string> {
  const ePub = (await import('epubjs')).default
  
  const arrayBuffer = await file.arrayBuffer()
  const book = ePub(arrayBuffer)
  
  await book.ready
  
  const spine = book.spine as any
  const textParts: string[] = []
  
  for (const item of spine.items) {
    try {
      const doc = await book.load(item.href)
      if (doc instanceof Document) {
        const text = doc.body?.textContent || ''
        textParts.push(text.trim())
      }
    } catch (e) {
      console.warn(`Failed to load spine item: ${item.href}`, e)
    }
  }
  
  book.destroy()
  
  return textParts.join('\n\n')
}
