'use client'
import { ShieldCheck, Sparkles, Loader2, History, ArrowRight } from 'lucide-react'
import type { SWOTGuidance, SavedSWOT } from '@/hooks/entrpTypes'
import { CopyButton } from '@/components/Copybutton'

type Props = {
  idea: string
  conceptStatement: string
  notes: string
  onNotesChange: (v: string) => void
  onGenerateSWOT: () => void
  isLoading: boolean
  errorMessage: string | null

  savedSWOTs: SavedSWOT[]
  savedSWOTsLoading: boolean
  selectedSwotId: string | null
  onSelectSavedSWOT: (id: string) => void

  swot: SWOTGuidance | null
  onContinue: () => void
  limitedUntil: number | null
  countdown: string
}

/** Turns a heading + list of items into pasteable plain text. */
const toCopyText = (heading: string, items: string[]) =>
  `${heading}\n${items.map((s) => `- ${s}`).join('\n')}`

export function SWOTStage({
  idea,
  conceptStatement,
  notes,
  onNotesChange,
  onGenerateSWOT,
  isLoading,
  errorMessage,
  savedSWOTs,
  savedSWOTsLoading,
  selectedSwotId,
  onSelectSavedSWOT,
  swot,
  onContinue,
  limitedUntil,
  countdown
}: Props) {
  const isLimited = !!limitedUntil

  return (
    <div className="rounded-xl border bg-white p-6 space-y-5" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: '#FAEEDA' }}>
          <ShieldCheck className="w-4 h-4" style={{ color: '#BA7517' }} />
        </div>
        <div>
          <h2 className="font-semibold text-lg leading-tight">SWOT Analysis</h2>
          <p className="text-xs text-muted-foreground">
            Strengths, weaknesses, opportunities, and threats — based on your finalized concept.
          </p>
        </div>
      </div>

      {conceptStatement && (
        <div className="rounded-lg px-3.5 py-2.5" style={{ background: 'rgba(11,28,51,0.04)' }}>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">
            Analyzing concept
          </p>
          <p className="text-sm font-medium leading-relaxed" style={{ color: '#0B1C33' }}>
            {conceptStatement}
          </p>
        </div>
      )}

      <div className="space-y-1.5">
        <label className="text-sm font-medium">
          Your rough SWOT notes <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        <textarea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="e.g. I think our biggest strength is knowing local suppliers personally, but I'm worried about bigger competitors..."
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
        onClick={onGenerateSWOT}
        disabled={!idea.trim() || !conceptStatement.trim() || isLoading || isLimited}
        className="inline-flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ background: '#F5B841', color: '#1A1A1A' }}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Analyzing...
          </>
        ) : isLimited ? (
          <>
            <Sparkles className="w-4 h-4" />
            Daily limit reached
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            Generate SWOT Analysis
          </>
        )}
      </button>

      {!conceptStatement.trim() && (
        <p className="text-xs" style={{ color: '#633806' }}>
          Complete the Business Concept stage first to carry over a concept statement.
        </p>
      )}

      {/* ── Result ── */}
      {swot && (
        <div className="pt-4 space-y-5 border-t" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
          {selectedSwotId && (
            <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: '#633806' }}>
              <History className="w-3.5 h-3.5" />
              Viewing a saved analysis from your history
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-3">
            <div className="rounded-lg px-3.5 py-3 space-y-1.5" style={{ background: '#EAF3DE' }}>
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#27500A' }}>Strengths</p>
                <CopyButton text={toCopyText('Strengths', swot.strengths)} title="Copy strengths" />
              </div>
              <ul className="space-y-1">
                {swot.strengths.map((s, i) => (
                  <li key={i} className="text-sm leading-relaxed">{s}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg px-3.5 py-3 space-y-1.5" style={{ background: '#FBEAEA' }}>
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#7A2020' }}>Weaknesses</p>
                <CopyButton text={toCopyText('Weaknesses', swot.weaknesses)} title="Copy weaknesses" />
              </div>
              <ul className="space-y-1">
                {swot.weaknesses.map((s, i) => (
                  <li key={i} className="text-sm leading-relaxed">{s}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg px-3.5 py-3 space-y-1.5" style={{ background: '#E7F0FA' }}>
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#1D5490' }}>Opportunities</p>
                <CopyButton text={toCopyText('Opportunities', swot.opportunities)} title="Copy opportunities" />
              </div>
              <ul className="space-y-1">
                {swot.opportunities.map((s, i) => (
                  <li key={i} className="text-sm leading-relaxed">{s}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg px-3.5 py-3 space-y-1.5" style={{ background: '#FAEEDA' }}>
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#BA7517' }}>Threats</p>
                <CopyButton text={toCopyText('Threats', swot.threats)} title="Copy threats" />
              </div>
              <ul className="space-y-1">
                {swot.threats.map((s, i) => (
                  <li key={i} className="text-sm leading-relaxed">{s}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                SO Strategies <span className="normal-case font-normal">(Strengths + Opportunities)</span>
              </p>
              <CopyButton
                text={toCopyText('SO Strategies (Strengths + Opportunities)', swot.soStrategies)}
                label="Copy all"
                title="Copy SO strategies"
              />
            </div>
            <ul className="space-y-1.5">
              {swot.soStrategies.map((s, i) => (
                <li key={i} className="text-sm rounded-lg px-3 py-2" style={{ background: 'rgba(11,28,51,0.04)' }}>
                  {s}
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                WO Strategies <span className="normal-case font-normal">(Weaknesses + Opportunities)</span>
              </p>
              <CopyButton
                text={toCopyText('WO Strategies (Weaknesses + Opportunities)', swot.woStrategies)}
                label="Copy all"
                title="Copy WO strategies"
              />
            </div>
            <ul className="space-y-1.5">
              {swot.woStrategies.map((s, i) => (
                <li key={i} className="text-sm rounded-lg px-3 py-2" style={{ background: 'rgba(11,28,51,0.04)' }}>
                  {s}
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                ST Contingencies <span className="normal-case font-normal">(Strengths + Threats)</span>
              </p>
              <CopyButton
                text={toCopyText('ST Contingencies (Strengths + Threats)', swot.stContingencies)}
                label="Copy all"
                title="Copy ST contingencies"
              />
            </div>
            <ul className="space-y-1.5">
              {swot.stContingencies.map((s, i) => (
                <li key={i} className="text-sm rounded-lg px-3 py-2" style={{ background: 'rgba(11,28,51,0.04)' }}>
                  {s}
                </li>
              ))}
            </ul>
          </div>

          <button
            onClick={onContinue}
            className="cursor-pointer inline-flex items-center gap-1.5 text-sm font-semibold hover:text-[#003887] transition-colors"
            style={{ color: '#0B1C33' }}
          >
            Continue to Market Research
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}