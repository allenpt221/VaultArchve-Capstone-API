'use client'
import { LiteratureReviewResult } from '@/hooks/types';
import { BookOpen, Sparkles, Loader2, History, Clock, X, ArrowRight, ExternalLink, FileText } from 'lucide-react'

type SavedReview = { id: string; topic: string; created_at: string }

type Props = {
  topic: string

  savedReviews: SavedReview[]
  savedReviewsLoading: boolean
  selectedReviewId: string | null
  onSelectSavedReview: (id: string) => void

  onGenerateReview: () => void
  isLoading: boolean
  errorMessage: string | null

  review: LiteratureReviewResult | null
  sourceCount?: number
  unverifiedDropped?: number
  onContinue: () => void
}

// Small color accents per source type so the badges are easy to scan at a glance.
const SOURCE_TYPE_STYLES: Record<string, { bg: string; color: string }> = {
  'Journal Article': { bg: '#E7F0FA', color: '#1D5490' },
  'Conference Paper': { bg: '#EFE9FA', color: '#5B3A9E' },
  Thesis: { bg: '#E8F5EC', color: '#1F7A3D' },
  Report: { bg: '#FDECEA', color: '#B23A2E' },
  'Web Source': { bg: '#F1F1F1', color: '#555555' },
}

function sourceTypeStyle(type?: string) {
  return SOURCE_TYPE_STYLES[type ?? ''] ?? SOURCE_TYPE_STYLES['Web Source']
}

export function LiteratureReviewStage({
  topic,
  selectedReviewId,
  onSelectSavedReview,
  onGenerateReview,
  isLoading,
  errorMessage,
  review,
  sourceCount,
  unverifiedDropped,
  onContinue,
}: Props) {
  return (
    <div className="rounded-2xl border bg-white p-6 space-y-5 shadow-sm" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: '#FAEEDA' }}>
          <BookOpen className="w-4 h-4" style={{ color: '#BA7517' }} />
        </div>
        <div>
          <h2 className="font-semibold text-lg leading-tight tracking-tight" style={{ color: '#0B1C33' }}>
            Literature Review
          </h2>
          <p className="text-xs text-muted-foreground">
            AI searches the web for real sources on your topic and builds an annotated bibliography.
          </p>
        </div>
      </div>


      {topic && (
        <div
          className="rounded-xl px-3.5 py-2.5 border"
          style={{ background: 'rgba(11,28,51,0.03)', borderColor: 'rgba(11,28,51,0.08)' }}
        >
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">
            Reviewing literature for
          </p>
          <p className="text-sm font-medium" style={{ color: '#0B1C33' }}>
            {topic}
          </p>
        </div>
      )}

      {errorMessage && !review && (
        <div className="rounded-lg px-3.5 py-2.5 text-xs font-medium" style={{ background: '#FBEAEA', color: '#7A2020' }}>
          {errorMessage}
        </div>
      )}

      <button
        onClick={onGenerateReview}
        disabled={!topic.trim() || isLoading}
        className="inline-flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm transition-transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
        style={{ background: '#F5B841', color: '#1A1A1A' }}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Searching the web &amp; synthesizing...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            Generate Literature Review
          </>
        )}
      </button>

      {/* ── Review result ── */}
      {review && (
        <div className="pt-4 space-y-5 border-t" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
          {selectedReviewId && (
            <div
              className="flex items-center gap-1.5 text-xs font-medium w-fit px-3 py-1.5 rounded-full"
              style={{ color: '#8A5A00', backgroundColor: '#FDF3E3' }}
            >
              <History className="w-3.5 h-3.5" />
              Viewing a saved review from your history
            </div>
          )}

          {typeof sourceCount === 'number' && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
              <span>
                Found and verified {sourceCount} real source{sourceCount === 1 ? '' : 's'} via web search.
              </span>
              {!!unverifiedDropped && (
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full"
                  style={{ color: '#8A5A00', backgroundColor: '#FDF3E3' }}
                >
                  {unverifiedDropped} unverifiable {unverifiedDropped === 1 ? 'entry' : 'entries'} dropped
                </span>
              )}
            </div>
          )}

          {review.annotatedBibliography?.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Annotated Bibliography
                </p>
                <span
                  className="text-xs font-semibold rounded-full px-2.5 py-0.5"
                  style={{ background: '#FAEEDA', color: '#BA7517' }}
                >
                  {review.annotatedBibliography.length} source{review.annotatedBibliography.length === 1 ? '' : 's'}
                </span>
              </div>

              <ul className="space-y-3">
                {review.annotatedBibliography.map((b, i) => {
                  const badge = sourceTypeStyle(b.sourceType)
                  // Fallback for any not-yet-migrated rows that still only have `citation`.
                  const headline = b.title ?? b.citation
                  const byline = [b.authors, b.year, b.container].filter(Boolean).join(' · ')

                  return (
                    <li
                      key={i}
                      className="rounded-xl border overflow-hidden transition-shadow hover:shadow-sm"
                      style={{ borderColor: 'rgba(0,0,0,0.08)' }}
                    >
                      <div className="flex items-start gap-3 px-4 pt-4">
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold"
                          style={{ background: '#0B1C33', color: '#F5B841' }}
                        >
                          {i + 1}
                        </div>

                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            {b.sourceType && (
                              <span
                                className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide rounded-full px-2 py-0.5"
                                style={{ background: badge.bg, color: badge.color }}
                              >
                                <FileText className="w-2.5 h-2.5" />
                                {b.sourceType}
                              </span>
                            )}
                          </div>

                          <p className="text-sm font-semibold leading-snug" style={{ color: '#0B1C33' }}>
                            {headline}
                          </p>

                          {byline && <p className="text-xs text-muted-foreground">{byline}</p>}
                        </div>

                        {b.url && (
                          <a
                            href={b.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 inline-flex items-center gap-1 text-xs font-medium rounded-md px-2 py-1 transition-colors hover:bg-amber-50"
                            style={{ color: '#BA7517' }}
                            title="Open source"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>

                      <div className="px-4 pb-4 pt-2 ml-9">
                        <p className="text-sm leading-relaxed text-muted-foreground">{b.annotation}</p>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}

          <button
            onClick={onContinue}
            className="inline-flex items-center gap-1.5 text-sm font-semibold hover:opacity-80 transition-opacity"
            style={{ color: '#0B1C33' }}
          >
            Continue to Research Question
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}