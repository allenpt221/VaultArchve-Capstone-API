'use client'

import {
  Lightbulb,
  Sparkles,
  Loader2,
  History,
  Clock,
  Check,
  ArrowRight,
} from 'lucide-react'
import { FEASIBILITY_STYLES } from '@/hooks/constants'
import { TopicGuidance } from '@/hooks/types'
import { CopyButton } from '@/components/Copybutton'

type Props = {
  topic: string
  onTopicChange: (v: string) => void
  context: string
  onContextChange: (v: string) => void
  onGetGuidance: () => void
  isLoading: boolean
  errorMessage: string | null

  // Opens the saved-topics modal (owned by the parent)
  onOpenSavedTopics: () => void
  savedTopicsCount: number

  guidance: TopicGuidance | null
  selectedTopicId: string | null
  onContinue: () => void

  // Rate-limit information
  limitedUntil: number | null
  countdown: string
}

// ── Plain-text builders for the copy buttons ──────────────────────────────

const numbered = (items: string[]) =>
  items.map((s, i) => `${i + 1}. ${s}`)

function refinedTopicsText(g: TopicGuidance): string {
  return [
    'Refined Topic Ideas',
    ...numbered(g.refinedTopics ?? []),
  ].join('\n')
}

function researchQuestionsText(g: TopicGuidance): string {
  return [
    'Suggested Research Questions',
    ...numbered(g.suggestedResearchQuestions ?? []),
  ].join('\n')
}

function nextStepsText(g: TopicGuidance): string {
  return [
    'Next Steps',
    ...numbered(g.nextSteps ?? []),
  ].join('\n')
}

function guidanceText(g: TopicGuidance): string {
  const sections: (string | null)[] = [
    `Feasibility: ${FEASIBILITY_STYLES[g.feasibility].label}\n${g.feedback}`,

    g.refinedTopics?.length > 0
      ? refinedTopicsText(g)
      : null,

    g.suggestedResearchQuestions?.length > 0
      ? researchQuestionsText(g)
      : null,

    g.nextSteps?.length > 0
      ? nextStepsText(g)
      : null,
  ]

  return sections
    .filter((s): s is string => !!s)
    .join('\n\n')
}

export function TopicSelectionStage({
  topic,
  onTopicChange,
  context,
  onContextChange,
  onGetGuidance,
  isLoading,
  errorMessage,
  onOpenSavedTopics,
  savedTopicsCount,
  selectedTopicId,
  guidance,
  onContinue,
  limitedUntil,
  countdown,
}: Props) {
  return (
    <div
      className="rounded-2xl border bg-white p-6 space-y-5 shadow-sm"
      style={{ borderColor: 'rgba(0,0,0,0.08)' }}
    >
      {/* ── Header ── */}
      <div className="flex items-center gap-2.5">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: '#FAEEDA' }}
        >
          <Lightbulb
            className="w-4 h-4"
            style={{ color: '#BA7517' }}
          />
        </div>

        <div>
          <h2
            className="font-semibold text-lg leading-tight tracking-tight"
            style={{ color: '#0B1C33' }}
          >
            Topic Selection
          </h2>

          <p className="text-xs text-muted-foreground">
            Brainstorm and refine a focused thesis topic.
          </p>
        </div>
      </div>

      {/* ── Saved topics (opens modal) ── */}
      <div className="flex">
        <button
          type="button"
          onClick={onOpenSavedTopics}
          className="group inline-flex items-center gap-2 text-sm cursor-pointer transition-colors hover:text-[#0B1C33]"
          style={{ color: '#4A4A48' }}
        >
          <History className="w-4 h-4 shrink-0" />
          <span className="underline decoration-1 underline-offset-4 decoration-[#C7C6C1] group-hover:decoration-[#0B1C33]">
            {savedTopicsCount > 0
              ? `View ${savedTopicsCount} saved ${
                  savedTopicsCount === 1 ? 'topic' : 'topics'
                }`
              : 'View saved topics'}
          </span>
        </button>
      </div>

      {/* ── Topic input ── */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">
          Your thesis topic / research area
        </label>

        <textarea
          value={topic}
          rows={1}
          onChange={(e) => onTopicChange(e.target.value)}
          placeholder="e.g. Impact of mobile learning on senior high school performance"
          className="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-100 focus:border-amber-400 bg-muted/30 transition-shadow"
          style={{ borderColor: 'rgba(0,0,0,0.12)' }}
        />
      </div>

      {/* ── Context input ── */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">
          Additional context{' '}
          <span className="text-muted-foreground font-normal">
            (optional)
          </span>
        </label>

        <textarea
          value={context}
          onChange={(e) => onContextChange(e.target.value)}
          placeholder="Any progress, questions, or constraints for this stage..."
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

      {/* ── Get guidance button ── */}
      <button
        onClick={onGetGuidance}
        disabled={
          !topic.trim() ||
          isLoading ||
          !!limitedUntil
        }
        className="inline-flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm transition-transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
        style={{
          background: '#F5B841',
          color: '#1A1A1A',
        }}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Thinking...
          </>
        ) : limitedUntil ? (
          <>
            <Clock className="w-4 h-4" />
            Daily limit reached
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
        <div
          className="pt-4 space-y-4 border-t"
          style={{
            borderColor: 'rgba(0,0,0,0.08)',
          }}
        >
          {/* Saved topic indicator */}
          {selectedTopicId && (
            <div
              className="flex items-center gap-1.5 text-xs font-medium w-fit px-3 py-1.5 rounded-full"
              style={{
                color: '#8A5A00',
                backgroundColor: '#FDF3E3',
              }}
            >
              <History className="w-3.5 h-3.5" />
              Viewing a saved topic from your history
            </div>
          )}

          {/* Feedback + feasibility */}
          <div className="flex items-start justify-between gap-3 flex-wrap rounded-xl border border-gray-100 p-4 bg-white shadow-sm">
            <p className="text-sm leading-relaxed flex-1 min-w-[200px]">
              {guidance.feedback}
            </p>

            <span
              className="text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap"
              style={{
                background:
                  FEASIBILITY_STYLES[
                    guidance.feasibility
                  ].bg,
                color:
                  FEASIBILITY_STYLES[
                    guidance.feasibility
                  ].color,
              }}
            >
              {
                FEASIBILITY_STYLES[
                  guidance.feasibility
                ].label
              }
            </span>
          </div>

          {/* ── Refined topics ── */}
          {guidance.refinedTopics?.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Refined topic ideas
                </p>
              </div>

              <p className="text-xs text-muted-foreground">
                Click a topic, or copy it, to use it as your
                thesis topic.
              </p>

              <div className="space-y-1.5">
                {guidance.refinedTopics.map((t, i) => (
                  <div
                    key={i}
                    className="group flex items-center gap-2 rounded-xl border pl-3 pr-2 py-2 hover:bg-amber-50 hover:border-gray-200 transition-colors"
                    style={{
                      borderColor: 'rgba(0,0,0,0.1)',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => onTopicChange(t)}
                      className="flex-1 text-left text-sm cursor-pointer"
                    >
                      {t}
                    </button>

                    {/* Copies to clipboard AND puts the topic in the
                        "Your thesis topic / research area" field. */}
                    <span
                      onClick={() => onTopicChange(t)}
                      className="inline-flex"
                    >
                      <CopyButton
                        text={t}
                        title="Copy topic and use it as your thesis topic"
                      />
                    </span>
                  </div>
                ))}
              </div>

              {/* Research questions note */}
              {guidance.suggestedResearchQuestions?.length >
                0 && (
                <div
                  className="flex items-center justify-between gap-3 flex-wrap rounded-xl px-3.5 py-2.5"
                  style={{
                    background: '#FDF3E3',
                  }}
                >
                  <p
                    className="text-xs font-medium leading-relaxed"
                    style={{
                      color: '#8A5A00',
                    }}
                  >
                    Your suggested research questions will be
                    added to the Methodology stage
                    automatically. You can still edit them
                    there.
                  </p>

                  <CopyButton
                    text={researchQuestionsText(guidance)}
                    label="Copy all research questions"
                    title="Copy all research questions"
                  />
                </div>
              )}
            </div>
          )}

          {/* ── Suggested research questions ── */}
          {guidance.suggestedResearchQuestions?.length > 0 && (
            <div className="rounded-xl border border-gray-100 p-4 space-y-2 bg-white shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Suggested research questions
                </p>

                <CopyButton
                  text={researchQuestionsText(guidance)}
                  title="Copy all research questions"
                />
              </div>

              <ul className="space-y-1.5">
                {guidance.suggestedResearchQuestions.map(
                  (q, i) => (
                    <li
                      key={i}
                      className="text-sm text-muted-foreground flex items-start gap-2"
                    >
                      <span style={{ color: '#BA7517' }}>
                        •
                      </span>

                      <span className="flex-1 min-w-0">
                        {q}
                      </span>

                      <CopyButton
                        text={q}
                        title="Copy research question"
                      />
                    </li>
                  )
                )}
              </ul>
            </div>
          )}

          {/* ── Next steps ── */}
          {guidance.nextSteps?.length > 0 && (
            <div className="rounded-xl border border-gray-100 p-4 space-y-2 bg-white shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Next steps
              </p>

              <ul className="space-y-1.5">
                {guidance.nextSteps.map((s, i) => (
                  <li
                    key={i}
                    className="text-sm flex gap-2"
                  >
                    <Check
                      className="w-4 h-4 shrink-0 mt-0.5"
                      style={{ color: '#3B6D11' }}
                    />

                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* ── Continue + Copy all ── */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <button
              onClick={onContinue}
              className="cursor-pointer hover:text-[#003887] text-[#0B1C33] inline-flex items-center gap-1.5 text-sm font-semibold transition-colors"
            >
              Continue to Objective of the Study

              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <CopyButton
              text={guidanceText(guidance)}
              label="Copy all guidance"
              title="Copy the full guidance"
            />
          </div>
        </div>
      )}
    </div>
  )
}