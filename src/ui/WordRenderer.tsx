import { useMemo } from 'react'
import { Token } from '../core/types'
import { getOrpLetter } from '../core/orp'
import { useTextMeasure } from './hooks/useTextMeasure'

interface WordRendererProps {
  token: Token | null
  fontSize?: number
  fontFamily?: string
}

const ORP_ANCHOR_POSITION = 0.35

export function WordRenderer({ 
  token, 
  fontSize = 64,
  fontFamily = 'Inter, system-ui, sans-serif'
}: WordRendererProps) {
  const { measureText } = useTextMeasure(fontFamily, fontSize, 500)
  
  const { left, orp, right, leftWidth, orpWidth } = useMemo(() => {
    if (!token || token.type === 'break') {
      return { left: '', orp: '', right: '', leftWidth: 0, orpWidth: 0 }
    }
    
    const parts = getOrpLetter(token.display, token.orpIndex)
    const leftWidth = measureText(parts.left)
    const orpWidth = measureText(parts.orp)
    
    return { ...parts, leftWidth, orpWidth }
  }, [token, measureText])
  
  if (!token) {
    return (
      <div className="relative h-32 flex items-center justify-center">
        <span className="text-gray-600 text-2xl">No text loaded</span>
      </div>
    )
  }
  
  if (token.type === 'break') {
    return (
      <div className="relative h-32 flex items-center justify-center">
        <span className="text-gray-600 text-4xl">¶</span>
      </div>
    )
  }
  
  const containerWidth = 800
  const anchorX = containerWidth * ORP_ANCHOR_POSITION
  const translateX = anchorX - leftWidth
  const tickX = anchorX + orpWidth / 2
  
  const tickHeight = 28
  const lineOffset = 58
  
  return (
    <div className="relative h-32 overflow-hidden" style={{ width: containerWidth }}>
      {/* Top horizontal guide line */}
      <div 
        className="absolute left-0 right-0 h-px bg-reader-guide"
        style={{ top: `calc(50% - ${lineOffset}px)` }}
      />
      
      {/* Bottom horizontal guide line */}
      <div 
        className="absolute left-0 right-0 h-px bg-reader-guide"
        style={{ top: `calc(50% + ${lineOffset}px)` }}
      />
      
      {/* Top vertical tick (goes DOWN from top line toward text) */}
      <div 
        className="absolute w-px bg-reader-guide"
        style={{ 
          left: tickX,
          top: `calc(50% - ${lineOffset}px)`,
          height: tickHeight,
        }}
      />
      
      {/* Bottom vertical tick (goes UP from bottom line toward text) */}
      <div 
        className="absolute w-px bg-reader-guide"
        style={{ 
          left: tickX,
          top: `calc(50% + ${lineOffset}px - ${tickHeight}px)`,
          height: tickHeight,
        }}
      />
      
      {/* Word container */}
      <div 
        className="absolute top-1/2 -translate-y-1/2 whitespace-nowrap"
        style={{ 
          transform: `translateX(${translateX}px) translateY(-50%)`,
          fontSize,
          fontFamily,
          fontWeight: 500,
        }}
      >
        <span className="text-reader-text">{left}</span>
        <span className="text-reader-orp">{orp}</span>
        <span className="text-reader-text">{right}</span>
      </div>
    </div>
  )
}
