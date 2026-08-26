import {
  Lightbulb,
  ShieldCheck,
  Users,
  Factory,
  Wallet,
} from 'lucide-react'
import type { BusinessConceptData } from './entrpTypes'

export const ENTREP_STAGES = [
  { key: 'concept', label: 'Business Concept', icon: Lightbulb },
  { key: 'swot', label: 'SWOT Analysis', icon: ShieldCheck },
  { key: 'market', label: 'Market Research', icon: Users },
  { key: 'production', label: 'Production Plan', icon: Factory },
  { key: 'financial', label: 'Financial Plan', icon: Wallet },
] as const

export type EntrepStageKey = (typeof ENTREP_STAGES)[number]['key']

export const FEASIBILITY_STYLES: Record<Exclude<BusinessConceptData['feasibility'], ''>,
  { label: string; bg: string; color: string }
> = {
  strong: { label: 'Strong concept', bg: '#EAF3DE', color: '#27500A' },
  needs_refinement: { label: 'Needs refinement', bg: '#FAEEDA', color: '#633806' },
  too_broad: { label: 'Too broad', bg: '#FBEAEA', color: '#7A2020' },
}

export const MIN_SUPPLIERS = 1
export const MAX_SUPPLIERS = 10

export const MIN_STARTUP_COST_ITEMS = 1
export const MAX_STARTUP_COST_ITEMS = 15

export const SURVEY_SECTION_SWATCHES = [
  '#BA7517',
  '#0B1C33',
  '#3B6D11',
  '#7A2020',
  '#5B3A9E',
  '#0E6E6E',
  '#8A4B0F',
  '#1B4E82',
  '#633806',
]