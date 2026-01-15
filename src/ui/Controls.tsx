import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  ChevronLeft, 
  ChevronRight,
  Hand,
  Zap,
  RotateCcw,
  Settings,
  Type
} from 'lucide-react'
import { ReaderSettings, ReadingMode, ReaderState, WPM_MIN, WPM_MAX, WPM_STEP } from '../core/types'
import clsx from 'clsx'

interface ControlsProps {
  state: ReaderState
  settings: ReaderSettings
  currentIndex: number
  totalTokens: number
  fontSize: number
  onPlay: () => void
  onPause: () => void
  onStepForward: () => void
  onStepBackward: () => void
  onJumpForward: () => void
  onJumpBackward: () => void
  onWpmChange: (wpm: number) => void
  onModeChange: (mode: ReadingMode) => void
  onPunctuationPauseChange: (enabled: boolean) => void
  onSoftRewindChange: (enabled: boolean) => void
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
  onStepForward,
  onStepBackward,
  onJumpForward,
  onJumpBackward,
  onWpmChange,
  onModeChange,
  onPunctuationPauseChange,
  onSoftRewindChange,
  onFontSizeChange,
}: ControlsProps) {
  const isPlaying = state === 'playing'
  const progress = totalTokens > 0 ? ((currentIndex + 1) / totalTokens) * 100 : 0
  
  return (
    <div className="flex flex-col gap-3">
      {/* Progress bar - subtle, no container */}
      <div className="w-full h-0.5 bg-white/10 rounded-full overflow-hidden">
        <div 
          className="h-full bg-reader-orp/70 transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      {/* Main controls row */}
      <div className="flex items-center justify-between">
        {/* Left: Progress text */}
        <div className="text-xs text-reader-text-muted font-mono w-32">
          {currentIndex + 1} / {totalTokens} ({Math.round(progress)}%)
        </div>
        
        {/* Center: Playback controls */}
        <div className="flex items-center gap-1">
          <ControlButton onClick={onJumpBackward} title="Jump back 10 words (Shift+←)">
            <SkipBack size={16} />
          </ControlButton>
          
          <ControlButton onClick={onStepBackward} title="Step back 1 word (←)">
            <ChevronLeft size={16} />
          </ControlButton>
          
          <button
            onClick={isPlaying ? onPause : onPlay}
            className={clsx(
              "w-12 h-12 rounded-full flex items-center justify-center transition-all",
              "bg-reader-orp/80 hover:bg-reader-orp text-white",
              "focus:outline-none focus:ring-2 focus:ring-reader-orp/50"
            )}
            title={isPlaying ? "Pause (Space)" : "Play (Space)"}
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
          </button>
          
          <ControlButton onClick={onStepForward} title="Step forward 1 word (→)">
            <ChevronRight size={16} />
          </ControlButton>
          
          <ControlButton onClick={onJumpForward} title="Jump forward 10 words (Shift+→)">
            <SkipForward size={16} />
          </ControlButton>
        </div>
        
        {/* Right: Mode toggle */}
        <div className="flex items-center gap-1 w-32 justify-end">
          <button
            onClick={() => onModeChange('autoplay')}
            className={clsx(
              "flex items-center gap-1 px-2 py-1 rounded text-xs transition-all",
              settings.mode === 'autoplay' 
                ? "bg-white/10 text-reader-text" 
                : "text-reader-text-muted hover:text-reader-text"
            )}
            title="Autoplay mode"
          >
            <Zap size={12} />
            Auto
          </button>
          <button
            onClick={() => onModeChange('hold-space')}
            className={clsx(
              "flex items-center gap-1 px-2 py-1 rounded text-xs transition-all",
              settings.mode === 'hold-space' 
                ? "bg-white/10 text-reader-text" 
                : "text-reader-text-muted hover:text-reader-text"
            )}
            title="Hold Space mode"
          >
            <Hand size={12} />
            Hold
          </button>
        </div>
      </div>
      
      {/* Secondary controls row - sliders and toggles */}
      <div className="flex items-center gap-6 text-xs">
        {/* Speed slider */}
        <div className="flex items-center gap-2 flex-1">
          <span className="text-reader-text-muted">WPM</span>
          <input
            type="range"
            min={WPM_MIN}
            max={WPM_MAX}
            step={WPM_STEP}
            value={settings.wpm}
            onChange={(e) => onWpmChange(parseInt(e.target.value, 10))}
            className="flex-1 h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-reader-orp"
          />
          <span className="text-reader-text font-mono w-12 text-right">{settings.wpm}</span>
        </div>
        
        {/* Size slider */}
        <div className="flex items-center gap-2 flex-1">
          <Type size={12} className="text-reader-text-muted" />
          <input
            type="range"
            min={32}
            max={128}
            step={4}
            value={fontSize}
            onChange={(e) => onFontSizeChange(parseInt(e.target.value, 10))}
            className="flex-1 h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-reader-orp"
          />
          <span className="text-reader-text font-mono w-10 text-right">{fontSize}</span>
        </div>
        
        {/* Toggles */}
        <div className="flex items-center gap-2">
          <ToggleButton
            active={settings.punctuationPause}
            onClick={() => onPunctuationPauseChange(!settings.punctuationPause)}
            title="Punctuation pause"
          >
            <Settings size={10} />
          </ToggleButton>
          
          <ToggleButton
            active={settings.softRewind}
            onClick={() => onSoftRewindChange(!settings.softRewind)}
            title="Soft rewind on resume"
          >
            <RotateCcw size={10} />
          </ToggleButton>
        </div>
      </div>
    </div>
  )
}

function ControlButton({ 
  onClick, 
  title, 
  children 
}: { 
  onClick: () => void
  title: string
  children: React.ReactNode 
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
        "text-reader-text-dim hover:text-reader-text hover:bg-white/5",
        "focus:outline-none"
      )}
      title={title}
    >
      {children}
    </button>
  )
}

function ToggleButton({
  active,
  onClick,
  title,
  children,
}: {
  active: boolean
  onClick: () => void
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "w-6 h-6 rounded flex items-center justify-center transition-all",
        active 
          ? "bg-white/10 text-reader-text" 
          : "text-reader-text-muted hover:text-reader-text"
      )}
      title={title}
    >
      {children}
    </button>
  )
}
