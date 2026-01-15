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
  fontFamily = 'Georgia, Cambria, Times New Roman, serif'
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
  const translateX = anchorX - leftWidth - orpWidth / 2
  const tickX = anchorX
  
  // Bracket dimensions - subtle visual guides
  const bracketHeight = 24
  const bracketGap = 8 // gap between bracket and text
  const textHalfHeight = fontSize * 0.45 // approximate half-height of text
  
  return (
    <div className="relative overflow-hidden" style={{ width: containerWidth, height: fontSize * 2 }}>
      {/* Top bracket (vertical tick only - no horizontal line) */}
      <div 
        className="absolute w-px bg-reader-guide transition-opacity duration-300"
        style={{ 
          left: tickX,
          top: `calc(50% - ${textHalfHeight + bracketGap + bracketHeight}px)`,
          height: bracketHeight,
          opacity: 0.6,
        }}
      />
      
      {/* Bottom bracket (vertical tick only - no horizontal line) */}
      <div 
        className="absolute w-px bg-reader-guide transition-opacity duration-300"
        style={{ 
          left: tickX,
          top: `calc(50% + ${textHalfHeight + bracketGap}px)`,
          height: bracketHeight,
          opacity: 0.6,
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
          letterSpacing: '0.01em',
        }}
      >
        <span className="text-reader-text">{left}</span>
        <span className="text-reader-orp">{orp}</span>
        <span className="text-reader-text">{right}</span>
      </div>
    </div>
  )
}
