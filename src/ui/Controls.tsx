import { Play, Pause, Type } from 'lucide-react'
import { ReaderSettings, ReadingMode, ReaderState } from '../core/types'
import clsx from 'clsx'

interface ControlsProps {
  state: ReaderState
  settings: ReaderSettings
  currentIndex: number
  totalTokens: number
  fontSize: number
  onPlay: () => void
  onPause: () => void
  onModeChange: (mode: ReadingMode) => void
  onFontSizeChange: (size: number) => void
}

export function Controls({
  state,
  settings,
  currentIndex,
  totalTokens,
  fontSize,
  onPlay,
  onPause,
  onModeChange,
  onFontSizeChange,
}: ControlsProps) {
  const isPlaying = state === 'playing'
  const progress = totalTokens > 0 ? ((currentIndex + 1) / totalTokens) * 100 : 0
  
  return (
    <div className="flex items-center justify-center gap-12">
      {/* Left info cluster */}
      <div className="flex items-center gap-6 text-base text-reader-text-muted">
        <span className="font-mono">{Math.round(progress)}%</span>
        <span className="font-mono">{settings.wpm} wpm</span>
      </div>
      
      {/* Center: Play button */}
      <button
        onClick={isPlaying ? onPause : onPlay}
        className="w-14 h-14 rounded-full flex items-center justify-center text-reader-text-dim hover:text-reader-text transition-all focus:outline-none"
        title={isPlaying ? "Pause (Space)" : "Play (Space)"}
      >
        {isPlaying ? <Pause size={28} /> : <Play size={28} className="ml-1" />}
      </button>
      
      {/* Right: Text size slider and mode */}
      <div className="flex items-center gap-8 text-base">
        {/* Text size slider */}
        <div className="flex items-center gap-3 text-reader-text-muted">
          <Type size={16} />
          <input
            type="range"
            min={32}
            max={96}
            step={4}
            value={fontSize}
            onChange={(e) => onFontSizeChange(parseInt(e.target.value, 10))}
            className="w-20 h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-reader-orp"
            title="Text size"
          />
        </div>
        
        {/* Mode toggle */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => onModeChange('autoplay')}
            className={clsx(
              "transition-all",
              settings.mode === 'autoplay' 
                ? "text-reader-text" 
                : "text-reader-text-muted hover:text-reader-text"
            )}
            title="Autoplay mode"
          >
            Auto
          </button>
          <button
            onClick={() => onModeChange('hold-space')}
            className={clsx(
              "transition-all",
              settings.mode === 'hold-space' 
                ? "text-reader-text" 
                : "text-reader-text-muted hover:text-reader-text"
            )}
            title="Hold Space mode"
          >
            Hold
          </button>
        </div>
      </div>
    </div>
  )
}
