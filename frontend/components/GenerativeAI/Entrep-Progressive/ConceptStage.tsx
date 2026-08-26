'use client'
import { Lightbulb, Sparkles, Loader2, History, Clock, ArrowRight, X, Trash2 } from 'lucide-react'
import type { MouseEvent } from 'react'
import { FEASIBILITY_STYLES } from '@/hooks/entrepconstant'
import type { ConceptGuidance, SavedConcept } from '@/hooks/entrpTypes'

type Props = {
  idea: string
  onIdeaChange: (v: string) => void
  context: string
  onContextChange: (v: string) => void
  onGenerateConcept: () => void
  isLoading: boolean
  errorMessage: string | null

  savedConcepts: SavedConcept[]
  savedConceptsLoading: boolean
  selectedConceptId: string | null
  onSelectSavedConcept: (id: string) => void
  onDeleteSavedConcept: (e: MouseEvent, id: string) => void

  guidance: ConceptGuidance | null
  selectedConceptStatement: string
  onSelectedConceptStatementChange: (v: string) => void
  selectedName: string
  onSelectedNameChange: (v: string) => void
  selectedTagline: string
  onSelectedTaglineChange: (v: string) => void
  selectedRationale: string
  onSelectedRationaleChange: (v: string) => void
  onContinue: () => void
}

export function ConceptStage({
  idea,
  onIdeaChange,
  context,
  onContextChange,
  onGenerateConcept,
  isLoading,
  errorMessage,
  savedConcepts,
  savedConceptsLoading,
  selectedConceptId,
  onSelectSavedConcept,
  onDeleteSavedConcept,
  guidance,
  selectedConceptStatement,
  onSelectedConceptStatementChange,
  selectedName,
  onSelectedNameChange,
  selectedTagline,
  onSelectedTaglineChange,
  selectedRationale,
  onSelectedRationaleChange,
  onContinue,
}: Props) {
  const canContinue = !!selectedConceptStatement.trim() && !!selectedName.trim()

  return (
    <div className="rounded-xl border bg-white p-6 space-y-5" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: '#FAEEDA' }}>
          <Lightbulb className="w-4 h-4" style={{ color: '#BA7517' }} />
        </div>
        <div>
          <h2 className="font-semibold text-lg leading-tight">Business Concept</h2>
          <p className="text-xs text-muted-foreground">Turn a raw idea into a defined value proposition.</p>
        </div>
      </div>

      {/* ── Saved concepts ── */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5">
          <History className="w-3.5 h-3.5 text-muted-foreground" />
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Your saved concepts</p>
        </div>

        {savedConceptsLoading ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Loading your saved concepts...
          </div>
        ) : savedConcepts.length > 0 ? (
          <div className="grid sm:grid-cols-2 gap-2">
            {savedConcepts.map((c) => {
              const isSelected = c.id === selectedConceptId
              return (
                <button
                  key={c.id}
                  onClick={() => onSelectSavedConcept(c.id)}
                  className="overflow-hidden relative text-left rounded-lg border px-3 py-2.5 transition-colors hover:bg-amber-50 group"
                  style={{
                    borderColor: isSelected ? '#BA7517' : 'rgba(0,0,0,0.08)',
                    background: isSelected ? '#FAEEDA' : '#FFFFFF',
                  }}
                  title={c.idea}
                >
                  <span
                    onClick={(e) => onDeleteSavedConcept(e, c.id)}
                    role="button"
                    aria-label="Delete saved concept"
                    className="absolute top-2 right-2 md:opacity-0 md:group-hover:opacity-100 opacity-100 text-muted-foreground hover:text-red-600 transition-opacity cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </span>
                  <div className="text-sm font-medium truncate pr-5">{c.idea}</div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">
                      {new Date(c.created_at).toLocaleDateString(undefined, {
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
            No saved concepts yet — generate guidance below and it'll show up here.
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Business idea</label>
        <textarea
          value={idea}
          rows={2}
          onChange={(e) => onIdeaChange(e.target.value)}
          placeholder="e.g. A mobile app connecting home-based food sellers in Guagua with customers beyond their barangay..."
          className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-amber-400 bg-muted/30"
          style={{ borderColor: 'rgba(0,0,0,0.12)' }}
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">
          Additional context <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        <textarea
          value={context}
          onChange={(e) => onContextChange(e.target.value)}
          placeholder="e.g. Aimed at working parents in nearby barangays who have limited time to prepare meals..."
          rows={3}
          className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-amber-400 bg-muted/30 resize-none"
          style={{ borderColor: 'rgba(0,0,0,0.12)' }}
        />
      </div>

      {errorMessage && !guidance && (
        <div className="rounded-lg px-3 py-2 text-xs font-medium" style={{ background: '#FBEAEA', color: '#7A2020' }}>
          {errorMessage}
        </div>
      )}

      <button
        onClick={onGenerateConcept}
        disabled={!idea.trim() || isLoading}
        className="inline-flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ background: '#F5B841', color: '#1A1A1A' }}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Thinking...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            Generate Guidance
          </>
        )}
      </button>

      {/* ── Guidance result ── */}
      {guidance && (
        <div className="pt-4 space-y-5 border-t" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
          {selectedConceptId && (
            <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: '#633806' }}>
              <History className="w-3.5 h-3.5" />
              Viewing a saved concept from your history
            </div>
          )}

          <div className="flex items-start justify-between gap-3 flex-wrap">
            <p className="text-sm leading-relaxed flex-1 min-w-50">{guidance.feedback}</p>
            <span
              className="text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap"
              style={{
                background: FEASIBILITY_STYLES[guidance.feasibility].bg,
                color: FEASIBILITY_STYLES[guidance.feasibility].color,
              }}
            >
              {FEASIBILITY_STYLES[guidance.feasibility].label}
            </span>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Pick a refined concept statement
            </p>
            <div className="space-y-1.5">
              {guidance.refinedConceptStatements.map((stmt, i) => (
                <label
                  key={i}
                  className="flex items-start gap-2 rounded-lg border px-3 py-2.5 text-sm cursor-pointer hover:bg-amber-50 transition-colors"
                  style={{
                    borderColor: selectedConceptStatement === stmt ? '#BA7517' : 'rgba(0,0,0,0.1)',
                    background: selectedConceptStatement === stmt ? '#FAEEDA' : '#FFFFFF',
                  }}
                >
                  <input
                    type="radio"
                    name="conceptStatement"
                    checked={selectedConceptStatement === stmt}
                    onChange={() => onSelectedConceptStatementChange(stmt)}
                    className="mt-1"
                  />
                  <span className="leading-relaxed">{stmt}</span>
                </label>
              ))}
            </div>
            <textarea
              rows={4}
              value={selectedConceptStatement}
              onChange={(e) => onSelectedConceptStatementChange(e.target.value)}
              placeholder="Selected or custom concept statement..."
              className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-amber-400 bg-muted/30 mt-1"
              style={{ borderColor: 'rgba(0,0,0,0.12)' }}
            />
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Pick a suggested name
            </p>
            <div className="grid sm:grid-cols-2 gap-2">
              {guidance.suggestedNames.map((n, i) => (
                <label
                  key={i}
                  className="rounded-lg border px-3 py-2.5 text-sm cursor-pointer hover:bg-amber-50 transition-colors"
                  style={{
                    borderColor: selectedName === n.name ? '#BA7517' : 'rgba(0,0,0,0.1)',
                    background: selectedName === n.name ? '#FAEEDA' : '#FFFFFF',
                  }}
                >
                  <input
                    type="radio"
                    name="suggestedName"
                    className="hidden"
                    checked={selectedName === n.name}
                    onChange={() => {
                      onSelectedNameChange(n.name)
                      onSelectedTaglineChange(n.tagline)
                      onSelectedRationaleChange(n.rationale)
                    }}
                  />
                  <p className="font-semibold" style={{ color: '#0B1C33' }}>{n.name}</p>
                  <p className="text-muted-foreground">{n.tagline}</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{n.rationale}</p>
                </label>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Company / brand name</label>
              <input
                value={selectedName}
                disabled={true}
                onChange={(e) => onSelectedNameChange(e.target.value)}
                placeholder="e.g. Ambrosian Delight"
                className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-amber-400 bg-muted/30"
                style={{ borderColor: 'rgba(0,0,0,0.12)' }}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Tagline</label>
              <input
                value={selectedTagline}
                disabled={true}
                onChange={(e) => onSelectedTaglineChange(e.target.value)}
                placeholder="e.g. Excellence in every bite"
                className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-amber-400 bg-muted/30"
                style={{ borderColor: 'rgba(0,0,0,0.12)' }}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Naming rationale</label>
            <textarea
              rows={2}
              disabled={true}
              value={selectedRationale}
              onChange={(e) => onSelectedRationaleChange(e.target.value)}
              placeholder="Explain the meaning behind the name..."
              className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-amber-400 bg-muted/30 resize-none"
              style={{ borderColor: 'rgba(0,0,0,0.12)' }}
            />
          </div>

          {guidance.nextSteps?.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Next steps</p>
              <ul className="space-y-1.5">
                {guidance.nextSteps.map((s, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex gap-2">
                    <span style={{ color: '#BA7517' }}>•</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            onClick={onContinue}
            disabled={!canContinue}
            className="cursor-pointer inline-flex items-center gap-1.5 text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:text-[#003887] transition-colors"
            style={{ color: '#0B1C33' }}
          >
            Continue to SWOT Analysis
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}