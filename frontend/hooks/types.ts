export type TopicGuidance = {
  feedback: string
  feasibility: 'strong' | 'needs_narrowing' | 'too_broad'
  refinedTopics: string[]
  suggestedResearchQuestions: string[]
  nextSteps: string[]
}

export type LiteratureSource = {
  topic: string;
}

export type RecommendedSearch = {
  theme: string
  searchQuery: string
  why: string
}

export type VisualizationSuggestion = {
  title: string
  chartType: 'bar' | 'line' | 'pie' | 'scatter' | 'table'
  description: string
  whatItShows: string
}

export type DataAnalysisResult = {
  dataCleaningChecklist: string[]
  analysisMethod: string
  analysisSteps: string[]
  analysisRationale: string
  literatureConnectionPrompts: string[]
  resultsSummary: string
  visualizations: VisualizationSuggestion[]
}


export type AnnotatedBibliographyEntry = {
  citation: string;
  url: string;
  annotation: string;
  sourceType: string;
  title: string
  authors: string
  year: string;
  container: string;
};

export type LiteratureReviewResult = {
  annotatedBibliography: AnnotatedBibliographyEntry[];
  sourceCount: number;
  unverifiedDropped?: number; // was required, now optional
};

export type DataAnalysisResponse = {
  id: string
  topic: string
  summary: string
  keyFindings?: string[]
  created_at: string
  // fallback for any additional columns not yet modeled above
  [key: string]: unknown
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

export type DataAnalysesHistoryResult = {
  dataAnalyses: DataAnalysisResponse[]
  total: number
  limit: number
  offset: number
}

export type SavedDataAnalysis = {
  id: string
  topic: string
  approach: MethodologyApproach
  research_questions: string[]
  gap_statement: string | null
  raw_findings: string
  data_cleaning_checklist: string[]
  analysis_method: string
  analysis_steps: string[]
  analysis_rationale: string
  literature_connection_prompts: string[]
  results_summary: string
  visualizations: VisualizationSuggestion[]
  created_at: string
}


export type ChapterDetectionResult = {
  chaptersFound: string[]
  missingOrUnclear: string[]
}

export type ConsistencyResult = 'Pass' | 'Partial' | 'Mismatch' | 'Not Found'

export type ConsistencyCheckEntry = {
  check: string
  result: ConsistencyResult
  detail: string
}

export type CitationAuditResult = {
  issuesFound: string[]
  status: string
}

export type StructuralComplianceResult = {
  requiredSectionsPresent: number
  requiredSectionsTotal: number
  missing: string[]
}

export type OverallReadinessResult = {
  score: string
  topPriorityFixes: string[]
}

export type FullPaperReviewResult = {
  reviewId?: string | null
  fileName?: string
  chapterDetection: ChapterDetectionResult
  consistencyCheck: ConsistencyCheckEntry[]
  citationAudit: CitationAuditResult
  structuralCompliance: StructuralComplianceResult
  overallReadiness: OverallReadinessResult
}

export type SavedFullPaperReview = {
  id: string
  user_id: string
  topic?: string
  file_name: string
  chapter_detection: ChapterDetectionResult
  consistency_check: ConsistencyCheckEntry[]
  citation_audit: CitationAuditResult
  structural_compliance: StructuralComplianceResult
  overall_readiness: OverallReadinessResult
  created_at: string
}