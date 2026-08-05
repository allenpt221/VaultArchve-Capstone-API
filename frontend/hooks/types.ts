export type TopicGuidance = {
  feedback: string
  feasibility: 'strong' | 'needs_narrowing' | 'too_broad'
  refinedTopics: string[]
  suggestedResearchQuestions: string[]
  nextSteps: string[]
}

export type LiteratureSource = {
  citation: string
  key_finding: string
  relevance_to_gap: string
}

export type RecommendedSearch = {
  theme: string
  searchQuery: string
  why: string
}

export type AnnotatedBibliographyEntry = {
  citation: string
  annotation: string
}

export type LiteratureReviewResult = {
  gapStatement: string
  themeGroups: Record<string, string[]>
  annotatedBibliography: AnnotatedBibliographyEntry[]
  synthesisParagraph: string
  recommendedSearches: RecommendedSearch[]
}

export type MethodologyApproach = 'qualitative' | 'quantitative' | 'mixed_methods'

export type MethodologyPopulation = {
  targetPopulation: string
  samplingMethod: string
  sampleSizeJustification: string
  inclusionCriteria: string[]
}

export type MethodologyInstrument = {
  name: string
  type: string
  purpose: string
  validityConsiderations: string
  researchQuestionNumbers: number[]
}

export type QuestionMappingEntry = {
  researchQuestionNumber: number
  researchQuestion: string
  approach: string
  instrument: string
  analysisMethod: string
}

export type MethodologyResult = {
  approach: MethodologyApproach
  approachRationale: string
  population: MethodologyPopulation
  instruments: MethodologyInstrument[]
  dataCollectionPlan: string
  dataAnalysisPlan: string
  questionMapping: QuestionMappingEntry[]
  limitations: string[]
}