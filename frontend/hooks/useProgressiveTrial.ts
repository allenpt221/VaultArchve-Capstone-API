'use client'
import { generativeStore } from '@/Stores/generativeStore'
import { useEffect, useMemo, useState, type MouseEvent } from 'react'
import { MAX_RESEARCH_QUESTIONS, MIN_RESEARCH_QUESTIONS, STAGES, type StageKey } from './constants'
import type { MethodologyApproach } from './types'

export function useProgressiveTrial() {
  const [activeStage, setActiveStage] = useState<StageKey>('topic')
  const [completedStages, setCompletedStages] = useState<Set<StageKey>>(new Set())

  const {
    TopicSelectionAI,
    LiteratureReviewAI,
    MethodologyAI,
    DataAnalysisAI,
    FullPaperReviewAI,
    GetLiteratureReviews,
    GetTopicSelections,
    GetMethodologies,
    GetDataAnalyses,
    GetFullPaperReviews,
    DeleteTopicSelection,
    topicGuidance,
    literatureReview,
    methodology,
    dataAnalysis,
    fullPaperReview,
    literatureReviewHistory,
    topicSelectionHistory,
    methodologyHistory,
    dataAnalysisHistory,
    fullPaperReviewHistory,
    historyLoading,
    topicHistoryLoading,
    methodologyHistoryLoading,
    dataAnalysesLoading,
    dataAnalysesTotal,
    dataAnalysesLimit,
    dataAnalysesOffset,
    fullPaperReviewLoading,
    fullPaperReviewHistoryLoading,
    fullPaperReviewsTotal,
    fullPaperReviewsLimit,
    fullPaperReviewsOffset,
    loading,
    message,
  } = generativeStore()


  const TOPIC_STORAGE_KEY = 'progressiveTrail:topic'
  const STAGE_STORAGE_KEY = 'progressiveTrail:activeStage'
  const RESEARCH_QUESTIONS_STORAGE_KEY = 'progressiveTrail:researchQuestions'

  // Topic Selection stage — form inputs
  const [topic, setTopic] = useState('')
  const [context, setContext] = useState('')

  // Shared between Methodology and Data Collection — research questions
  // are used by both stages, so this state isn't scoped to just one of them.
  const [researchQuestions, setResearchQuestions] = useState<string[]>(() => {
    if (typeof window === 'undefined') return []
    try {
      const saved = localStorage.getItem(RESEARCH_QUESTIONS_STORAGE_KEY)
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })
  const [researchQuestionInput, setResearchQuestionInput] = useState('')
  const [methodologyContext, setMethodologyContext] = useState('')

  // Data Collection stage — form inputs
  const [dataCollectionApproach, setDataCollectionApproach] = useState<MethodologyApproach | ''>('')
  const [gapStatement, setGapStatement] = useState('')
  const [rawFindings, setRawFindings] = useState('')

  // Review & Submit stage — form inputs
  const [paperFile, setPaperFile] = useState<File | null>(null)

  // Which saved record (from the database) is currently selected for viewing, if any
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null)
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null)
  const [selectedMethodologyId, setSelectedMethodologyId] = useState<string | null>(null)
  const [selectedDataAnalysisId, setSelectedDataAnalysisId] = useState<string | null>(null)
  const [selectedPaperReviewId, setSelectedPaperReviewId] = useState<string | null>(null)

  const activeIndex = STAGES.findIndex((s) => s.key === activeStage)
  const percentComplete = Math.round((completedStages.size / STAGES.length) * 100)

  // Load the user's saved literature reviews, topic selections, and
  // methodologies on mount. Data Analyses and Full Paper Reviews are also
  // loaded eagerly here (not lazily when their stage becomes active) so the
  // topic-match effect below has data to match against as soon as a topic
  // is typed or selected, no matter which stage the user is currently on.
  useEffect(() => {
    GetLiteratureReviews()
    GetTopicSelections()
    GetMethodologies()
    GetDataAnalyses({ limit: 20, offset: 0 })
    GetFullPaperReviews({ limit: 20, offset: 0 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    localStorage.setItem(TOPIC_STORAGE_KEY, topic)
  }, [topic])

  useEffect(() => {
    localStorage.setItem(STAGE_STORAGE_KEY, activeStage)
  }, [activeStage])

  useEffect(() => {                                                          // ← add this block
    localStorage.setItem(RESEARCH_QUESTIONS_STORAGE_KEY, JSON.stringify(researchQuestions))
  }, [researchQuestions])

  // ── Auto-match saved work to the current topic ────────────────────
  // If the current topic text matches a saved topic guidance, literature
  // review, methodology, data analysis, or paper review, that record is
  // automatically selected and its stage marked complete. This means a
  // returning user who already did earlier stages for a title doesn't
  // have to manually reselect anything — later stages unlock and populate
  // on their own once a match is recognized.
  //
  // NOTE on Full Paper Review: matching relies on a `topic` field on the
  // saved record (SavedFullPaperReview.topic). FullPaperReviewAI now sends
  // `topic` in the multipart form data (see generativeStore.ts) so the
  // backend can persist it — make sure the /ai/paper-reviews endpoint
  // actually stores and returns that field, or this match will never fire.
  //
  // If the topic text is later changed to something that no longer matches
  // the currently-selected saved record, that selection is cleared and the
  // stage is un-marked complete — the "done" check only holds while the
  // topic text actually matches.
  useEffect(() => {
    if (loading) return
    const normalizedTopic = topic.trim().toLowerCase()

    let topicStillValid = false
    if (selectedTopicId) {
      const saved = topicSelectionHistory.find((t) => t.id === selectedTopicId)
      if (saved && saved.topic.trim().toLowerCase() === normalizedTopic) {
        topicStillValid = true
      } else {
        setSelectedTopicId(null)
        unmarkComplete('topic')
      }
    }
    if (!topicStillValid && normalizedTopic) {
      const match = topicSelectionHistory.find(
        (t) => t.topic.trim().toLowerCase() === normalizedTopic
      )
      if (match) {
        setSelectedTopicId(match.id)
        markComplete('topic')
      }
    }

    let reviewStillValid = false
    if (selectedReviewId) {
      const saved = literatureReviewHistory.find((r) => r.id === selectedReviewId)
      if (saved && saved.topic.trim().toLowerCase() === normalizedTopic) {
        reviewStillValid = true
      } else {
        setSelectedReviewId(null)
        unmarkComplete('literature')
      }
    }
    if (!reviewStillValid && normalizedTopic) {
      const match = literatureReviewHistory.find(
        (r) => r.topic.trim().toLowerCase() === normalizedTopic
      )
      if (match) {
        setSelectedReviewId(match.id)
        markComplete('literature')
      }
    }

    let methodologyStillValid = false
    if (selectedMethodologyId) {
      const saved = methodologyHistory.find((m) => m.id === selectedMethodologyId)
      if (saved && saved.topic.trim().toLowerCase() === normalizedTopic) {
        methodologyStillValid = true
      } else {
        setSelectedMethodologyId(null)
        unmarkComplete('methodology')
      }
    }
    if (!methodologyStillValid && normalizedTopic) {
      const match = methodologyHistory.find(
        (m) => m.topic.trim().toLowerCase() === normalizedTopic
      )
      if (match) {
        setSelectedMethodologyId(match.id)
        markComplete('methodology')
      }
    }

    // Data Collection — matched by topic text, same as the stages above.
    // Also repopulates the form fields (approach, research questions, gap
    // statement, raw findings) from the matched record so the stage shows
    // the saved result immediately, without any click.
    let dataAnalysisStillValid = false
    if (selectedDataAnalysisId) {
      const saved = dataAnalysisHistory.find((d) => d.id === selectedDataAnalysisId)
      if (saved && saved.topic.trim().toLowerCase() === normalizedTopic) {
        dataAnalysisStillValid = true
      } else {
        setSelectedDataAnalysisId(null)
        unmarkComplete('collection')
      }
    }
    if (!dataAnalysisStillValid && normalizedTopic) {
      const match = dataAnalysisHistory.find(
        (d) => d.topic.trim().toLowerCase() === normalizedTopic
      )
      if (match) {
        setSelectedDataAnalysisId(match.id)
        setDataCollectionApproach(match.approach)
        setResearchQuestions(match.research_questions)
        setGapStatement(match.gap_statement || '')
        setRawFindings(match.raw_findings)
        markComplete('collection')
      }
    }

    // Full Paper Review — matched by topic text, same pattern. Nothing to
    // repopulate into a form here (the PDF/manual-section inputs aren't
    // meaningfully "restorable"), we just surface the saved review and
    // mark the stage complete.
    let paperReviewStillValid = false
    if (selectedPaperReviewId) {
      const saved = fullPaperReviewHistory.find((r) => r.id === selectedPaperReviewId)
      if (saved && (saved.topic ?? '').trim().toLowerCase() === normalizedTopic) {
        paperReviewStillValid = true
      } else {
        setSelectedPaperReviewId(null)
        unmarkComplete('paper-review')
      }
    }
    if (!paperReviewStillValid && normalizedTopic) {
      const match = fullPaperReviewHistory.find(
        (r) => (r.topic ?? '').trim().toLowerCase() === normalizedTopic
      )
      if (match) {
        setSelectedPaperReviewId(match.id)
        markComplete('paper-review')
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    topic,
    topicSelectionHistory,
    literatureReviewHistory,
    methodologyHistory,
    dataAnalysisHistory,
    fullPaperReviewHistory,
    loading,
  ])

  const handleLoadMoreDataAnalyses = () => {
    GetDataAnalyses({ limit: dataAnalysesLimit, offset: dataAnalysesOffset + dataAnalysesLimit })
  }

  const handleLoadMorePaperReviews = () => {
    GetFullPaperReviews({ limit: fullPaperReviewsLimit, offset: fullPaperReviewsOffset + fullPaperReviewsLimit })
  }

  // Default the approach picker to whatever Methodology already produced,
  // once, the first time it becomes available.
  useEffect(() => {
    if (!dataCollectionApproach && methodology?.approach) {
      setDataCollectionApproach(methodology.approach)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [methodology])

  // A stage is locked until the stage immediately before it is completed.
  const isStageLocked = (stageKey: StageKey) => {
    const i = STAGES.findIndex((s) => s.key === stageKey)
    if (i <= 0) return false
    return !completedStages.has(STAGES[i - 1].key)
  }

  const markComplete = (stage: StageKey) =>
    setCompletedStages((prev) => new Set(prev).add(stage))

  const unmarkComplete = (stage: StageKey) =>
    setCompletedStages((prev) => {
      const next = new Set(prev)
      next.delete(stage)
      return next
    })

  // ── Topic Selection handlers ──────────────────────────────────────
  const handleGetGuidance = async () => {
    if (!topic.trim() || loading) return
    setSelectedTopicId(null) // a fresh generation takes priority over any selected saved topic
    await TopicSelectionAI({ topic, context })
    if (generativeStore.getState().topicGuidance) {
      markComplete('topic')
      GetTopicSelections() // refresh the saved list so the new one shows up
    }
  }

  const handleSelectSavedTopic = (id: string) => {
    const saved = topicSelectionHistory.find((t) => t.id === id)
    if (!saved) return
    setSelectedTopicId(id)
    setTopic(saved.topic)
    setContext(saved.context || '')
    markComplete('topic')
  }

const handleDeleteSavedTopic = (e: MouseEvent, id: string) => {
  e.stopPropagation() // don't trigger the card's onClick (which selects it)

  const wasActiveTopic = selectedTopicId === id

  if (wasActiveTopic) {
    // Clear the topic stage itself
    setSelectedTopicId(null)
    unmarkComplete('topic')

    // Cascade: every later stage was generated against this topic's text.
    // Their saved records live in separate tables and won't self-clear
    // via the auto-match effect (that effect only re-checks a stage
    // against its OWN history, not against whether the topic itself
    // still exists) — so we unmark them explicitly here.
    setSelectedReviewId(null)
    unmarkComplete('literature')
    setSelectedMethodologyId(null)
    unmarkComplete('methodology')
    setSelectedDataAnalysisId(null)
    unmarkComplete('collection')
    setSelectedPaperReviewId(null)
    unmarkComplete('paper-review')

    // Reset the topic text too, so the stepper doesn't sit there still
    // "matching" a topic string that no longer has a saved record behind it.
    setTopic('')
    setContext('')
  }

  DeleteTopicSelection(id)
}



  // The guidance currently on screen: a saved one from the database, or a freshly
  // generated one — normalized to the same shape either way.
  const displayedGuidance = useMemo(() => {
    if (selectedTopicId) {
      const saved = topicSelectionHistory.find((t) => t.id === selectedTopicId)
      if (saved) {
        return {
          feedback: saved.feedback,
          feasibility: saved.feasibility,
          refinedTopics: saved.refined_topics,
          suggestedResearchQuestions: saved.suggested_research_questions,
          nextSteps: saved.next_steps,
        }
      }
    }
    return topicGuidance
  }, [selectedTopicId, topicSelectionHistory, topicGuidance])

  // ── Literature Review handlers ────────────────────────────────────
  // The AI now finds and verifies real sources itself via web search —
  // the user just supplies a topic, so there's no manual source form anymore.
  const handleGenerateReview = async () => {
    if (!topic.trim() || loading) return
    setSelectedReviewId(null) // a fresh generation takes priority over any selected saved review
    await LiteratureReviewAI({ topic })
    if (generativeStore.getState().literatureReview) {
      markComplete('literature')
      GetLiteratureReviews() // refresh the saved list so the new one shows up
    }
  }

  const handleSelectSavedReview = (id: string) => {
    const saved = literatureReviewHistory.find((r) => r.id === id)
    if (!saved) return
    setSelectedReviewId(id)
    setTopic(saved.topic)
    markComplete('literature')
  }

  // The review currently on screen: a saved one from the database, or a freshly
  // generated one — normalized to the same shape either way.
  const displayedReview = useMemo(() => {
    if (selectedReviewId) {
      const saved = literatureReviewHistory.find((r) => r.id === selectedReviewId)
      if (saved) {
        return {
          annotatedBibliography: saved.annotated_bibliography,
          sourceCount: saved.annotated_bibliography?.length,
          unverifiedDropped: saved.unverifiedDropped
        }
      }
    }
    return literatureReview
  }, [selectedReviewId, literatureReviewHistory, literatureReview])

  // ── Methodology handlers ───────────────────────────────────────────
  const handleAddResearchQuestion = () => {
    if (!researchQuestionInput.trim()) return
    if (researchQuestions.length >= MAX_RESEARCH_QUESTIONS) return
    setResearchQuestions((prev) => [...prev, researchQuestionInput.trim()])
    setResearchQuestionInput('')
  }

  const handleRemoveResearchQuestion = (index: number) => {
    setResearchQuestions((prev) => prev.filter((_, i) => i !== index))
  }

  const handleGenerateMethodology = async () => {
    if (researchQuestions.length < MIN_RESEARCH_QUESTIONS || loading) return
    setSelectedMethodologyId(null) // a fresh generation takes priority over any selected saved methodology
    await MethodologyAI({ topic, researchQuestions, context: methodologyContext })
    if (generativeStore.getState().methodology) {
      markComplete('methodology')
      GetMethodologies() // refresh the saved list so the new one shows up
    }
  }

  const handleSelectSavedMethodology = (id: string) => {
    const saved = methodologyHistory.find((m) => m.id === id)
    if (!saved) return
    setSelectedMethodologyId(id)
    setResearchQuestions(saved.research_questions)
    setMethodologyContext(saved.context || '')
    markComplete('methodology')
  }

  // The methodology currently on screen: a saved one from the database, or a freshly
  // generated one — normalized to the same shape either way.
  const displayedMethodology = useMemo(() => {
    if (selectedMethodologyId) {
      const saved = methodologyHistory.find((m) => m.id === selectedMethodologyId)
      if (saved) {
        return {
          approach: saved.approach,
          approachRationale: saved.approach_rationale,
          population: saved.population,
          instruments: saved.instruments,
          dataCollectionPlan: saved.data_collection_plan,
          dataAnalysisPlan: saved.data_analysis_plan,
          questionMapping: saved.question_mapping,
          limitations: saved.limitations,
        }
      }
    }
    return methodology
  }, [selectedMethodologyId, methodologyHistory, methodology])

  // ── Data Collection handlers ───────────────────────────────────────
  const handleGenerateDataAnalysis = async () => {
    if (
      !topic.trim() ||
      !dataCollectionApproach ||
      researchQuestions.length === 0 ||
      !rawFindings.trim() ||
      loading
    ) {
      return
    }
    setSelectedDataAnalysisId(null) // a fresh generation takes priority over any selected saved analysis
    await DataAnalysisAI({
      topic,
      approach: dataCollectionApproach,
      researchQuestions,
      gapStatement: gapStatement.trim() ? gapStatement : undefined,
      rawFindings,
    })
    if (generativeStore.getState().dataAnalysis) {
      markComplete('collection')
      GetDataAnalyses({ limit: 20, offset: 0 }) // refresh the saved list so the new one shows up
    }
  }

  // Kept for any explicit re-selection needs elsewhere, but the Data
  // Collection stage itself no longer renders a clickable picker —
  // selection happens automatically via the topic-match effect above.
  const handleSelectSavedDataAnalysis = (id: string) => {
    const saved = dataAnalysisHistory.find((d) => d.id === id)
    if (!saved) return
    setSelectedDataAnalysisId(id)
    setTopic(saved.topic)
    setDataCollectionApproach(saved.approach)
    setResearchQuestions(saved.research_questions)
    setGapStatement(saved.gap_statement || '')
    setRawFindings(saved.raw_findings)
    markComplete('collection')
  }

  // The analysis currently on screen: a saved one from the database, or a freshly
  // generated one — normalized to the same shape either way.
  const displayedDataAnalysis = useMemo(() => {
    if (selectedDataAnalysisId) {
      const saved = dataAnalysisHistory.find((d) => d.id === selectedDataAnalysisId)
      if (saved) {
        return {
          dataCleaningChecklist: saved.data_cleaning_checklist,
          analysisMethod: saved.analysis_method,
          analysisSteps: saved.analysis_steps,
          analysisRationale: saved.analysis_rationale,
          literatureConnectionPrompts: saved.literature_connection_prompts,
          resultsSummary: saved.results_summary,
          visualizations: saved.visualizations,
        }
      }
    }
    return dataAnalysis
  }, [selectedDataAnalysisId, dataAnalysisHistory, dataAnalysis])

  // ── Review & Submit (Full Paper Review) handlers ────────────────────
  // A PDF upload is optional — the caller may instead (or additionally)
  // supply manually typed thesis sections, e.g.
  // { thesis_abstract: '...', thesis_introduction: '...' }.
  // `topic` is sent along too now, so the saved record can be matched
  // back to the current topic (see the auto-match effect above).
  const handleUploadPaperReview = async (manualSections?: Record<string, string>) => {
    const hasManualText = !!manualSections && Object.keys(manualSections).length > 0
    if ((!paperFile && !hasManualText) || fullPaperReviewLoading) return
    setSelectedPaperReviewId(null) // a fresh upload takes priority over any selected saved review
    await FullPaperReviewAI(paperFile, manualSections, topic)
    if (generativeStore.getState().fullPaperReview) {
      markComplete('paper-review')
      GetFullPaperReviews({ limit: 20, offset: 0 }) // refresh the saved list so the new one shows up
    }
  }

  // Kept for explicit selection from the "Past Reviews" list in the UI —
  // unlike Data Collection, browsing/re-opening an old paper review by
  // hand is still a normal thing to want to do (they aren't limited to
  // one-per-topic the way earlier stages are), so this stays clickable.
  const handleSelectSavedPaperReview = (id: string) => {
    const saved = fullPaperReviewHistory.find((r) => r.id === id)
    if (!saved) return
    setSelectedPaperReviewId(id)
    markComplete('paper-review')
  }

  // The paper review currently on screen: a saved one from the database, or a freshly
  // generated one — normalized to the same shape either way.
  const displayedPaperReview = useMemo(() => {
    if (selectedPaperReviewId) {
      const saved = fullPaperReviewHistory.find((r) => r.id === selectedPaperReviewId)
      if (saved) {
        return {
          reviewId: saved.id,
          fileName: saved.file_name,
          chapterDetection: saved.chapter_detection,
          consistencyCheck: saved.consistency_check,
          citationAudit: saved.citation_audit,
          structuralCompliance: saved.structural_compliance,
          overallReadiness: saved.overall_readiness,
        }
      }
    }
    return fullPaperReview
  }, [selectedPaperReviewId, fullPaperReviewHistory, fullPaperReview])

  return {
    // navigation / progress
    activeStage,
    setActiveStage,
    completedStages,
    activeIndex,
    percentComplete,
    isStageLocked,
    markComplete,
    message,
    isTopicLoading: loading && activeStage === 'topic',
    isLiteratureLoading: loading && activeStage === 'literature',
    isMethodologyLoading: loading && activeStage === 'methodology',
    isDataAnalysisLoading: loading && activeStage === 'collection',

    // topic selection
    topic,
    setTopic,
    context,
    setContext,
    handleGetGuidance,
    topicSelectionHistory,
    topicHistoryLoading,
    selectedTopicId,
    handleSelectSavedTopic,
    handleDeleteSavedTopic,
    displayedGuidance,

    // literature review
    handleGenerateReview,
    literatureReviewHistory,
    historyLoading,
    selectedReviewId,
    handleSelectSavedReview,
    displayedReview,

    // methodology
    researchQuestions,
    researchQuestionInput,
    setResearchQuestionInput,
    handleAddResearchQuestion,
    handleRemoveResearchQuestion,
    methodologyContext,
    setMethodologyContext,
    handleGenerateMethodology,
    methodologyHistory,
    methodologyHistoryLoading,
    selectedMethodologyId,
    handleSelectSavedMethodology,
    displayedMethodology,

    // data collection
    dataCollectionApproach,
    setDataCollectionApproach,
    gapStatement,
    setGapStatement,
    rawFindings,
    setRawFindings,
    handleGenerateDataAnalysis,
    dataAnalysisHistory,
    dataAnalysesLoading,
    dataAnalysesTotal,
    hasMoreDataAnalyses: dataAnalysisHistory.length < dataAnalysesTotal,
    handleLoadMoreDataAnalyses,
    selectedDataAnalysisId,
    handleSelectSavedDataAnalysis,
    displayedDataAnalysis,

    // review & submit (full paper review)
    paperFile,
    setPaperFile,
    handleUploadPaperReview,
    isPaperReviewLoading: fullPaperReviewLoading,
    fullPaperReviewHistory,
    fullPaperReviewHistoryLoading,
    fullPaperReviewsTotal,
    hasMorePaperReviews: fullPaperReviewHistory.length < fullPaperReviewsTotal,
    handleLoadMorePaperReviews,
    selectedPaperReviewId,
    handleSelectSavedPaperReview,
    displayedPaperReview,
  }
}