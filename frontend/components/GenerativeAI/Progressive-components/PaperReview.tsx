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
}

function PaperReview({
  topic,
  paperFile,
  setPaperFile,
  handleUploadPaperReview,
  isPaperReviewLoading,
  fullPaperReviewHistory,
  fullPaperReviewHistoryLoading,
  hasMorePaperReviews,
  handleLoadMorePaperReviews,
  selectedPaperReviewId,
  handleSelectSavedPaperReview,
  displayedPaperReview,
  message,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Which submission method is currently shown — only one at a time.
  const [submissionMode, setSubmissionMode] = useState<SubmissionMode>('pdf')

  // Manual section text — an alternative (or supplement) to uploading a PDF.
  const [manualSections, setManualSections] = useState<ManualSectionValues>(EMPTY_MANUAL_SECTIONS)

  const hasManualText = Object.values(manualSections).some((v) => v.trim().length > 0)

  // canSubmit only looks at whichever mode is currently active — if the
  // user typed manual sections, then switched to the PDF tab without
  // uploading anything, the button correctly disables rather than silently
  // submitting the manual text they can no longer see.
  const canSubmit =
    !isPaperReviewLoading && (submissionMode === 'pdf' ? !!paperFile : hasManualText)

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

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold" style={{ color: '#0B1C33' }}>
          Review & Submit
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Upload your full thesis draft as a PDF, or type in your chapters manually. We'll
          check its structure, cross-check it against your earlier stages, and audit
          citations before you submit.
        </p>
      </div>

      {topic && (
        <div className="rounded-lg px-3.5 py-2.5" style={{ background: 'rgba(11,28,51,0.04)' }}>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-0.5">
            Reviewing paper for
          </p>
          <p className="text-sm font-medium" style={{ color: '#0B1C33' }}>
            {topic}
          </p>
        </div>
      )}

      {selectedPaperReviewId && (
        <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: '#633806' }}>
          <History className="w-3.5 h-3.5" />
          Showing a saved review for this topic
        </div>
      )}

      {/* Option 1 / Option 2 toggle — only one submission method is shown
          and submitted at a time. */}
      <div
        className="inline-flex self-start rounded-lg border p-1 gap-1"
        style={{ borderColor: 'rgba(0,0,0,0.08)' }}
        role="tablist"
        aria-label="Choose submission method"
      >
        <button
          type="button"
          role="tab"
          aria-selected={submissionMode === 'pdf'}
          onClick={() => setSubmissionMode('pdf')}
          className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors"
          style={{
            background: submissionMode === 'pdf' ? '#0B1C33' : 'transparent',
            color: submissionMode === 'pdf' ? '#FFFFFF' : '#444441',
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
          className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors"
          style={{
            background: submissionMode === 'manual' ? '#0B1C33' : 'transparent',
            color: submissionMode === 'manual' ? '#FFFFFF' : '#444441',
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
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center gap-3 cursor-pointer transition-colors"
            style={{ borderColor: paperFile ? '#BA7517' : '#D1D5DB' }}
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
                <UploadCloud size={32} style={{ color: '#0B1C33' }} />
                <p className="text-sm font-medium" style={{ color: '#0B1C33' }}>
                  Drag & drop your thesis PDF, or click to browse
                </p>
                <p className="text-xs text-gray-400">PDF only, up to {MAX_PDF_SIZE_MB}MB</p>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <FileText size={24} style={{ color: '#BA7517' }} />
                <span className="text-sm font-medium" style={{ color: '#0B1C33' }}>
                  {paperFile.name}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setPaperFile(null)
                  }}
                  className="text-gray-400 hover:text-red-500"
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Manual section entry — only rendered in manual mode */}
      {submissionMode === 'manual' && (
        <div className="rounded-xl border border-gray-200 p-5 flex flex-col gap-4">
          <p className="text-xs text-gray-500 -mt-1">
            No PDF yet? Paste or type each chapter below — fill in as many as you have. Each
            box lists the subsections it should cover so we can check them individually.
          </p>
          {MANUAL_SECTIONS.map(({ key, label, hint }) => (
            <div key={key} className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                {label}
              </label>
              <p className="text-[11px] text-gray-400 leading-snug">{hint}</p>
              <textarea
                value={manualSections[key]}
                onChange={(e) => handleManualSectionChange(key, e.target.value)}
                placeholder={`Paste ${label.toLowerCase()} here...`}
                rows={6}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-amber-500 resize-y"
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
        className="self-start px-5 py-2.5 rounded-lg text-sm font-medium text-white flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ backgroundColor: '#0B1C33' }}
      >
        {isPaperReviewLoading ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Reviewing your paper...
          </>
        ) : (
          'Run Full Paper Review'
        )}
      </button>
      {!canSubmit && !isPaperReviewLoading && (
        <p className="text-xs text-gray-400 -mt-4">
          {submissionMode === 'pdf'
            ? 'Upload a PDF to continue.'
            : 'Fill in at least one chapter above to continue.'}
        </p>
      )}

      {message && (
        <p className="text-sm" style={{ color: '#7A2020' }}>
          {message}
        </p>
      )}

      {/* Results */}
      {displayedPaperReview && (
        <div className="flex flex-col gap-6 mt-2">
          {/* Overall readiness */}
          <div className="rounded-xl p-5 flex items-center justify-between" style={{ backgroundColor: '#0B1C33' }}>
            <div className="flex items-center gap-3">
              <Gauge size={22} className="text-amber-400" />
              <div>
                <p className="text-xs text-gray-300">Overall Readiness</p>
                <p className="text-2xl font-semibold text-white">
                  {displayedPaperReview.overallReadiness?.score}
                </p>
              </div>
            </div>
          </div>

          {displayedPaperReview.overallReadiness?.topPriorityFixes?.length > 0 && (
            <div className="rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold mb-3" style={{ color: '#0B1C33' }}>
                Top Priority Fixes
              </h3>
              <ul className="flex flex-col gap-2">
                {displayedPaperReview.overallReadiness.topPriorityFixes.map((fix, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <AlertTriangle size={14} className="mt-0.5 shrink-0" style={{ color: '#BA7517' }} />
                    {fix}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Chapter detection */}
          <div className="rounded-xl border border-gray-200 p-5">
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
            {displayedPaperReview.chapterDetection?.missingOrUnclear?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {displayedPaperReview.chapterDetection.missingOrUnclear.map((ch, i) => (
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

          {/* Consistency check */}
          <div className="rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold mb-3" style={{ color: '#0B1C33' }}>
              Consistency With Your Earlier Stages
            </h3>
            <div className="flex flex-col gap-3">
              {displayedPaperReview.consistencyCheck?.map((entry, i) => {
                const style = CONSISTENCY_STYLES[entry.result]
                return (
                  <div key={i} className="border border-gray-100 rounded-lg p-3">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-sm font-medium" style={{ color: '#0B1C33' }}>
                        {entry.check}
                      </span>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full shrink-0"
                        style={{ backgroundColor: style.bg, color: style.color }}
                      >
                        {style.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{entry.detail}</p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Citation audit */}
          <div className="rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold mb-1" style={{ color: '#0B1C33' }}>
              Citation Audit
            </h3>
            <p className="text-xs text-gray-500 mb-3">
              {displayedPaperReview.citationAudit?.status}
            </p>
            <ul className="flex flex-col gap-2">
              {displayedPaperReview.citationAudit?.issuesFound?.map((issue, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
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
          </div>

          {/* Structural compliance */}
          <div className="rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold mb-3" style={{ color: '#0B1C33' }}>
              Structural Compliance
            </h3>
            <p className="text-sm text-gray-600 mb-2">
              {displayedPaperReview.structuralCompliance?.requiredSectionsPresent} of{' '}
              {displayedPaperReview.structuralCompliance?.requiredSectionsTotal} required sections present
            </p>
            <div className="w-full bg-gray-100 rounded-full h-2 mb-3">
              <div
                className="h-2 rounded-full"
                style={{
                  backgroundColor: '#BA7517',
                  width: `${
                    ((displayedPaperReview.structuralCompliance?.requiredSectionsPresent ?? 0) /
                      Math.max(1, displayedPaperReview.structuralCompliance?.requiredSectionsTotal ?? 1)) *
                    100
                  }%`,
                }}
              />
            </div>
            {displayedPaperReview.structuralCompliance?.missing?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {displayedPaperReview.structuralCompliance.missing.map((s, i) => (
                  <span
                    key={i}
                    className="text-xs px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: '#FBEAEA', color: '#7A2020' }}
                  >
                    Missing: {s}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* History */}
      <div className="mt-4">
        <h3 className="text-sm font-semibold mb-3" style={{ color: '#0B1C33' }}>
          Past Reviews
        </h3>

        {fullPaperReviewHistoryLoading && fullPaperReviewHistory.length === 0 ? (
          <p className="text-sm text-gray-400">Loading history...</p>
        ) : fullPaperReviewHistory.length === 0 ? (
          <p className="text-sm text-gray-400">No paper reviews yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {fullPaperReviewHistory.map((review) => (
              <div
                key={review.id}
                onClick={() => handleSelectSavedPaperReview(review.id)}
                className="flex items-center justify-between border rounded-lg px-4 py-3 cursor-pointer transition-colors"
                style={{
                  borderColor: selectedPaperReviewId === review.id ? '#BA7517' : '#E5E7EB',
                  backgroundColor: selectedPaperReviewId === review.id ? '#FDF6EC' : 'white',
                }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <FileText size={16} style={{ color: '#0B1C33' }} className="shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: '#0B1C33' }}>
                      {review.file_name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(review.created_at).toLocaleDateString()} ·{' '}
                      {review.overall_readiness?.score}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {hasMorePaperReviews && (
              <button
                type="button"
                onClick={handleLoadMorePaperReviews}
                disabled={fullPaperReviewHistoryLoading}
                className="text-sm font-medium mt-2 self-start"
                style={{ color: '#BA7517' }}
              >
                {fullPaperReviewHistoryLoading ? 'Loading...' : 'Load more'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default PaperReview