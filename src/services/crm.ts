import { and, count, desc, eq, gte, ilike, inArray, or, sql } from 'drizzle-orm'
import { schema, withTenantDb } from '@/lib/db'
import { PLANS, type PlanId, type ProspectStatus } from '@/constants/plans'

export interface ProspectRow {
  id: string
  name: string
  phone: string | null
  email: string | null
  status: ProspectStatus
  source: string | null
  commissionEstimated: string | null
  commissionConfirmed: string | null
  closedAt: Date | null
  createdAt: Date
  /** Nombres de los productos de interés, para mostrarlos en el listado. */
  productNames: string[]
}

export interface ProspectInput {
  name: string
  phone?: string | null
  email?: string | null
  status: ProspectStatus
  source?: string | null
  notes?: string | null
  commissionEstimated?: string | null
  commissionConfirmed?: string | null
  productIds: string[]
}

export interface ProspectFilters {
  search?: string
  status?: string
  productId?: string
  /** Días hacia atrás desde hoy. Sin valor, sin filtro de fecha. */
  days?: number
}

export class CrmError extends Error {}

/** Recuento por estado, para los chips del filtro. */
export interface StatusCounts {
  total: number
  byStatus: Record<string, number>
}

export async function getProspectCounts(userId: string): Promise<StatusCounts> {
  return withTenantDb(userId, async (tx) => {
    const rows = await tx
      .select({ status: schema.prospects.status, n: count() })
      .from(schema.prospects)
      .groupBy(schema.prospects.status)

    const byStatus: Record<string, number> = {}
    let total = 0
    for (const row of rows) {
      byStatus[row.status] = row.n
      total += row.n
    }
    return { total, byStatus }
  })
}

export async function listProspects(
  userId: string,
  filters: ProspectFilters = {},
): Promise<ProspectRow[]> {
  return withTenantDb(userId, async (tx) => {
    const conditions = []

    if (filters.status) {
      conditions.push(eq(schema.prospects.status, filters.status))
    }

    if (filters.days) {
      const since = new Date()
      since.setDate(since.getDate() - filters.days)
      conditions.push(gte(schema.prospects.createdAt, since))
    }

    if (filters.search) {
      const term = `%${filters.search}%`
      const match = or(
        ilike(schema.prospects.name, term),
        ilike(schema.prospects.phone, term),
        ilike(schema.prospects.email, term),
        ilike(schema.prospects.source, term),
      )
      if (match) conditions.push(match)
    }

    // El filtro por producto se resuelve con EXISTS y no con un JOIN, para
    // que un prospecto interesado en varios productos no aparezca repetido.
    if (filters.productId) {
      conditions.push(
        sql`EXISTS (
          SELECT 1 FROM prospect_products pp
          WHERE pp.prospect_id = ${schema.prospects.id}
            AND pp.product_id = ${filters.productId}
        )`,
      )
    }

    const rows = await tx
      .select({
        id: schema.prospects.id,
        name: schema.prospects.name,
        phone: schema.prospects.phone,
        email: schema.prospects.email,
        status: schema.prospects.status,
        source: schema.prospects.source,
        commissionEstimated: schema.prospects.commissionEstimated,
        commissionConfirmed: schema.prospects.commissionConfirmed,
        closedAt: schema.prospects.closedAt,
        createdAt: schema.prospects.createdAt,
      })
      .from(schema.prospects)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(schema.prospects.updatedAt))

    if (rows.length === 0) return []

    // Los productos se traen en una sola consulta y se agrupan en memoria:
    // una consulta por prospecto sería N+1.
    const links = await tx
      .select({
        prospectId: schema.prospectProducts.prospectId,
        productName: schema.products.name,
      })
      .from(schema.prospectProducts)
      .innerJoin(schema.products, eq(schema.products.id, schema.prospectProducts.productId))
      .where(
        inArray(
          schema.prospectProducts.prospectId,
          rows.map((r) => r.id),
        ),
      )

    const byProspect = new Map<string, string[]>()
    for (const link of links) {
      const list = byProspect.get(link.prospectId) ?? []
      list.push(link.productName)
      byProspect.set(link.prospectId, list)
    }

    return rows.map((row) => ({
      ...row,
      status: row.status as ProspectStatus,
      productNames: byProspect.get(row.id) ?? [],
    }))
  })
}

export async function getProspect(userId: string, prospectId: string) {
  return withTenantDb(userId, async (tx) => {
    const [prospect] = await tx
      .select()
      .from(schema.prospects)
      .where(eq(schema.prospects.id, prospectId))
      .limit(1)

    if (!prospect) return null

    const productIds = await tx
      .select({ productId: schema.prospectProducts.productId })
      .from(schema.prospectProducts)
      .where(eq(schema.prospectProducts.prospectId, prospectId))

    return { ...prospect, productIds: productIds.map((p) => p.productId) }
  })
}

/* ============================================================
   ESCRITURA
   ============================================================ */

/** Un prospecto se considera cerrado en el momento en que pasa a ese
 *  estado. La fecha se guarda sola: es la que alimenta la comisión del mes
 *  en el panel, y pedírsela al vendedor sería una fricción inútil. */
function closedAtFor(status: ProspectStatus, previous: Date | null): Date | null {
  if (status !== 'cerrado') return null
  return previous ?? new Date()
}

export async function createProspect(
  userId: string,
  tenantId: string,
  plan: PlanId,
  input: ProspectInput,
): Promise<string> {
  const max = PLANS[plan].maxProspects

  return withTenantDb(userId, async (tx) => {
    if (max !== null) {
      // Se cuenta dentro de la transacción para que dos pestañas abiertas
      // no puedan superar el tope entre las dos.
      const [{ n }] = await tx
        .select({ n: sql<number>`count(*)::int` })
        .from(schema.prospects)

      if (n >= max) {
        throw new CrmError(
          `Tu plan ${PLANS[plan].name} permite hasta ${max} prospectos. Descarta alguno o cambia de plan para registrar más.`,
        )
      }
    }

    const [prospect] = await tx
      .insert(schema.prospects)
      .values({
        tenantId,
        name: input.name,
        phone: input.phone || null,
        email: input.email || null,
        status: input.status,
        source: input.source || null,
        notes: input.notes || null,
        commissionEstimated: input.commissionEstimated || null,
        commissionConfirmed: input.commissionConfirmed || null,
        closedAt: closedAtFor(input.status, null),
      })
      .returning({ id: schema.prospects.id })

    if (input.productIds.length > 0) {
      await tx.insert(schema.prospectProducts).values(
        input.productIds.map((productId) => ({
          tenantId,
          prospectId: prospect.id,
          productId,
        })),
      )
    }

    return prospect.id
  })
}

/** Al editar NO se toca el estado ni la fecha de cierre: de eso se encarga
 *  únicamente changeStatus(). Si el formulario también los escribiera,
 *  guardaría el estado que tenía cargado al abrir la página y desharía en
 *  silencio el cambio hecho con el selector rápido — un vendedor cerraría
 *  una venta, editaría una nota y perdería la comisión del mes. */
export async function updateProspect(
  userId: string,
  tenantId: string,
  prospectId: string,
  input: ProspectInput,
): Promise<void> {
  await withTenantDb(userId, async (tx) => {
    const updated = await tx
      .update(schema.prospects)
      .set({
        name: input.name,
        phone: input.phone || null,
        email: input.email || null,
        source: input.source || null,
        notes: input.notes || null,
        commissionEstimated: input.commissionEstimated || null,
        commissionConfirmed: input.commissionConfirmed || null,
        updatedAt: new Date(),
      })
      .where(eq(schema.prospects.id, prospectId))
      .returning({ id: schema.prospects.id })

    if (updated.length === 0) throw new CrmError('El prospecto no existe o no es tuyo.')

    await tx
      .delete(schema.prospectProducts)
      .where(eq(schema.prospectProducts.prospectId, prospectId))

    if (input.productIds.length > 0) {
      await tx.insert(schema.prospectProducts).values(
        input.productIds.map((productId) => ({
          tenantId,
          prospectId,
          productId,
        })),
      )
    }
  })
}

/** Cambio rápido de estado desde la ficha, sin abrir el formulario. */
export async function changeStatus(
  userId: string,
  prospectId: string,
  status: ProspectStatus,
): Promise<void> {
  await withTenantDb(userId, async (tx) => {
    const [current] = await tx
      .select({ closedAt: schema.prospects.closedAt })
      .from(schema.prospects)
      .where(eq(schema.prospects.id, prospectId))
      .limit(1)

    if (!current) throw new CrmError('El prospecto no existe o no es tuyo.')

    await tx
      .update(schema.prospects)
      .set({
        status,
        closedAt: closedAtFor(status, current.closedAt),
        updatedAt: new Date(),
      })
      .where(eq(schema.prospects.id, prospectId))
  })
}

export async function deleteProspect(userId: string, prospectId: string): Promise<void> {
  await withTenantDb(userId, async (tx) => {
    const deleted = await tx
      .delete(schema.prospects)
      .where(eq(schema.prospects.id, prospectId))
      .returning({ id: schema.prospects.id })

    if (deleted.length === 0) {
      throw new CrmError('El prospecto no existe o no es tuyo.')
    }
  })
}

/** Lista mínima del catálogo, para los selectores del CRM. */
export async function listProductOptions(userId: string) {
  return withTenantDb(userId, async (tx) =>
    tx
      .select({ id: schema.products.id, name: schema.products.name })
      .from(schema.products)
      .where(eq(schema.products.archived, false))
      .orderBy(schema.products.name),
  )
}
