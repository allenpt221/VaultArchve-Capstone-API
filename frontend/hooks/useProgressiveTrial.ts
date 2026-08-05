'use client'
import { generativeStore } from '@/Stores/generativeStore'
import { useEffect, useMemo, useState, type MouseEvent } from 'react'
import { LiteratureSource } from './types'
import { MAX_RESEARCH_QUESTIONS, MIN_RESEARCH_QUESTIONS, MIN_SOURCES, STAGES, type StageKey } from './constants'

export function useProgressiveTrial() {
  const [activeStage, setActiveStage] = useState<StageKey>('topic')
  const [completedStages, setCompletedStages] = useState<Set<StageKey>>(new Set())

  const {
    TopicSelectionAI,
    LiteratureReviewAI,
    MethodologyAI,
    GetLiteratureReviews,
    GetTopicSelections,
    GetMethodologies,
    DeleteTopicSelection,
    DeleteMethodology,
    topicGuidance,
    literatureReview,
    methodology,
    literatureReviewHistory,
    topicSelectionHistory,
    methodologyHistory,
    historyLoading,
    topicHistoryLoading,
    methodologyHistoryLoading,
    loading,
    message,
  } = generativeStore()

  // Topic Selection stage — form inputs
  const [topic, setTopic] = useState('')
  const [context, setContext] = useState('')

  // Literature Review stage — form inputs
  const [sources, setSources] = useState<LiteratureSource[]>([])
  const [sourceCitation, setSourceCitation] = useState('')
  const [sourceFinding, setSourceFinding] = useState('')
  const [sourceRelevance, setSourceRelevance] = useState('')

  // Methodology stage — form inputs
  const [researchQuestions, setResearchQuestions] = useState<string[]>([])
  const [researchQuestionInput, setResearchQuestionInput] = useState('')
  const [methodologyContext, setMethodologyContext] = useState('')

  // Which saved record (from the database) is currently selected for viewing, if any
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null)
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null)
  const [selectedMethodologyId, setSelectedMethodologyId] = useState<string | null>(null)

  const activeIndex = STAGES.findIndex((s) => s.key === activeStage)
  const percentComplete = Math.round((completedStages.size / STAGES.length) * 100)

  // Load the user's saved literature reviews and topic selections on mount
  useEffect(() => {
    GetLiteratureReviews()
    GetTopicSelections()
    GetMethodologies()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // A stage is locked until the stage immediately before it is completed.
  const isStageLocked = (stageKey: StageKey) => {
    const i = STAGES.findIndex((s) => s.key === stageKey)
    if (i <= 0) return false
    return !completedStages.has(STAGES[i - 1].key)
  }

  const markComplete = (stage: StageKey) =>
    setCompletedStages((prev) => new Set(prev).add(stage))

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
    if (selectedTopicId === id) setSelectedTopicId(null)
    DeleteTopicSelection(id)
  }


  const handleDeleteMethodology = (id: string) => {
    if(selectedMethodologyId === id) setSelectedMethodologyId(null);

    DeleteMethodology(id)
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
  const handleAddSource = () => {
    if (!sourceCitation.trim() || !sourceFinding.trim() || !sourceRelevance.trim()) return
    setSources((prev) => [
      ...prev,
      {
        citation: sourceCitation.trim(),
        key_finding: sourceFinding.trim(),
        relevance_to_gap: sourceRelevance.trim(),
      },
    ])
    setSourceCitation('')
    setSourceFinding('')
    setSourceRelevance('')
  }

  const handleRemoveSource = (index: number) => {
    setSources((prev) => prev.filter((_, i) => i !== index))
  }

  const handleGenerateReview = async () => {
    if (sources.length < MIN_SOURCES || loading) return
    setSelectedReviewId(null) // a fresh generation takes priority over any selected saved review
    await LiteratureReviewAI({ topic, sources })
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
    setSources(saved.sources)
    markComplete('literature')
  }

  // The review currently on screen: a saved one from the database, or a freshly
  // generated one — normalized to the same shape either way.
  const displayedReview = useMemo(() => {
    if (selectedReviewId) {
      const saved = literatureReviewHistory.find((r) => r.id === selectedReviewId)
      if (saved) {
        return {
          gapStatement: saved.gap_statement,
          themeGroups: saved.theme_groups,
          annotatedBibliography: saved.annotated_bibliography,
          synthesisParagraph: saved.synthesis_paragraph,
          recommendedSearches: saved.recommended_searches,
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
    sources,
    sourceCitation,
    setSourceCitation,
    sourceFinding,
    setSourceFinding,
    sourceRelevance,
    setSourceRelevance,
    handleAddSource,
    handleRemoveSource,
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
    handleDeleteMethodology,
    methodologyContext,
    setMethodologyContext,
    handleGenerateMethodology,
    methodologyHistory,
    methodologyHistoryLoading,
    selectedMethodologyId,
    handleSelectSavedMethodology,
    displayedMethodology,
  }
}