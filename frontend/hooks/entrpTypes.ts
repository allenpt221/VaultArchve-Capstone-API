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
export type StartupCostItem = {
  item: string
  category: string
  cost: string
  [key: string]: string
}

export type FinancialGuidance = {
  pricingStrategy: string
  viabilitySummary: string
  breakEvenNote: string
}

export type SavedFinancial = {
  id: string
  user_id: string
  idea: string
  concept_statement: string
  startup_costs: StartupCostItem[]
  fixed_costs_per_month: string
  variable_cost_per_unit: string
  price_per_unit: string
  pricing_strategy: string
  viability_summary: string
  break_even_note: string
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
  startupCosts: StartupCostItem[]
  pricingStrategy: string
  fixedCostsPerMonth: string
  variableCostPerUnit: string
  pricePerUnit: string
  viabilitySummary: string
  breakEvenNote: string
}

export type EntrepTrailData = {
  concept: BusinessConceptData
  swot: SWOTData
  market: MarketResearchData
  production: ProductionData
  financial: FinancialData
}