import { DataAnalysisResult, MethodologyApproach, SavedDataAnalysis, FullPaperReviewResult, SavedFullPaperReview } from '@/hooks/types';
import axios from '@/lib/axios';
import { create } from 'zustand';


const normalizeMethodology = (data: any): SavedMethodology => ({
  ...data,

  research_questions:
    typeof data.research_questions === "string"
      ? JSON.parse(data.research_questions)
      : data.research_questions,

  population:
    typeof data.population === "string"
      ? JSON.parse(data.population)
      : data.population,

  instruments:
    typeof data.instruments === "string"
      ? JSON.parse(data.instruments)
      : data.instruments,

  question_mapping:
    typeof data.question_mapping === "string"
      ? JSON.parse(data.question_mapping)
      : data.question_mapping,

  limitations:
    typeof data.limitations === "string"
      ? JSON.parse(data.limitations)
      : data.limitations,
});


interface RecommendedProps{
    course: string;
    chatPrompt: string;
}

interface TopicSelectionProps{
  topic: string;
  context?: string;
}

interface LiteratureReviewProps {
  topic: string;
}

interface MethodologyProps {
  topic: string;
  researchQuestions: string[];
  context?: string;
}

interface TopicGuidance {
  feedback: string;
  feasibility: "strong" | "needs_narrowing" | "too_broad";
  refinedTopics: string[];
  suggestedResearchQuestions: string[];
  nextSteps: string[];
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

interface LiteratureReviewResult {
  annotatedBibliography: AnnotatedBibliographyEntry[];
  sourceCount: number;
  unverifiedDropped: number;
}

interface MethodologyPopulation {
  targetPopulation: string;
  samplingMethod: string;
  sampleSizeJustification: string;
  inclusionCriteria: string[];
}

interface MethodologyInstrument {
  name: string;
  type: string;
  purpose: string;
  validityConsiderations: string;
  researchQuestionNumbers: number[];
}

interface QuestionMappingEntry {
  researchQuestionNumber: number;
  researchQuestion: string;
  approach: string;
  instrument: string;
  analysisMethod: string;
}

interface MethodologyResult {
  approach: "qualitative" | "quantitative" | "mixed_methods";
  approachRationale: string;
  population: MethodologyPopulation;
  instruments: MethodologyInstrument[];
  dataCollectionPlan: string;
  dataAnalysisPlan: string;
  questionMapping: QuestionMappingEntry[];
  limitations: string[];
}



interface SavedLiteratureReview {
  id: string;
  user_id: string;
  topic: string;
  gap_statement: string;
  theme_groups: Record<string, string[]>;
  annotated_bibliography: AnnotatedBibliographyEntry[];
  synthesis_paragraph: string;
  unverifiedDropped: number;
  created_at: string;
}

interface SavedTopicSelection {
  id: string;
  user_id: string;
  topic: string;
  context: string | null;
  feedback: string;
  feasibility: "strong" | "needs_narrowing" | "too_broad";
  refined_topics: string[];
  suggested_research_questions: string[];
  next_steps: string[];
  created_at: string;
}

interface SavedMethodology {
  id: string;
  user_id: string;
  topic: string;
  research_questions: string[];
  context: string | null;
  approach: "qualitative" | "quantitative" | "mixed_methods";
  approach_rationale: string;
  population: MethodologyPopulation;
  instruments: MethodologyInstrument[];
  data_collection_plan: string;
  data_analysis_plan: string;
  question_mapping: QuestionMappingEntry[];
  limitations: string[];
  created_at: string;
}

interface generativeAiProps {
  RecommendedAI: (data: RecommendedProps) => Promise<void>;
  TopicSelectionAI: (data: TopicSelectionProps) => Promise<void>;
  LiteratureReviewAI: (data: LiteratureReviewProps) => Promise<void>;
  MethodologyAI: (data: MethodologyProps) => Promise<void>;
  GetLiteratureReviews: (params?: { limit?: number; offset?: number }) => Promise<void>;
  GetTopicSelections: (params?: { limit?: number; offset?: number }) => Promise<void>;
  GetMethodologies: (params?: { limit?: number; offset?: number }) => Promise<void>;
  DeleteTopicSelection: (id: string) => Promise<void>;
  dataAnalysis: DataAnalysisResult | null
  dataAnalysisHistory: SavedDataAnalysis[]
  dataAnalysesTotal: number
  dataAnalysesLimit: number
  dataAnalysesOffset: number
  dataAnalysesLoading: boolean

  DataAnalysisAI: (params: {
    topic: string
    approach: MethodologyApproach
    researchQuestions: string[]
    gapStatement?: string
    rawFindings: string
  }) => Promise<void>
  GetDataAnalyses: (opts?: { limit?: number; offset?: number }) => Promise<void>

  // Full Paper Review
  fullPaperReview: FullPaperReviewResult | null
  fullPaperReviewHistory: SavedFullPaperReview[]
  fullPaperReviewsTotal: number
  fullPaperReviewsLimit: number
  fullPaperReviewsOffset: number
  fullPaperReviewLoading: boolean
  fullPaperReviewHistoryLoading: boolean
  // `topic` is now sent alongside the file/manual sections so the saved
  // review can be matched back to the current topic later, the same way
  // Topic Selection / Literature Review / Methodology / Data Collection
  // records are matched.
  FullPaperReviewAI: (file: File | null, manualSections?: Record<string, string>, topic?: string) => Promise<void>
  GetFullPaperReviews: (opts?: { limit?: number; offset?: number }) => Promise<void>

  result: any[];
  topicGuidance: TopicGuidance | null;
  literatureReview: LiteratureReviewResult | null;
  methodology: MethodologyResult | null;
  literatureReviewHistory: SavedLiteratureReview[];
  topicSelectionHistory: SavedTopicSelection[];
  methodologyHistory: SavedMethodology[];
  historyLoading: boolean;
  topicHistoryLoading: boolean;
  methodologyHistoryLoading: boolean;
  loading: boolean;
  message: string | null;
}



export const generativeStore = create<generativeAiProps>((set, get) => ({
    result: [],
    topicGuidance: null,
    literatureReview: null,
    methodology: null,
    literatureReviewHistory: [],
    topicSelectionHistory: [],
    methodologyHistory: [],
    historyLoading: false,
    topicHistoryLoading: false,
    methodologyHistoryLoading: false,
    dataAnalysis: null,
    dataAnalysisHistory: [],
    dataAnalysesTotal: 0,
    dataAnalysesLimit: 20,
    dataAnalysesOffset: 0,
    dataAnalysesLoading: false,

    fullPaperReview: null,
    fullPaperReviewHistory: [],
    fullPaperReviewsTotal: 0,
    fullPaperReviewsLimit: 20,
    fullPaperReviewsOffset: 0,
    fullPaperReviewLoading: false,
    fullPaperReviewHistoryLoading: false,

    loading: false,
    message: "",

  // POST METHOD
  RecommendedAI: async ({ chatPrompt, course }: RecommendedProps): Promise<void> => {
    try {
      set({ loading: true, message: "" });

      const res = await axios.post('/ai/recommendation', {
        course,
        chatPrompt,
      });

      set({
        result: res.data.recommendations,
        loading: false,
        message: "AI recommendations generated successfully!",
      });

    } catch (error: any) {
      set({ loading: false });

      const status = error.response?.status;
      const data = error.response?.data;

      if (status === 401) {
        set({ message: data?.message || "Unauthorized Access. Please log in" });
        return;
      }

      if (status === 400) {
        set({ message: data?.message || "Invalid request. Please check your input." });
        return;
      }

      if (status === 429) {
        set({ message: data?.message || "Daily limit reached. Please try again tomorrow." });
        return;
      }

      if (status === 500) {
        set({ message: data?.error || data?.message || "Something went wrong. Please try again." });
        return;
      }

      console.error("AI Recommendation Error:", error);
      set({ message: error.message || "An unexpected error occurred." });
    }
  },
  // POST METHOD
  TopicSelectionAI: async ({ topic, context }: TopicSelectionProps): Promise<void> => {
    try {
      set({ loading: true, message: "" });

      const res = await axios.post('/ai/topic-selection', {
        topic,
        context,
      });

      set({
        topicGuidance: res.data.guidance,
        loading: false,
        message: "Topic guidance generated successfully!",
      });

    } catch (error: any) {
      set({ loading: false });

      const status = error.response?.status;
      const data = error.response?.data;

      if (status === 401) {
        set({ message: data?.message || "Unauthorized Access. Please log in" });
        return;
      }

      if (status === 400) {
        set({ message: data?.message || "Invalid request. Please check your input." });
        return;
      }

      if (status === 429) {
        set({ message: data?.message || "Daily limit reached. Please try again tomorrow." });
        return;
      }

      if (status === 500) {
        set({ message: data?.error || data?.message || "Something went wrong. Please try again." });
        return;
      }

      console.error("Topic Selection Error:", error);
      set({ message: error.message || "An unexpected error occurred." });
    }
  },

  // POST METHOD
  LiteratureReviewAI: async ({ topic }: LiteratureReviewProps): Promise<void> => {
    try {
      set({ loading: true, message: "" });

      const res = await axios.post('/ai/literature-review', {
        topic,
      });

      set({
        literatureReview: {
          annotatedBibliography: res.data.annotatedBibliography,
          sourceCount: res.data.sourceCount,
          unverifiedDropped: res.data.unverifiedDropped,
        },
        loading: false,
        message: "Literature review generated successfully!",
      });

    } catch (error: any) {
      set({ loading: false });

      const status = error.response?.status;
      const data = error.response?.data;

      if (status === 401) {
        set({ message: data?.message || "Unauthorized Access. Please log in" });
        return;
      }

      if (status === 400) {
        set({ message: data?.message || "Invalid request. Please check your input." });
        return;
      }

      if (status === 404) {
        set({ message: data?.message || "Couldn't find enough sources for this topic. Try broadening or rephrasing it." });
        return;
      }

      if (status === 429) {
        set({ message: data?.message || "Daily limit reached. Please try again tomorrow." });
        return;
      }

      if (status === 500) {
        set({ message: data?.error || data?.message || "Something went wrong. Please try again." });
        return;
      }

      console.error("Literature Review Error:", error);
      set({ message: error.message || "An unexpected error occurred." });
    }
  },

  // POST METHOD
  MethodologyAI: async ({ topic, researchQuestions, context }: MethodologyProps): Promise<void> => {
    try {
      set({ loading: true, message: "" });

      const res = await axios.post('/ai/methodology', {
        topic,
        researchQuestions,
        context,
      });

      set({
        methodology: res.data.methodology,
        loading: false,
        message: "Methodology generated successfully!",
      });

    } catch (error: any) {
      set({ loading: false });

      const status = error.response?.status;
      const data = error.response?.data;

      if (status === 401) {
        set({ message: data?.message || "Unauthorized Access. Please log in" });
        return;
      }

      if (status === 400) {
        set({ message: data?.message || "Invalid request. Please check your input." });
        return;
      }

      if (status === 429) {
        set({ message: data?.message || "Daily limit reached. Please try again tomorrow." });
        return;
      }

      if (status === 500) {
        set({ message: data?.error || data?.message || "Something went wrong. Please try again." });
        return;
      }

      console.error("Methodology Error:", error);
      set({ message: error.message || "An unexpected error occurred." });
    }
  },

  // POST METHOD
  DataAnalysisAI: async (params) => {
  set({ loading: true, message: null })
    try {
      const res = await axios.post('/ai/data-analysis', params)
      set({ dataAnalysis: res.data.dataAnalysis })
    } catch (error: any) {
      console.log(error)
      set({
        message:
          error?.response?.data?.message ||
          'Could not generate the data analysis. Please try again.',
      })
    } finally {
      set({ loading: false })
    }
  },

  // GET METHOD
  GetDataAnalyses: async (opts) => {
    set({ dataAnalysesLoading: true })
    try {
      const limit = opts?.limit ?? get().dataAnalysesLimit ?? 20
      const offset = opts?.offset ?? 0
      const res = await axios.get('/ai/data-analysis', { params: { limit, offset } })
      set({
        dataAnalysisHistory:
          offset === 0
            ? res.data.dataAnalyses
            : [...get().dataAnalysisHistory, ...res.data.dataAnalyses],
        dataAnalysesTotal: res.data.total,
        dataAnalysesLimit: res.data.limit,
        dataAnalysesOffset: res.data.offset,
      })
    } catch (error: any) {
      console.log(error)
    } finally {
      set({ dataAnalysesLoading: false })
    }
  },

  // POST METHOD (multipart) — Full Paper Review
  FullPaperReviewAI: async (file: File | null, manualSections?: Record<string, string>, topic?: string): Promise<void> => {
    set({ fullPaperReviewLoading: true, message: "" });
    try {
     const formData = new FormData()
      if (file) {
        formData.append('paper', file)
      }
      if (manualSections) {
        Object.entries(manualSections).forEach(([key, value]) => {
          formData.append(key, value)
        })
      }
      // Sent so the backend can persist/associate this review with the
      // current topic — needed for auto-matching it back on later visits,
      // the same way Topic Selection / Literature Review / Methodology /
      // Data Collection records are matched.
      if (topic) {
        formData.append('topic', topic)
      }


      const res = await axios.post('/ai/paper-reviews', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      set({
        fullPaperReview: {
          reviewId: res.data.reviewId,
          fileName: res.data.fileName,
          chapterDetection: res.data.chapterDetection,
          consistencyCheck: res.data.consistencyCheck,
          citationAudit: res.data.citationAudit,
          structuralCompliance: res.data.structuralCompliance,
          overallReadiness: res.data.overallReadiness,
        },
        fullPaperReviewLoading: false,
        message: "Paper review generated successfully!",
      });

    } catch (error: any) {
      set({ fullPaperReviewLoading: false });

      const status = error.response?.status;
      const data = error.response?.data;

      if (status === 401) {
        set({ message: data?.message || "Unauthorized Access. Please log in" });
        return;
      }

      if (status === 400) {
        set({ message: data?.message || "Invalid request. Please check your file." });
        return;
      }

      if (status === 429) {
        set({ message: data?.message || "Daily limit reached. Please try again tomorrow." });
        return;
      }

      if (status === 500) {
        set({ message: data?.error || data?.message || "Something went wrong. Please try again." });
        return;
      }

      console.error("Full Paper Review Error:", error);
      set({ message: error.message || "An unexpected error occurred." });
    }
  },

  // GET METHOD
  GetFullPaperReviews: async (opts): Promise<void> => {
    set({ fullPaperReviewHistoryLoading: true, message: "" });
    try {
      const limit = opts?.limit ?? get().fullPaperReviewsLimit ?? 20;
      const offset = opts?.offset ?? 0;

      const res = await axios.get('/ai/paper-reviews', {
        params: { limit, offset },
      });

      set({
        fullPaperReviewHistory:
          offset === 0
            ? res.data.reviews
            : [...get().fullPaperReviewHistory, ...res.data.reviews],
        fullPaperReviewsTotal: res.data.total,
        fullPaperReviewsLimit: res.data.limit,
        fullPaperReviewsOffset: res.data.offset,
        fullPaperReviewHistoryLoading: false,
      });

    } catch (error: any) {
      set({ fullPaperReviewHistoryLoading: false });

      const status = error.response?.status;
      const data = error.response?.data;

      if (status === 401) {
        set({ message: data?.message || "Unauthorized Access. Please log in" });
        return;
      }

      if (status === 500) {
        set({ message: data?.error || data?.message || "Could not load your paper reviews." });
        return;
      }

      console.error("Get Full Paper Reviews Error:", error);
      set({ message: error.message || "An unexpected error occurred." });
    }
  },

  // GET METHOD
  GetLiteratureReviews: async (params): Promise<void> => {
    try {
      set({ historyLoading: true, message: "" });

      const res = await axios.get('/ai/literature-reviews', {
        params: {
          limit: params?.limit ?? 20,
          offset: params?.offset ?? 0,
        },
      });

      set({
        literatureReviewHistory: res.data.reviews,
        historyLoading: false,
      });

    } catch (error: any) {
      set({ historyLoading: false });

      const status = error.response?.status;
      const data = error.response?.data;

      if (status === 401) {
        set({ message: data?.message || "Unauthorized Access. Please log in" });
        return;
      }

      if (status === 500) {
        set({ message: data?.error || data?.message || "Could not load your literature reviews." });
        return;
      }

      console.error("Get Literature Reviews Error:", error);
      set({ message: error.message || "An unexpected error occurred." });
    }
  },

  // GET METHOD
  GetTopicSelections: async (params): Promise<void> => {
    try {
      set({ topicHistoryLoading: true, message: "" });

      const res = await axios.get('/ai/topic-selections', {
        params: {
          limit: params?.limit ?? 20,
          offset: params?.offset ?? 0,
        },
      });

      set({
        topicSelectionHistory: res.data.topics,
        topicHistoryLoading: false,
      });

    } catch (error: any) {
      set({ topicHistoryLoading: false });

      const status = error.response?.status;
      const data = error.response?.data;

      if (status === 401) {
        set({ message: data?.message || "Unauthorized Access. Please log in" });
        return;
      }

      if (status === 500) {
        set({ message: data?.error || data?.message || "Could not load your topic selection history." });
        return;
      }

      console.error("Get Topic Selections Error:", error);
      set({ message: error.message || "An unexpected error occurred." });
    }
  },

  // GET METHOD
  GetMethodologies: async (params): Promise<void> => {
    try {
      set({ methodologyHistoryLoading: true, message: "" });

      const res = await axios.get('/ai/methodologies', {
        params: {
          limit: params?.limit ?? 20,
          offset: params?.offset ?? 0,
        },
      });

      set({
        methodologyHistory: res.data.methodologies.map(normalizeMethodology),
        methodologyHistoryLoading: false,
      });

    } catch (error: any) {
      set({ methodologyHistoryLoading: false });

      const status = error.response?.status;
      const data = error.response?.data;

      if (status === 401) {
        set({ message: data?.message || "Unauthorized Access. Please log in" });
        return;
      }

      if (status === 500) {
        set({ message: data?.error || data?.message || "Could not load your methodology history." });
        return;
      }

      console.error("Get Methodologies Error:", error);
      set({ message: error.message || "An unexpected error occurred." });
    }
  },

  // DELETE METHOD
  DeleteTopicSelection: async (id: string): Promise<void> => {
    const previous = get().topicSelectionHistory;
    set({
      topicSelectionHistory: previous.filter((t) => t.id !== id),
      message: "",
    });

    try {
      await axios.delete('/ai/topic-selections', { data: { id } });
    } catch (error: any) {
      set({ topicSelectionHistory: previous });

      const status = error.response?.status;
      const data = error.response?.data;

      if (status === 401) {
        set({ message: data?.message || "Unauthorized Access. Please log in" });
        return;
      }

      if (status === 404) {
        set({ message: data?.message || "That topic selection could not be found." });
        return;
      }

      if (status === 500) {
        set({ message: data?.error || data?.message || "Could not delete this topic selection." });
        return;
      }

      console.error("Delete Topic Selection Error:", error);
      set({ message: error.message || "An unexpected error occurred." });
    }
  },

  // DELETE METHOD
  DeleteMethodology: async (id: string): Promise<void> => {
    const previous = get().methodologyHistory;
    set({
      methodologyHistory: previous.filter((m) => m.id !== id),
      message: "",
    });

    try {
      await axios.delete('/ai/methodology', { data: { id } });
    } catch (error: any) {
      set({ methodologyHistory: previous });

      const status = error.response?.status;
      const data = error.response?.data;

      if (status === 401) {
        set({ message: data?.message || "Unauthorized Access. Please log in" });
        return;
      }

      if (status === 404) {
        set({ message: data?.message || "That methodology could not be found." });
        return;
      }

      if (status === 500) {
        set({ message: data?.error || data?.message || "Could not delete this methodology." });
        return;
      }

      console.error("Delete Methodology Error:", error);
      set({ message: error.message || "An unexpected error occurred." });
    }
  },
}))