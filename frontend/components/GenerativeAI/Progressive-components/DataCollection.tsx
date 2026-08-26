'use client'
import { DataAnalysisResult, MethodologyApproach, SavedDataAnalysis } from '@/hooks/types'
import {
  Database,
  Loader2,
  Sparkles,
  History,
  ArrowRight,
  ClipboardCheck,
  BarChart3,
  MessageCircleQuestion,
  Plus,
  X,
} from 'lucide-react'

const APPROACHES: { value: MethodologyApproach; label: string }[] = [
  { value: 'qualitative', label: 'Qualitative' },
  { value: 'quantitative', label: 'Quantitative' },
  { value: 'mixed_methods', label: 'Mixed Methods' },
]

type Props = {
  topic: string

  approach: MethodologyApproach | ''
  onApproachChange: (a: MethodologyApproach) => void

  researchQuestions: string[]
  researchQuestionInput: string
  onResearchQuestionInputChange: (v: string) => void
  onAddResearchQuestion: () => void
  onRemoveResearchQuestion: (index: number) => void

  gapStatement: string
  onGapStatementChange: (v: string) => void
  rawFindings: string
  onRawFindingsChange: (v: string) => void

  onGenerate: () => void
  isLoading: boolean
  errorMessage: string | null

  result: DataAnalysisResult | null

  history: SavedDataAnalysis[]
  historyLoading: boolean
  historyTotal: number
  hasMore: boolean
  onLoadMore: () => void
  selectedId: string | null
  onSelectSaved: (id: string) => void

  onContinue: () => void
}

export function DataCollectionStage({
  topic,
  approach,
  onApproachChange,
  researchQuestions,
  researchQuestionInput,
  onResearchQuestionInputChange,
  onAddResearchQuestion,
  onRemoveResearchQuestion,
  gapStatement,
  onGapStatementChange,
  rawFindings,
  onRawFindingsChange,
  onGenerate,
  isLoading,
  errorMessage,
  result,
  historyLoading,
  hasMore,
  onLoadMore,
  selectedId,
  onContinue,
}: Props) {
  const canGenerate = !!topic.trim() && !!approach && researchQuestions.length > 0 && !!rawFindings.trim()

  return (
    <div className="rounded-xl border bg-white p-6 space-y-5" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: '#FAEEDA' }}>
          <Database className="w-4 h-4" style={{ color: '#BA7517' }} />
        </div>
        <div>
          <h2 className="font-semibold text-lg leading-tight">Data Collection &amp; Analysis</h2>
          <p className="text-xs text-muted-foreground">
            Bring your raw findings — AI suggests a cleaning checklist, analysis method, and charts to run.
          </p>
        </div>
      </div>

      {topic && (
        <div className="rounded-lg px-3.5 py-2.5" style={{ background: 'rgba(11,28,51,0.04)' }}>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">
            Collecting Data & Analysis for
          </p>
          <p className="text-sm font-medium" style={{ color: '#0B1C33' }}>
            {topic}
          </p>
        </div>
      )}

      {/* ── Saved history (passive) ──
          Selection is now automatic: useProgressiveTrial matches the current
          topic against dataAnalysisHistory and sets selectedId itself, the
          same way it already does for Topic/Literature/Methodology. This
          card is just a quiet status line — nothing here is clickable.
          onSelectSaved / onLoadMore / hasMore are still accepted as props
          (kept for the "Load more" affordance below and to avoid changing
          the parent's call signature) but there is no manual picker. */}
      {historyLoading && !selectedId && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground px-1 py-1">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Checking for a saved analysis on this topic...
        </div>
      )}

      {hasMore && (
        <button
          onClick={onLoadMore}
          disabled={historyLoading}
          className="text-xs font-semibold disabled:opacity-50"
          style={{ color: '#BA7517' }}
        >
          {historyLoading ? 'Loading...' : 'Load more history'}
        </button>
      )}

      {/* ── Form ── */}
      <div className="space-y-4 pt-2 border-t" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Methodological approach</p>
          <div className="flex flex-wrap gap-2">
            {APPROACHES.map((a) => (
              <button
                key={a.value}
                onClick={() => onApproachChange(a.value)}
                className="rounded-full px-3 py-1.5 text-xs font-semibold border transition-colors"
                style={{
                  borderColor: approach === a.value ? '#BA7517' : 'rgba(0,0,0,0.08)',
                  background: approach === a.value ? '#FAEEDA' : '#FFFFFF',
                  color: approach === a.value ? '#BA7517' : '#444441',
                }}
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Research questions</p>
          <div className="flex gap-2">
            <input
              value={researchQuestionInput}
              onChange={(e) => onResearchQuestionInputChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  onAddResearchQuestion()
                }
              }}
              placeholder="Type a research question and press Enter"
              className="flex-1 rounded-lg border px-3 py-2 text-sm outline-none focus:border-amber-500"
              style={{ borderColor: 'rgba(0,0,0,0.12)' }}
            />
            <button
              onClick={onAddResearchQuestion}
              className="inline-flex items-center justify-center rounded-lg px-3 border shrink-0"
              style={{ borderColor: 'rgba(0,0,0,0.12)' }}
              title="Add question"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          {researchQuestions.length > 0 && (
            <ul className="space-y-1.5 pt-1">
              {researchQuestions.map((q, i) => (
                <li
                  key={i}
                  className="flex items-start justify-between gap-2 text-sm rounded-lg px-3 py-2"
                  style={{ background: 'rgba(11,28,51,0.04)' }}
                >
                  <span className="leading-snug">{i + 1}. {q}</span>
                  <button onClick={() => onRemoveResearchQuestion(i)} className="shrink-0 text-muted-foreground hover:text-red-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Research gap
            {/* <span className="normal-case font-normal">(optional, from your Literature Review)</span> */}
          </p>
          <textarea
            value={gapStatement}
            onChange={(e) => onGapStatementChange(e.target.value)}
            placeholder="e.g. Prior studies haven't examined..."
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-amber-500"
            style={{ borderColor: 'rgba(0,0,0,0.12)' }}
            rows={1}
          />
        </div>

        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Raw findings / data notes</p>
          <textarea
            value={rawFindings}
            onChange={(e) => onRawFindingsChange(e.target.value)}
            placeholder="Paste or describe your raw data, survey responses, interview notes, etc."
            rows={5}
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-amber-500 resize-y"
            style={{ borderColor: 'rgba(0,0,0,0.12)' }}
          />
        </div>

        {errorMessage && !result && (
          <div className="rounded-lg px-3 py-2 text-xs font-medium" style={{ background: '#FBEAEA', color: '#7A2020' }}>
            {errorMessage}
          </div>
        )}

        <button
          onClick={onGenerate}
          disabled={!canGenerate || isLoading}
          className="inline-flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: '#F5B841', color: '#1A1A1A' }}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generate Analysis Plan
            </>
          )}
        </button>
      </div>

      {/* ── Result ── */}
      {result && (
        <div className="pt-4 space-y-5 border-t" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
          {selectedId && (
            <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: '#633806' }}>
              <History className="w-3.5 h-3.5" />
              Viewing a saved analysis from your history
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <ClipboardCheck className="w-3.5 h-3.5" style={{ color: '#BA7517' }} />
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Data cleaning checklist</p>
            </div>
            <ul className="space-y-1.5">
              {result.dataCleaningChecklist.map((item, i) => (
                <li key={i} className="text-sm rounded-lg px-3 py-2" style={{ background: 'rgba(11,28,51,0.04)' }}>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg px-3.5 py-3" style={{ background: '#FAEEDA' }}>
            <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: '#BA7517' }}>
              {result.analysisMethod}
            </p>
            <p className="text-sm leading-relaxed mb-2" style={{ color: '#1A1A1A' }}>{result.analysisRationale}</p>
            <ol className="space-y-1 list-decimal list-inside">
              {result.analysisSteps.map((step, i) => (
                <li key={i} className="text-sm" style={{ color: '#1A1A1A' }}>{step}</li>
              ))}
            </ol>
          </div>

          {result.literatureConnectionPrompts?.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <MessageCircleQuestion className="w-3.5 h-3.5" style={{ color: '#BA7517' }} />
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Connect back to your research gap
                </p>
              </div>
              <ul className="space-y-1.5">
                {result.literatureConnectionPrompts.map((p, i) => (
                  <li key={i} className="text-sm italic text-muted-foreground rounded-lg border px-3 py-2" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Results summary (template)</p>
            <p className="text-sm leading-relaxed">{result.resultsSummary}</p>
          </div>

          {result.visualizations?.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5" style={{ color: '#BA7517' }} />
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Suggested visualizations</p>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                {result.visualizations.map((v, i) => (
                  <div key={i} className="rounded-lg border p-3 space-y-1" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold">{v.title}</p>
                      <span className="text-[10px] font-semibold uppercase rounded-full px-2 py-0.5" style={{ background: '#FAEEDA', color: '#BA7517' }}>
                        {v.chartType}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{v.description}</p>
                    <p className="text-xs leading-relaxed" style={{ color: '#0B1C33' }}>{v.whatItShows}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button onClick={onContinue} className="inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: '#0B1C33' }}>
            Continue Paper Review
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}