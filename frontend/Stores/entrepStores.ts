import axios from '@/lib/axios'
import { create } from 'zustand'
import type {
  ConceptGuidance,
  SWOTGuidance,
  MarketResearchGuidance,
  ProductionGuidance,
  FinancialGuidance,
  SavedConcept,
  SavedSWOT,
  SavedMarketResearch,
  SavedProduction,
  SavedFinancial,
  Supplier,
} from '@/hooks/entrpTypes'

interface ConceptProps {
  idea: string
  context?: string
}

interface SWOTProps {
  idea: string
  conceptStatement: string
  notes?: string
}

interface MarketResearchProps {
  idea: string
  conceptStatement: string
  notes?: string
}

interface ProductionProps {
  idea: string
  conceptStatement: string
  suppliers: Supplier[]
  dailyOutput: string
  operatingDaysPerWeek?: string
  variants?: string
}

interface FinancialProps {
  idea: string
  conceptStatement: string
  notes?: string
}

interface EntrepGenerativeProps {
  // ── Concept ──
  conceptGuidance: ConceptGuidance | null
  conceptHistory: SavedConcept[]
  conceptTotal: number
  conceptLimit: number
  conceptOffset: number
  conceptHistoryLoading: boolean
  EntrepConceptAI: (data: ConceptProps) => Promise<boolean>
  GetEntrepConcepts: (opts?: { limit?: number; offset?: number }) => Promise<void>
  DeleteEntrepConcept: (id: string) => Promise<void>

  // ── SWOT ──
  swotGuidance: SWOTGuidance | null
  swotHistory: SavedSWOT[]
  swotTotal: number
  swotLimit: number
  swotOffset: number
  swotHistoryLoading: boolean
  EntrepSWOTAI: (data: SWOTProps) => Promise<boolean>
  GetEntrepSWOTs: (opts?: { limit?: number; offset?: number }) => Promise<void>

  // ── Market Research ──
  marketGuidance: MarketResearchGuidance | null
  marketHistory: SavedMarketResearch[]
  marketTotal: number
  marketLimit: number
  marketOffset: number
  marketHistoryLoading: boolean
  EntrepMarketResearchAI: (data: MarketResearchProps) => Promise<boolean>
  GetEntrepMarketResearches: (opts?: { limit?: number; offset?: number }) => Promise<void>

  // ── Production ──
  productionGuidance: ProductionGuidance | null
  productionHistory: SavedProduction[]
  productionTotal: number
  productionLimit: number
  productionOffset: number
  productionHistoryLoading: boolean
  EntrepProductionAI: (data: ProductionProps) => Promise<boolean>
  GetEntrepProductions: (opts?: { limit?: number; offset?: number }) => Promise<void>

  // ── Financial ──
  financialGuidance: FinancialGuidance | null
  financialHistory: SavedFinancial[]
  financialTotal: number
  financialLimit: number
  financialOffset: number
  financialHistoryLoading: boolean
  EntrepFinancialAI: (data: FinancialProps) => Promise<boolean>
  GetEntrepFinancials: (opts?: { limit?: number; offset?: number }) => Promise<void>

  loading: boolean
  message: string | null
}

export const entrepGenerativeStore = create<EntrepGenerativeProps>((set, get) => ({
  conceptGuidance: null,
  conceptHistory: [],
  conceptTotal: 0,
  conceptLimit: 20,
  conceptOffset: 0,
  conceptHistoryLoading: false,

  swotGuidance: null,
  swotHistory: [],
  swotTotal: 0,
  swotLimit: 20,
  swotOffset: 0,
  swotHistoryLoading: false,

  marketGuidance: null,
  marketHistory: [],
  marketTotal: 0,
  marketLimit: 20,
  marketOffset: 0,
  marketHistoryLoading: false,

  productionGuidance: null,
  productionHistory: [],
  productionTotal: 0,
  productionLimit: 20,
  productionOffset: 0,
  productionHistoryLoading: false,

  financialGuidance: null,
  financialHistory: [],
  financialTotal: 0,
  financialLimit: 20,
  financialOffset: 0,
  financialHistoryLoading: false,

  loading: false,
  message: '',

  // ── Concept ──────────────────────────────────────────────────────
  EntrepConceptAI: async ({ idea, context }): Promise<boolean> => {
    try {
      set({ loading: true, message: '' })
      const res = await axios.post('/entrep-ai/concept', { idea, context })
      set({
        conceptGuidance: res.data.guidance,
        loading: false,
        message: 'Concept guidance generated successfully!',
      })
      return true
    } catch (error: any) {
      set({ loading: false })
      const status = error.response?.status
      const data = error.response?.data
      if (status === 401) { set({ message: data?.message || 'Unauthorized Access. Please log in' }); return false }
      if (status === 400) { set({ message: data?.message || 'Invalid request. Please check your input.' }); return false }
      if (status === 429) { set({ message: data?.message || 'Daily limit reached. Please try again tomorrow.' }); return false }
      if (status === 500) { set({ message: data?.error || data?.message || 'Something went wrong. Please try again.' }); return false }
      console.error('Entrep Concept Error:', error)
      set({ message: error.message || 'An unexpected error occurred.' })
      return false
    }
  },

  GetEntrepConcepts: async (opts) => {
    set({ conceptHistoryLoading: true, message: '' })
    try {
      const limit = opts?.limit ?? get().conceptLimit ?? 20
      const offset = opts?.offset ?? 0
      const res = await axios.get('/entrep-ai/concepts', { params: { limit, offset } })
      set({
        conceptHistory: offset === 0 ? res.data.concepts : [...get().conceptHistory, ...res.data.concepts],
        conceptTotal: res.data.total,
        conceptLimit: res.data.limit,
        conceptOffset: res.data.offset,
        conceptHistoryLoading: false,
      })
    } catch (error: any) {
      set({ conceptHistoryLoading: false })
      const status = error.response?.status
      const data = error.response?.data
      if (status === 401) return set({ message: data?.message || 'Unauthorized Access. Please log in' })
      console.error('Get Entrep Concepts Error:', error)
      set({ message: data?.message || 'Could not load your concept history.' })
    }
  },

  DeleteEntrepConcept: async (id: string) => {
    const previous = get().conceptHistory
    set({ conceptHistory: previous.filter((c) => c.id !== id), message: '' })
    try {
      await axios.delete(`/entrep-ai/concept/${id}`)
      // Cascade: refresh downstream stage histories too, since the backend
      // deletes any SWOT/Market/Production/Financial rows tied to this idea.
      get().GetEntrepSWOTs({ limit: get().swotLimit, offset: 0 })
      get().GetEntrepMarketResearches({ limit: get().marketLimit, offset: 0 })
      get().GetEntrepProductions({ limit: get().productionLimit, offset: 0 })
      get().GetEntrepFinancials({ limit: get().financialLimit, offset: 0 })
    } catch (error: any) {
      set({ conceptHistory: previous })
      const status = error.response?.status
      const data = error.response?.data
      if (status === 401) return set({ message: data?.message || 'Unauthorized Access. Please log in' })
      if (status === 404) return set({ message: data?.message || 'That concept could not be found.' })
      console.error('Delete Entrep Concept Error:', error)
      set({ message: data?.message || 'Could not delete this concept.' })
    }
  },

  // ── SWOT ─────────────────────────────────────────────────────────
  EntrepSWOTAI: async ({ idea, conceptStatement, notes }): Promise<boolean> => {
    try {
      set({ loading: true, message: '' })
      const res = await axios.post('/entrep-ai/swot', { idea, conceptStatement, notes })
      set({
        swotGuidance: res.data.guidance,
        loading: false,
        message: 'SWOT analysis generated successfully!',
      })
      return true
    } catch (error: any) {
      set({ loading: false })
      const status = error.response?.status
      const data = error.response?.data
      if (status === 401) { set({ message: data?.message || 'Unauthorized Access. Please log in' }); return false }
      if (status === 400) { set({ message: data?.message || 'Invalid request. Please check your input.' }); return false }
      if (status === 429) { set({ message: data?.message || 'Daily limit reached. Please try again tomorrow.' }); return false }
      if (status === 500) { set({ message: data?.error || data?.message || 'Something went wrong. Please try again.' }); return false }
      console.error('Entrep SWOT Error:', error)
      set({ message: error.message || 'An unexpected error occurred.' })
      return false
    }
  },

  GetEntrepSWOTs: async (opts) => {
    set({ swotHistoryLoading: true, message: '' })
    try {
      const limit = opts?.limit ?? get().swotLimit ?? 20
      const offset = opts?.offset ?? 0
      const res = await axios.get('/entrep-ai/swots', { params: { limit, offset } })
      set({
        swotHistory: offset === 0 ? res.data.swots : [...get().swotHistory, ...res.data.swots],
        swotTotal: res.data.total,
        swotLimit: res.data.limit,
        swotOffset: res.data.offset,
        swotHistoryLoading: false,
      })
    } catch (error: any) {
      set({ swotHistoryLoading: false })
      const status = error.response?.status
      const data = error.response?.data
      if (status === 401) return set({ message: data?.message || 'Unauthorized Access. Please log in' })
      console.error('Get Entrep SWOTs Error:', error)
      set({ message: data?.message || 'Could not load your SWOT history.' })
    }
  },

  // ── Market Research ──────────────────────────────────────────────
  EntrepMarketResearchAI: async ({ idea, conceptStatement, notes }): Promise<boolean> => {
    try {
      set({ loading: true, message: '' })
      const res = await axios.post('/entrep-ai/market-research', { idea, conceptStatement, notes })
      set({
        marketGuidance: res.data.guidance,
        loading: false,
        message: 'Market research generated successfully!',
      })
      return true
    } catch (error: any) {
      set({ loading: false })
      const status = error.response?.status
      const data = error.response?.data
      if (status === 401) { set({ message: data?.message || 'Unauthorized Access. Please log in' }); return false }
      if (status === 400) { set({ message: data?.message || 'Invalid request. Please check your input.' }); return false }
      if (status === 429) { set({ message: data?.message || 'Daily limit reached. Please try again tomorrow.' }); return false }
      if (status === 500) { set({ message: data?.error || data?.message || 'Something went wrong. Please try again.' }); return false }
      console.error('Entrep Market Research Error:', error)
      set({ message: error.message || 'An unexpected error occurred.' })
      return false
    }
  },

  GetEntrepMarketResearches: async (opts) => {
    set({ marketHistoryLoading: true, message: '' })
    try {
      const limit = opts?.limit ?? get().marketLimit ?? 20
      const offset = opts?.offset ?? 0
      const res = await axios.get('/entrep-ai/market-researches', { params: { limit, offset } })
      set({
        marketHistory: offset === 0 ? res.data.marketResearches : [...get().marketHistory, ...res.data.marketResearches],
        marketTotal: res.data.total,
        marketLimit: res.data.limit,
        marketOffset: res.data.offset,
        marketHistoryLoading: false,
      })
    } catch (error: any) {
      set({ marketHistoryLoading: false })
      const status = error.response?.status
      const data = error.response?.data
      if (status === 401) return set({ message: data?.message || 'Unauthorized Access. Please log in' })
      console.error('Get Entrep Market Researches Error:', error)
      set({ message: data?.message || 'Could not load your market research history.' })
    }
  },

  // ── Production ───────────────────────────────────────────────────
  EntrepProductionAI: async ({ idea, conceptStatement, suppliers, dailyOutput, operatingDaysPerWeek, variants }): Promise<boolean> => {
    try {
      set({ loading: true, message: '' })
      const res = await axios.post('/entrep-ai/production', {
        idea,
        conceptStatement,
        suppliers,
        dailyOutput,
        operatingDaysPerWeek,
        variants,
      })
      set({
        productionGuidance: res.data.guidance,
        loading: false,
        message: 'Production plan generated successfully!',
      })
      return true
    } catch (error: any) {
      set({ loading: false })
      const status = error.response?.status
      const data = error.response?.data
      if (status === 401) { set({ message: data?.message || 'Unauthorized Access. Please log in' }); return false }
      if (status === 400) { set({ message: data?.message || 'Invalid request. Please check your input.' }); return false }
      if (status === 429) { set({ message: data?.message || 'Daily limit reached. Please try again tomorrow.' }); return false }
      if (status === 500) { set({ message: data?.error || data?.message || 'Something went wrong. Please try again.' }); return false }
      console.error('Entrep Production Error:', error)
      set({ message: error.message || 'An unexpected error occurred.' })
      return false
    }
  },

  GetEntrepProductions: async (opts) => {
    set({ productionHistoryLoading: true, message: '' })
    try {
      const limit = opts?.limit ?? get().productionLimit ?? 20
      const offset = opts?.offset ?? 0
      const res = await axios.get('/entrep-ai/productions', { params: { limit, offset } })
      set({
        productionHistory: offset === 0 ? res.data.productions : [...get().productionHistory, ...res.data.productions],
        productionTotal: res.data.total,
        productionLimit: res.data.limit,
        productionOffset: res.data.offset,
        productionHistoryLoading: false,
      })
    } catch (error: any) {
      set({ productionHistoryLoading: false })
      const status = error.response?.status
      const data = error.response?.data
      if (status === 401) return set({ message: data?.message || 'Unauthorized Access. Please log in' })
      console.error('Get Entrep Productions Error:', error)
      set({ message: data?.message || 'Could not load your production history.' })
    }
  },

  // ── Financial ────────────────────────────────────────────────────
  EntrepFinancialAI: async ({ idea, conceptStatement, notes }): Promise<boolean> => {
    try {
      set({ loading: true, message: '' })
      const res = await axios.post('/entrep-ai/financial', { idea, conceptStatement, notes })
      set({
        financialGuidance: res.data.guidance,
        loading: false,
        message: 'Financial plan generated successfully!',
      })
      return true
    } catch (error: any) {
      set({ loading: false })
      const status = error.response?.status
      const data = error.response?.data
      if (status === 401) { set({ message: data?.message || 'Unauthorized Access. Please log in' }); return false }
      if (status === 400) { set({ message: data?.message || 'Invalid request. Please check your input.' }); return false }
      if (status === 429) { set({ message: data?.message || 'Daily limit reached. Please try again tomorrow.' }); return false }
      if (status === 500) { set({ message: data?.error || data?.message || 'Something went wrong. Please try again.' }); return false }
      console.error('Entrep Financial Error:', error)
      set({ message: error.message || 'An unexpected error occurred.' })
      return false
    }
  },

  GetEntrepFinancials: async (opts) => {
    set({ financialHistoryLoading: true, message: '' })
    try {
      const limit = opts?.limit ?? get().financialLimit ?? 20
      const offset = opts?.offset ?? 0
      const res = await axios.get('/entrep-ai/financials', { params: { limit, offset } })
      set({
        financialHistory: offset === 0 ? res.data.financials : [...get().financialHistory, ...res.data.financials],
        financialTotal: res.data.total,
        financialLimit: res.data.limit,
        financialOffset: res.data.offset,
        financialHistoryLoading: false,
      })
    } catch (error: any) {
      set({ financialHistoryLoading: false })
      const status = error.response?.status
      const data = error.response?.data
      if (status === 401) return set({ message: data?.message || 'Unauthorized Access. Please log in' })
      console.error('Get Entrep Financials Error:', error)
      set({ message: data?.message || 'Could not load your financial history.' })
    }
  },
}))