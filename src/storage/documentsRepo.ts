import { v4 as uuidv4 } from 'uuid'
import { db } from './db'
import { Document, ReadingProgress, LibraryExport, ReadingMode } from '../core/types'
import { tokenize } from '../core/tokenizer'

export async function createDocument(
  filename: string,
  format: 'pdf' | 'docx' | 'epub' | 'txt',
  rawText: string
): Promise<Document> {
  const { fullText, tokens } = tokenize(rawText)
  
  const doc: Document = {
    id: uuidv4(),
    title: filename.replace(/\.[^/.]+$/, ''),
    filename,
    format,
    fullText,
    tokens,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
  
  await db.documents.add(doc)
  
  await db.progress.put({
    documentId: doc.id,
    tokenIndex: 0,
    wpm: 300,
    mode: 'autoplay',
    updatedAt: Date.now(),
  })
  
  return doc
}

export async function getDocument(id: string): Promise<Document | undefined> {
  return db.documents.get(id)
}

export async function getAllDocuments(): Promise<Document[]> {
  return db.documents.orderBy('updatedAt').reverse().toArray()
}

export async function deleteDocument(id: string): Promise<void> {
  await db.documents.delete(id)
  await db.progress.delete(id)
}

export async function updateDocumentTitle(id: string, title: string): Promise<void> {
  await db.documents.update(id, { title, updatedAt: Date.now() })
}

export async function getProgress(documentId: string): Promise<ReadingProgress | undefined> {
  return db.progress.get(documentId)
}

export async function updateProgress(
  documentId: string,
  tokenIndex: number,
  wpm?: number,
  mode?: ReadingMode
): Promise<void> {
  const existing = await db.progress.get(documentId)
  
  await db.progress.put({
    documentId,
    tokenIndex,
    wpm: wpm ?? existing?.wpm ?? 300,
    mode: mode ?? existing?.mode ?? 'autoplay',
    updatedAt: Date.now(),
  })
}

export async function exportLibrary(): Promise<LibraryExport> {
  const documents = await db.documents.toArray()
  const progress = await db.progress.toArray()
  
  return {
    version: 1,
    exportedAt: Date.now(),
    documents,
    progress,
  }
}

export async function importLibrary(data: LibraryExport): Promise<{ imported: number; skipped: number }> {
  let imported = 0
  let skipped = 0
  
  for (const doc of data.documents) {
    const existing = await db.documents.get(doc.id)
    if (!existing) {
      await db.documents.add(doc)
      imported++
    } else {
      skipped++
    }
  }
  
  for (const prog of data.progress) {
    const existing = await db.progress.get(prog.documentId)
    if (!existing || prog.updatedAt > existing.updatedAt) {
      await db.progress.put(prog)
    }
  }
  
  return { imported, skipped }
}

export async function clearLibrary(): Promise<void> {
  await db.documents.clear()
  await db.progress.clear()
}

export function generateShareUrl(documentId: string, tokenIndex: number): string {
  const params = new URLSearchParams({
    doc: documentId,
    pos: tokenIndex.toString(),
  })
  return `${window.location.origin}/read/${documentId}?${params.toString()}`
}

export function parseShareUrl(url: string): { documentId: string; tokenIndex: number } | null {
  try {
    const urlObj = new URL(url)
    const match = urlObj.pathname.match(/\/read\/([^/]+)/)
    if (!match) return null
    
    const documentId = match[1]
    const pos = urlObj.searchParams.get('pos')
    const tokenIndex = pos ? parseInt(pos, 10) : 0
    
    return { documentId, tokenIndex: isNaN(tokenIndex) ? 0 : tokenIndex }
  } catch {
    return null
  }
}
