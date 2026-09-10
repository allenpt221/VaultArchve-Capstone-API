import React, { useState } from 'react'
import {
  X,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  ClipboardList,
  LineChart,
  Factory,
  Calculator,
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

// Content mirrors the actual Entrep Progressive Trail stages — keep this in
// sync if a stage's scope or output artifact changes.
const STAGES: Stage[] = [
  {
    key: 'concept',
    icon: Lightbulb,
    title: 'Concept',
    summary:
      "Start with your business idea, even a rough one. We'll help you shape it into a clear, sellable concept.",
    youDo: [
      'Describe your idea and any context you already have',
      'Get AI-generated name, tagline, and positioning options to choose from and refine',
    ],
    youGet: 'A concept statement, name, and tagline you can carry into every later stage',
  },
  {
    key: 'swot',
    icon: ClipboardList,
    title: 'SWOT Analysis',
    summary:
      "See your concept from every angle before you commit resources to it — what's working in your favor, and what could work against you.",
    youDo: [
      'Add your own notes and observations about your concept',
      'Get an AI-generated breakdown of strengths, weaknesses, opportunities, and threats',
    ],
    youGet: 'A SWOT analysis grounded in your concept statement',
  },
  {
    key: 'market',
    icon: LineChart,
    title: 'Market Research',
    summary:
      'Find out whether people actually want what you\'re building, and who your target market really is.',
    youDo: [
      'Log your market notes and any survey results you\'ve gathered',
      'Get an AI interpretation of your survey data and target market fit',
    ],
    youGet: 'A market research summary with your target market defined',
  },
  {
    key: 'production',
    icon: Factory,
    title: 'Production',
    summary:
      'Plan how you\'ll actually make and deliver your product — suppliers, capacity, and variants.',
    youDo: [
      'Add your suppliers, daily output, and operating days per week',
      'Define your product variants and get an AI-generated production plan',
    ],
    youGet: 'A production plan mapped to your real capacity and suppliers',
  },
  {
    key: 'financial',
    icon: Calculator,
    title: 'Financial',
    summary:
      "Turn your concept and production plan into numbers — what it costs to start, what it costs to run, and what it needs to sell for.",
    youDo: [
      'Enter startup costs, fixed monthly costs, and variable cost per unit',
      'Set your price per unit and get an AI-generated financial outlook',
    ],
    youGet: 'A financial outlook covering costs, pricing, and breakeven',
  },
]

type Props = {
  isOpen: boolean
  onClose: () => void
  onGetStarted?: () => void
}

function EntrepProgressiveTrailGuideModal({ isOpen, onClose, onGetStarted }: Props) {
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
      className="h-full fixed inset-0 z-50 flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="entrep-progressive-trail-guide-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70"
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
              id="entrep-progressive-trail-guide-title"
              className="text-lg font-semibold mt-0.5"
              style={{ color: '#0B1C33' }}
            >
              The Business Plan Trail
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

export default EntrepProgressiveTrailGuideModal