import { useEffect, useRef } from 'react'
import { ReadingMode } from '../../core/types'

interface KeyboardShortcutsConfig {
  mode: ReadingMode
  onTogglePlayPause: () => void
  onHoldStart: () => void
  onHoldEnd: () => void
  onStepForward: () => void
  onStepBackward: () => void
  onJumpForward: () => void
  onJumpBackward: () => void
  onWpmUp: () => void
  onWpmDown: () => void
  onEscape: () => void
  onToggleFullscreen?: () => void
}

export function useKeyboardShortcuts(config: KeyboardShortcutsConfig) {
  const spaceHeldRef = useRef(false)
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }
      
      switch (e.code) {
        case 'Space':
          e.preventDefault()
          if (config.mode === 'hold-space') {
            if (!spaceHeldRef.current) {
              spaceHeldRef.current = true
              config.onHoldStart()
            }
          } else {
            if (!e.repeat) {
              config.onTogglePlayPause()
            }
          }
          break
          
        case 'ArrowLeft':
          e.preventDefault()
          if (e.shiftKey) {
            config.onJumpBackward()
          } else {
            config.onStepBackward()
          }
          break
          
        case 'ArrowRight':
          e.preventDefault()
          if (e.shiftKey) {
            config.onJumpForward()
          } else {
            config.onStepForward()
          }
          break
          
        case 'ArrowUp':
          e.preventDefault()
          config.onWpmUp()
          break
          
        case 'ArrowDown':
          e.preventDefault()
          config.onWpmDown()
          break
          
        case 'Escape':
          e.preventDefault()
          config.onEscape()
          break
          
        case 'KeyF':
          if (config.onToggleFullscreen) {
            e.preventDefault()
            config.onToggleFullscreen()
          }
          break
      }
    }
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' && config.mode === 'hold-space') {
        spaceHeldRef.current = false
        config.onHoldEnd()
      }
    }
    
    const handleBlur = () => {
      if (spaceHeldRef.current && config.mode === 'hold-space') {
        spaceHeldRef.current = false
        config.onHoldEnd()
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('blur', handleBlur)
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('blur', handleBlur)
    }
  }, [config])
}
