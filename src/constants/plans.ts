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

/** Valor del filtro para productos sin categoría. Vive aquí, y no en el
 *  servicio, porque lo usa un componente de cliente: importarlo desde
 *  services/catalog arrastraría Drizzle y el driver de Neon al navegador. */
export const UNCATEGORIZED = 'sin-categoria'

/** Color de cada estado. El dorado es el color de la comisión en VendIA,
 *  así que se reserva para los dos estados donde hay dinero en juego:
 *  negociación (posible) y cerrado (confirmado, en relleno sólido). */
export const STATUS_STYLES: Record<ProspectStatus, string> = {
  nuevo: 'bg-linea-soft text-tinta-soft border-linea',
  contactado: 'bg-ciruela-50 text-ciruela-700 border-ciruela-200',
  interesado: 'bg-berry-50 text-berry-700 border-berry-200',
  negociacion: 'bg-dorado-50 text-dorado-700 border-dorado-200',
  cerrado: 'bg-dorado text-ciruela border-dorado',
  descartado: 'bg-linea-soft text-humo border-linea',
}

/** Filtros de fecha. Un vendedor piensa en "esta semana", no en rangos. */
export const DATE_FILTERS = [
  { value: '', label: 'Cualquier fecha' },
  { value: '1', label: 'Hoy' },
  { value: '7', label: 'Últimos 7 días' },
  { value: '30', label: 'Últimos 30 días' },
] as const
