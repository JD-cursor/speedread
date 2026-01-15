import { useMemo, useCallback } from 'react'
import { Token } from '../core/types'

interface TextFlowProps {
  tokens: Token[]
  currentIndex: number
  onSeek: (index: number) => void
}

// Number of visible lines in the text flow window
const VISIBLE_LINES = 10
// Words per line for text wrapping - more organic, longer lines
const WORDS_PER_LINE = 12
// Line height in pixels
const LINE_HEIGHT = 36
// Animation duration for smooth transitions
const TRANSITION_DURATION = 300

/**
 * TextFlow: A Star Wars crawl-style text display
 * 
 * Design decisions:
 * - Current line is always vertically centered
 * - Lines above/below fade based on distance from center
 * - Uses transform + opacity for smooth 60fps animations
 * - Virtualized internally but appears continuous
 * - Click any visible line to seek to that position
 */
export function TextFlow({ tokens, currentIndex, onSeek }: TextFlowProps) {
  // Filter to word tokens only and group into lines
  const wordTokens = useMemo(() => 
    tokens.filter(t => t.type === 'word'), 
    [tokens]
  )
  
  const lines = useMemo(() => 
    groupTokensIntoLines(wordTokens, WORDS_PER_LINE),
    [wordTokens]
  )
  
  // Calculate current word index and line
  const currentWordIndex = useMemo(() => 
    getCurrentWordIndex(tokens, currentIndex),
    [tokens, currentIndex]
  )
  
  const currentLineIndex = Math.floor(currentWordIndex / WORDS_PER_LINE)
  
  // Calculate which lines to render (windowed)
  const { visibleLines, startLineIndex } = useMemo(() => {
    const halfVisible = Math.floor(VISIBLE_LINES / 2)
    let start = currentLineIndex - halfVisible
    let end = currentLineIndex + halfVisible + 1
    
    // Clamp to valid range
    if (start < 0) {
      start = 0
      end = Math.min(VISIBLE_LINES, lines.length)
    }
    if (end > lines.length) {
      end = lines.length
      start = Math.max(0, end - VISIBLE_LINES)
    }
    
    return {
      visibleLines: lines.slice(start, end),
      startLineIndex: start,
    }
  }, [currentLineIndex, lines])
  
  // Handle line click for seeking
  const handleLineClick = useCallback((lineIndex: number, wordIndexInLine: number) => {
    const globalWordIndex = lineIndex * WORDS_PER_LINE + wordIndexInLine
    const token = wordTokens[globalWordIndex]
    if (token) {
      const actualIndex = tokens.findIndex(t => t.id === token.id)
      if (actualIndex !== -1) {
        onSeek(actualIndex)
      }
    }
  }, [tokens, wordTokens, onSeek])
  
  // Calculate opacity based on distance from center line
  const getLineOpacity = (lineIndex: number): number => {
    const distance = Math.abs(lineIndex - currentLineIndex)
    const maxDistance = Math.floor(VISIBLE_LINES / 2)
    
    if (distance === 0) return 1
    if (distance >= maxDistance) return 0.1
    
    // Smooth exponential falloff
    const normalizedDistance = distance / maxDistance
    return Math.max(0.1, 1 - Math.pow(normalizedDistance, 1.5))
  }
  
  // Calculate Y offset for smooth centering animation
  const getLineTransformY = (lineIndex: number): number => {
    const centerY = (VISIBLE_LINES / 2) * LINE_HEIGHT
    const linePosition = (lineIndex - startLineIndex) * LINE_HEIGHT
    return linePosition - centerY + (LINE_HEIGHT / 2)
  }
  
  if (tokens.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-reader-text-muted">
        No text loaded
      </div>
    )
  }
  
  const containerHeight = VISIBLE_LINES * LINE_HEIGHT
  
  return (
    <div 
      className="h-full flex items-center overflow-hidden"
      style={{ 
        // Subtle gradient masks at top and bottom for fade effect
        maskImage: 'linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)',
        // Move container toward center (away from right edge)
        marginRight: '15%',
      }}
    >
      <div 
        className="relative w-full"
        style={{ height: containerHeight }}
      >
        {visibleLines.map((line, idx) => {
          const lineIndex = startLineIndex + idx
          const opacity = getLineOpacity(lineIndex)
          const transformY = getLineTransformY(lineIndex)
          const isCurrentLine = lineIndex === currentLineIndex
          
          return (
            <div
              key={`line-${lineIndex}`}
              className="absolute left-0 right-0 px-4 flex items-center gap-2 select-none overflow-x-auto scrollbar-hide"
              style={{
                height: LINE_HEIGHT,
                top: '50%',
                transform: `translateY(${transformY}px)`,
                opacity,
                transition: `transform ${TRANSITION_DURATION}ms ease-out, opacity ${TRANSITION_DURATION}ms ease-out`,
                // Subtle blur for distant lines
                filter: opacity < 0.5 ? `blur(${(1 - opacity) * 1}px)` : 'none',
              }}
            >
              {line.map((token, wordIdx) => {
                const globalWordIdx = lineIndex * WORDS_PER_LINE + wordIdx
                const isCurrentWord = globalWordIdx === currentWordIndex
                
                return (
                  <span
                    key={token.id}
                    onClick={() => handleLineClick(lineIndex, wordIdx)}
                    className="cursor-pointer transition-colors duration-150 font-reader"
                    style={{
                      fontSize: isCurrentLine ? '18px' : '16px',
                      color: isCurrentWord 
                        ? '#b85c5c' // reader-orp
                        : isCurrentLine 
                          ? '#c8c8cc' // reader-text
                          : '#707078', // reader-text-dim
                      fontWeight: isCurrentWord ? 600 : isCurrentLine ? 500 : 400,
                      textShadow: isCurrentWord ? '0 0 20px rgba(184, 92, 92, 0.3)' : 'none',
                    }}
                  >
                    {token.display}
                  </span>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function groupTokensIntoLines(tokens: Token[], wordsPerLine: number): Token[][] {
  const lines: Token[][] = []
  for (let i = 0; i < tokens.length; i += wordsPerLine) {
    lines.push(tokens.slice(i, i + wordsPerLine))
  }
  return lines
}

function getCurrentWordIndex(tokens: Token[], currentIndex: number): number {
  let wordIndex = 0
  for (let i = 0; i < currentIndex && i < tokens.length; i++) {
    if (tokens[i].type === 'word') {
      wordIndex++
    }
  }
  return tokens[currentIndex]?.type === 'word' ? wordIndex : Math.max(0, wordIndex - 1)
}
