import { asc, count, eq, ilike } from 'drizzle-orm'
import { schema, withTenantDb } from '@/lib/db'
import { PLANS, type PlanId } from '@/constants/plans'
import { DEFAULT_TEMPLATES } from '@/lib/whatsapp'

export interface TemplateRow {
  id: string
  name: string
  body: string
  isDefault: boolean
}

export class TemplateError extends Error {}

/** El plan Básico trae tres plantillas fijas: puede usarlas, no editarlas. */
export function canCustomize(plan: PlanId): boolean {
  return PLANS[plan].templates !== 'fijas'
}

/** Las variables avanzadas (precio, proveedor, tu nombre) son de Elite. */
export function canUseAdvancedVariables(plan: PlanId): boolean {
  return PLANS[plan].templates === 'avanzadas'
}

/** Devuelve las plantillas del vendedor, sembrando las tres por defecto la
 *  primera vez. Se siembra aquí y no solo en el registro para que las
 *  cuentas creadas antes de este módulo también las tengan. */
export async function listTemplates(
  userId: string,
  tenantId: string,
): Promise<TemplateRow[]> {
  return withTenantDb(userId, async (tx) => {
    const existing = await tx
      .select({
        id: schema.messageTemplates.id,
        name: schema.messageTemplates.name,
        body: schema.messageTemplates.body,
        isDefault: schema.messageTemplates.isDefault,
      })
      .from(schema.messageTemplates)
      .orderBy(asc(schema.messageTemplates.createdAt))

    if (existing.length > 0) return existing

    await tx.insert(schema.messageTemplates).values(
      DEFAULT_TEMPLATES.map((template) => ({
        tenantId,
        name: template.name,
        body: template.body,
        isDefault: true,
      })),
    )

    return tx
      .select({
        id: schema.messageTemplates.id,
        name: schema.messageTemplates.name,
        body: schema.messageTemplates.body,
        isDefault: schema.messageTemplates.isDefault,
      })
      .from(schema.messageTemplates)
      .orderBy(asc(schema.messageTemplates.createdAt))
  })
}

export async function createTemplate(
  userId: string,
  tenantId: string,
  plan: PlanId,
  name: string,
  body: string,
): Promise<void> {
  if (!canCustomize(plan)) {
    throw new TemplateError(
      `El plan ${PLANS[plan].name} incluye las 3 plantillas fijas. Cambia de plan para crear las tuyas.`,
    )
  }

  await withTenantDb(userId, async (tx) => {
    const [duplicate] = await tx
      .select({ id: schema.messageTemplates.id })
      .from(schema.messageTemplates)
      .where(ilike(schema.messageTemplates.name, name))
      .limit(1)

    if (duplicate) throw new TemplateError(`Ya tienes una plantilla llamada "${name}".`)

    await tx
      .insert(schema.messageTemplates)
      .values({ tenantId, name, body, isDefault: false })
  })
}

export async function updateTemplate(
  userId: string,
  plan: PlanId,
  templateId: string,
  name: string,
  body: string,
): Promise<void> {
  if (!canCustomize(plan)) {
    throw new TemplateError(
      `El plan ${PLANS[plan].name} no permite editar las plantillas. Cambia de plan para personalizarlas.`,
    )
  }

  await withTenantDb(userId, async (tx) => {
    const updated = await tx
      .update(schema.messageTemplates)
      .set({ name, body, updatedAt: new Date() })
      .where(eq(schema.messageTemplates.id, templateId))
      .returning({ id: schema.messageTemplates.id })

    if (updated.length === 0) throw new TemplateError('La plantilla no existe o no es tuya.')
  })
}

export async function deleteTemplate(
  userId: string,
  plan: PlanId,
  templateId: string,
): Promise<void> {
  if (!canCustomize(plan)) {
    throw new TemplateError(
      `El plan ${PLANS[plan].name} no permite eliminar las plantillas fijas.`,
    )
  }

  await withTenantDb(userId, async (tx) => {
    const [template] = await tx
      .select({ isDefault: schema.messageTemplates.isDefault })
      .from(schema.messageTemplates)
      .where(eq(schema.messageTemplates.id, templateId))
      .limit(1)

    if (!template) throw new TemplateError('La plantilla no existe o no es tuya.')

    // Se protege la última plantilla: quedarse sin ninguna dejaría el botón
    // de WhatsApp inservible desde la ficha del prospecto.
    const [{ n }] = await tx
      .select({ n: count() })
      .from(schema.messageTemplates)

    if (n <= 1) {
      throw new TemplateError('Debes conservar al menos una plantilla.')
    }

    await tx
      .delete(schema.messageTemplates)
      .where(eq(schema.messageTemplates.id, templateId))
  })
}
