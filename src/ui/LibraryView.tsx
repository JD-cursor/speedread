import { useState, useRef, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { 
  Upload, 
  FileText, 
  Trash2, 
  Download, 
  FolderUp,
  BookOpen,
  Clock,
  Edit2,
  Check,
  X
} from 'lucide-react'
import { 
  getAllDocuments, 
  deleteDocument, 
  updateDocumentTitle,
  exportLibrary, 
  importLibrary,
} from '../storage/documentsRepo'
import { db } from '../storage/db'
import { Document, ReadingProgress } from '../core/types'
import { ingestFile, ingestText } from '../ingest/ingest'
import clsx from 'clsx'

export function LibraryView() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const importInputRef = useRef<HTMLInputElement>(null)
  
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [activeTab, setActiveTab] = useState<'text' | 'website'>('text')
  const [pasteText, setPasteText] = useState('')
  const [pasteTitle, setPasteTitle] = useState('')
  
  const documents = useLiveQuery(() => getAllDocuments(), [])
  
  const allProgress = useLiveQuery(() => db.progress.toArray(), [])
  
  const progressMap = useMemo(() => {
    if (!allProgress) return {}
    const map: Record<string, ReadingProgress> = {}
    for (const progress of allProgress) {
      map[progress.documentId] = progress
    }
    return map
  }, [allProgress])
  
  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    
    setImporting(true)
    setImportError(null)
    
    try {
      for (const file of Array.from(files)) {
        await ingestFile(file)
      }
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Failed to import file')
    } finally {
      setImporting(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }, [])
  
  const handleExport = useCallback(async () => {
    try {
      const data = await exportLibrary()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `speedread-library-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      alert('Failed to export library')
    }
  }, [])
  
  const handleImportLibrary = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      const result = await importLibrary(data)
      alert(`Imported ${result.imported} documents. ${result.skipped} already existed.`)
    } catch (err) {
      alert('Failed to import library: Invalid file format')
    } finally {
      if (importInputRef.current) {
        importInputRef.current.value = ''
      }
    }
  }, [])
  
  const handleDelete = useCallback(async (id: string, title: string) => {
    if (confirm(`Delete "${title}"? This cannot be undone.`)) {
      await deleteDocument(id)
    }
  }, [])
  
  const handleOpenDocument = useCallback((id: string) => {
    navigate(`/read/${id}`)
  }, [navigate])
  
  const startEditing = useCallback((doc: Document) => {
    setEditingId(doc.id)
    setEditTitle(doc.title)
  }, [])
  
  const saveTitle = useCallback(async () => {
    if (editingId && editTitle.trim()) {
      await updateDocumentTitle(editingId, editTitle.trim())
    }
    setEditingId(null)
    setEditTitle('')
  }, [editingId, editTitle])
  
  const cancelEditing = useCallback(() => {
    setEditingId(null)
    setEditTitle('')
  }, [])
  
  const handlePasteText = useCallback(async () => {
    if (!pasteText.trim()) {
      setImportError('Please enter some text')
      return
    }
    
    setImporting(true)
    setImportError(null)
    
    try {
      const doc = await ingestText(pasteText, pasteTitle.trim() || undefined)
      setPasteText('')
      setPasteTitle('')
      navigate(`/read/${doc.id}`)
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Failed to import text')
    } finally {
      setImporting(false)
    }
  }, [pasteText, pasteTitle, navigate])
  
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }
  
  const getProgressPercent = (doc: Document) => {
    const progress = progressMap[doc.id]
    if (!progress) return 0
    return Math.round((progress.tokenIndex / doc.tokens.length) * 100)
  }
  
  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">SpeedRead</h1>
            <p className="text-gray-400">Your speed reading library</p>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => importInputRef.current?.click()}
              className="flex items-center gap-2 px-3 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors text-sm"
              title="Import library"
            >
              <FolderUp size={16} />
              Import
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-3 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors text-sm"
              title="Export library"
            >
              <Download size={16} />
              Export
            </button>
          </div>
        </div>
        
        {/* Tab Toggle */}
        <div className="flex items-center justify-center mb-8">
          <div className="inline-flex bg-gray-900 rounded-full p-1">
            <button
              onClick={() => setActiveTab('text')}
              className={clsx(
                "px-8 py-2 rounded-full text-sm font-medium transition-all",
                activeTab === 'text'
                  ? "bg-white text-gray-900"
                  : "text-gray-400 hover:text-white"
              )}
            >
              Text
            </button>
            <button
              onClick={() => setActiveTab('website')}
              className={clsx(
                "px-8 py-2 rounded-full text-sm font-medium transition-all",
                activeTab === 'website'
                  ? "bg-white text-gray-900"
                  : "text-gray-400 hover:text-white"
              )}
            >
              Document / Book
            </button>
          </div>
        </div>
        
        {/* Hidden file inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.epub"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
        <input
          ref={importInputRef}
          type="file"
          accept=".json"
          onChange={handleImportLibrary}
          className="hidden"
        />
        
        {/* Error message */}
        {importError && (
          <div className="mb-4 p-4 bg-red-900/30 border border-red-800 rounded-lg text-red-300">
            {importError}
          </div>
        )}
        
        {/* Text Tab - Paste Text Interface */}
        {activeTab === 'text' && (
          <div className="max-w-3xl mx-auto">
            <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Title (optional)</label>
                  <input
                    type="text"
                    value={pasteTitle}
                    onChange={(e) => setPasteTitle(e.target.value)}
                    placeholder="Enter a title for this text..."
                    className="w-full bg-gray-800 px-4 py-3 rounded-lg border border-gray-700 focus:border-reader-orp focus:outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Paste your text</label>
                  <textarea
                    value={pasteText}
                    onChange={(e) => setPasteText(e.target.value)}
                    placeholder="Paste or type your text here..."
                    rows={16}
                    className="w-full bg-gray-800 px-4 py-3 rounded-lg border border-gray-700 focus:border-reader-orp focus:outline-none resize-none font-mono text-sm"
                    autoFocus
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-end mt-6">
                <button
                  onClick={handlePasteText}
                  disabled={!pasteText.trim() || importing}
                  className={clsx(
                    "px-6 py-3 rounded-lg transition-colors font-medium text-base",
                    !pasteText.trim() || importing
                      ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                      : "bg-reader-orp hover:bg-red-500 text-white"
                  )}
                >
                  {importing ? 'Starting...' : 'Start Reading'}
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Website Tab - File Upload and Document List */}
        {activeTab === 'website' && (
          <>
            {/* Upload Section */}
            <div className="mb-8 text-center">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={importing}
                className={clsx(
                  "inline-flex items-center gap-2 px-6 py-3 rounded-lg transition-colors font-medium",
                  importing 
                    ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                    : "bg-reader-orp hover:bg-red-500 text-white"
                )}
              >
                <Upload size={20} />
                {importing ? 'Uploading...' : 'Upload Document'}
              </button>
              <p className="text-sm text-gray-500 mt-2">PDF, DOCX, EPUB, or TXT files</p>
            </div>
            
            {/* Document list */}
            {!documents || documents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                <BookOpen size={48} className="mb-4 opacity-50" />
                <p className="text-lg mb-2">No documents yet</p>
                <p className="text-sm">Upload a PDF, DOCX, EPUB, or TXT file to get started</p>
              </div>
            ) : (
              <div className="space-y-2">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="group flex items-center gap-4 p-4 bg-gray-900/50 rounded-xl hover:bg-gray-900 transition-colors cursor-pointer"
                onClick={() => handleOpenDocument(doc.id)}
              >
                {/* Icon */}
                <div className="w-12 h-12 rounded-lg bg-gray-800 flex items-center justify-center flex-shrink-0">
                  <FileText size={24} className="text-gray-400" />
                </div>
                
                {/* Info */}
                <div className="flex-1 min-w-0">
                  {editingId === doc.id ? (
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveTitle()
                          if (e.key === 'Escape') cancelEditing()
                        }}
                        className="flex-1 bg-gray-800 px-2 py-1 rounded border border-gray-700 focus:border-reader-orp focus:outline-none"
                        autoFocus
                      />
                      <button onClick={saveTitle} className="p-1 hover:bg-gray-700 rounded">
                        <Check size={16} className="text-green-400" />
                      </button>
                      <button onClick={cancelEditing} className="p-1 hover:bg-gray-700 rounded">
                        <X size={16} className="text-red-400" />
                      </button>
                    </div>
                  ) : (
                    <h3 className="font-medium truncate">{doc.title}</h3>
                  )}
                  <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                    <span className="uppercase">{doc.format}</span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {formatDate(doc.updatedAt)}
                    </span>
                    <span>{doc.tokens.filter(t => t.type === 'word').length} words</span>
                  </div>
                </div>
                
                {/* Progress */}
                <div className="w-24 flex-shrink-0">
                  <div className="text-right text-sm text-gray-400 mb-1">
                    {getProgressPercent(doc)}%
                  </div>
                  <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-reader-orp transition-all"
                      style={{ width: `${getProgressPercent(doc)}%` }}
                    />
                  </div>
                </div>
                
                {/* Actions */}
                <div 
                  className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => startEditing(doc)}
                    className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
                    title="Rename"
                  >
                    <Edit2 size={16} className="text-gray-400" />
                  </button>
                  <button
                    onClick={() => handleDelete(doc.id, doc.title)}
                    className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={16} className="text-red-400" />
                  </button>
                </div>
              </div>
            ))}
              </div>
            )}
            
            {/* Keyboard shortcuts help */}
            <div className="mt-12 p-4 bg-gray-900/30 rounded-xl">
              <h3 className="text-sm font-medium text-gray-400 mb-3">Keyboard Shortcuts (in Reader)</h3>
              <div className="grid grid-cols-2 gap-2 text-sm text-gray-500">
                <div><kbd className="px-2 py-0.5 bg-gray-800 rounded">Space</kbd> Play/Pause or Hold to read</div>
                <div><kbd className="px-2 py-0.5 bg-gray-800 rounded">←</kbd> <kbd className="px-2 py-0.5 bg-gray-800 rounded">→</kbd> Step word</div>
                <div><kbd className="px-2 py-0.5 bg-gray-800 rounded">Shift</kbd>+<kbd className="px-2 py-0.5 bg-gray-800 rounded">←</kbd> <kbd className="px-2 py-0.5 bg-gray-800 rounded">→</kbd> Jump 10 words</div>
                <div><kbd className="px-2 py-0.5 bg-gray-800 rounded">↑</kbd> <kbd className="px-2 py-0.5 bg-gray-800 rounded">↓</kbd> Adjust speed</div>
                <div><kbd className="px-2 py-0.5 bg-gray-800 rounded">Esc</kbd> Back to library</div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
