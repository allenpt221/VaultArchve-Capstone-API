'use client'
import { Users, Sparkles, Loader2, History, ArrowRight } from 'lucide-react'
import type { MarketResearchGuidance, SavedMarketResearch } from '@/hooks/entrpTypes'
import { CopyButton } from '@/components/Copybutton'

type Props = {
  idea: string
  conceptStatement: string
  notes: string
  onNotesChange: (v: string) => void
  surveyResultsInterpretation: string
  onSurveyResultsInterpretationChange: (v: string) => void
  onGenerateMarketResearch: () => void
  isLoading: boolean
  errorMessage: string | null

  savedMarketResearches: SavedMarketResearch[]
  savedMarketResearchesLoading: boolean
  selectedMarketId: string | null
  onSelectSavedMarketResearch: (id: string) => void

  marketResearch: MarketResearchGuidance | null
  onContinue: () => void
  limitedUntil: number | null
  countdown: string
}

type SurveySection = MarketResearchGuidance['surveySections'][number]

/** Plain-text version of one survey section: "1. Title" followed by "- question" lines. */
const sectionToText = (section: SurveySection) =>
  `${section.id}. ${section.title}\n${section.questions.map((q) => `- ${q}`).join('\n')}`

export function MarketResearchStage({
  idea,
  conceptStatement,
  notes,
  onNotesChange,
  onGenerateMarketResearch,
  isLoading,
  errorMessage,
  selectedMarketId,
  marketResearch,
  onContinue,
  limitedUntil,
  countdown
}: Props) {
  const isLimited = !!limitedUntil

  return (
    <div className="rounded-xl border bg-white p-6 space-y-5" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: '#FAEEDA' }}>
          <Users className="w-4 h-4" style={{ color: '#BA7517' }} />
        </div>
        <div>
          <h2 className="font-semibold text-lg leading-tight">Market Research</h2>
          <p className="text-xs text-muted-foreground">
            Define your target market and get a ready-to-run survey.
          </p>
        </div>
      </div>

      {conceptStatement && (
        <div className="rounded-lg px-3.5 py-2.5" style={{ background: 'rgba(11,28,51,0.04)' }}>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">
            Researching market for
          </p>
          <p className="text-sm font-medium leading-relaxed" style={{ color: '#0B1C33' }}>
            {conceptStatement}
          </p>
        </div>
      )}


      <div className="space-y-1.5">
        <label className="text-sm font-medium">
          Your rough market notes <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        <textarea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="e.g. I'm thinking our primary market is young urban professionals who care about fresh food..."
          rows={3}
          className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-amber-400 bg-muted/30 resize-none"
          style={{ borderColor: 'rgba(0,0,0,0.12)' }}
        />
      </div>

      {(errorMessage || (limitedUntil && countdown)) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 w-full">
          {errorMessage && (
            <div
              className="min-w-0 rounded-lg px-3.5 py-2.5 text-xs font-medium leading-relaxed break-words"
              style={{
                background: '#FBEAEA',
                color: '#7A2020',
              }}
            >
              {errorMessage}
            </div>
          )}

          {limitedUntil && countdown && (
            <div
              className="min-w-0 rounded-lg px-3.5 py-2.5 text-xs font-medium leading-relaxed break-words"
              style={{
                background: '#FDF3E3',
                color: '#8A5A00',
              }}
            >
              Please wait{' '}
              <strong>{countdown}</strong>{' '}
              before requesting AI guidance again.
            </div>
          )}
        </div>
      )}

      <button
        onClick={onGenerateMarketResearch}
        disabled={!idea.trim() || !conceptStatement.trim() || isLoading || isLimited}
        className="inline-flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ background: '#F5B841', color: '#1A1A1A' }}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Researching...
          </>
        ) : isLimited ? (
          <>
            <Sparkles className="w-4 h-4" />
            Daily limit reached
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            Generate Market Research
          </>
        )}
      </button>

      {!conceptStatement.trim() && (
        <p className="text-xs" style={{ color: '#633806' }}>
          Complete the Business Concept stage first to carry over a concept statement.
        </p>
      )}

      {/* ── Result ── */}
      {marketResearch && (
        <div className="pt-4 space-y-5 border-t" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
          {selectedMarketId && (
            <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: '#633806' }}>
              <History className="w-3.5 h-3.5" />
              Viewing a saved entry from your history
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-3">
            <div className="rounded-lg px-3.5 py-3" style={{ background: '#FAEEDA' }}>
              <div className="flex items-center justify-between gap-2 mb-1">
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#BA7517' }}>
                  Primary market
                </p>
                <CopyButton text={marketResearch.primaryMarket} title="Copy primary market" />
              </div>
              <p className="text-sm leading-relaxed">{marketResearch.primaryMarket}</p>
            </div>
            <div className="rounded-lg px-3.5 py-3" style={{ background: 'rgba(11,28,51,0.04)' }}>
              <div className="flex items-center justify-between gap-2 mb-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Secondary market
                </p>
                <CopyButton text={marketResearch.secondaryMarket} title="Copy secondary market" />
              </div>
              <p className="text-sm leading-relaxed">{marketResearch.secondaryMarket}</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Segmentation justification
              </p>
              <CopyButton
                text={marketResearch.segmentationJustification}
                title="Copy segmentation justification"
              />
            </div>
            <p className="text-sm leading-relaxed">{marketResearch.segmentationJustification}</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Survey sections</p>
              <CopyButton
                text={marketResearch.surveySections.map(sectionToText).join('\n\n')}
                label="Copy full survey"
                title="Copy full survey"
              />
            </div>
            <div className="space-y-2">
              {marketResearch.surveySections.map((section) => (
                <div key={section.id} className="rounded-lg border px-3.5 py-3" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <p className="text-sm font-semibold" style={{ color: '#0B1C33' }}>
                      <span style={{ color: '#BA7517' }}>{section.id}.</span> {section.title}
                    </p>
                    <CopyButton text={sectionToText(section)} title="Copy this section" />
                  </div>
                  <ul className="space-y-1">
                    {section.questions.map((q, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex gap-2">
                        <span style={{ color: '#BA7517' }}>•</span>
                        {q}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={onContinue}
            className="cursor-pointer inline-flex items-center gap-1.5 text-sm font-semibold hover:text-[#003887] transition-colors"
            style={{ color: '#0B1C33' }}
          >
            Continue to Production Plan
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}