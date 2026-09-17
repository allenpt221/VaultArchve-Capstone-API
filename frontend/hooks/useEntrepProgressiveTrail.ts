'use client'
import { entrepGenerativeStore } from '@/Stores/entrepStores'
import { useEffect, useMemo, useState, type MouseEvent } from 'react'
import { ENTREP_STAGES, type EntrepStageKey } from './entrepconstant'
import type { Supplier } from './entrpTypes'

export function useEntrepProgressiveTrial() {
  const [activeStage, setActiveStage] = useState<EntrepStageKey>('concept')
  const [completedStages, setCompletedStages] = useState<Set<EntrepStageKey>>(new Set())

  const {
    EntrepConceptAI,
    EntrepSWOTAI,
    EntrepMarketResearchAI,
    EntrepProductionAI,
    EntrepFinancialAI,
    GetEntrepConcepts,
    GetEntrepSWOTs,
    GetEntrepMarketResearches,
    GetEntrepProductions,
    GetEntrepFinancials,
    DeleteEntrepConcept,
    conceptGuidance,
    swotGuidance,
    marketGuidance,
    productionGuidance,
    financialGuidance,
    conceptHistory,
    swotHistory,
    marketHistory,
    productionHistory,
    financialHistory,
    conceptHistoryLoading,
    swotHistoryLoading,
    marketHistoryLoading,
    productionHistoryLoading,
    financialHistoryLoading,
    conceptTotal,
    conceptLimit,
    conceptOffset,
    swotTotal,
    swotLimit,
    swotOffset,
    marketTotal,
    marketLimit,
    marketOffset,
    productionTotal,
    productionLimit,
    productionOffset,
    financialTotal,
    financialLimit,
    financialOffset,
    loading,
    message,
  } = entrepGenerativeStore()

  const IDEA_STORAGE_KEY = 'entrepProgressiveTrail:idea'
  const STAGE_STORAGE_KEY = 'entrepProgressiveTrail:activeStage'

  // ── Concept stage form inputs ──
  const [idea, setIdea] = useState('')
  const [context, setContext] = useState('')
  const [selectedConceptStatement, setSelectedConceptStatement] = useState('')
  const [selectedName, setSelectedName] = useState('')
  const [selectedTagline, setSelectedTagline] = useState('')
  const [selectedRationale, setSelectedRationale] = useState('')

  // ── SWOT stage form inputs ──
  const [swotNotes, setSwotNotes] = useState('')

  // ── Market Research stage form inputs ──
  const [marketNotes, setMarketNotes] = useState('')
  const [surveyResultsInterpretation, setSurveyResultsInterpretation] = useState('')

  // ── Production stage form inputs ──
  const [suppliers, setSuppliers] = useState<Supplier[]>([{ name: '', address: '', materials: '', quantity: '' }])
  const [dailyOutput, setDailyOutput] = useState('')
  const [operatingDaysPerWeek, setOperatingDaysPerWeek] = useState('')
  const [variants, setVariants] = useState('')

  // ── Financial stage form inputs ──
  const [financialNotes, setFinancialNotes] = useState('')

  // ── Which saved record is currently selected for viewing ──
  const [selectedConceptId, setSelectedConceptId] = useState<string | null>(null)
  const [selectedSwotId, setSelectedSwotId] = useState<string | null>(null)
  const [selectedMarketId, setSelectedMarketId] = useState<string | null>(null)
  const [selectedProductionId, setSelectedProductionId] = useState<string | null>(null)
  const [selectedFinancialId, setSelectedFinancialId] = useState<string | null>(null)

  const activeIndex = ENTREP_STAGES.findIndex((s) => s.key === activeStage)
  const percentComplete = Math.round((completedStages.size / ENTREP_STAGES.length) * 100)

  useEffect(() => {
    GetEntrepConcepts({ limit: 20, offset: 0 })
    GetEntrepSWOTs({ limit: 20, offset: 0 })
    GetEntrepMarketResearches({ limit: 20, offset: 0 })
    GetEntrepProductions({ limit: 20, offset: 0 })
    GetEntrepFinancials({ limit: 20, offset: 0 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    localStorage.setItem(IDEA_STORAGE_KEY, idea)
  }, [idea])

  useEffect(() => {
    localStorage.setItem(STAGE_STORAGE_KEY, activeStage)
  }, [activeStage])

  const markComplete = (stage: EntrepStageKey) => setCompletedStages((prev) => new Set(prev).add(stage))

  const unmarkComplete = (stage: EntrepStageKey) =>
    setCompletedStages((prev) => {
      const next = new Set(prev)
      next.delete(stage)
      return next
    })

  // ── Auto-match saved work to the current idea ──────────────────────
  // Same pattern as the research trail: if the current idea text matches
  // a saved concept/SWOT/market/production/financial record (keyed off
  // the original `idea`), that record is auto-selected and its stage
  // marked complete, so a returning student doesn't have to reselect.
  //
  // Cascading: a later stage can only be auto-completed if the stage
  // before it is also valid for this idea. This mirrors isStageLocked's
  // prerequisite chain, so a stray DB record from an old session can't
  // mark a later stage "done" while an earlier one is incomplete.
  useEffect(() => {
    if (loading) return
    const normalizedIdea = idea.trim().toLowerCase()

    // ── Concept ──
    let conceptStillValid = false
    if (selectedConceptId) {
      const saved = conceptHistory.find((c) => c.id === selectedConceptId)
      if (saved && (saved.idea ?? '').trim().toLowerCase() === normalizedIdea) {
        conceptStillValid = true
      } else {
        setSelectedConceptId(null)
        unmarkComplete('concept')
      }
    }
    if (!conceptStillValid && normalizedIdea) {
      const match = conceptHistory.find((c) => (c.idea ?? '').trim().toLowerCase() === normalizedIdea)
      if (match) {
        setSelectedConceptId(match.id)
        setSelectedConceptStatement(match.refined_concept_statements?.[0] || '')
        const firstName = match.suggested_names?.[0]
        setSelectedName(firstName?.name || '')
        setSelectedTagline(firstName?.tagline || '')
        setSelectedRationale(firstName?.rationale || '')
        markComplete('concept')
        conceptStillValid = true
      }
    }

    // ── SWOT (requires concept) ──
    let swotStillValid = false
    if (conceptStillValid) {
      if (selectedSwotId) {
        const saved = swotHistory.find((s) => s.id === selectedSwotId)
        if (saved && (saved.idea ?? '').trim().toLowerCase() === normalizedIdea) {
          swotStillValid = true
        } else {
          setSelectedSwotId(null)
          unmarkComplete('swot')
        }
      }
      if (!swotStillValid && normalizedIdea) {
        const match = swotHistory.find((s) => (s.idea ?? '').trim().toLowerCase() === normalizedIdea)
        if (match) {
          setSelectedSwotId(match.id)
          markComplete('swot')
          swotStillValid = true
        }
      }
    } else if (selectedSwotId || completedStages.has('swot')) {
      setSelectedSwotId(null)
      unmarkComplete('swot')
    }

    // ── Market Research (requires SWOT) ──
    let marketStillValid = false
    if (swotStillValid) {
      if (selectedMarketId) {
        const saved = marketHistory.find((m) => m.id === selectedMarketId)
        if (saved && (saved.idea ?? '').trim().toLowerCase() === normalizedIdea) {
          marketStillValid = true
        } else {
          setSelectedMarketId(null)
          unmarkComplete('market')
        }
      }
      if (!marketStillValid && normalizedIdea) {
        const match = marketHistory.find((m) => (m.idea ?? '').trim().toLowerCase() === normalizedIdea)
        if (match) {
          setSelectedMarketId(match.id)
          setSurveyResultsInterpretation(match.survey_results_interpretation || '')
          markComplete('market')
          marketStillValid = true
        }
      }
    } else if (selectedMarketId || completedStages.has('market')) {
      setSelectedMarketId(null)
      unmarkComplete('market')
    }

    // ── Production (requires Market Research) ──
    let productionStillValid = false
    if (marketStillValid) {
      if (selectedProductionId) {
        const saved = productionHistory.find((p) => p.id === selectedProductionId)
        if (saved && (saved.idea ?? '').trim().toLowerCase() === normalizedIdea) {
          productionStillValid = true
        } else {
          setSelectedProductionId(null)
          unmarkComplete('production')
        }
      }
      if (!productionStillValid && normalizedIdea) {
        const match = productionHistory.find((p) => (p.idea ?? '').trim().toLowerCase() === normalizedIdea)
        if (match) {
          setSelectedProductionId(match.id)
          setSuppliers(match.suppliers)
          setDailyOutput(match.daily_output)
          setOperatingDaysPerWeek(match.operating_days_per_week || '')
          setVariants(match.variants || '')
          markComplete('production')
          productionStillValid = true
        }
      }
    } else if (selectedProductionId || completedStages.has('production')) {
      setSelectedProductionId(null)
      unmarkComplete('production')
    }

    // ── Financial (requires Production) ──
    let financialStillValid = false
    if (productionStillValid) {
      if (selectedFinancialId) {
        const saved = financialHistory.find((f) => f.id === selectedFinancialId)
        if (saved && (saved.idea ?? '').trim().toLowerCase() === normalizedIdea) {
          financialStillValid = true
        } else {
          setSelectedFinancialId(null)
          unmarkComplete('financial')
        }
      }
      if (!financialStillValid && normalizedIdea) {
        const match = financialHistory.find((f) => (f.idea ?? '').trim().toLowerCase() === normalizedIdea)
        if (match) {
          setSelectedFinancialId(match.id)
          setFinancialNotes(match.notes || '')
          markComplete('financial')
          financialStillValid = true
        }
      }
    } else if (selectedFinancialId || completedStages.has('financial')) {
      setSelectedFinancialId(null)
      unmarkComplete('financial')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idea, conceptHistory, swotHistory, marketHistory, productionHistory, financialHistory, loading])

  const isStageLocked = (stageKey: EntrepStageKey) => {
    const i = ENTREP_STAGES.findIndex((s) => s.key === stageKey)
    if (i <= 0) return false
    return !completedStages.has(ENTREP_STAGES[i - 1].key)
  }

  // ── Concept handlers ─────────────────────────────────────────────
  const handleGenerateConcept = async () => {
    if (!idea.trim() || loading) return
    setSelectedConceptId(null)
    await EntrepConceptAI({ idea, context })
    if (entrepGenerativeStore.getState().conceptGuidance) {
      markComplete('concept')
      GetEntrepConcepts({ limit: 20, offset: 0 })
    }
  }

  const handleSelectSavedConcept = (id: string) => {
    const saved = conceptHistory.find((c) => c.id === id)
    if (!saved) return
    setSelectedConceptId(id)
    setIdea(saved.idea ?? '')
    setContext(saved.context || '')
    setSelectedConceptStatement(saved.refined_concept_statements?.[0] || '')
    const firstName = saved.suggested_names?.[0]
    setSelectedName(firstName?.name || '')
    setSelectedTagline(firstName?.tagline || '')
    setSelectedRationale(firstName?.rationale || '')
    markComplete('concept')
  }

  const handleDeleteSavedConcept = (e: MouseEvent, id: string) => {
    e.stopPropagation()
    const wasActiveConcept = selectedConceptId === id

    if (wasActiveConcept) {
      setSelectedConceptId(null)
      unmarkComplete('concept')

      // Cascade: every later stage was generated against this idea's text.
      // The backend already deletes their DB rows; clear local selection
      // state here too so the UI reflects it immediately.
      setSelectedSwotId(null)
      unmarkComplete('swot')
      setSelectedMarketId(null)
      unmarkComplete('market')
      setSelectedProductionId(null)
      unmarkComplete('production')
      setSelectedFinancialId(null)
      unmarkComplete('financial')

      setIdea('')
      setContext('')
      setSelectedConceptStatement('')
      setSelectedName('')
      setSelectedTagline('')
      setSelectedRationale('')
    }

    DeleteEntrepConcept(id)
  }

  const displayedConcept = useMemo(() => {
    if (selectedConceptId) {
      const saved = conceptHistory.find((c) => c.id === selectedConceptId)
      if (saved) {
        return {
          feedback: saved.feedback,
          feasibility: saved.feasibility,
          refinedConceptStatements: saved.refined_concept_statements,
          suggestedNames: saved.suggested_names,
          nextSteps: saved.next_steps,
        }
      }
    }
    return conceptGuidance
  }, [selectedConceptId, conceptHistory, conceptGuidance])

  // ── SWOT handlers ────────────────────────────────────────────────
  const handleGenerateSWOT = async () => {
    if (!idea.trim() || !selectedConceptStatement.trim() || loading) return
    setSelectedSwotId(null)
    await EntrepSWOTAI({ idea, conceptStatement: selectedConceptStatement, notes: swotNotes })
    if (entrepGenerativeStore.getState().swotGuidance) {
      markComplete('swot')
      GetEntrepSWOTs({ limit: 20, offset: 0 })
    }
  }

  const handleSelectSavedSWOT = (id: string) => {
    const saved = swotHistory.find((s) => s.id === id)
    if (!saved) return
    setSelectedSwotId(id)
    setIdea(saved.idea ?? '')
    setSelectedConceptStatement(saved.concept_statement ?? '')
    setSwotNotes(saved.notes || '')
    markComplete('swot')
  }

  const displayedSWOT = useMemo(() => {
    if (selectedSwotId) {
      const saved = swotHistory.find((s) => s.id === selectedSwotId)
      if (saved) {
        return {
          strengths: saved.strengths,
          weaknesses: saved.weaknesses,
          opportunities: saved.opportunities,
          threats: saved.threats,
          soStrategies: saved.so_strategies,
          woStrategies: saved.wo_strategies,
          stContingencies: saved.st_contingencies,
        }
      }
    }
    return swotGuidance
  }, [selectedSwotId, swotHistory, swotGuidance])

  // ── Market Research handlers ─────────────────────────────────────
  const handleGenerateMarketResearch = async () => {
    if (!idea.trim() || !selectedConceptStatement.trim() || loading) return
    setSelectedMarketId(null)
    await EntrepMarketResearchAI({ idea, conceptStatement: selectedConceptStatement, notes: marketNotes })
    if (entrepGenerativeStore.getState().marketGuidance) {
      markComplete('market')
      GetEntrepMarketResearches({ limit: 20, offset: 0 })
    }
  }

  const handleSelectSavedMarketResearch = (id: string) => {
    const saved = marketHistory.find((m) => m.id === id)
    if (!saved) return
    setSelectedMarketId(id)
    setIdea(saved.idea ?? '')
    setSelectedConceptStatement(saved.concept_statement ?? '')
    setMarketNotes(saved.notes || '')
    setSurveyResultsInterpretation(saved.survey_results_interpretation || '')
    markComplete('market')
  }

  const displayedMarketResearch = useMemo(() => {
    if (selectedMarketId) {
      const saved = marketHistory.find((m) => m.id === selectedMarketId)
      if (saved) {
        return {
          primaryMarket: saved.primary_market,
          secondaryMarket: saved.secondary_market,
          segmentationJustification: saved.segmentation_justification,
          surveySections: saved.survey_sections,
        }
      }
    }
    return marketGuidance
  }, [selectedMarketId, marketHistory, marketGuidance])

  // ── Production handlers ──────────────────────────────────────────
  const handleAddSupplier = () =>
    setSuppliers((prev) => [...prev, { name: '', address: '', materials: '', quantity: '' }])

  const handleRemoveSupplier = (index: number) =>
    setSuppliers((prev) => prev.filter((_, i) => i !== index))

  const handleUpdateSupplier = (index: number, patch: Partial<Supplier>) =>
    setSuppliers((prev) =>
      prev.map((s, i) => (i === index ? ({ ...s, ...patch } as Supplier) : s))
    )

  const handleGenerateProduction = async () => {
    if (
      !idea.trim() ||
      !selectedConceptStatement.trim() ||
      suppliers.every((s) => !s.name.trim()) ||
      !dailyOutput.trim() ||
      loading
    ) {
      return
    }
    setSelectedProductionId(null)
    await EntrepProductionAI({
      idea,
      conceptStatement: selectedConceptStatement,
      suppliers,
      dailyOutput,
      operatingDaysPerWeek,
      variants,
    })
    if (entrepGenerativeStore.getState().productionGuidance) {
      markComplete('production')
      GetEntrepProductions({ limit: 20, offset: 0 })
    }
  }

  const handleSelectSavedProduction = (id: string) => {
    const saved = productionHistory.find((p) => p.id === id)
    if (!saved) return
    setSelectedProductionId(id)
    setIdea(saved.idea ?? '')
    setSelectedConceptStatement(saved.concept_statement ?? '')
    setSuppliers(saved.suppliers)
    setDailyOutput(saved.daily_output)
    setOperatingDaysPerWeek(saved.operating_days_per_week || '')
    setVariants(saved.variants || '')
    markComplete('production')
  }

  const displayedProduction = useMemo(() => {
    if (selectedProductionId) {
      const saved = productionHistory.find((p) => p.id === selectedProductionId)
      if (saved) {
        return {
          processSteps: saved.process_steps,
          feasibilityNote: saved.feasibility_note,
        }
      }
    }
    return productionGuidance
  }, [selectedProductionId, productionHistory, productionGuidance])

  // ── Financial handlers ───────────────────────────────────────────
  const handleGenerateFinancial = async () => {
    if (!idea.trim() || !selectedConceptStatement.trim() || loading) return
    setSelectedFinancialId(null)
    await EntrepFinancialAI({ idea, conceptStatement: selectedConceptStatement, notes: financialNotes })
    if (entrepGenerativeStore.getState().financialGuidance) {
      markComplete('financial')
      GetEntrepFinancials({ limit: 20, offset: 0 })
    }
  }

  const handleSelectSavedFinancial = (id: string) => {
    const saved = financialHistory.find((f) => f.id === id)
    if (!saved) return
    setSelectedFinancialId(id)
    setIdea(saved.idea ?? '')
    setSelectedConceptStatement(saved.concept_statement ?? '')
    setFinancialNotes(saved.notes || '')
    markComplete('financial')
  }

  const displayedFinancial = useMemo(() => {
    if (selectedFinancialId) {
      const saved = financialHistory.find((f) => f.id === selectedFinancialId)
      if (saved) {
        return {
          startupCostCategories: saved.startup_cost_categories,
          pricingStrategy: saved.pricing_strategy,
          revenueModelNote: saved.revenue_model_note,
          viabilitySummary: saved.viability_summary,
          breakEvenNote: saved.break_even_note,
          fundingOptions: saved.funding_options,
          keyMetricsToTrack: saved.key_metrics_to_track,
          riskFlags: saved.risk_flags,
          thirtyDayActionPlan: saved.thirty_day_action_plan,
          recommendation: saved.recommendation,
          closingSummary: saved.closing_summary,
        }
      }
    }
    return financialGuidance
  }, [selectedFinancialId, financialHistory, financialGuidance])

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
    isConceptLoading: loading && activeStage === 'concept',
    isSwotLoading: loading && activeStage === 'swot',
    isMarketLoading: loading && activeStage === 'market',
    isProductionLoading: loading && activeStage === 'production',
    isFinancialLoading: loading && activeStage === 'financial',

    // concept
    idea,
    setIdea,
    context,
    setContext,
    selectedConceptStatement,
    setSelectedConceptStatement,
    selectedName,
    setSelectedName,
    selectedTagline,
    setSelectedTagline,
    selectedRationale,
    setSelectedRationale,
    handleGenerateConcept,
    conceptHistory,
    conceptHistoryLoading,
    conceptTotal,
    hasMoreConcepts: conceptHistory.length < conceptTotal,
    selectedConceptId,
    handleSelectSavedConcept,
    handleDeleteSavedConcept,
    displayedConcept,

    // SWOT
    swotNotes,
    setSwotNotes,
    handleGenerateSWOT,
    swotHistory,
    swotHistoryLoading,
    swotTotal,
    hasMoreSwots: swotHistory.length < swotTotal,
    selectedSwotId,
    handleSelectSavedSWOT,
    displayedSWOT,

    // market research
    marketNotes,
    setMarketNotes,
    surveyResultsInterpretation,
    setSurveyResultsInterpretation,
    handleGenerateMarketResearch,
    marketHistory,
    marketHistoryLoading,
    marketTotal,
    hasMoreMarketResearches: marketHistory.length < marketTotal,
    selectedMarketId,
    handleSelectSavedMarketResearch,
    displayedMarketResearch,

    // production
    suppliers,
    setSuppliers,
    handleAddSupplier,
    handleRemoveSupplier,
    handleUpdateSupplier,
    dailyOutput,
    setDailyOutput,
    operatingDaysPerWeek,
    setOperatingDaysPerWeek,
    variants,
    setVariants,
    handleGenerateProduction,
    productionHistory,
    productionHistoryLoading,
    productionTotal,
    hasMoreProductions: productionHistory.length < productionTotal,
    selectedProductionId,
    handleSelectSavedProduction,
    displayedProduction,

    // financial
    financialNotes,
    setFinancialNotes,
    handleGenerateFinancial,
    financialHistory,
    financialHistoryLoading,
    financialTotal,
    hasMoreFinancials: financialHistory.length < financialTotal,
    selectedFinancialId,
    handleSelectSavedFinancial,
    displayedFinancial,
  }
}