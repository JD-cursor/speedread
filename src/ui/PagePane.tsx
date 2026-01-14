import { useRef, useEffect, useCallback } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Token } from '../core/types'
import clsx from 'clsx'

interface PagePaneProps {
  tokens: Token[]
  currentIndex: number
  onSeek: (index: number) => void
}

const LINE_HEIGHT = 32
const WORDS_PER_LINE = 10

export function PagePane({ tokens, currentIndex, onSeek }: PagePaneProps) {
  const parentRef = useRef<HTMLDivElement>(null)
  const wordTokens = tokens.filter(t => t.type === 'word')
  
  const lines = groupTokensIntoLines(wordTokens, WORDS_PER_LINE)
  
  const virtualizer = useVirtualizer({
    count: lines.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => LINE_HEIGHT,
    overscan: 5,
  })
  
  const currentWordIndex = getCurrentWordIndex(tokens, currentIndex)
  const currentLineIndex = Math.floor(currentWordIndex / WORDS_PER_LINE)
  
  useEffect(() => {
    if (currentLineIndex >= 0 && currentLineIndex < lines.length) {
      virtualizer.scrollToIndex(currentLineIndex, { align: 'center', behavior: 'smooth' })
    }
  }, [currentLineIndex, lines.length, virtualizer])
  
  const handleTokenClick = useCallback((tokenIndex: number) => {
    const actualIndex = tokens.findIndex(t => t.id === wordTokens[tokenIndex]?.id)
    if (actualIndex !== -1) {
      onSeek(actualIndex)
    }
  }, [tokens, wordTokens, onSeek])
  
  if (tokens.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        No document loaded
      </div>
    )
  }
  
  return (
    <div 
      ref={parentRef}
      className="h-full overflow-auto px-4 py-2 bg-gray-950"
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const line = lines[virtualRow.index]
          const lineStartIndex = virtualRow.index * WORDS_PER_LINE
          
          return (
            <div
              key={virtualRow.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
              className="flex items-center gap-x-2 overflow-hidden text-sm"
            >
              {line.map((token, idx) => {
                const globalWordIndex = lineStartIndex + idx
                const isCurrentWord = globalWordIndex === currentWordIndex
                
                return (
                  <span
                    key={token.id}
                    onClick={() => handleTokenClick(globalWordIndex)}
                    className={clsx(
                      "cursor-pointer transition-colors duration-100 px-0.5 rounded",
                      isCurrentWord 
                        ? "bg-reader-highlight text-reader-orp font-medium" 
                        : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50"
                    )}
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
  return tokens[currentIndex]?.type === 'word' ? wordIndex : wordIndex - 1
}
