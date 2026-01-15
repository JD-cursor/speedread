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
    <div className="flex flex-col gap-4 p-4 bg-gray-900/50 rounded-xl backdrop-blur-sm">
      {/* Progress bar */}
      <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
        <div 
          className="h-full bg-reader-orp transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      {/* Progress text */}
      <div className="flex justify-between text-sm text-gray-400">
        <span>{currentIndex + 1} / {totalTokens}</span>
        <span>{Math.round(progress)}%</span>
      </div>
      
      {/* Main controls */}
      <div className="flex items-center justify-center gap-2">
        <ControlButton onClick={onJumpBackward} title="Jump back 10 words (Shift+←)">
          <SkipBack size={20} />
        </ControlButton>
        
        <ControlButton onClick={onStepBackward} title="Step back 1 word (←)">
          <ChevronLeft size={20} />
        </ControlButton>
        
        <button
          onClick={isPlaying ? onPause : onPlay}
          className={clsx(
            "w-14 h-14 rounded-full flex items-center justify-center transition-all",
            "bg-reader-orp hover:bg-red-500 text-white",
            "focus:outline-none focus:ring-2 focus:ring-reader-orp focus:ring-offset-2 focus:ring-offset-gray-900"
          )}
          title={isPlaying ? "Pause (Space)" : "Play (Space)"}
        >
          {isPlaying ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
        </button>
        
        <ControlButton onClick={onStepForward} title="Step forward 1 word (→)">
          <ChevronRight size={20} />
        </ControlButton>
        
        <ControlButton onClick={onJumpForward} title="Jump forward 10 words (Shift+→)">
          <SkipForward size={20} />
        </ControlButton>
      </div>
      
      {/* Speed slider */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-400 w-16">Speed</span>
        <input
          type="range"
          min={WPM_MIN}
          max={WPM_MAX}
          step={WPM_STEP}
          value={settings.wpm}
          onChange={(e) => onWpmChange(parseInt(e.target.value, 10))}
          className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-reader-orp"
        />
        <span className="text-sm font-mono text-white w-20 text-right">{settings.wpm} WPM</span>
      </div>
      
      {/* Text size slider */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-400 w-16 flex items-center gap-1">
          <Type size={14} />
          Size
        </span>
        <input
          type="range"
          min={32}
          max={128}
          step={4}
          value={fontSize}
          onChange={(e) => onFontSizeChange(parseInt(e.target.value, 10))}
          className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-reader-orp"
        />
        <span className="text-sm font-mono text-white w-20 text-right">{fontSize}px</span>
      </div>
      
      {/* Mode and toggles */}
      <div className="flex items-center justify-between gap-4">
        {/* Mode toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onModeChange('autoplay')}
            className={clsx(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all",
              settings.mode === 'autoplay' 
                ? "bg-reader-orp text-white" 
                : "bg-gray-800 text-gray-400 hover:text-white"
            )}
            title="Autoplay mode"
          >
            <Zap size={14} />
            Auto
          </button>
          <button
            onClick={() => onModeChange('hold-space')}
            className={clsx(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all",
              settings.mode === 'hold-space' 
                ? "bg-reader-orp text-white" 
                : "bg-gray-800 text-gray-400 hover:text-white"
            )}
            title="Hold Space mode (deadman switch)"
          >
            <Hand size={14} />
            Hold
          </button>
        </div>
        
        {/* Toggles */}
        <div className="flex items-center gap-2">
          <ToggleButton
            active={settings.punctuationPause}
            onClick={() => onPunctuationPauseChange(!settings.punctuationPause)}
            title="Punctuation pause"
          >
            <Settings size={14} />
            <span>Punct</span>
          </ToggleButton>
          
          <ToggleButton
            active={settings.softRewind}
            onClick={() => onSoftRewindChange(!settings.softRewind)}
            title="Soft rewind on resume"
          >
            <RotateCcw size={14} />
            <span>Rewind</span>
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
        "w-10 h-10 rounded-lg flex items-center justify-center transition-all",
        "bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white",
        "focus:outline-none focus:ring-2 focus:ring-reader-orp"
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
        "flex items-center gap-1 px-2 py-1 rounded text-xs transition-all",
        active 
          ? "bg-gray-700 text-white" 
          : "bg-gray-800/50 text-gray-500 hover:text-gray-300"
      )}
      title={title}
    >
      {children}
    </button>
  )
}
