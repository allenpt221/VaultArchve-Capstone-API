'use client'
import { useState } from 'react'
import { STAGES } from '@/hooks/constants'
import { useProgressiveTrial } from '@/hooks/useProgressiveTrial'
import { Microscope, Briefcase, Check, Lock, ArrowRight, HelpCircle, ShieldCheck } from 'lucide-react'
import { TopicSelectionStage } from './Progressive-components/TopicSelection'
import { LiteratureReviewStage } from './Progressive-components/LiteraturestageReview'
import { MethodologyStage } from './Progressive-components/Methodology'
import { DataCollectionStage } from './Progressive-components/DataCollection'
import PaperReview from './Progressive-components/PaperReview'
import ProgressiveTrailGuideModal from '../Modal/Progressivetrailguidemodal '
import EntrepProgressiveTrailGuideModal from '../Modal/EntrepProgressiveTrailGuideModal'
import EntrepProgressive from './EntrepProgressive'
import { ObjectivesSuggestionPanel } from './Progressive-components/ObjectiveStudy'
import PlagiarismModal from '../PlagiarismStage'
// import EntrepProgressive from '../EntrepProgressive'

function ProgressiveTrial() {
  const [track, setTrack] = useState<'research' | 'entrep'>('research')
  const [showGuide, setShowGuide] = useState(false)
  const [showPlagiarismCheck, setShowPlagiarismCheck] = useState(false)

  const t = useProgressiveTrial()
  const activeLabel = STAGES.find((s) => s.key === t.activeStage)?.label ?? ''
  const previousLabel = STAGES[t.activeIndex - 1]?.label
  const stageLocked = t.isStageLocked(t.activeStage)

  return (
    <div className="sm:px-4 px-3 py-10 space-y-8" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="text-center space-y-3">
        <div className="flex items-center justify-center gap-2">
          {track === 'research' ? (
            <Microscope className="w-4 h-4" style={{ color: '#BA7517' }} />
          ) : (
            <Briefcase className="w-4 h-4" style={{ color: '#BA7517' }} />
          )}
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#BA7517', letterSpacing: '0.08em' }}>
            AI-Guided {track === 'research' ? 'Research' : 'Business Plan'}
          </p>
        </div>
        <h1 className="font-bold text-4xl" style={{ color: '#0B1C33' }}>
          Progressive Trail
        </h1>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          {track === 'research'
            ? 'A step-by-step roadmap to guide your research — with AI assistance at every stage.'
            : 'A step-by-step roadmap to build and validate your business plan — with AI assistance at every stage.'}
        </p>

        <div>
          <button
            type="button"
            onClick={() => setShowGuide(true)}
            className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-medium mx-auto"
            style={{ color: '#0B1C33' }}
          >
            <HelpCircle className="w-3.5 h-3.5" style={{ color: '#BA7517' }} />
            How does this work?
          </button>
        </div>

        {/* ── Track switcher ── */}
        <div
          className="inline-flex items-center rounded-full p-1 mt-2"
          style={{ background: '#F1EFEA', border: '1px solid rgba(0,0,0,0.06)' }}
        >
          <button
            onClick={() => setTrack('research')}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium transition-colors"
            style={{
              background: track === 'research' ? '#0B1C33' : 'transparent',
              color: track === 'research' ? '#FFFFFF' : '#6B6A65',
            }}
          >
            <Microscope className="w-3.5 h-3.5" />
            Research (APA)
          </button>
          <button
            onClick={() => setTrack('entrep')}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium transition-colors"
            style={{
              background: track === 'entrep' ? '#0B1C33' : 'transparent',
              color: track === 'entrep' ? '#FFFFFF' : '#6B6A65',
            }}
          >
            <Briefcase className="w-3.5 h-3.5" />
            Business Plan
          </button>
        </div>
      </div>

      {track === 'research' ? (
        <ProgressiveTrailGuideModal
          isOpen={showGuide}
          onClose={() => setShowGuide(false)}
          onGetStarted={() => t.setActiveStage('topic')}
        />
      ) : (
        <EntrepProgressiveTrailGuideModal
          isOpen={showGuide}
          onClose={() => setShowGuide(false)}
        />
      )}

      {track === 'entrep' ? (
        <EntrepProgressive />
      ) : (
        <div className="max-w-7xl mx-auto space-y-5">
          {/* ── Progress bar ── */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
              <span>Step {t.activeIndex + 1} of {STAGES.length}</span>
              <span>{t.percentComplete}% complete</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${t.percentComplete}%`, background: 'linear-gradient(90deg, #BA7517, #E5A93A)' }}
              />
            </div>
          </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setShowPlagiarismCheck(true)}
            className="group inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition-colors"
            style={{
              borderColor: 'rgba(186, 117, 23, 0.35)',
              background: '#FFFFFF',
              color: '#0B1C33',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#FBF3E7')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#FFFFFF')}
          >
            <ShieldCheck className="w-3.5 h-3.5" style={{ color: '#BA7517' }} />
            Check for Plagiarism
            <ArrowRight className="w-3 h-3 opacity-0 -translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0" style={{ color: '#BA7517' }} />
          </button>
        </div>

          {/* ── Stage tabs ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
            {STAGES.map((stage, i) => {
              const Icon = stage.icon
              const isActive = stage.key === t.activeStage
              const isDone = t.completedStages.has(stage.key)
              const isLocked = !isActive && !isDone && t.isStageLocked(stage.key)

              return (
                <button
                  key={stage.key}
                  onClick={() => !isLocked && t.setActiveStage(stage.key)}
                  disabled={isLocked}
                  aria-disabled={isLocked}
                  title={isLocked ? `Complete ${STAGES[i - 1]?.label} first` : undefined}
                  className="relative flex flex-col items-center gap-1.5 rounded-xl px-3 py-3 border transition-colors text-center disabled:cursor-not-allowed"
                  style={{
                    background: isActive ? '#0B1C33' : '#FFFFFF',
                    borderColor: isActive ? '#0B1C33' : 'rgba(0,0,0,0.08)',
                    cursor: isLocked ? 'not-allowed' : 'pointer',
                  }}
                >
                  <span
                    className="absolute top-1.5 left-2 text-[10px] leading-none"
                    style={{ color: isActive ? '#FFFFFF' : isLocked ? '#C7C6C1' : '#000000' }}
                  >
                    Step {i + 1}
                  </span>

                  <span className="relative">
                    <Icon className="w-4 h-4" style={{ color: isActive ? '#FFFFFF' : isLocked ? '#B0AFAA' : '#444441' }} />
                    {isDone && (
                      <span
                        className="absolute -top-1.5 -right-2 w-3 h-3 rounded-full flex items-center justify-center"
                        style={{ background: '#3B6D11' }}
                      >
                        <Check className="w-2 h-2 text-white" strokeWidth={3} />
                      </span>
                    )}
                  </span>
                  <span className="text-xs font-medium leading-tight" style={{ color: isActive ? '#FFFFFF' : isLocked ? '#B0AFAA' : '#1A1A1A' }}>
                    {stage.label}
                  </span>
                </button>
              )
            })}
          </div>

          <PlagiarismModal
            isOpen={showPlagiarismCheck}
            onClose={() => setShowPlagiarismCheck(false)}
          />

          {/* ── Stage content ── */}
          {stageLocked ? (
            <div className="rounded-xl border bg-white p-10 text-center space-y-2" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
              <Lock className="w-5 h-5 mx-auto text-muted-foreground" />
              <p className="text-sm font-medium">{activeLabel} is locked.</p>
              <p className="text-xs text-muted-foreground">Complete {previousLabel} first to unlock this stage.</p>
            </div>
          ) : t.activeStage === 'topic' ? (
            <TopicSelectionStage
              topic={t.topic}
              onTopicChange={t.setTopic}
              context={t.context}
              onContextChange={t.setContext}
              onGetGuidance={t.handleGetGuidance}
              isLoading={t.isTopicLoading}
              errorMessage={t.topicError}
              savedTopics={t.topicSelectionHistory}
              savedTopicsLoading={t.topicHistoryLoading}
              selectedTopicId={t.selectedTopicId}
              onSelectSavedTopic={t.handleSelectSavedTopic}
              onDeleteSavedTopic={t.handleDeleteSavedTopic}
              guidance={t.displayedGuidance}
              onContinue={() => t.setActiveStage('objective')}
              limitedUntil={t.topicLimitedUntil}
              countdown={t.topicCountdown}
            />
          ) : t.activeStage === 'objective' ? (
            <ObjectivesSuggestionPanel
                topic={t.topic}
                context={t.context}
                onContextChange={t.setContext}
                isLoading={t.objectivesLoading}
                objectives={t.objectives}
                errorMessage={t.objectiveError}
                onGenerate={t.handleSuggestObjectives}
                onContinue={() => t.setActiveStage('literature')}
                limitedUntil={t.objectiveLimitedUntil}
                countdown={t.objectiveCountdown}
            />
          )  : t.activeStage === 'literature' ? (
            <LiteratureReviewStage
              topic={t.topic}
              savedReviews={t.literatureReviewHistory}
              savedReviewsLoading={t.historyLoading}
              selectedReviewId={t.selectedReviewId}
              onSelectSavedReview={t.handleSelectSavedReview}
              onGenerateReview={t.handleGenerateReview}
              isLoading={t.isLiteratureLoading}
              errorMessage={t.literatureError}
              review={t.displayedReview}
              sourceCount={t.displayedReview?.sourceCount}
              unverifiedDropped={t.displayedReview?.unverifiedDropped}
              onContinue={() => t.setActiveStage('methodology')}
              limitedUntil={t.literatureLimitedUntil}
              countdown={t.literatureCountdown}
            />
          ) : t.activeStage === 'methodology' ? (
            <MethodologyStage
              topic={t.topic}
              savedMethodologies={t.methodologyHistory}
              savedMethodologiesLoading={t.methodologyHistoryLoading}
              selectedMethodologyId={t.selectedMethodologyId}
              onSelectSavedMethodology={t.handleSelectSavedMethodology}
              researchQuestions={t.researchQuestions}
              researchQuestionInput={t.researchQuestionInput}
              onResearchQuestionInputChange={t.setResearchQuestionInput}
              onAddResearchQuestion={t.handleAddResearchQuestion}
              onRemoveResearchQuestion={t.handleRemoveResearchQuestion}
              context={t.methodologyContext}
              onContextChange={t.setMethodologyContext}
              onGenerateMethodology={t.handleGenerateMethodology}
              isLoading={t.isMethodologyLoading}
              errorMessage={t.methodologyError}
              methodology={t.displayedMethodology}
              onContinue={() => t.setActiveStage('collection')}
              objective={t.methodologyObjective}
              onObjectiveChange={t.setMethodologyObjective}
              limitedUntil={t.methodologyLimitedUntil}
              countdown={t.methodologyCountdown}
            />
          ) : t.activeStage === 'collection' ? (
            <DataCollectionStage
              topic={t.topic}
              approach={t.dataCollectionApproach}
              onApproachChange={t.setDataCollectionApproach}
              researchQuestions={t.researchQuestions}
              researchQuestionInput={t.researchQuestionInput}
              onResearchQuestionInputChange={t.setResearchQuestionInput}
              onAddResearchQuestion={t.handleAddResearchQuestion}
              onRemoveResearchQuestion={t.handleRemoveResearchQuestion}
              gapStatement={t.gapStatement}
              onGapStatementChange={t.setGapStatement}
              rawFindings={t.rawFindings}
              onRawFindingsChange={t.setRawFindings}
              onGenerate={t.handleGenerateDataAnalysis}
              isLoading={t.isDataAnalysisLoading}
              errorMessage={t.dataCollectionError}
              result={t.displayedDataAnalysis}
              history={t.dataAnalysisHistory}
              historyLoading={t.dataAnalysesLoading}
              historyTotal={t.dataAnalysesTotal}
              hasMore={t.hasMoreDataAnalyses}
              onLoadMore={t.handleLoadMoreDataAnalyses}
              selectedId={t.selectedDataAnalysisId}
              onSelectSaved={t.handleSelectSavedDataAnalysis}
              onContinue={() => t.setActiveStage('paper-review')}
              limitedUntil={t.collectionLimitedUntil}
              countdown={t.collectionCountdown}
            />
          ) : t.activeStage === 'paper-review' ? (
            <PaperReview
              topic={t.topic}
              paperFile={t.paperFile}
              setPaperFile={t.setPaperFile}
              handleUploadPaperReview={t.handleUploadPaperReview}
              isPaperReviewLoading={t.isPaperReviewLoading}
              fullPaperReviewHistory={t.fullPaperReviewHistory}
              fullPaperReviewHistoryLoading={t.fullPaperReviewHistoryLoading}
              hasMorePaperReviews={t.hasMorePaperReviews}
              handleLoadMorePaperReviews={t.handleLoadMorePaperReviews}
              selectedPaperReviewId={t.selectedPaperReviewId}
              handleSelectSavedPaperReview={t.handleSelectSavedPaperReview}
              displayedPaperReview={t.displayedPaperReview}
              message={t.paperReviewError}
              errorMessage={t.paperReviewError}
              limitedUntil={t.paperReviewLimitedUntil}
              countdown={t.paperReviewCountdown}
            />
          ) : (
            <div className="rounded-xl border bg-white p-10 text-center space-y-2" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
              <Lock className="w-5 h-5 mx-auto text-muted-foreground" />
              <p className="text-sm font-medium">{activeLabel} is coming soon.</p>
              <p className="text-xs text-muted-foreground">This stage's AI guidance isn't wired up yet.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ProgressiveTrial