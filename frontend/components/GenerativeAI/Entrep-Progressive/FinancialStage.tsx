'use client'
import {
  Sparkles,
  Loader2,
  History,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Receipt,
  Landmark,
  LineChart,
  ListChecks,
  FileText,
} from 'lucide-react'
import type { FinancialGuidance, SavedFinancial } from '@/hooks/entrpTypes'

type Props = {
  idea: string
  conceptStatement: string
  notes: string
  onNotesChange: (v: string) => void
  onGenerateFinancial: () => void
  isLoading: boolean
  errorMessage: string | null

  savedFinancials: SavedFinancial[]
  savedFinancialsLoading: boolean
  selectedFinancialId: string | null
  onSelectSavedFinancial: (id: string) => void

  financial: FinancialGuidance | null
}

export function FinancialStage({
  idea,
  conceptStatement,
  notes,
  onNotesChange,
  onGenerateFinancial,
  isLoading,
  errorMessage,
  savedFinancials,
  savedFinancialsLoading,
  selectedFinancialId,
  onSelectSavedFinancial,
  financial,
}: Props) {
  return (
    <div className="rounded-xl border bg-white p-6 space-y-5" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: '#FAEEDA' }}>
        </div>
        <div>
          <h2 className="font-semibold text-lg leading-tight">Financial Plan</h2>
          <p className="text-xs text-muted-foreground">
            The final stage — AI pulls together pricing, funding, and viability for your full plan.
          </p>
        </div>
      </div>

      {conceptStatement && (
        <div className="rounded-lg px-3.5 py-2.5" style={{ background: 'rgba(11,28,51,0.04)' }}>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">
            Evaluating finances for
          </p>
          <p className="text-sm font-medium leading-relaxed" style={{ color: '#0B1C33' }}>
            {conceptStatement}
          </p>
        </div>
      )}

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Rough financial notes (optional)</label>
        <textarea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="e.g. Any cost estimates, pricing ideas, or funding thoughts you already have..."
          rows={4}
          className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-amber-400 bg-muted/30 resize-none"
          style={{ borderColor: 'rgba(0,0,0,0.12)' }}
        />
      </div>

      {errorMessage && !financial && (
        <div className="rounded-lg px-3 py-2 text-xs font-medium" style={{ background: '#FBEAEA', color: '#7A2020' }}>
          {errorMessage}
        </div>
      )}

      <button
        onClick={onGenerateFinancial}
        disabled={!idea.trim() || !conceptStatement.trim() || isLoading}
        className="inline-flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ background: '#F5B841', color: '#1A1A1A' }}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Evaluating...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            Generate Financial Plan
          </>
        )}
      </button>

      {!conceptStatement.trim() && (
        <p className="text-xs" style={{ color: '#633806' }}>
          Complete the Business Concept stage first to carry over a concept statement.
        </p>
      )}

      {/* ── Result ── */}
      {financial && (
        <div className="pt-4 space-y-5 border-t" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
          {selectedFinancialId && (
            <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: '#633806' }}>
              <History className="w-3.5 h-3.5" />
              Viewing a saved plan from your history
            </div>
          )}

          {financial.startupCostCategories && financial.startupCostCategories.length > 0 && (
            <div className="rounded-lg px-3.5 py-3" style={{ background: 'rgba(11,28,51,0.04)' }}>
              <div className="flex items-center gap-1.5 mb-2">
                <Receipt className="w-3.5 h-3.5 text-muted-foreground" />
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Startup cost categories
                </p>
              </div>
              <div className="space-y-2.5">
                {financial.startupCostCategories.map((c, i) => (
                  <div key={i} className="rounded-lg bg-white border px-3 py-2.5" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
                    <p className="text-sm font-semibold" style={{ color: '#0B1C33' }}>{c.category}</p>
                    {c.examples && c.examples.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-0.5">{c.examples.join(' · ')}</p>
                    )}
                    {c.note && <p className="text-sm leading-relaxed mt-1.5">{c.note}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-lg px-3.5 py-3" style={{ background: '#FAEEDA' }}>
            <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: '#BA7517' }}>
              Pricing strategy
            </p>
            <p className="text-sm leading-relaxed">{financial.pricingStrategy}</p>
          </div>

          {financial.revenueModelNote && (
            <div className="rounded-lg px-3.5 py-3 flex gap-2" style={{ background: 'rgba(11,28,51,0.04)' }}>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide mb-1 text-muted-foreground">
                  Revenue model
                </p>
                <p className="text-sm leading-relaxed">{financial.revenueModelNote}</p>
              </div>
            </div>
          )}

          <div className="rounded-lg px-3.5 py-3" style={{ background: 'rgba(11,28,51,0.04)' }}>
            <p className="text-xs font-semibold uppercase tracking-wide mb-1 text-muted-foreground">
              Viability summary
            </p>
            <p className="text-sm leading-relaxed">{financial.viabilitySummary}</p>
          </div>

          <div className="rounded-lg px-3.5 py-3 flex gap-2" style={{ background: '#EAF3DE' }}>
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#3B6D11' }} />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: '#27500A' }}>
                Break-even estimate
              </p>
              <p className="text-sm leading-relaxed">{financial.breakEvenNote}</p>
            </div>
          </div>

          {financial.fundingOptions && financial.fundingOptions.length > 0 && (
            <div className="rounded-lg px-3.5 py-3" style={{ background: 'rgba(11,28,51,0.04)' }}>
              <div className="flex items-center gap-1.5 mb-2">
                <Landmark className="w-3.5 h-3.5 text-muted-foreground" />
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Funding options
                </p>
              </div>
              <div className="space-y-2">
                {financial.fundingOptions.map((f, i) => (
                  <div key={i} className="rounded-lg bg-white border px-3 py-2.5" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
                    <p className="text-sm font-semibold" style={{ color: '#0B1C33' }}>{f.source}</p>
                    <p className="text-sm leading-relaxed mt-0.5">{f.fitNote}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {financial.keyMetricsToTrack && financial.keyMetricsToTrack.length > 0 && (
            <div className="rounded-lg px-3.5 py-3 flex gap-2" style={{ background: 'rgba(11,28,51,0.04)' }}>
              <LineChart className="w-4 h-4 shrink-0 mt-0.5 text-muted-foreground" />
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Key metrics to track
                </p>
                <ul className="text-sm leading-relaxed list-disc pl-4 space-y-0.5">
                  {financial.keyMetricsToTrack.map((metric, i) => (
                    <li key={i}>{metric}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {financial.riskFlags && financial.riskFlags.length > 0 && (
            <div className="rounded-lg px-3.5 py-3 flex gap-2" style={{ background: '#FBEAEA' }}>
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#B23B3B' }} />
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#7A2020' }}>
                  Risk flags
                </p>
                <ul className="text-sm leading-relaxed list-disc pl-4 space-y-0.5">
                  {financial.riskFlags.map((flag, i) => (
                    <li key={i}>{flag}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {financial.thirtyDayActionPlan && financial.thirtyDayActionPlan.length > 0 && (
            <div className="rounded-lg px-3.5 py-3 flex gap-2" style={{ background: '#EAF3DE' }}>
              <ListChecks className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#3B6D11' }} />
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#27500A' }}>
                  30-day action plan
                </p>
                <ol className="text-sm leading-relaxed list-decimal pl-4 space-y-0.5">
                  {financial.thirtyDayActionPlan.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>
              </div>
            </div>
          )}

          {financial.recommendation && (
            <div className="rounded-lg px-3.5 py-3 flex gap-2" style={{ background: 'rgba(11,28,51,0.04)' }}>
              <ArrowRight className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#0B1C33' }} />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide mb-1 text-muted-foreground">
                  Recommendation
                </p>
                <p className="text-sm leading-relaxed">{financial.recommendation}</p>
              </div>
            </div>
          )}

          {financial.closingSummary && (
            <div className="rounded-lg px-3.5 py-3 flex gap-2" style={{ background: '#FAEEDA', borderColor: 'rgba(0,0,0,0.08)' }}>
              <FileText className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#BA7517' }} />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: '#BA7517' }}>
                  Closing summary
                </p>
                <p className="text-sm leading-relaxed">{financial.closingSummary}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}