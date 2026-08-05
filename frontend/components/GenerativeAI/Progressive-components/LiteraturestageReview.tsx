'use client'
import { MIN_SOURCES, THEME_SWATCHES } from '@/hooks/constants';
import { LiteratureReviewResult, LiteratureSource } from '@/hooks/types';
import { BookOpen, Sparkles, Loader2, History, Clock, Plus, X, Search, ArrowRight } from 'lucide-react'

type SavedReview = { id: string; topic: string; created_at: string }

type Props = {
  topic: string

  savedReviews: SavedReview[]
  savedReviewsLoading: boolean
  selectedReviewId: string | null
  onSelectSavedReview: (id: string) => void

  sources: LiteratureSource[]
  sourceCitation: string
  onSourceCitationChange: (v: string) => void
  sourceFinding: string
  onSourceFindingChange: (v: string) => void
  sourceRelevance: string
  onSourceRelevanceChange: (v: string) => void
  onAddSource: () => void
  onRemoveSource: (index: number) => void

  onGenerateReview: () => void
  isLoading: boolean
  errorMessage: string | null

  review: LiteratureReviewResult | null
  onContinue: () => void
}

export function LiteratureReviewStage({
  topic,
  savedReviews,
  savedReviewsLoading,
  selectedReviewId,
  onSelectSavedReview,
  sources,
  sourceCitation,
  onSourceCitationChange,
  sourceFinding,
  onSourceFindingChange,
  sourceRelevance,
  onSourceRelevanceChange,
  onAddSource,
  onRemoveSource,
  onGenerateReview,
  isLoading,
  errorMessage,
  review,
  onContinue,
}: Props) {
  return (
    <div className="rounded-xl border bg-white p-6 space-y-5" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: '#FAEEDA' }}>
          <BookOpen className="w-4 h-4" style={{ color: '#BA7517' }} />
        </div>
        <div>
          <h2 className="font-semibold text-lg leading-tight">Literature Review</h2>
          <p className="text-xs text-muted-foreground">
            Log your sources, then let AI find the gap and synthesize them.
          </p>
        </div>
      </div>

      {/* ── Saved reviews ── */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5">
          <History className="w-3.5 h-3.5 text-muted-foreground" />
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Your saved reviews</p>
        </div>

        {savedReviewsLoading ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Loading your saved reviews...
          </div>
        ) : savedReviews.length > 0 ? (
          <div className="grid sm:grid-cols-2 gap-2">
            {savedReviews.map((r) => {
              const isSelected = r.id === selectedReviewId
              return (
                <button
                  key={r.id}
                  onClick={() => onSelectSavedReview(r.id)}
                  className="text-left rounded-lg border px-3 py-2.5 transition-colors hover:bg-amber-50"
                  style={{
                    borderColor: isSelected ? '#BA7517' : 'rgba(0,0,0,0.08)',
                    background: isSelected ? '#FAEEDA' : '#FFFFFF',
                  }}
                >
                  <p className="text-sm font-medium truncate">{r.topic}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground py-1">
            No saved reviews yet — generate one below and it'll show up here.
          </p>
        )}
      </div>

      {topic && (
        <div className="rounded-lg px-3.5 py-2.5" style={{ background: 'rgba(11,28,51,0.04)' }}>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">
            Reviewing literature for
          </p>
          <p className="text-sm font-medium" style={{ color: '#0B1C33' }}>
            {topic}
          </p>
        </div>
      )}

      {/* ── Add source form ── */}
      <div className="rounded-lg border p-4 space-y-3" style={{ borderColor: 'rgba(0,0,0,0.1)', background: 'rgba(11,28,51,0.02)' }}>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Log a source</p>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Citation</label>
          <input
            type="text"
            value={sourceCitation}
            onChange={(e) => onSourceCitationChange(e.target.value)}
            placeholder="Author, A. (Year). Title. Journal, Vol(Issue), pages."
            className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-amber-400 bg-white"
            style={{ borderColor: 'rgba(0,0,0,0.12)' }}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Key finding</label>
          <textarea
            value={sourceFinding}
            onChange={(e) => onSourceFindingChange(e.target.value)}
            placeholder="What did this source find?"
            rows={2}
            className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-amber-400 bg-white resize-none"
            style={{ borderColor: 'rgba(0,0,0,0.12)' }}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Relevance to your gap</label>
          <textarea
            value={sourceRelevance}
            onChange={(e) => onSourceRelevanceChange(e.target.value)}
            placeholder="How does this connect to (or fail to cover) what your study is about?"
            rows={2}
            className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-amber-400 bg-white resize-none"
            style={{ borderColor: 'rgba(0,0,0,0.12)' }}
          />
        </div>

        <button
          onClick={onAddSource}
          disabled={!sourceCitation.trim() || !sourceFinding.trim() || !sourceRelevance.trim()}
          className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: '#0B1C33', color: '#FFFFFF' }}
        >
          <Plus className="w-3.5 h-3.5" />
          Add source
        </button>
      </div>

      {/* ── Logged sources ── */}
      {sources.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Logged sources ({sources.length})
          </p>
          <div className="space-y-2">
            {sources.map((s, i) => (
              <div
                key={i}
                className="flex items-start justify-between gap-3 rounded-lg border px-3 py-2.5"
                style={{ borderColor: 'rgba(0,0,0,0.08)' }}
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{s.citation}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1">{s.key_finding}</p>
                </div>
                <button onClick={() => onRemoveSource(i)} className="shrink-0 text-muted-foreground hover:text-red-600 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          {sources.length < MIN_SOURCES && (
            <p className="text-xs" style={{ color: '#633806' }}>
              Log {MIN_SOURCES - sources.length} more source{MIN_SOURCES - sources.length === 1 ? '' : 's'} to generate your review.
            </p>
          )}
        </div>
      )}

      {errorMessage && !review && (
        <div className="rounded-lg px-3 py-2 text-xs font-medium" style={{ background: '#FBEAEA', color: '#7A2020' }}>
          {errorMessage}
        </div>
      )}

      <button
        onClick={onGenerateReview}
        disabled={sources.length < MIN_SOURCES || isLoading}
        className="inline-flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ background: '#F5B841', color: '#1A1A1A' }}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Synthesizing...
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
            <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: '#633806' }}>
              <History className="w-3.5 h-3.5" />
              Viewing a saved review from your history
            </div>
          )}

          <div className="rounded-lg px-3.5 py-3" style={{ background: '#FAEEDA' }}>
            <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: '#BA7517' }}>
              Research gap
            </p>
            <p className="text-sm leading-relaxed" style={{ color: '#1A1A1A' }}>
              {review.gapStatement}
            </p>
          </div>

          {Object.keys(review.themeGroups || {}).length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Synthesis matrix</p>
              <div className="grid sm:grid-cols-2 gap-3">
                {Object.entries(review.themeGroups).map(([theme, citations], i) => (
                  <div key={theme} className="rounded-lg border p-3 space-y-1.5" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
                    <p className="text-xs font-semibold" style={{ color: THEME_SWATCHES[i % THEME_SWATCHES.length] }}>
                      {theme}
                    </p>
                    <ul className="space-y-1">
                      {citations.map((c, j) => (
                        <li key={j} className="text-xs text-muted-foreground leading-snug">
                          {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Synthesis</p>
            <p className="text-sm leading-relaxed">{review.synthesisParagraph}</p>
          </div>

          {review.annotatedBibliography?.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Annotated bibliography</p>
              <ul className="space-y-3">
                {review.annotatedBibliography.map((b, i) => (
                  <li key={i} className="text-sm">
                    <p className="font-medium">{b.citation}</p>
                    <p className="text-muted-foreground leading-relaxed">{b.annotation}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {review.recommendedSearches?.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Recommended searches</p>
              <div className="space-y-2">
                {review.recommendedSearches.map((r, i) => {
                  const scholarUrl = `https://scholar.google.com/scholar?q=${encodeURIComponent(r.searchQuery)}`
                  const color = THEME_SWATCHES[i % THEME_SWATCHES.length]
                  return (
                    <div key={i} className="rounded-lg border px-3 py-2.5 space-y-1.5" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
                      <div className="flex items-center gap-1.5">
                        <Search className="w-3 h-3 shrink-0" style={{ color }} />
                        <span className="text-xs font-semibold" style={{ color }}>
                          {r.theme}
                        </span>
                      </div>
                      <a
                        href={scholarUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between gap-2 text-sm font-mono bg-muted/40 hover:bg-muted/70 rounded px-2 py-1.5 leading-snug break-words transition-colors group"
                        style={{ color: '#0B1C33' }}
                      >
                        <span className="underline decoration-dotted underline-offset-2">{r.searchQuery}</span>
                        <ArrowRight className="w-3.5 h-3.5 shrink-0 opacity-40 group-hover:opacity-100 transition-opacity" />
                      </a>
                      <p className="text-xs text-muted-foreground leading-relaxed">{r.why}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <button onClick={onContinue} className="inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: '#0B1C33' }}>
            Continue to Research Question
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}