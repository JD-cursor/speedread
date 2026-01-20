import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

const DISCLAIMER_KEY = 'speedread-disclaimer-dismissed'

export function DisclaimerPopup() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const dismissed = localStorage.getItem(DISCLAIMER_KEY)
    if (!dismissed) {
      setIsVisible(true)
    }
  }, [])

  const handleDismiss = () => {
    localStorage.setItem(DISCLAIMER_KEY, 'true')
    setIsVisible(false)
  }

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative bg-reader-bg border border-white/10 rounded-lg p-8 max-w-md mx-4 shadow-2xl">
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-reader-text-dim hover:text-reader-text transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-reader-text">
            Experimental v1
          </h2>
          
          <div className="space-y-3 text-reader-text-dim">
            <p className="flex items-start gap-2">
              <span className="text-reader-orp mt-1">•</span>
              <span>Data stored locally in your browser</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-reader-orp mt-1">•</span>
              <span>Export your library if you care about it</span>
            </p>
          </div>

          <button
            onClick={handleDismiss}
            className="w-full py-3 px-4 bg-reader-orp hover:bg-reader-orp/80 text-white rounded-lg font-medium transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  )
}
