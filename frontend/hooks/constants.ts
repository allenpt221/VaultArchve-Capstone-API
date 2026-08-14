import {
  Lightbulb,
  BookOpen,
  HelpCircle,
  FlaskConical,
  PenLine,
  ClipboardCheck,
} from 'lucide-react'
import type { MethodologyApproach, TopicGuidance, ConsistencyResult } from './types'

export const STAGES = [
  { key: 'topic', label: 'Topic Selection', icon: Lightbulb },
  { key: 'literature', label: 'Literature Review', icon: BookOpen },
  { key: 'methodology', label: 'Methodology', icon: FlaskConical },
  { key: 'collection', label: 'Data Collection & Analysis', icon: HelpCircle },
  { key: 'paper-review', label: 'Review & Check', icon: PenLine },
  { key: 'review', label: 'Review & Submit', icon: ClipboardCheck },
] as const

export type StageKey = (typeof STAGES)[number]['key']

export const FEASIBILITY_STYLES: Record<
  TopicGuidance['feasibility'],
  { label: string; bg: string; color: string }
> = {
  strong: { label: 'Strong topic', bg: '#EAF3DE', color: '#27500A' },
  needs_narrowing: { label: 'Needs narrowing', bg: '#FAEEDA', color: '#633806' },
  too_broad: { label: 'Too broad', bg: '#FBEAEA', color: '#7A2020' },
}

export const MIN_SOURCES = 3

export const THEME_SWATCHES = ['#BA7517', '#0B1C33', '#3B6D11', '#7A2020', '#5B3A9E', '#0E6E6E']

export const APPROACH_STYLES: Record<MethodologyApproach, { label: string; bg: string; color: string }> = {
  qualitative: { label: 'Qualitative', bg: '#EDE7F9', color: '#3D2B7A' },
  quantitative: { label: 'Quantitative', bg: '#E3EEFB', color: '#1B4E82' },
  mixed_methods: { label: 'Mixed Methods', bg: '#FDEEDD', color: '#8A4B0F' },
}

export const MIN_RESEARCH_QUESTIONS = 1
export const MAX_RESEARCH_QUESTIONS = 6


export const MAX_PDF_SIZE_MB = 15

export const CONSISTENCY_STYLES: Record<ConsistencyResult, { label: string; bg: string; color: string }> = {
  Pass: { label: 'Pass', bg: '#EAF3DE', color: '#27500A' },
  Partial: { label: 'Partial', bg: '#FAEEDA', color: '#633806' },
  Mismatch: { label: 'Mismatch', bg: '#FBEAEA', color: '#7A2020' },
  'Not Found': { label: 'Not Found', bg: '#EDEDED', color: '#4A4A4A' },
}