import { useEffect, useState, useCallback, useMemo } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Share2, Maximize, Minimize } from 'lucide-react'
import { WordRenderer } from './WordRenderer'
import { Controls } from './Controls'
import { TextFlow } from './TextFlow'
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
  const [fontSize, setFontSize] = useState(64)
  const [isFullscreen, setIsFullscreen] = useState(false)
  // Controls are always visible in the immersive layout
  const showControls = true
  
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
    <div className="h-screen flex flex-col bg-reader-bg overflow-hidden">
      {/* Minimal floating header - fades into background */}
      <header 
        className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-6 py-4"
        style={{
          background: 'linear-gradient(to bottom, rgba(14, 14, 16, 0.95) 0%, rgba(14, 14, 16, 0) 100%)',
        }}
      >
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className="p-2 rounded-lg text-reader-text-dim hover:text-reader-text hover:bg-white/5 transition-all duration-200"
            title="Back to Library (Esc)"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-sm font-medium text-reader-text-dim truncate max-w-md">{document.title}</h1>
        </div>
        
        <div className="flex items-center gap-1">
          <button
            onClick={handleShare}
            className="p-2 rounded-lg text-reader-text-dim hover:text-reader-text hover:bg-white/5 transition-all duration-200"
            title="Share position"
          >
            <Share2 size={16} />
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg text-reader-text-dim hover:text-reader-text hover:bg-white/5 transition-all duration-200"
            title="Toggle fullscreen (F)"
          >
            {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
          </button>
        </div>
      </header>
      
      {/* Main immersive canvas - split into left (word) and right (text flow) */}
      <div className="flex-1 flex">
        {/* Left side: Word display - positioned left of center */}
        <div className="flex-1 flex items-center justify-center">
          <div className="transform -translate-x-8">
            <WordRenderer token={currentToken} fontSize={fontSize} />
          </div>
        </div>
        
        {/* Right side: Text flow - Star Wars crawl style */}
        <div className="w-[400px] flex-shrink-0">
          <TextFlow
            tokens={tokens}
            currentIndex={state.currentIndex}
            onSeek={seekTo}
          />
        </div>
      </div>
      
      {/* Floating controls at bottom - fades into background */}
      <div 
        className="absolute bottom-0 left-0 right-0 z-20"
        style={{
          background: 'linear-gradient(to top, rgba(14, 14, 16, 0.95) 0%, rgba(14, 14, 16, 0) 100%)',
        }}
      >
        <div 
          className={`transition-all duration-300 ${showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}
        >
          <div className="max-w-3xl mx-auto px-6 py-6">
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
      </div>
    </div>
  )
}
