import { count, eq, sql } from 'drizzle-orm'
import { schema, withTenantDb } from '@/lib/db'
import { PLANS, type PlanId } from '@/constants/plans'

export interface UsageItem {
  key: 'products' | 'prospects' | 'images' | 'templates'
  label: string
  used: number
  /** null significa que no hay tope numérico en este plan. */
  limit: number | null
  /** `meter` dibuja barra y consumo; `count` solo muestra el número, para
   *  lo que no es una cuota; `unlimited` marca lo que de verdad no tiene
   *  techo, como los productos del plan Elite. */
  display: 'meter' | 'count' | 'unlimited'
  /** Texto que explica qué se está midiendo. */
  hint: string
}

export interface UsageReport {
  plan: PlanId
  items: UsageItem[]
  /** Cuándo se reinicia el contador de imágenes. */
  imagesRenewAt: string
  createdAt: Date | null
}

export function currentPeriod(): string {
  const now = new Date()
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`
}

/** Las imágenes se reinician el primer día del mes siguiente. Los demás
 *  topes no se reinician: son de acumulado, no de consumo mensual. */
function nextRenewal(): string {
  const now = new Date()
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1))
  return next.toLocaleDateString('es-BO', { day: 'numeric', month: 'long' })
}

export async function getUsageReport(
  userId: string,
  plan: PlanId,
): Promise<UsageReport> {
  const limits = PLANS[plan]

  return withTenantDb(userId, async (tx) => {
    const [products] = await tx
      .select({ n: count() })
      .from(schema.products)
      .where(eq(schema.products.archived, false))

    const [prospects] = await tx.select({ n: count() }).from(schema.prospects)

    const [templates] = await tx.select({ n: count() }).from(schema.messageTemplates)

    const [usage] = await tx
      .select({ n: schema.usageCounters.imagesGenerated })
      .from(schema.usageCounters)
      .where(eq(schema.usageCounters.period, currentPeriod()))
      .limit(1)

    const [tenant] = await tx
      .select({ createdAt: schema.tenants.createdAt })
      .from(schema.tenants)
      .limit(1)

    return {
      plan,
      imagesRenewAt: nextRenewal(),
      createdAt: tenant?.createdAt ?? null,
      items: [
        {
          key: 'products',
          label: 'Productos en catálogo',
          used: products?.n ?? 0,
          limit: limits.maxProducts,
          display: limits.maxProducts === null ? 'unlimited' : 'meter',
          hint: 'Cuenta los productos activos; los eliminados liberan espacio.',
        },
        {
          key: 'prospects',
          label: 'Prospectos en el CRM',
          used: prospects?.n ?? 0,
          limit: limits.maxProspects,
          display: limits.maxProspects === null ? 'unlimited' : 'meter',
          hint: 'Cuenta todos, incluidos los cerrados y descartados.',
        },
        {
          key: 'images',
          label: 'Imágenes IA este mes',
          used: usage?.n ?? 0,
          limit: limits.maxImagesPerMonth,
          display: 'meter',
          hint: 'Solo se descuenta al generar un fondo nuevo; reescribir el texto es gratis.',
        },
        {
          key: 'templates',
          label: 'Plantillas de WhatsApp',
          used: templates?.n ?? 0,
          // Las plantillas nunca son una cuota. En Básico "3 fijas" describe
          // una capacidad —no puedes crear ni editar—, no un tope de
          // cantidad. Pintarlo como barra mostraría "4 de 3" a quien bajó de
          // plan conservando las suyas, y daría a entender que se le van a
          // borrar. Se muestra el número y se explica la restricción real.
          limit: null,
          display: 'count',
          hint:
            limits.templates === 'fijas'
              ? 'Tu plan usa las plantillas tal como están. Para editarlas o crear las tuyas, cambia de plan.'
              : 'Puedes crear y editar todas las que necesites.',
        },
      ],
    }
  })
}

/** Consumo total del mes en curso, para el panel del super-admin. */
export async function getImagesUsedThisMonth(userId: string): Promise<number> {
  return withTenantDb(userId, async (tx) => {
    const [row] = await tx
      .select({ n: sql<number>`coalesce(sum(${schema.usageCounters.imagesGenerated}),0)::int` })
      .from(schema.usageCounters)
      .where(eq(schema.usageCounters.period, currentPeriod()))
    return row?.n ?? 0
  })
}
