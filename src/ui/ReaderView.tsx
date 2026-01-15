import { useEffect, useState, useCallback, useMemo } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Share2, BookOpen, Maximize, Minimize } from 'lucide-react'
import { WordRenderer } from './WordRenderer'
import { Controls } from './Controls'
import { PagePane } from './PagePane'
import { useReaderEngine } from './hooks/useReaderEngine'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { getDocument, getProgress, updateProgress, generateShareUrl } from '../storage/documentsRepo'
import type { Document } from '../core/types'

export function ReaderView() {
  const { documentId } = useParams<{ documentId: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  
  const [document, setDocument] = useState<Document | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showPagePane, setShowPagePane] = useState(true)
  const [fontSize, setFontSize] = useState(64)
  const [isFullscreen, setIsFullscreen] = useState(false)
  
  const initialPosition = useMemo(() => {
    const pos = searchParams.get('pos')
    return pos ? parseInt(pos, 10) : 0
  }, [searchParams])
  
  const tokens = useMemo(() => document?.tokens ?? [], [document])
  
  const {
    state,
    play,
    pause,
    togglePlayPause,
    holdStart,
    holdEnd,
    stepForward,
    stepBackward,
    seekTo,
    adjustWpm,
    setWpm,
    setMode,
    setPunctuationPause,
    setSoftRewind,
    updateSettings,
  } = useReaderEngine(tokens, initialPosition)
  
  useEffect(() => {
    async function loadDocument() {
      if (!documentId) {
        setError('No document ID provided')
        setLoading(false)
        return
      }
      
      try {
        const doc = await getDocument(documentId)
        if (!doc) {
          setError('Document not found')
          setLoading(false)
          return
        }
        
        setDocument(doc)
        
        const progress = await getProgress(documentId)
        if (progress && initialPosition === 0) {
          seekTo(progress.tokenIndex)
          updateSettings({
            wpm: progress.wpm,
            mode: progress.mode,
          })
        }
        
        setLoading(false)
      } catch (err) {
        setError('Failed to load document')
        setLoading(false)
      }
    }
    
    loadDocument()
  }, [documentId, initialPosition, seekTo, updateSettings])
  
  useEffect(() => {
    if (!documentId || !state) return
    
    const saveProgress = async () => {
      await updateProgress(
        documentId,
        state.currentIndex,
        state.settings.wpm,
        state.settings.mode
      )
    }
    
    const timeoutId = setTimeout(saveProgress, 1000)
    return () => clearTimeout(timeoutId)
  }, [documentId, state?.currentIndex, state?.settings.wpm, state?.settings.mode])
  
  const handleBack = useCallback(() => {
    pause()
    navigate('/')
  }, [pause, navigate])
  
  const handleShare = useCallback(() => {
    if (!documentId || !state) return
    const url = generateShareUrl(documentId, state.currentIndex)
    navigator.clipboard.writeText(url)
    alert('Share link copied to clipboard!\n\nNote: This link only works on devices that have this document in their library.')
  }, [documentId, state])
  
  const toggleFullscreen = useCallback(() => {
    if (!window.document.fullscreenElement) {
      window.document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      window.document.exitFullscreen()
      setIsFullscreen(false)
    }
  }, [])
  
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!window.document.fullscreenElement)
    }
    
    window.document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => window.document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])
  
  useKeyboardShortcuts({
    mode: state?.settings.mode ?? 'autoplay',
    onTogglePlayPause: togglePlayPause,
    onHoldStart: holdStart,
    onHoldEnd: holdEnd,
    onStepForward: () => stepForward(1),
    onStepBackward: () => stepBackward(1),
    onJumpForward: () => stepForward(10),
    onJumpBackward: () => stepBackward(10),
    onWpmUp: () => adjustWpm(50),
    onWpmDown: () => adjustWpm(-50),
    onEscape: handleBack,
    onToggleFullscreen: toggleFullscreen,
  })
  
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-gray-400">Loading document...</div>
      </div>
    )
  }
  
  if (error || !document || !state) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4">
        <div className="text-red-400">{error || 'Something went wrong'}</div>
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
        >
          <ArrowLeft size={18} />
          Back to Library
        </button>
      </div>
    )
  }
  
  const currentToken = tokens[state.currentIndex] ?? null
  
  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
            title="Back to Library (Esc)"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-medium truncate max-w-md">{document.title}</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
            title="Share position"
          >
            <Share2 size={18} />
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
            title="Toggle fullscreen (F)"
          >
            {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
          </button>
          <button
            onClick={() => setShowPagePane(!showPagePane)}
            className={`p-2 rounded-lg transition-colors ${showPagePane ? 'bg-gray-800' : 'hover:bg-gray-800'}`}
            title="Toggle page pane"
          >
            <BookOpen size={18} />
          </button>
        </div>
      </header>
      
      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Reader section */}
        <div className={`flex-1 flex flex-col ${showPagePane ? 'border-r border-gray-800' : ''}`}>
          {/* Word display area */}
          <div className="flex-1 flex items-center justify-center bg-reader-bg">
            <WordRenderer token={currentToken} fontSize={fontSize} />
          </div>
          
          {/* Controls */}
          <div className="p-4">
            <Controls
              state={state.state}
              settings={state.settings}
              currentIndex={state.currentIndex}
              totalTokens={tokens.length}
              fontSize={fontSize}
              onPlay={play}
              onPause={pause}
              onStepForward={() => stepForward(1)}
              onStepBackward={() => stepBackward(1)}
              onJumpForward={() => stepForward(10)}
              onJumpBackward={() => stepBackward(10)}
              onWpmChange={setWpm}
              onModeChange={setMode}
              onPunctuationPauseChange={setPunctuationPause}
              onSoftRewindChange={setSoftRewind}
              onFontSizeChange={setFontSize}
            />
          </div>
        </div>
        
        {/* Page pane */}
        {showPagePane && (
          <div className="w-96 flex-shrink-0">
            <PagePane
              tokens={tokens}
              currentIndex={state.currentIndex}
              onSeek={seekTo}
            />
          </div>
        )}
      </div>
    </div>
  )
}
