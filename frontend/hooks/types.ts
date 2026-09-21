export type TopicGuidance = {
  feedback: string
  feasibility: 'strong' | 'needs_narrowing' | 'too_broad'
  refinedTopics: string[]
  suggestedResearchQuestions: string[]
  nextSteps: string[]
}

export type SuggestedObjectivesResult = {
  generalObjective: string
  generalObjectiveRationale: string
  specificObjectives: string[]
  objectiveRationale: string[]
  suggestedVariables: string[]
  scopeConsiderations: string[]
  researchConsiderations: string[]
}

export type SavedSuggestedObjectives = {
  id: string
  topic: string
  context: string | null
  general_objective: string
  general_objective_rationale: string
  specific_objectives: string[]
  objective_rationale: string[]
  suggested_variables: string[]
  scope_considerations: string[]
  research_considerations: string[]
  created_at: string
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

export type MethodologyReference = {
  title: string
  url: string
  relevance: string
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
  references: MethodologyReference[]
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

export type ConsistencyResult = 'Pass' | 'Partial' | 'Mismatch' | 'Not Found'

export type ConsistencySeverity = 'None' | 'Low' | 'Medium' | 'High' | 'Critical'

export type ConsistencyCheckEntry = {
  check: string
  result: ConsistencyResult
  detail: string
  // Present on newer reviews only — the earliest saved rows for this
  // feature predate this field, so treat it as optional everywhere it's
  // read (PaperReview.tsx guards with `entry.severity &&`).
  severity?: ConsistencySeverity
}

export type CitationAuditResult = {
  status: string
  issuesFound: string[]
  // Added alongside issuesFound on newer reviews — optional for the same
  // reason as ConsistencyCheckEntry.severity above.
  recommendations?: string[]
}

export type StructuralComplianceResult = {
  requiredSectionsPresent: number
  requiredSectionsTotal: number
  missing: string[]
}

export type ChapterDetectionResult = {
  chaptersFound: string[]
  missingOrUnclear: string[]
}

export type OverallReadinessResult = {
  // The backend has sent this as both a bare number (63) and a "x/100"
  // string ("32/100") across different review runs. Accept either here
  // and normalize at the point of use rather than assuming one format.
  score: number | string
  label?: string
  summary?: string
  topPriorityFixes: string[]
}

// Added alongside the original five fields — saved rows created before
// this feature shipped won't have a document_stage column value, so this
// (and everything below) is optional everywhere it's read.
export type DocumentStageResult = {
  detected: 'Proposal' | 'Final Paper' | 'Unclear'
  confidence: 'High' | 'Medium' | 'Low'
  reason: string
}

export type SectionStatus = 'Present' | 'Partial' | 'Missing' | 'Unclear' | 'Not Applicable'

export type SectionCheckEntry = {
  section: string
  status: SectionStatus
  // finding/recommendation/severity have shown up populated on every
  // review seen so far, but kept optional in case a future prompt
  // revision starts omitting them for Not Applicable rows the way
  // overallReadiness omits label/summary on older rows.
  finding?: string
  recommendation?: string
  severity?: ConsistencySeverity
}

export type MethodologyCheckResult = {
  status: string
  issues: string[]
  recommendations: string[]
}

export type ContentQualityResult = {
  strengths: string[]
  weaknesses: string[]
  contradictions: string[]
}

export type WritingQualityResult = {
  majorIssues: string[]
  minorIssues: string[]
}

// Canonical DISPLAY shape — camelCase. This is what useProgressiveTrial's
// displayedPaperReview actually produces, whether the result is a fresh
// upload (fullPaperReview from the store, already in this shape) or a
// saved review (converted from the snake_case DB row inline in that
// hook's displayedPaperReview useMemo). Every other stage in that hook
// (displayedReview, displayedMethodology, displayedDataAnalysis) follows
// this same convention: snake_case only exists at the DB/API boundary,
// camelCase is canonical everywhere it's actually rendered.
export type FullPaperReviewResult = {
  reviewId?: string | null
  fileName?: string
  documentStage?: DocumentStageResult
  chapterDetection: ChapterDetectionResult
  sectionCheck?: SectionCheckEntry[]
  consistencyCheck: ConsistencyCheckEntry[]
  methodologyCheck?: MethodologyCheckResult
  citationAudit: CitationAuditResult
  contentQuality?: ContentQualityResult
  writingQuality?: WritingQualityResult
  structuralCompliance: StructuralComplianceResult
  overallReadiness: OverallReadinessResult
}

// The raw DB/API row shape — snake_case, matches the /reviews list
// response exactly. Never rendered directly; useProgressiveTrial converts
// one of these into a FullPaperReviewResult before handing it to the UI.
export type SavedFullPaperReview = {
  id: string
  user_id: string
  topic?: string | null
  file_name: string
  document_stage?: DocumentStageResult | null
  chapter_detection: ChapterDetectionResult
  section_check?: SectionCheckEntry[] | null
  consistency_check: ConsistencyCheckEntry[]
  methodology_check?: MethodologyCheckResult | null
  citation_audit: CitationAuditResult
  content_quality?: ContentQualityResult | null
  writing_quality?: WritingQualityResult | null
  structural_compliance: StructuralComplianceResult
  overall_readiness: OverallReadinessResult
  created_at: string
}