'use client'
import { Target, Sparkles, Loader2, History, ArrowRight } from 'lucide-react'
import type { SuggestedObjectivesResult } from '@/hooks/types'
import { CopyButton } from '@/components/Copybutton'

/**
 * Shape returned by the saved-objectives endpoint (snake_case, straight from
 * the API). Move this into '@/hooks/types' if you'd rather keep all types there.
 */
export interface SavedObjectivesItem {
  id: string
  user_id: string
  topic: string
  context: string | null
  general_objective: string
  general_objective_rationale?: string | null
  specific_objectives: string[]
  objective_rationale?: string[] | null
  suggested_variables?: string[] | null
  scope_considerations?: string[] | null
  research_considerations?: string[] | null
  created_at: string
  updated_at: string
}

export interface SavedObjectivesResponse {
  objectives: SavedObjectivesItem[]
  total: number
  limit: number
  offset: number
}

/** Max saved objective sets shown in the history list (newest first). */
export const MAX_SAVED_OBJECTIVES = 5

/** snake_case API row -> the camelCase shape the result block renders. */
export function toSuggestedObjectives(s: SavedObjectivesItem): SuggestedObjectivesResult {
  return {
    generalObjective: s.general_objective,
    generalObjectiveRationale: s.general_objective_rationale ?? undefined,
    specificObjectives: s.specific_objectives ?? [],
    objectiveRationale: s.objective_rationale ?? [],
    suggestedVariables: s.suggested_variables ?? [],
    scopeConsiderations: s.scope_considerations ?? [],
    researchConsiderations: s.research_considerations ?? [],
  } as SuggestedObjectivesResult
}

function formatSavedDate(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })
}

function buildObjectivesText(r: SuggestedObjectivesResult): string {
  const lines = ['General Objective', r.generalObjective]
  if (r.specificObjectives?.length > 0) {
    lines.push('', 'Specific Objectives', ...r.specificObjectives.map((o, i) => `${i + 1}. ${o}`))
  }
  return lines.join('\n')
}

interface ObjectivesSuggestionPanelProps {
  topic: string
  context: string
  onContextChange: (v: string) => void

  onGenerate: () => void
  isLoading: boolean
  errorMessage?: string | null

  objectives: SuggestedObjectivesResult | null
  // Set automatically when a saved item is selected; can still be forced
  // from the hook if it tracks its own saved-selection state.
  viewingSaved?: boolean

  // ── Saved objectives history (GET response: { objectives, total, ... }) ──
  savedObjectives?: SavedObjectivesItem[]
  savedTotal?: number
  isLoadingSaved?: boolean
  selectedSavedId?: string | null
  onSelectSaved?: (id: string | null) => void

  onContinue: () => void

  limitedUntil: number | null
  countdown: string
}

/**
 * Objectives stage. Lets a student generate a General Objective + Specific
 * Objectives from their topic (via ObjectivesAI / POST /ai/objectives)
 * instead of writing the Objectives of the Study section from scratch,
 * then continue to the next stage.
 *
 * Previously generated sets (saved history) are listed under the generate
 * button; picking one shows it in the same result block.
 *
 * All state (topic, loading, objectives, saved list, handlers) comes from
 * useProgressiveTrial — this component is presentational only.
 *
 * Styled to match MethodologyStage 1:1 — same shell, icon badge, topic
 * strip, context field, generate button, and result-block treatment.
 */
export function ObjectivesSuggestionPanel({
  topic,
  context,
  onContextChange,
  onGenerate,
  isLoading,
  errorMessage,
  objectives,
  viewingSaved,
  savedObjectives = [],
  savedTotal,
  isLoadingSaved = false,
  selectedSavedId = null,
  onSelectSaved,
  onContinue,
  limitedUntil,
  countdown
}: ObjectivesSuggestionPanelProps) {
  const canGenerate = topic.trim().length > 0 && !isLoading && !limitedUntil

  // Newest first, capped at MAX_SAVED_OBJECTIVES.
  const visibleSaved = [...savedObjectives]
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
    .slice(0, MAX_SAVED_OBJECTIVES)
  const totalSaved = Math.max(savedTotal ?? 0, savedObjectives.length)

  const selectedSaved = visibleSaved.find((s) => s.id === selectedSavedId) ?? null
  const result: SuggestedObjectivesResult | null = selectedSaved
    ? toSuggestedObjectives(selectedSaved)
    : objectives
  const isViewingSaved = !!selectedSaved || !!viewingSaved

  const handleGenerate = () => {
    // Leave the saved view so the fresh result is what shows up.
    onSelectSaved?.(null)
    onGenerate()
  }

  return (
    <div className="rounded-2xl border bg-white p-6 space-y-5 shadow-sm" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: '#FAEEDA' }}>
          <Target className="w-4 h-4" style={{ color: '#BA7517' }} />
        </div>
        <div>
          <h2 className="font-semibold text-lg leading-tight tracking-tight" style={{ color: '#0B1C33' }}>
            Objectives of the Study
          </h2>
          <p className="text-xs text-muted-foreground">
            Generate a general objective and five specific objectives from your topic.
          </p>
        </div>
      </div>

      {topic && (
        <div
          className="rounded-xl px-3.5 py-2.5 border"
          style={{ background: 'rgba(11,28,51,0.03)', borderColor: 'rgba(11,28,51,0.08)' }}
        >
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">
            Drafting objectives for
          </p>
          <p className="text-sm font-medium" style={{ color: '#0B1C33' }}>
            {topic}
          </p>
        </div>
      )}

      {!topic.trim() && (
        <p className="text-xs" style={{ color: '#633806' }}>
          Add a topic on the first stage before generating objectives.
        </p>
      )}

      {/* ── Additional context ── */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">
          Additional context <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        <textarea
          value={context}
          onChange={(e) => onContextChange(e.target.value)}
          placeholder="Constraints, target respondents, timeframe, or anything else that should shape the objectives..."
          rows={3}
          className="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-100 focus:border-amber-400 bg-muted/30 resize-none transition-shadow"
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
        onClick={handleGenerate}
        disabled={!canGenerate}
        className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm transition-transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
        style={{ background: '#F5B841', color: '#1A1A1A' }}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Generating...
          </>
        ) : limitedUntil ? (
          <>
            <Sparkles className="w-4 h-4" />
            Daily limit reached
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            {objectives || selectedSaved ? 'Regenerate Objectives' : 'Suggest Objectives'}
          </>
        )}
      </button>

      {/* ── Saved objectives history ── */}
      {(isLoadingSaved || visibleSaved.length > 0) && (
        <div className="pt-4 space-y-2.5 border-t" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Saved objectives
              {totalSaved > 0 && (
                <span className="ml-1.5 font-normal normal-case tracking-normal">
                  {totalSaved > visibleSaved.length
                    ? `(latest ${visibleSaved.length} of ${totalSaved})`
                    : `(${totalSaved})`}
                </span>
              )}
            </p>
            {isLoadingSaved && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />}
          </div>

          <div className="space-y-2">
            {visibleSaved.map((s) => {
              const isSelected = s.id === selectedSavedId
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => onSelectSaved?.(isSelected ? null : s.id)}
                  aria-pressed={isSelected}
                  className="w-full text-left rounded-xl border p-3.5 space-y-1 transition-colors hover:border-gray-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-100"
                  style={{
                    borderColor: isSelected ? '#F5B841' : 'rgba(0,0,0,0.08)',
                    background: isSelected ? '#FDF3E3' : '#FFFFFF',
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium leading-snug" style={{ color: '#0B1C33' }}>
                      {s.topic}
                    </p>
                    <span className="text-[11px] text-muted-foreground shrink-0 pt-0.5">
                      {formatSavedDate(s.created_at)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                    {s.general_objective}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {s.specific_objectives?.length ?? 0} specific objectives
                  </p>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Objectives result ── */}
      {result && (
        <div className="pt-4 space-y-5 border-t" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
          {isViewingSaved && (
            <div className="space-y-1.5">
              <div
                className="flex items-center gap-1.5 text-xs font-medium w-fit px-3 py-1.5 rounded-full"
                style={{ color: '#8A5A00', backgroundColor: '#FDF3E3' }}
              >
                <History className="w-3.5 h-3.5" />
                Viewing a saved objectives set from your history
              </div>
              {selectedSaved && selectedSaved.topic !== topic && (
                <p className="text-xs text-muted-foreground">
                  Saved for: <span style={{ color: '#0B1C33' }}>{selectedSaved.topic}</span>
                </p>
              )}
            </div>
          )}

          {/* General objective (+ rationale) */}
          <div className="rounded-xl border border-gray-100 p-4 space-y-1.5 bg-white shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm leading-relaxed">{result.generalObjective}</p>
              <CopyButton text={result.generalObjective} title="Copy general objective" />
            </div>
            {result.generalObjectiveRationale && (
              <p className="text-xs text-muted-foreground leading-relaxed">
                {result.generalObjectiveRationale}
              </p>
            )}
          </div>

          {/* Specific objectives (+ rationale) */}
          {result.specificObjectives?.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Specific objectives
              </p>
              <div className="space-y-2">
                {result.specificObjectives.map((o, i) => (
                  <div
                    key={i}
                    className="rounded-xl border p-3.5 space-y-1.5 hover:border-gray-200 transition-colors"
                    style={{ borderColor: 'rgba(0,0,0,0.08)' }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm leading-relaxed">
                        <span className="font-semibold mr-1.5" style={{ color: '#BA7517' }}>
                          {i + 1}.
                        </span>
                        {o}
                      </p>
                      <CopyButton text={o} title={`Copy specific objective ${i + 1}`} />
                    </div>
                    {result.objectiveRationale?.[i] && (
                      <p className="text-xs text-muted-foreground pl-5 leading-relaxed">
                        {result.objectiveRationale[i]}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggested variables */}
          {result.suggestedVariables?.length > 0 && (
            <div className="rounded-xl border border-gray-100 p-4 space-y-2 bg-white shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Suggested variables
              </p>
              <div className="flex flex-wrap gap-1.5">
                {result.suggestedVariables.map((v, i) => (
                  <span
                    key={i}
                    className="text-xs px-2.5 py-1 rounded-full font-medium"
                    style={{ background: '#F1EFEA', color: '#444441' }}
                  >
                    {v}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Scope / research considerations */}
          {(result.scopeConsiderations?.length > 0 || result.researchConsiderations?.length > 0) && (
            <div className="grid sm:grid-cols-2 gap-3">
              {result.scopeConsiderations?.length > 0 && (
                <div className="rounded-xl border border-gray-100 p-4 space-y-1.5 bg-white shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Scope considerations
                  </p>
                  <ul className="space-y-1.5">
                    {result.scopeConsiderations.map((s, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex gap-2">
                        <span style={{ color: '#BA7517' }}>•</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {result.researchConsiderations?.length > 0 && (
                <div className="rounded-xl border border-gray-100 p-4 space-y-1.5 bg-white shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Research considerations
                  </p>
                  <ul className="space-y-1.5">
                    {result.researchConsiderations.map((r, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex gap-2">
                        <span style={{ color: '#BA7517' }}>•</span>
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between gap-3 flex-wrap">
            <button
              onClick={onContinue}
              className="cursor-pointer hover:text-[#003887] text-[#0B1C33] inline-flex items-center gap-1.5 text-sm font-semibold transition-colors"
            >
              Continue to Literature Review
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <CopyButton text={buildObjectivesText(result)} label="Copy all objectives" title="Copy general and specific objectives" />
          </div>
        </div>
      )}
    </div>
  )
}