'use client'
import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { plagiarismStore } from '@/Stores/PlagiarismStore'
import { ShieldCheck, AlertTriangle, CheckCircle2, ArrowRight, X, Loader2 } from 'lucide-react'

interface PlagiarismModalProps {
  isOpen: boolean
  onClose: () => void
  onContinue?: () => void
}

export default function PlagiarismModal({ isOpen, onClose, onContinue }: PlagiarismModalProps) {
  const { text, result, loading, error, setText, checkPlagiarism, reset } = plagiarismStore()
  const dialogRef = useRef<HTMLDivElement>(null)

  const wordCount = text.trim().split(/\s+/).filter(Boolean).length

  // Close on Escape, lock body scroll while open
  useEffect(() => {
    if (!isOpen) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', onKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose()
  }

  const handleContinue = () => {
    onContinue?.()
    onClose()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="plagiarism-modal-title"
      onMouseDown={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8"
      style={{ background: 'rgba(11, 28, 51, 0.45)' }}
    >
      <div
        ref={dialogRef}
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl"
        style={{ fontFamily: "'DM Sans', sans-serif", border: '1px solid rgba(0,0,0,0.08)' }}
      >
        {/* ── Header ── */}
        <div
          className="sticky top-0 z-10 flex items-start justify-between gap-4 rounded-t-2xl bg-white px-6 py-5"
          style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}
        >
          <div className="flex items-start gap-3">
            <span
              className="flex items-center justify-center w-9 h-9 rounded-full shrink-0"
              style={{ background: '#FBF3E7' }}
            >
              <ShieldCheck className="w-4 h-4" style={{ color: '#BA7517' }} />
            </span>
            <div>
              <h2 id="plagiarism-modal-title" className="font-bold text-lg" style={{ color: '#0B1C33' }}>
                Plagiarism Check
              </h2>
              <p className="text-sm text-muted-foreground">
                Paste your paper or a section of it to scan for overlap with published sources.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 rounded-full p-1.5 transition-colors"
            style={{ color: '#6B6A65' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#F1EFEA')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="space-y-6 px-6 py-6">
          <div>
            <label htmlFor="plagiarism-modal-input" className="mb-2 block text-sm font-medium" style={{ color: '#0B1C33' }}>
              Text to check
            </label>
            <textarea
              id="plagiarism-modal-input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste at least 50 words..."
              rows={10}
              disabled={loading}
              className="w-full resize-y rounded-lg border p-3 text-sm leading-relaxed focus:outline-none focus:ring-1 disabled:bg-[#FAFAF9]"
              style={{ borderColor: 'rgba(0,0,0,0.12)', color: '#1A1A1A' }}
            />
            <div className="mt-1.5 flex items-center justify-between text-xs text-muted-foreground">
              <span>{wordCount} words</span>
              {(result || error) && (
                <button type="button" onClick={reset} className="underline-offset-2 hover:underline">
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={checkPlagiarism}
              disabled={loading || wordCount === 0}
              className="inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
              style={{ background: '#0B1C33' }}
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {loading ? 'Scanning...' : 'Run Plagiarism Check'}
            </button>
          </div>

          {error && (
            <p role="alert" className="flex items-center gap-1.5 text-sm" style={{ color: '#B3261E' }}>
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              {error}
            </p>
          )}

          {result && (
            <div className="rounded-xl border p-5 space-y-4" style={{ borderColor: 'rgba(0,0,0,0.08)', background: '#FAFAF9' }}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Result
                </span>
                <span
                  className="inline-flex items-center gap-1.5 text-sm font-semibold"
                  style={{ color: result.flagged ? '#B3261E' : '#3B6D11' }}
                >
                  {result.flagged ? (
                    <>
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Possible plagiarism found
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Looks original
                    </>
                  )}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-2xl font-bold" style={{ color: '#0B1C33' }}>
                    {(result.percentUnique ?? 0).toFixed(0)}%
                  </div>
                  <div className="text-xs text-muted-foreground">Unique</div>
                </div>
                <div>
                  <div className="text-2xl font-bold" style={{ color: '#0B1C33' }}>
                    {(result.percentDuplicated ?? 0).toFixed(0)}%
                  </div>
                  <div className="text-xs text-muted-foreground">Matched elsewhere</div>
                </div>
              </div>

              {result.matches.length > 0 && (
                <ul className="space-y-2 border-t pt-3" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
                  {result.matches.map((match, i) => (
                    <li key={i} className="flex items-center justify-between text-sm gap-3">
                      <a
                        href={match.url}
                        target="_blank"
                        rel="noreferrer"
                        className="truncate underline-offset-2 hover:underline"
                        style={{ color: '#0B1C33' }}
                      >
                        {match.url || 'Unknown source'}
                      </a>
                      <span className="shrink-0 text-muted-foreground">{(match.percentage ?? 0).toFixed(0)}%</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}