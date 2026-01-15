export interface Token {
  id: string
  display: string
  core: string
  type: 'word' | 'break'
  orpIndex: number
  charStart: number
  charEnd: number
}

export interface TimedToken extends Token {
  delayMs: number
}

export type ReadingMode = 'autoplay' | 'hold-space'

export type ReaderState = 'idle' | 'playing' | 'paused'

export interface ReaderSettings {
  wpm: number
  mode: ReadingMode
  punctuationPause: boolean
  softRewind: boolean
  softRewindWords: number
}

export interface Document {
  id: string
  title: string
  filename: string
  format: 'pdf' | 'docx' | 'epub' | 'txt'
  fullText: string
  tokens: Token[]
  createdAt: number
  updatedAt: number
}

export interface ReadingProgress {
  documentId: string
  tokenIndex: number
  wpm: number
  mode: ReadingMode
  updatedAt: number
}

export interface LibraryExport {
  version: number
  exportedAt: number
  documents: Document[]
  progress: ReadingProgress[]
}

export const DEFAULT_SETTINGS: ReaderSettings = {
  wpm: 300,
  mode: 'autoplay',
  punctuationPause: true,
  softRewind: true,
  softRewindWords: 5,
}

export const WPM_MIN = 50
export const WPM_MAX = 1000
export const WPM_STEP = 50
