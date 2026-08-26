'use client'
import { Lightbulb, Sparkles, Loader2, History, Clock, Check, ArrowRight, X, Copy } from 'lucide-react'
import type { MouseEvent } from 'react'
import { useState } from 'react'
import { FEASIBILITY_STYLES } from '@/hooks/constants'
import { TopicGuidance } from '@/hooks/types'

type SavedTopic = { id: string; topic: string; created_at: string }

type Props = {
  topic: string
  onTopicChange: (v: string) => void
  context: string
  onContextChange: (v: string) => void
  onGetGuidance: () => void
  isLoading: boolean
  errorMessage: string | null

  savedTopics: SavedTopic[]
  savedTopicsLoading: boolean
  selectedTopicId: string | null
  onSelectSavedTopic: (id: string) => void
  onDeleteSavedTopic: (e: MouseEvent, id: string) => void

  guidance: TopicGuidance | null
  onContinue: () => void
}

export function TopicSelectionStage({
  topic,
  onTopicChange,
  context,
  onContextChange,
  onGetGuidance,
  isLoading,
  errorMessage,
  savedTopics,
  savedTopicsLoading,
  selectedTopicId,
  onSelectSavedTopic,
  onDeleteSavedTopic,
  guidance,
  onContinue,
}: Props) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const handleCopyTopic = async (e: MouseEvent, text: string, index: number) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(text)
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 1500)
    } catch (err) {
      console.error('Copy failed:', err)
    }
  }

  return (
    <div className="rounded-xl border bg-white p-6 space-y-5" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: '#FAEEDA' }}>
          <Lightbulb className="w-4 h-4" style={{ color: '#BA7517' }} />
        </div>
        <div>
          <h2 className="font-semibold text-lg leading-tight">Topic Selection</h2>
          <p className="text-xs text-muted-foreground">Brainstorm and refine a focused thesis topic.</p>
        </div>
      </div>

      {/* ── Saved topics ── */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5">
          <History className="w-3.5 h-3.5 text-muted-foreground" />
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Your saved topics</p>
        </div>

        {savedTopicsLoading ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Loading your saved topics...
          </div>
        ) : savedTopics.length > 0 ? (
          <div className="grid sm:grid-cols-2 gap-2">
            {savedTopics.map((t) => {
              const isSelected = t.id === selectedTopicId
              return (
                <button
                  key={t.id}
                  onClick={() => onSelectSavedTopic(t.id)}
                  className="overflow-hidden relative text-left rounded-lg border px-3 py-2.5 transition-colors hover:bg-amber-50 group"
                  style={{
                    borderColor: isSelected ? '#BA7517' : 'rgba(0,0,0,0.08)',
                    background: isSelected ? '#FAEEDA' : '#FFFFFF',
                  }}
                  title={t.topic}
                >
                  <span
                    onClick={(e) => onDeleteSavedTopic(e, t.id)}
                    role="button"
                    aria-label="Delete saved topic"
                    className="absolute top-2 right-2 md:opacity-0 md:group-hover:opacity-100 opacity-100 text-muted-foreground hover:text-red-600 transition-opacity cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </span>
                  <div className="text-sm font-medium truncate pr-5">
                    {t.topic}
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">
                      {new Date(t.created_at).toLocaleDateString(undefined, {
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
            No saved topics yet — get AI guidance above and it'll show up here.
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Your thesis topic / research area</label>
        <textarea
          value={topic}
          rows={1}
          onChange={(e) => onTopicChange(e.target.value)}
          placeholder="e.g. Impact of mobile learning on senior high school performance"
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
          placeholder="Any progress, questions, or constraints for this stage..."
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
        onClick={onGetGuidance}
        disabled={!topic.trim() || isLoading}
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
            Get AI Guidance
          </>
        )}
      </button>


      {/* ── Guidance result ── */}
      {guidance && (
        <div className="pt-4 space-y-4 border-t" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
          {selectedTopicId && (
            <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: '#633806' }}>
              <History className="w-3.5 h-3.5" />
              Viewing a saved topic from your history
            </div>
          )}

          <div className="flex items-start justify-between gap-3 flex-wrap">
            <p className="text-sm leading-relaxed flex-1 min-w-[200px]">{guidance.feedback}</p>
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

          {guidance.refinedTopics?.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Refined topic ideas</p>
              <div className="space-y-1.5">
                {guidance.refinedTopics.map((t, i) => (
                  <div
                    key={i}
                    className="group flex items-center gap-2 rounded-lg border pl-3 pr-2 py-2 hover:bg-amber-50 transition-colors"
                    style={{ borderColor: 'rgba(0,0,0,0.1)' }}
                  >
                    <button
                      onClick={() => onTopicChange(t)}
                      className="flex-1 text-left text-sm cursor-pointer"
                    >
                      {t}
                    </button>
                    <button
                      onClick={(e) => handleCopyTopic(e, t, i)}
                      className="shrink-0 p-1.5 rounded-md text-muted-foreground hover:text-[#BA7517] hover:bg-black/5 transition-colors cursor-pointer"
                      title="Copy to clipboard"
                      aria-label="Copy topic to clipboard"
                    >
                      {copiedIndex === i ? (
                        <Check className="w-3.5 h-3.5 text-green-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {guidance.suggestedResearchQuestions?.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Suggested research questions
              </p>
              <ul className="space-y-1.5">
                {guidance.suggestedResearchQuestions.map((q, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex gap-2">
                    <span style={{ color: '#BA7517' }}>•</span>
                    {q}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {guidance.nextSteps?.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Next steps</p>
              <ul className="space-y-1.5">
                {guidance.nextSteps.map((s, i) => (
                  <li key={i} className="text-sm flex gap-2">
                    <Check className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#3B6D11' }} />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button onClick={onContinue} className=" cursor-pointer hover:text-[#003887] text-[#0B1C33] inline-flex items-center gap-1.5 text-sm font-semibold">
            Continue to Literature Review
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}