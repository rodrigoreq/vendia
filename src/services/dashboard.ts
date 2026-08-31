import { and, count, eq, isNull, ne, sql, sum } from 'drizzle-orm'
import { isDatabaseConfigured, schema, withTenantDb } from '@/lib/db'

export interface DashboardStats {
  prospects: number
  products: number
  imagesThisMonth: number
  /** Comisión confirmada del mes en curso, en bolivianos. */
  commissionMonth: number
}

const EMPTY: DashboardStats = {
  prospects: 0,
  products: 0,
  imagesThisMonth: 0,
  commissionMonth: 0,
}

/** Datos ficticios solo para el modo demostración, cuando aún no hay base. */
const DEMO: DashboardStats = {
  prospects: 147,
  products: 23,
  imagesThisMonth: 31,
  commissionMonth: 4850,
}

function currentPeriod(): string {
  const now = new Date()
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`
}

export async function getDashboardStats(userId: string | null): Promise<DashboardStats> {
  if (!isDatabaseConfigured) return DEMO
  if (!userId) return EMPTY

  // Pasa por withTenantDb: las políticas filtran por tenant, así que estas
  // consultas no necesitan (ni deben) llevar el tenant_id a mano.
  return withTenantDb(userId, async (tx) => {
    const [products] = await tx
      .select({ n: count() })
      .from(schema.products)
      .where(eq(schema.products.archived, false))

    // "Activos" = los que siguen en juego. Se excluyen los cerrados (ya
    // rindieron) y los descartados, que no tienen fecha de cierre pero
    // tampoco son seguimiento pendiente.
    const [prospects] = await tx
      .select({ n: count() })
      .from(schema.prospects)
      .where(
        and(
          isNull(schema.prospects.closedAt),
          ne(schema.prospects.status, 'descartado'),
        ),
      )

    const [usage] = await tx
      .select({ n: schema.usageCounters.imagesGenerated })
      .from(schema.usageCounters)
      .where(eq(schema.usageCounters.period, currentPeriod()))
      .limit(1)

    const [commission] = await tx
      .select({ total: sum(schema.prospects.commissionConfirmed) })
      .from(schema.prospects)
      .where(
        and(
          eq(schema.prospects.status, 'cerrado'),
          sql`date_trunc('month', ${schema.prospects.closedAt}) = date_trunc('month', now())`,
        ),
      )

    return {
      products: products?.n ?? 0,
      prospects: prospects?.n ?? 0,
      imagesThisMonth: usage?.n ?? 0,
      commissionMonth: Number(commission?.total ?? 0),
    }
  })
}
