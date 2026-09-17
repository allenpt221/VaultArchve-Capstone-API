'use client'
import { APPROACH_STYLES, MAX_RESEARCH_QUESTIONS, MIN_RESEARCH_QUESTIONS } from '@/hooks/constants';
import { MethodologyResult } from '@/hooks/types';
import { FlaskConical, Sparkles, Loader2, History, Clock, Plus, X, ArrowRight, CheckCircle2, Link2 } from 'lucide-react'
import Link from 'next/link';

type SavedMethodology = { id: string; topic: string; created_at: string }

type Props = {
  topic: string

  savedMethodologies: SavedMethodology[]
  savedMethodologiesLoading: boolean
  selectedMethodologyId: string | null
  onSelectSavedMethodology: (id: string) => void

  objective: string
  onObjectiveChange: (v: string) => void

  researchQuestions: string[]
  researchQuestionInput: string
  onResearchQuestionInputChange: (v: string) => void
  onAddResearchQuestion: () => void
  onRemoveResearchQuestion: (index: number) => void

  context: string
  onContextChange: (v: string) => void

  onGenerateMethodology: () => void
  isLoading: boolean
  errorMessage: string | null

  methodology: MethodologyResult | null
  onContinue: () => void
}

export function MethodologyStage({
  topic,
  selectedMethodologyId,
  objective,
  onObjectiveChange,
  researchQuestions,
  researchQuestionInput,
  onResearchQuestionInputChange,
  onAddResearchQuestion,
  onRemoveResearchQuestion,
  context,
  onContextChange,
  onGenerateMethodology,
  isLoading,
  errorMessage,
  methodology,
  onContinue,
}: Props) {

  const safeObjective = objective ?? ''

  const canGenerate =
    safeObjective.trim().length > 0 &&
    researchQuestions.length >= MIN_RESEARCH_QUESTIONS &&
    !isLoading

  return (
    <div className="rounded-2xl border bg-white p-6 space-y-5 shadow-sm" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: '#FAEEDA' }}>
          <FlaskConical className="w-4 h-4" style={{ color: '#BA7517' }} />
        </div>
        <div>
          <h2 className="font-semibold text-lg leading-tight tracking-tight" style={{ color: '#0B1C33' }}>
            Methodology
          </h2>
          <p className="text-xs text-muted-foreground">
            List your objective and research questions, and AI will design a methodology mapped to each one.
          </p>
        </div>
      </div>

      {topic && (
        <div
          className="rounded-xl px-3.5 py-2.5 border"
          style={{ background: 'rgba(11,28,51,0.03)', borderColor: 'rgba(11,28,51,0.08)' }}
        >
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">
            Designing methodology for
          </p>
          <p className="text-sm font-medium" style={{ color: '#0B1C33' }}>
            {topic}
          </p>
        </div>
      )}

      {/* ── General objective ── */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">
          General objective <span className="text-muted-foreground font-normal">(required)</span>
        </label>
        <textarea
          value={safeObjective}
          onChange={(e) => onObjectiveChange(e.target.value)}
          placeholder="e.g. This study aims to determine the effectiveness of..."
          rows={2}
          className="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-100 focus:border-amber-400 bg-white resize-none transition-shadow"
          style={{ borderColor: 'rgba(0,0,0,0.12)' }}
        />
        {safeObjective.trim().length === 0 && (
          <p className="text-xs" style={{ color: '#633806' }}>
            Add a general objective — it grounds the approach decision alongside your research questions.
          </p>
        )}
      </div>

      {/* ── Research question builder ── */}
      <div className="rounded-xl border p-4 space-y-3 shadow-sm" style={{ borderColor: 'rgba(0,0,0,0.1)', background: 'rgba(11,28,51,0.02)' }}>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Research questions</p>

        <div className="flex gap-2">
          <textarea
            value={researchQuestionInput}
            onChange={(e) => onResearchQuestionInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                onAddResearchQuestion()
              }
              // Shift + Enter is allowed to create a new line
            }}
            rows={1}
            placeholder="e.g. How does mobile learning affect senior high school students' test scores?"
            className="w-full flex-1 rounded-xl border px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-100 focus:border-amber-400 bg-white transition-shadow"
            style={{ borderColor: 'rgba(0,0,0,0.12)' }}
          />
          <button
            onClick={onAddResearchQuestion}
            disabled={!researchQuestionInput.trim() || researchQuestions.length >= MAX_RESEARCH_QUESTIONS}
            className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold shrink-0 shadow-sm transition-transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
            style={{ background: '#0B1C33', color: '#FFFFFF' }}
          >
            <Plus className="w-3.5 h-3.5" />
            Insert
          </button>
        </div>

        {researchQuestions.length > 0 && (
          <ul className="space-y-1.5">
            {researchQuestions.map((q, i) => (
              <li
                key={i}
                className="flex items-start justify-between gap-3 rounded-xl border px-3 py-2 text-sm bg-white hover:border-gray-200 transition-colors"
                style={{ borderColor: 'rgba(0,0,0,0.08)' }}
              >
                <span className="min-w-0">
                  <span className="font-semibold mr-1.5" style={{ color: '#BA7517' }}>
                    {i + 1}.
                  </span>
                  {q}
                </span>
                <button onClick={() => onRemoveResearchQuestion(i)} className="shrink-0 text-muted-foreground hover:text-red-600 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}

        {researchQuestions.length < MIN_RESEARCH_QUESTIONS && (
          <p className="text-xs" style={{ color: '#633806' }}>
            Add at least one research question to generate a methodology.
          </p>
        )}
        {researchQuestions.length >= MAX_RESEARCH_QUESTIONS && (
          <p className="text-xs text-muted-foreground">Maximum of {MAX_RESEARCH_QUESTIONS} research questions.</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">
          Additional context <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        <textarea
          value={context}
          onChange={(e) => onContextChange(e.target.value)}
          placeholder="Constraints, setting, timeframe, or anything else that should shape the methodology..."
          rows={3}
          className="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-100 focus:border-amber-400 bg-muted/30 resize-none transition-shadow"
          style={{ borderColor: 'rgba(0,0,0,0.12)' }}
        />
      </div>

      {errorMessage && !methodology && (
        <div className="rounded-lg px-3.5 py-2.5 text-xs font-medium" style={{ background: '#FBEAEA', color: '#7A2020' }}>
          {errorMessage}
        </div>
      )}

      <button
        onClick={onGenerateMethodology}
        disabled={!canGenerate}
        className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm transition-transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
        style={{ background: '#F5B841', color: '#1A1A1A' }}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Designing...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            Generate Methodology
          </>
        )}
      </button>

      {/* ── Methodology result ── */}
      {methodology && (
        <div className="pt-4 space-y-5 border-t" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
          {selectedMethodologyId && (
            <div
              className="flex items-center gap-1.5 text-xs font-medium w-fit px-3 py-1.5 rounded-full"
              style={{ color: '#8A5A00', backgroundColor: '#FDF3E3' }}
            >
              <History className="w-3.5 h-3.5" />
              Viewing a saved methodology from your history
            </div>
          )}

          <div className="flex items-start justify-between gap-3 flex-wrap rounded-xl border border-gray-100 p-4 bg-white shadow-sm">
            <p className="text-sm leading-relaxed flex-1 min-w-[200px]">{methodology.approachRationale}</p>
            <span
              className="text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap"
              style={{
                background: APPROACH_STYLES[methodology.approach].bg,
                color: APPROACH_STYLES[methodology.approach].color,
              }}
            >
              {APPROACH_STYLES[methodology.approach].label}
            </span>
          </div>

          {/* Population & sampling */}
          <div className="rounded-xl px-4 py-3.5 space-y-2 shadow-sm" style={{ background: '#FAEEDA' }}>
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#BA7517' }}>
              Population &amp; sampling
            </p>

            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs font-semibold text-muted-foreground">Target population</p>
                <p className="leading-relaxed">{methodology.population.targetPopulation}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground">Sampling method</p>
                <p className="leading-relaxed">{methodology.population.samplingMethod}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs font-semibold text-muted-foreground">Sample size justification</p>
                <p className="leading-relaxed">{methodology.population.sampleSizeJustification}</p>
              </div>
            </div>
            {methodology.population.inclusionCriteria?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1">Inclusion criteria</p>
                <ul className="space-y-1">
                  {methodology.population.inclusionCriteria.map((c, i) => (
                    <li key={i} className="text-sm flex gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: '#3B6D11' }} />
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Instruments */}
          {methodology.instruments?.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Instruments &amp; validity
              </p>
              <div className="space-y-2">
                {methodology.instruments.map((inst, i) => (
                  <div
                    key={i}
                    className="rounded-xl border p-3.5 space-y-1 hover:border-gray-200 transition-colors"
                    style={{ borderColor: 'rgba(0,0,0,0.08)' }}
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <p className="text-sm font-semibold">{inst.name}</p>
                      <span className="text-xs text-muted-foreground">{inst.type}</span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{inst.purpose}</p>
                    <p className="text-xs leading-relaxed">
                      <span className="font-semibold">Validity: </span>
                      {inst.validityConsiderations}
                    </p>
                    {inst.researchQuestionNumbers?.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Addresses RQ{inst.researchQuestionNumbers.length > 1 ? 's' : ''}:{' '}
                        {inst.researchQuestionNumbers.join(', ')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Data collection / analysis */}
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="rounded-xl border border-gray-100 p-4 space-y-1.5 bg-white shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Data collection plan</p>
              <p className="text-sm leading-relaxed">{methodology.dataCollectionPlan}</p>
            </div>
            <div className="rounded-xl border border-gray-100 p-4 space-y-1.5 bg-white shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Data analysis plan</p>
              <p className="text-sm leading-relaxed">{methodology.dataAnalysisPlan}</p>
            </div>
          </div>

          {/* Question mapping artifact */}
          {methodology.questionMapping?.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Methodology mapped to each research question
              </p>
              <div className="space-y-2">
                {methodology.questionMapping.map((row, i) => (
                  <div
                    key={i}
                    className="rounded-xl border px-4 py-3 hover:border-gray-200 transition-colors"
                    style={{ borderColor: 'rgba(0,0,0,0.08)' }}
                  >
                    <p className="text-sm font-medium mb-1">
                      <span style={{ color: '#BA7517' }}>RQ{row.researchQuestionNumber}.</span> {row.researchQuestion}
                    </p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>
                        <span className="font-semibold">Approach:</span> {row.approach}
                      </span>
                      <span>
                        <span className="font-semibold">Instrument:</span> {row.instrument}
                      </span>
                      <span>
                        <span className="font-semibold">Analysis:</span> {row.analysisMethod}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Limitations */}
          {methodology.limitations.length > 0 && (
            <div className="rounded-xl border border-gray-100 p-4 space-y-2 bg-white shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Limitations</p>
              <ul className="space-y-1.5">
                {methodology.limitations.map((l, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex gap-2">
                    <span style={{ color: '#BA7517' }}>•</span>
                    {l}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* References */}
          {methodology.references?.length > 0 && (
            <div className="rounded-xl border border-gray-100 p-4 space-y-2 bg-white shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Sources referenced
              </p>
              <ul className="space-y-2">
                {methodology.references.map((ref, i) => (
                  <li key={i} className="text-sm flex gap-2">
                    <Link2 className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: '#BA7517' }} />
                    <span>
                      
                      <Link  href={ref.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium underline hover:opacity-80"
                        style={{ color: '#0B1C33' }}
                      >
                        {ref.title}
                      </Link>
                      {ref.relevance && (
                        <span className="text-muted-foreground"> — {ref.relevance}</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            onClick={onContinue}
            className="inline-flex items-center gap-1.5 text-sm font-semibold hover:opacity-80 transition-opacity"
            style={{ color: '#0B1C33' }}
          >
            Continue to Data Collection & Analysis
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}