import React, { useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import {
  UploadCloud,
  FileText,
  X,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Gauge,
  PenLine,
  History,
  Lightbulb,
  Sparkles,
  Clock,
} from 'lucide-react'
import { CONSISTENCY_STYLES, MAX_PDF_SIZE_MB } from '@/hooks/constants'
import type { FullPaperReviewResult, SavedFullPaperReview } from '@/hooks/types'

// Grouped by the standard 5-chapter thesis structure (matches the
// structuralCompliance checklist on the backend) instead of the old
// 6 generic fields. Each field now maps to a real chapter, and the
// placeholder tells the student which subsections belong inside it —
// so manual entry gets checked at the same subsection granularity as
// an uploaded PDF, instead of everything outside Abstract/Intro/
// Methodology/Discussion/Conclusion/References being auto-flagged as
// "missing" just because there was never a box for it.
const MANUAL_SECTIONS = [
  {
    key: 'chapter1_introduction',
    label: 'Chapter 1 — Introduction',
    hint: 'Background of the Study, Statement of the Problem, Research Questions, Significance of the Study, Scope and Delimitation, Definition of Terms',
  },
  {
    key: 'chapter2_rrl',
    label: 'Chapter 2 — Review of Related Literature',
    hint: 'Review of Related Literature, Theoretical Framework, Conceptual Framework',
  },
  {
    key: 'chapter3_methodology',
    label: 'Chapter 3 — Methodology',
    hint: 'Research Design, Population and Sampling, Research Instrument, Data Gathering Procedure, Statistical Treatment',
  },
  {
    key: 'chapter4_presentation',
    label: 'Chapter 4 — Presentation, Analysis and Interpretation of Data',
    hint: 'Presentation of Data, Analysis of Data, Discussion of Findings',
  },
  {
    key: 'chapter5_summary',
    label: 'Chapter 5 — Summary, Conclusion and Recommendation',
    hint: 'Summary of Findings, Conclusion, Recommendation',
  },
  {
    key: 'thesis_references',
    label: 'References',
    hint: 'Full reference list',
  },
] as const

type ManualSectionKey = (typeof MANUAL_SECTIONS)[number]['key']
type ManualSectionValues = Record<ManualSectionKey, string>

const EMPTY_MANUAL_SECTIONS: ManualSectionValues = {
  chapter1_introduction: '',
  chapter2_rrl: '',
  chapter3_methodology: '',
  chapter4_presentation: '',
  chapter5_summary: '',
  thesis_references: '',
}

type SubmissionMode = 'pdf' | 'manual'

// Status → color mapping for the per-section breakdown (sectionCheck).
// Kept local to this file since it's only used here, unlike
// CONSISTENCY_STYLES which is shared via hooks/constants.
const SECTION_STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  Present: { bg: '#EAF3DE', color: '#27500A' },
  Partial: { bg: '#FDF3E3', color: '#8A5A00' },
  Missing: { bg: '#FBEAEA', color: '#7A2020' },
  Unclear: { bg: '#FDF3E3', color: '#8A5A00' },
  'Not Applicable': { bg: '#F1F1F1', color: '#666666' },
}

// This component now receives everything from useProgressiveTrial() via
// props from the parent (ProgressiveTrial.tsx), instead of calling the
// hook itself. useProgressiveTrial is a plain custom hook (not backed by
// React context) — every component that calls it separately gets its own
// independent copy of local state like `topic`. Calling it a second time
// here meant `topic` was always empty in this component, even though the
// user had already typed one in the Topic Selection stage. Props fix that.
type Props = {
  topic: string

  paperFile: File | null
  setPaperFile: (file: File | null) => void
  handleUploadPaperReview: (manualSections?: Record<string, string>) => void
  isPaperReviewLoading: boolean

  fullPaperReviewHistory: SavedFullPaperReview[]
  fullPaperReviewHistoryLoading: boolean
  hasMorePaperReviews: boolean
  handleLoadMorePaperReviews: () => void

  selectedPaperReviewId: string | null
  handleSelectSavedPaperReview: (id: string) => void
  displayedPaperReview: FullPaperReviewResult | null

  message: string | null
  errorMessage: string | null
  limitedUntil: number | null
  countdown: string
}

function PaperReview({
  topic,
  paperFile,
  setPaperFile,
  handleUploadPaperReview,
  isPaperReviewLoading,
  selectedPaperReviewId,
  displayedPaperReview,
  message,
  errorMessage,
  limitedUntil,
  countdown
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Which submission method is currently shown — only one at a time.
  // "pdf" (Upload PDF) is now Option 1 / the default.
  const [submissionMode, setSubmissionMode] = useState<SubmissionMode>('pdf')

  // Whether the dropzone is being actively dragged over, for hover styling.
  const [isDragActive, setIsDragActive] = useState(false)

  // Manual section text — an alternative (or supplement) to uploading a PDF.
  const [manualSections, setManualSections] = useState<ManualSectionValues>(EMPTY_MANUAL_SECTIONS)

  const hasManualText = Object.values(manualSections).some((v) => v.trim().length > 0)

  // canSubmit only looks at whichever mode is currently active — if the
  // user typed manual sections, then switched to the PDF tab without
  // uploading anything, the button correctly disables rather than silently
  // submitting the manual text they can no longer see. It's also gated on
  // the rate limit, same as every other stage's generate button.
  const canSubmit =
    !isPaperReviewLoading &&
    !limitedUntil &&
    (submissionMode === 'pdf' ? !!paperFile : hasManualText)

  const handleManualSectionChange = (key: ManualSectionKey, value: string) => {
    setManualSections((prev) => ({ ...prev, [key]: value }))
  }

  const validateAndSetFile = (file: File | undefined) => {
    if (!file) return
    if (file.type !== 'application/pdf') {
      alert('Only PDF files are accepted.')
      return
    }
    if (file.size > MAX_PDF_SIZE_MB * 1024 * 1024) {
      alert(`PDF is too large. Max size is ${MAX_PDF_SIZE_MB}MB.`)
      return
    }
    setPaperFile(file)
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    validateAndSetFile(e.target.files?.[0])
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragActive(false)
    validateAndSetFile(e.dataTransfer.files?.[0])
  }

  const handleSubmit = () => {
    if (!canSubmit) return

    if (submissionMode === 'pdf') {
      // PDF mode: send only the file, regardless of anything typed into
      // the manual section fields on the other tab.
      handleUploadPaperReview(undefined)
      return
    }

    // Manual mode: send only the non-empty manual sections, regardless of
    // whether a PDF happens to be attached from the other tab.
    const nonEmptyManualSections = Object.fromEntries(
      Object.entries(manualSections).filter(([, v]) => v.trim().length > 0)
    )
    handleUploadPaperReview(nonEmptyManualSections)
  }

  // displayedPaperReview is always in the camelCase display shape by the
  // time it reaches this component — useProgressiveTrial's displayedPaperReview
  // useMemo converts the snake_case DB row into this shape for saved reviews,
  // and a fresh upload is already in this shape. structuralCompliance is a
  // ready-made summary { missing: string[], requiredSectionsTotal,
  // requiredSectionsPresent } — there's no separate `sectionCheck` array to
  // derive it from.
  const structuralCompliance = displayedPaperReview?.structuralCompliance ?? null
  const requiredSectionsTotal = structuralCompliance?.requiredSectionsTotal ?? 0
  const requiredSectionsPresent = structuralCompliance?.requiredSectionsPresent ?? 0
  const missingSections = structuralCompliance?.missing ?? []
  const compliancePct = Math.round(
    (requiredSectionsPresent / Math.max(1, requiredSectionsTotal)) * 100
  )

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight" style={{ color: '#0B1C33' }}>
          Review & Submit
        </h2>
        <p className="text-sm text-gray-500 mt-1 leading-relaxed">
          Upload your full thesis draft as a PDF, or type in your chapters manually. We'll
          check its structure, cross-check it against your earlier stages, and audit
          citations before you submit.
        </p>
      </div>

      {topic && (
        <div
          className="rounded-xl px-4 py-3 border"
          style={{ background: 'rgba(11,28,51,0.03)', borderColor: 'rgba(11,28,51,0.08)' }}
        >
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-0.5">
            Reviewing paper for
          </p>
          <p className="text-sm font-medium" style={{ color: '#0B1C33' }}>
            {topic}
          </p>
        </div>
      )}

      {selectedPaperReviewId && (
        <div
          className="flex items-center gap-1.5 text-xs font-medium w-fit px-3 py-1.5 rounded-full"
          style={{ color: '#8A5A00', backgroundColor: '#FDF3E3' }}
        >
          <History className="w-3.5 h-3.5" />
          Showing a saved review for this topic
        </div>
      )}

      {/* Option 1 / Option 2 toggle — only one submission method is shown
          and submitted at a time. PDF upload is Option 1 / the default. */}
      <div
        className="inline-flex self-start rounded-xl border p-1 gap-1 shadow-sm"
        style={{ borderColor: 'rgba(0,0,0,0.08)', background: '#FAFAF9' }}
        role="tablist"
        aria-label="Choose submission method"
      >
        <button
          type="button"
          role="tab"
          aria-selected={submissionMode === 'pdf'}
          onClick={() => setSubmissionMode('pdf')}
          className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all duration-150"
          style={{
            background: submissionMode === 'pdf' ? '#0B1C33' : 'transparent',
            color: submissionMode === 'pdf' ? '#FFFFFF' : '#57534E',
            boxShadow: submissionMode === 'pdf' ? '0 1px 3px rgba(11,28,51,0.35)' : 'none',
          }}
        >
          <UploadCloud size={14} />
          Option 1 — Upload PDF
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={submissionMode === 'manual'}
          onClick={() => setSubmissionMode('manual')}
          className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all duration-150"
          style={{
            background: submissionMode === 'manual' ? '#0B1C33' : 'transparent',
            color: submissionMode === 'manual' ? '#FFFFFF' : '#57534E',
            boxShadow: submissionMode === 'manual' ? '0 1px 3px rgba(11,28,51,0.35)' : 'none',
          }}
        >
          <PenLine size={14} />
          Option 2 — Type Chapters
        </button>
      </div>

      {/* Upload zone — only rendered in PDF mode */}
      {submissionMode === 'pdf' && (
        <div>
          <div
            onDragOver={(e) => {
              e.preventDefault()
              setIsDragActive(true)
            }}
            onDragLeave={() => setIsDragActive(false)}
            onDrop={handleDrop}
            className="relative overflow-hidden border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center gap-3 cursor-pointer transition-all duration-200"
            style={{
              borderColor: isDragActive ? '#BA7517' : paperFile ? '#BA7517' : '#D9D6D0',
              background: isDragActive
                ? 'linear-gradient(180deg, rgba(186,117,23,0.08), rgba(186,117,23,0.02))'
                : paperFile
                  ? 'rgba(186,117,23,0.04)'
                  : '#FCFCFB',
              transform: isDragActive ? 'scale(1.01)' : 'scale(1)',
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />

            {!paperFile ? (
              <>
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(11,28,51,0.06)' }}
                >
                  <UploadCloud size={26} style={{ color: '#0B1C33' }} />
                </div>
                <p className="text-sm font-medium" style={{ color: '#0B1C33' }}>
                  Drag & drop your thesis PDF, or click to browse
                </p>
                <p className="text-xs text-gray-400">PDF only, up to {MAX_PDF_SIZE_MB}MB</p>
              </>
            ) : (
              <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 border border-gray-100 shadow-sm">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(186,117,23,0.12)' }}
                >
                  <FileText size={18} style={{ color: '#BA7517' }} />
                </div>
                <span className="text-sm font-medium" style={{ color: '#0B1C33' }}>
                  {paperFile.name}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setPaperFile(null)
                  }}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

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

      {/* Manual section entry — only rendered in manual mode */}
      {submissionMode === 'manual' && (
        <div className="rounded-2xl border border-gray-200 p-5 flex flex-col gap-5 bg-white shadow-sm">
          <p className="text-xs text-gray-500 -mt-1 leading-relaxed">
            No PDF yet? Paste or type each chapter below — fill in as many as you have. Each
            box lists the subsections it should cover so we can check them individually.
          </p>
          {MANUAL_SECTIONS.map(({ key, label, hint }, idx) => (
            <div
              key={key}
              className="space-y-1.5 pb-5"
              style={{
                borderBottom:
                  idx < MANUAL_SECTIONS.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none',
              }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0"
                  style={{ background: 'rgba(11,28,51,0.08)', color: '#0B1C33' }}
                >
                  {idx + 1}
                </span>
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                  {label}
                </label>
              </div>
              <p className="text-[11px] text-gray-400 leading-snug pl-7">{hint}</p>
              <textarea
                value={manualSections[key]}
                onChange={(e) => handleManualSectionChange(key, e.target.value)}
                placeholder={`Paste ${label.toLowerCase()} here...`}
                rows={6}
                className="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 resize-y transition-shadow"
                style={{ borderColor: 'rgba(0,0,0,0.12)' }}
              />
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!canSubmit}
        className="self-start px-6 py-3 rounded-xl text-sm font-semibold text-white flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-transform active:scale-[0.98] shadow-sm"
        style={{ backgroundColor: '#0B1C33' }}
      >
        {isPaperReviewLoading ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Reviewing your paper...
          </>
        ) : limitedUntil ? (
          <>
            <Clock size={16} />
            Daily limit reached
          </>
        ) : (
          <>
            <Sparkles size={16} className="text-amber-400" />
            Run Full Paper Review
          </>
        )}
      </button>
      {!canSubmit && !isPaperReviewLoading && (
        <p className="text-xs text-gray-400 -mt-4">
          {limitedUntil && countdown
            ? `Please wait ${countdown} before trying again.`
            : submissionMode === 'pdf'
              ? 'Upload a PDF to continue.'
              : 'Fill in at least one chapter above to continue.'}
        </p>
      )}

      {message && (
        <p
          className="text-sm px-4 py-2.5 rounded-lg w-fit"
          style={{ color: '#7A2020', backgroundColor: '#FBEAEA' }}
        >
          {message}
        </p>
      )}

      {/* Results */}
      {displayedPaperReview && (
        <div className="flex flex-col gap-6 mt-2">
          {/* Overall readiness */}
          <div
            className="rounded-2xl p-6 flex items-center justify-between shadow-sm"
            style={{ background: 'linear-gradient(135deg, #0B1C33 0%, #16294A 100%)' }}
          >
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
                style={{ background: 'rgba(255,255,255,0.08)' }}
              >
                <Gauge size={22} className="text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-gray-300 uppercase tracking-wide">Overall Readiness</p>
                <p className="text-3xl font-semibold text-white leading-tight">
                  {displayedPaperReview.overallReadiness?.score}
                </p>
              </div>
            </div>
            {displayedPaperReview.overallReadiness?.label && (
              <span
                className="text-xs px-3.5 py-1.5 rounded-full font-medium"
                style={{ backgroundColor: 'rgba(255,255,255,0.14)', color: '#FFFFFF' }}
              >
                {displayedPaperReview.overallReadiness.label}
              </span>
            )}
          </div>

          {displayedPaperReview.overallReadiness?.summary && (
            <p className="text-sm text-gray-600 -mt-3 leading-relaxed">
              {displayedPaperReview.overallReadiness.summary}
            </p>
          )}

          {(displayedPaperReview.overallReadiness?.topPriorityFixes?.length ?? 0) > 0 && (
            <div className="rounded-2xl border border-gray-200 p-5 bg-white shadow-sm">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-1.5" style={{ color: '#0B1C33' }}>
                <Lightbulb size={16} style={{ color: '#BA7517' }} />
                Top Priority Improvements
              </h3>
              <ul className="flex flex-col gap-2.5">
                {displayedPaperReview.overallReadiness?.topPriorityFixes?.map((fix, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700 leading-relaxed">
                    <span
                      className="flex items-center justify-center shrink-0 rounded-full text-[10px] font-semibold mt-0.5"
                      style={{ width: 18, height: 18, backgroundColor: '#FDF3E3', color: '#8A5A00' }}
                    >
                      {i + 1}
                    </span>
                    {fix}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Document stage */}
          {displayedPaperReview.documentStage && (
            <div className="rounded-2xl border border-gray-200 p-5 bg-white shadow-sm">
              <h3 className="text-sm font-semibold mb-2" style={{ color: '#0B1C33' }}>
                Document Stage
              </h3>
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="text-xs px-2.5 py-1 rounded-full font-medium"
                  style={{ backgroundColor: '#EAF3DE', color: '#27500A' }}
                >
                  {displayedPaperReview.documentStage.detected}
                </span>
                {displayedPaperReview.documentStage.confidence && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                    {displayedPaperReview.documentStage.confidence} confidence
                  </span>
                )}
              </div>
              {displayedPaperReview.documentStage.reason && (
                <p className="text-xs text-gray-500 leading-relaxed">{displayedPaperReview.documentStage.reason}</p>
              )}
            </div>
          )}

          {/* Chapter detection */}
          <div className="rounded-2xl border border-gray-200 p-5 bg-white shadow-sm">
            <h3 className="text-sm font-semibold mb-3" style={{ color: '#0B1C33' }}>
              Chapter Detection
            </h3>
            <div className="flex flex-wrap gap-2 mb-3">
              {displayedPaperReview.chapterDetection?.chaptersFound?.map((ch, i) => (
                <span
                  key={i}
                  className="text-xs px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: '#EAF3DE', color: '#27500A' }}
                >
                  {ch}
                </span>
              ))}
            </div>
            {(displayedPaperReview.chapterDetection?.missingOrUnclear?.length ?? 0) > 0 && (
              <div className="flex flex-wrap gap-2">
                {displayedPaperReview.chapterDetection?.missingOrUnclear?.map((ch, i) => (
                  <span
                    key={i}
                    className="text-xs px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: '#FBEAEA', color: '#7A2020' }}
                  >
                    {ch} — unclear/missing
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Section-by-section check */}
          {(displayedPaperReview.sectionCheck?.length ?? 0) > 0 && (
            <div className="rounded-2xl border border-gray-200 p-5 bg-white shadow-sm">
              <h3 className="text-sm font-semibold mb-3" style={{ color: '#0B1C33' }}>
                Section-by-Section Check
              </h3>
              <div className="flex flex-col gap-3">
                {displayedPaperReview.sectionCheck?.map((entry, i) => {
                  const style = SECTION_STATUS_STYLES[entry.status] ?? {
                    bg: '#F1F1F1',
                    color: '#444444',
                  }
                  return (
                    <div
                      key={i}
                      className="border border-gray-100 rounded-xl p-3.5 hover:border-gray-200 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-sm font-medium" style={{ color: '#0B1C33' }}>
                          {entry.section}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {entry.severity && entry.severity !== 'None' && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                              {entry.severity}
                            </span>
                          )}
                          <span
                            className="text-xs px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: style.bg, color: style.color }}
                          >
                            {entry.status}
                          </span>
                        </div>
                      </div>
                      {entry.finding && (
                        <p className="text-xs text-gray-500 mb-1 leading-relaxed">{entry.finding}</p>
                      )}
                      {entry.recommendation && entry.recommendation !== 'None.' && entry.recommendation !== 'None' && (
                        <p className="text-xs" style={{ color: '#BA7517' }}>
                          → {entry.recommendation}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Coherence improvements — renamed from "Consistency With Your
              Earlier Stages". The AI prompt now writes consistencyCheck
              entries as improvements to make ("Aligning the system title
              used throughout the paper") rather than "X vs Y" mismatch
              comparisons, so the heading and copy here reflect that: this
              reads as a punch list of fixes, not a pass/fail diff. The
              underlying data shape (check/result/severity/detail) and the
              CONSISTENCY_STYLES color mapping are unchanged — only the
              framing text changed. */}
          <div className="rounded-2xl border border-gray-200 p-5 bg-white shadow-sm">
            <h3 className="text-sm font-semibold mb-1" style={{ color: '#0B1C33' }}>
              Coherence Improvements
            </h3>
            <p className="text-xs text-gray-500 mb-3 leading-relaxed">
              Places where the paper isn't holding together as one coherent
              document yet, and what to change to fix it.
            </p>
            <div className="flex flex-col gap-3">
              {displayedPaperReview.consistencyCheck?.map((entry, i) => {
                const style = CONSISTENCY_STYLES[entry.result]
                return (
                  <div
                    key={i}
                    className="border border-gray-100 rounded-xl p-3.5 hover:border-gray-200 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-sm font-medium" style={{ color: '#0B1C33' }}>
                        {entry.check}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* severity is newer on some rows and may be absent
                            on older saved reviews — only render if present */}
                        {entry.severity && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                            {entry.severity}
                          </span>
                        )}
                        <span
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: style.bg, color: style.color }}
                        >
                          {style.label}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">{entry.detail}</p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Methodology check */}
          {displayedPaperReview.methodologyCheck && (
            <div className="rounded-2xl border border-gray-200 p-5 bg-white shadow-sm">
              <h3 className="text-sm font-semibold mb-1" style={{ color: '#0B1C33' }}>
                Methodology Check
              </h3>
              <p className="text-xs text-gray-500 mb-3 leading-relaxed">
                {displayedPaperReview.methodologyCheck.status}
              </p>

              {(displayedPaperReview.methodologyCheck.issues?.length ?? 0) > 0 && (
                <ul className="flex flex-col gap-2 mb-3">
                  {displayedPaperReview.methodologyCheck.issues?.map((issue, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700 leading-relaxed">
                      <AlertTriangle size={14} className="mt-0.5 shrink-0" style={{ color: '#BA7517' }} />
                      {issue}
                    </li>
                  ))}
                </ul>
              )}

              {(displayedPaperReview.methodologyCheck.recommendations?.length ?? 0) > 0 && (
                <div className="pt-3 border-t border-gray-100">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2 flex items-center gap-1.5">
                    <Lightbulb size={12} style={{ color: '#BA7517' }} />
                    How to Improve
                  </h4>
                  <ul className="flex flex-col gap-1.5">
                    {displayedPaperReview.methodologyCheck.recommendations?.map((rec, i) => (
                      <li key={i} className="text-xs text-gray-600 leading-relaxed">
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Citation audit */}
          <div className="rounded-2xl border border-gray-200 p-5 bg-white shadow-sm">
            <h3 className="text-sm font-semibold mb-1" style={{ color: '#0B1C33' }}>
              Citation Audit
            </h3>
            <p className="text-xs text-gray-500 mb-3 leading-relaxed">
              {displayedPaperReview.citationAudit?.status}
            </p>
            <ul className="flex flex-col gap-2">
              {displayedPaperReview.citationAudit?.issuesFound?.map((issue, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700 leading-relaxed">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0" style={{ color: '#BA7517' }} />
                  {issue}
                </li>
              ))}
              {displayedPaperReview.citationAudit?.issuesFound?.length === 0 && (
                <li className="flex items-center gap-2 text-sm" style={{ color: '#27500A' }}>
                  <CheckCircle2 size={14} />
                  No citation issues found.
                </li>
              )}
            </ul>

            {/* recommendations is a newer field alongside issuesFound —
                render it as a separate list when present */}
            {(displayedPaperReview.citationAudit?.recommendations?.length ?? 0) > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2 flex items-center gap-1.5">
                  <Lightbulb size={12} style={{ color: '#BA7517' }} />
                  How to Improve
                </h4>
                <ul className="flex flex-col gap-1.5">
                  {displayedPaperReview.citationAudit?.recommendations?.map((rec, i) => (
                    <li key={i} className="text-xs text-gray-600 leading-relaxed">
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Content quality */}
          {displayedPaperReview.contentQuality && (
            <div className="rounded-2xl border border-gray-200 p-5 bg-white shadow-sm">
              <h3 className="text-sm font-semibold mb-3" style={{ color: '#0B1C33' }}>
                Content Quality
              </h3>

              {(displayedPaperReview.contentQuality.strengths?.length ?? 0) > 0 && (
                <div className="mb-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
                    Strengths
                  </h4>
                  <ul className="flex flex-col gap-1.5">
                    {displayedPaperReview.contentQuality.strengths?.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm leading-relaxed" style={{ color: '#27500A' }}>
                        <CheckCircle2 size={14} className="mt-0.5 shrink-0" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {(displayedPaperReview.contentQuality.weaknesses?.length ?? 0) > 0 && (
                <div className="mb-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
                    Weaknesses
                  </h4>
                  <ul className="flex flex-col gap-1.5">
                    {displayedPaperReview.contentQuality.weaknesses?.map((w, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700 leading-relaxed">
                        <AlertTriangle size={14} className="mt-0.5 shrink-0" style={{ color: '#BA7517' }} />
                        {w}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {(displayedPaperReview.contentQuality.contradictions?.length ?? 0) > 0 && (
                <div className="pt-3 border-t border-gray-100">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
                    Contradictions
                  </h4>
                  <ul className="flex flex-col gap-1.5">
                    {displayedPaperReview.contentQuality.contradictions?.map((c, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm leading-relaxed" style={{ color: '#7A2020' }}>
                        <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Writing quality */}
          {displayedPaperReview.writingQuality && (
            <div className="rounded-2xl border border-gray-200 p-5 bg-white shadow-sm">
              <h3 className="text-sm font-semibold mb-3" style={{ color: '#0B1C33' }}>
                Writing Quality
              </h3>

              {(displayedPaperReview.writingQuality.majorIssues?.length ?? 0) > 0 && (
                <div className="mb-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
                    Major Issues
                  </h4>
                  <ul className="flex flex-col gap-1.5">
                    {displayedPaperReview.writingQuality.majorIssues?.map((issue, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700 leading-relaxed">
                        <AlertTriangle size={14} className="mt-0.5 shrink-0" style={{ color: '#7A2020' }} />
                        {issue}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {(displayedPaperReview.writingQuality.minorIssues?.length ?? 0) > 0 && (
                <div className="pt-3 border-t border-gray-100">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
                    Minor Issues
                  </h4>
                  <ul className="flex flex-col gap-1.5">
                    {displayedPaperReview.writingQuality.minorIssues?.map((issue, i) => (
                      <li key={i} className="text-xs text-gray-600 leading-relaxed">
                        {issue}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Structural compliance — read directly from structuralCompliance
              (missing[], requiredSectionsTotal, requiredSectionsPresent)
              rather than derived from a sectionCheck array, since that's
              the summary useProgressiveTrial actually provides. */}
          <div className="rounded-2xl border border-gray-200 p-5 bg-white shadow-sm">
            <h3 className="text-sm font-semibold mb-3" style={{ color: '#0B1C33' }}>
              Structural Compliance
            </h3>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">
                {requiredSectionsPresent} of {requiredSectionsTotal} required sections present
              </p>
              <span className="text-xs font-semibold" style={{ color: '#BA7517' }}>
                {compliancePct}%
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 mb-3 overflow-hidden">
              <div
                className="h-2 rounded-full transition-all duration-500"
                style={{
                  backgroundColor: '#BA7517',
                  width: `${compliancePct}%`,
                }}
              />
            </div>
            {missingSections.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {missingSections.map((section, i) => (
                  <span
                    key={i}
                    className="text-xs px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: '#FBEAEA', color: '#7A2020' }}
                  >
                    Missing: {section}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  )
}

export default PaperReview