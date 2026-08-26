import React, { useState } from 'react'
import {
  X,
  ChevronLeft,
  ChevronRight,
  Target,
  BookOpenText,
  FlaskConical,
  BarChart3,
  FileCheck2,
  CheckCircle2,
} from 'lucide-react'

type Stage = {
  key: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  title: string
  summary: string
  youDo: string[]
  youGet: string
}

// Content mirrors the actual Progressive Trail stages — keep this in sync
// if a stage's scope or output artifact changes.
const STAGES: Stage[] = [
  {
    key: 'topic',
    icon: Target,
    title: 'Topic & Problem Definition',
    summary:
      "Start with whatever interest or idea you have, even a rough one. We'll help you narrow it into a real problem statement.",
    youDo: [
      'Answer guided prompts that test your idea for specificity, feasibility, originality, and relevance',
      'See common pitfalls flagged as you go, before an adviser has to point them out',
    ],
    youGet: 'A draft problem statement + 3 research questions',
  },
  {
    key: 'literature',
    icon: BookOpenText,
    title: 'Literature Review',
    summary:
      'Give us your topic and the trail searches the web for real sources, verifies each one, and builds your annotated bibliography for you.',
    youDo: [
      'Get a numbered list of verified sources — each with its citation, link to the original, and a summary of what it found and how it relates to your topic',
      "See only sources that were checked as real, not made up — anything unverified gets dropped",
    ],
    youGet: 'An annotated bibliography of verified sources',
  },
  {
    key: 'methodology',
    icon: FlaskConical,
    title: 'Methodology',
    summary:
      'Decide how you\'ll actually answer your research questions — qualitative, quantitative, or mixed — with reasoning you can defend.',
    youDo: [
      'Work through a decision tree tied directly to your research questions',
      'Justify your population and sampling, then plan your instrument and data collection with validity in mind',
    ],
    youGet: 'A methodology draft, mapped to each research question',
  },
  {
    key: 'data',
    icon: BarChart3,
    title: 'Data Collection & Analysis',
    summary:
      "Once your data is in, get guidance matched to your method — thematic coding for qualitative, statistical tests for quantitative.",
    youDo: [
      'Work through a data cleaning and organization checklist',
      'Get prompts that connect your findings back to the gap you identified in your literature review',
    ],
    youGet: 'A results summary with suggested visualizations',
  },
  {
    key: 'paper-review',
    icon: FileCheck2,
    title: 'Full Paper Review',
    summary:
      "Upload your full draft (or type your chapters in directly) and get it checked against everything from the earlier stages.",
    youDo: [
      "See which chapters and required sections were found, and which are unclear or missing",
      "Get flagged on anything that doesn't match your saved topic, research questions, or methodology, plus a citation audit",
    ],
    youGet: 'An overall readiness score with your top priority fixes',
  },
]

type Props = {
  isOpen: boolean
  onClose: () => void
  onGetStarted?: () => void
}

function ProgressiveTrailGuideModal({ isOpen, onClose, onGetStarted }: Props) {
  const [stepIndex, setStepIndex] = useState(0)

  if (!isOpen) return null

  const isFirst = stepIndex === 0
  const isLast = stepIndex === STAGES.length - 1
  const stage = STAGES[stepIndex]
  const Icon = stage.icon

  const goNext = () => {
    if (isLast) {
      onGetStarted?.()
      onClose()
      return
    }
    setStepIndex((i) => Math.min(i + 1, STAGES.length - 1))
  }

  const goBack = () => setStepIndex((i) => Math.max(i - 1, 0))

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="progressive-trail-guide-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#BA7517' }}>
              How it works
            </p>
            <h2
              id="progressive-trail-guide-title"
              className="text-lg font-semibold mt-0.5"
              style={{ color: '#0B1C33' }}
            >
              The Progressive Trail
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-gray-400 hover:text-gray-600 shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        {/* Step indicator — numbered because this is a real sequence: each
            stage's output feeds the next one, and stages unlock in order. */}
        <div className="flex items-center gap-2 px-6 pb-2">
          {STAGES.map((s, i) => {
            const isDone = i < stepIndex
            const isActive = i === stepIndex
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => setStepIndex(i)}
                aria-label={`Go to step ${i + 1}: ${s.title}`}
                aria-current={isActive ? 'step' : undefined}
                className="flex-1 h-1.5 rounded-full transition-colors"
                style={{
                  backgroundColor: isActive || isDone ? '#BA7517' : '#E5E7EB',
                }}
              />
            )
          })}
        </div>

        {/* Body */}
        <div className="px-6 pt-4 pb-2 overflow-y-auto">
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: '#0B1C33' }}
            >
              <Icon size={20} className="text-amber-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-400">
                Stage {stepIndex + 1} of {STAGES.length}
              </p>
              <h3 className="text-base font-semibold" style={{ color: '#0B1C33' }}>
                {stage.title}
              </h3>
            </div>
          </div>

          <p className="text-sm text-gray-600 leading-relaxed mb-4">{stage.summary}</p>

          <div className="rounded-xl border border-gray-100 p-4 mb-4" style={{ background: 'rgba(11,28,51,0.03)' }}>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
              At this stage you'll
            </p>
            <ul className="flex flex-col gap-2">
              {stage.youDo.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span
                    className="mt-1.5 w-1 h-1 rounded-full shrink-0"
                    style={{ backgroundColor: '#BA7517' }}
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-center gap-2 text-sm font-medium" style={{ color: '#27500A' }}>
            <CheckCircle2 size={16} className="shrink-0" />
            You'll walk away with: {stage.youGet}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 mt-2">
          <button
            type="button"
            onClick={goBack}
            disabled={isFirst}
            className="inline-flex items-center gap-1 text-sm font-medium disabled:opacity-0 disabled:pointer-events-none"
            style={{ color: '#0B1C33' }}
          >
            <ChevronLeft size={16} />
            Back
          </button>

          <button
            type="button"
            onClick={onClose}
            className="text-sm text-gray-400 hover:text-gray-600"
          >
            Skip
          </button>

          <button
            type="button"
            onClick={goNext}
            className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-white"
            style={{ backgroundColor: '#0B1C33' }}
          >
            {isLast ? 'Start Stage 1' : 'Next'}
            {!isLast && <ChevronRight size={16} />}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProgressiveTrailGuideModal