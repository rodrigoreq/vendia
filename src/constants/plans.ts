export type PlanId = 'basico' | 'profesional' | 'elite'

export interface Plan {
  id: PlanId
  name: string
  priceMonthly: number
  priceYearly: number
  /** null significa ilimitado. */
  maxProducts: number | null
  maxProspects: number | null
  maxImagesPerMonth: number
  /** fijas | personalizables | avanzadas */
  templates: 'fijas' | 'personalizables' | 'avanzadas'
  maxTemplates: number | null
}

export const PLANS: Record<PlanId, Plan> = {
  basico: {
    id: 'basico',
    name: 'Básico',
    priceMonthly: 79,
    priceYearly: 790,
    maxProducts: 15,
    maxProspects: 100,
    maxImagesPerMonth: 15,
    templates: 'fijas',
    maxTemplates: 3,
  },
  profesional: {
    id: 'profesional',
    name: 'Profesional',
    priceMonthly: 149,
    priceYearly: 1490,
    maxProducts: 60,
    maxProspects: 500,
    maxImagesPerMonth: 50,
    templates: 'personalizables',
    maxTemplates: null,
  },
  elite: {
    id: 'elite',
    name: 'Elite',
    priceMonthly: 249,
    priceYearly: 2490,
    maxProducts: null,
    maxProspects: null,
    maxImagesPerMonth: 150,
    templates: 'avanzadas',
    maxTemplates: null,
  },
}

export const PLAN_IDS = Object.keys(PLANS) as PlanId[]

/** Categorías que se crean con cada cuenta nueva. El usuario puede
 *  añadir las suyas libremente. */
export const DEFAULT_CATEGORIES = ['Terrenos', 'Membresías', 'Salud'] as const

export const PROSPECT_STATUSES = [
  { value: 'nuevo', label: 'Nuevo' },
  { value: 'contactado', label: 'Contactado' },
  { value: 'interesado', label: 'Interesado' },
  { value: 'negociacion', label: 'En negociación' },
  { value: 'cerrado', label: 'Compró / Cerró' },
  { value: 'descartado', label: 'Descartado' },
] as const

export type ProspectStatus = (typeof PROSPECT_STATUSES)[number]['value']
