// ── Concept (Stage 1) ──────────────────────────────────────────────
export type SuggestedName = {
  name: string
  tagline: string
  rationale: string
}

export type ConceptGuidance = {
  feedback: string
  feasibility: 'strong' | 'needs_refinement' | 'too_broad'
  refinedConceptStatements: string[]
  suggestedNames: SuggestedName[]
  nextSteps: string[]
}

export type SavedConcept = {
  id: string
  user_id: string
  idea: string
  context: string | null
  feedback: string
  feasibility: 'strong' | 'needs_refinement' | 'too_broad'
  refined_concept_statements: string[]
  suggested_names: SuggestedName[]
  next_steps: string[]
  created_at: string
}

// ── SWOT (Stage 2) ──────────────────────────────────────────────────
export type SWOTGuidance = {
  strengths: string[]
  weaknesses: string[]
  opportunities: string[]
  threats: string[]
  soStrategies: string[]
  woStrategies: string[]
  stContingencies: string[]
}

export type SavedSWOT = {
  id: string
  user_id: string
  idea: string
  concept_statement: string
  notes: string | null
  strengths: string[]
  weaknesses: string[]
  opportunities: string[]
  threats: string[]
  so_strategies: string[]
  wo_strategies: string[]
  st_contingencies: string[]
  created_at: string
}

// ── Market Research (Stage 3) ────────────────────────────────────────
export type SurveySection = {
  id: string
  title: string
  questions: string[]
}

export type MarketResearchGuidance = {
  primaryMarket: string
  secondaryMarket: string
  segmentationJustification: string
  surveySections: SurveySection[]
}

export type SavedMarketResearch = {
  id: string
  user_id: string
  idea: string
  concept_statement: string
  notes: string | null
  primary_market: string
  secondary_market: string
  segmentation_justification: string
  survey_sections: SurveySection[]
  survey_results_interpretation: string | null
  created_at: string
}

// ── Production (Stage 4) ─────────────────────────────────────────────
export type Supplier = {
  name: string
  address: string
  materials: string
  quantity: string
  [key: string]: string
}

export type ProductionGuidance = {
  processSteps: string[]
  feasibilityNote: string
}

export type SavedProduction = {
  id: string
  user_id: string
  idea: string
  concept_statement: string
  suppliers: Supplier[]
  daily_output: string
  operating_days_per_week: string | null
  variants: string | null
  process_steps: string[]
  feasibility_note: string
  created_at: string
}

// ── Financial (Stage 5) ──────────────────────────────────────────────
export type StartupCostCategory = {
  category: string
  examples: string[]
  note: string
}

export type FundingOption = {
  source: string
  fitNote: string
}

export type FinancialGuidance = {
  startupCostCategories: StartupCostCategory[]
  pricingStrategy: string
  revenueModelNote: string
  viabilitySummary: string
  breakEvenNote: string
  fundingOptions: FundingOption[]
  keyMetricsToTrack: string[]
  riskFlags: string[]
  thirtyDayActionPlan: string[]
  recommendation: string
  closingSummary: string
}

export type SavedFinancial = {
  id: string
  user_id: string
  idea: string
  concept_statement: string
  notes: string | null
  startup_cost_categories: StartupCostCategory[]
  pricing_strategy: string
  revenue_model_note: string
  viability_summary: string
  break_even_note: string
  funding_options: FundingOption[]
  key_metrics_to_track: string[]
  risk_flags: string[]
  thirty_day_action_plan: string[]
  recommendation: string
  closing_summary: string
  created_at: string
}

// ── Combined trail data (local form/display state) ───────────────────
export type BusinessConceptData = {
  idea: string
  context: string
  feedback: string
  feasibility: 'strong' | 'needs_refinement' | 'too_broad' | ''
  refinedConceptStatements: string[]
  suggestedNames: SuggestedName[]
  nextSteps: string[]
  selectedConceptStatement: string
  selectedName: string
  selectedTagline: string
  selectedRationale: string
}

export type SWOTData = {
  strengths: string[]
  weaknesses: string[]
  opportunities: string[]
  threats: string[]
  soStrategies: string[]
  woStrategies: string[]
  stContingencies: string[]
  notes: string
}

export type MarketResearchData = {
  primaryMarket: string
  secondaryMarket: string
  segmentationJustification: string
  surveySections: SurveySection[]
  surveyResultsInterpretation: string
  notes: string
}

export type ProductionData = {
  suppliers: Supplier[]
  processSteps: string[]
  dailyOutput: string
  operatingDaysPerWeek: string
  variants: string
  feasibilityNote: string
}

export type FinancialData = {
  startupCostCategories: StartupCostCategory[]
  pricingStrategy: string
  revenueModelNote: string
  viabilitySummary: string
  breakEvenNote: string
  fundingOptions: FundingOption[]
  keyMetricsToTrack: string[]
  riskFlags: string[]
  thirtyDayActionPlan: string[]
  recommendation: string
  closingSummary: string
  notes: string
}

export type EntrepTrailData = {
  concept: BusinessConceptData
  swot: SWOTData
  market: MarketResearchData
  production: ProductionData
  financial: FinancialData
}