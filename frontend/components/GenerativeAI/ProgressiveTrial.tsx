'use client'
import { useState } from 'react'
import { STAGES } from '@/hooks/constants'
import { useProgressiveTrial } from '@/hooks/useProgressiveTrial'
import { Microscope, Briefcase, Check, Lock, ArrowRight, HelpCircle } from 'lucide-react'
import { TopicSelectionStage } from './Progressive-components/TopicSelection'
import { LiteratureReviewStage } from './Progressive-components/LiteraturestageReview'
import { MethodologyStage } from './Progressive-components/Methodology'
import { DataCollectionStage } from './Progressive-components/DataCollection'
import PaperReview from './Progressive-components/PaperReview'
import ProgressiveTrailGuideModal from '../Modal/Progressivetrailguidemodal '
import EntrepProgressiveTrailGuideModal from '../Modal/EntrepProgressiveTrailGuideModal'
import EntrepProgressive from './EntrepProgressive'
import WordDocument from './Progressive-components/WordSheet'
// import EntrepProgressive from '../EntrepProgressive'

function ProgressiveTrial() {
  const [track, setTrack] = useState<'research' | 'entrep'>('research')
  const [showGuide, setShowGuide] = useState(false)
  const [paperSeedTitle, setPaperSeedTitle] = useState('')

  const t = useProgressiveTrial()
  const activeLabel = STAGES.find((s) => s.key === t.activeStage)?.label ?? ''
  const previousLabel = STAGES[t.activeIndex - 1]?.label
  const stageLocked = t.activeStage === 'write-paper' ? false : t.isStageLocked(t.activeStage)

  return (
    <div className="sm:px-4 px-3 py-10 space-y-8" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* ── Hero ── */}
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

          {/* ── Stage tabs ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
            {STAGES.map((stage, i) => {
              const Icon = stage.icon
              const isActive = stage.key === t.activeStage
              const isDone = t.completedStages.has(stage.key)
              const isLocked = stage.key === 'write-paper' ? false : !isActive && !isDone && t.isStageLocked(stage.key)

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
                  {stage.key !== 'write-paper' && (
                    <span
                      className="absolute top-1.5 left-2 text-[10px] leading-none"
                      style={{ color: isActive ? '#FFFFFF' : isLocked ? '#C7C6C1' : '#000000' }}
                    >
                      Step {i + 1}
                    </span>
                  )}

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
              errorMessage={t.message}
              savedTopics={t.topicSelectionHistory}
              savedTopicsLoading={t.topicHistoryLoading}
              selectedTopicId={t.selectedTopicId}
              onSelectSavedTopic={t.handleSelectSavedTopic}
              onDeleteSavedTopic={t.handleDeleteSavedTopic}
              guidance={t.displayedGuidance}
              onContinue={() => t.setActiveStage('literature')}
              onSendToPaper={setPaperSeedTitle}
            />
          ) : t.activeStage === 'literature' ? (
            <LiteratureReviewStage
              topic={t.topic}
              savedReviews={t.literatureReviewHistory}
              savedReviewsLoading={t.historyLoading}
              selectedReviewId={t.selectedReviewId}
              onSelectSavedReview={t.handleSelectSavedReview}
              onGenerateReview={t.handleGenerateReview}
              isLoading={t.isLiteratureLoading}
              errorMessage={t.message}
              review={t.displayedReview}
              sourceCount={t.displayedReview?.sourceCount}
              unverifiedDropped={t.displayedReview?.unverifiedDropped}
              onContinue={() => t.setActiveStage('methodology')}
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
              errorMessage={t.message}
              objective={t.methodologyObjective}
              onObjectiveChange={t.setMethodologyObjective}
              methodology={t.displayedMethodology}
              onContinue={() => t.setActiveStage('collection')}
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
              errorMessage={t.message}
              result={t.displayedDataAnalysis}
              history={t.dataAnalysisHistory}
              historyLoading={t.dataAnalysesLoading}
              historyTotal={t.dataAnalysesTotal}
              hasMore={t.hasMoreDataAnalyses}
              onLoadMore={t.handleLoadMoreDataAnalyses}
              selectedId={t.selectedDataAnalysisId}
              onSelectSaved={t.handleSelectSavedDataAnalysis}
              onContinue={() => t.setActiveStage('paper-review')}
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
              message={t.message}
            />
          ) : t.activeStage === 'write-paper' ? (
            <WordDocument initialTitle={paperSeedTitle} />
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