import { eq } from 'drizzle-orm'
import { auth } from '@/auth'
import { getDb, schema } from '@/lib/db'
import type { PlanId } from '@/constants/plans'

export class SessionError extends Error {}

export interface SellerSession {
  userId: string
  tenantId: string
  plan: PlanId
  name: string | null
}

/** Sesión del vendedor con el plan LEÍDO DE LA BASE, no del token.
 *
 *  El token dura 30 días, así que si se tomara el plan de ahí una bajada
 *  de plan no surtiría efecto hasta el siguiente inicio de sesión: alguien
 *  que pasa de Elite a Básico conservaría los privilegios caros casi un
 *  mes. Cuesta una consulta por acción de escritura, y a cambio los topes
 *  del plan son ciertos en el momento en que se aplican.
 *
 *  Se usa la conexión del propietario a propósito: solo lee el plan del
 *  tenant al que el propio usuario pertenece, y es el paso previo a poder
 *  abrir la conexión con RLS. */
export async function requireSeller(): Promise<SellerSession> {
  const session = await auth()
  if (!session?.user?.id || !session.user.tenantId) {
    throw new SessionError('Sesión no válida.')
  }

  const db = getDb()
  const [tenant] = await db
    .select({ plan: schema.tenants.plan, status: schema.tenants.status })
    .from(schema.tenants)
    .where(eq(schema.tenants.id, session.user.tenantId))
    .limit(1)

  if (!tenant) throw new SessionError('Tu cuenta ya no existe.')
  if (tenant.status !== 'active') {
    throw new SessionError('Tu cuenta está suspendida. Contacta al administrador.')
  }

  return {
    userId: session.user.id,
    tenantId: session.user.tenantId,
    plan: tenant.plan as PlanId,
    name: session.user.name ?? null,
  }
}
