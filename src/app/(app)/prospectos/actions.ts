'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { SessionError, requireSeller } from '@/lib/session'
import {
  CrmError,
  changeStatus,
  createProspect,
  deleteProspect,
  updateProspect,
} from '@/services/crm'
import { PROSPECT_STATUSES, type ProspectStatus } from '@/constants/plans'

export interface ActionResult {
  ok: boolean
  error?: string
  prospectId?: string
}

const STATUS_VALUES = PROSPECT_STATUSES.map((s) => s.value) as [string, ...string[]]

const money = z
  .string()
  .trim()
  .regex(/^\d{1,10}(\.\d{1,2})?$/, 'La comisión debe ser un número')
  .optional()
  .or(z.literal(''))

const prospectSchema = z.object({
  name: z.string().trim().min(2, 'El nombre es demasiado corto').max(150),
  phone: z.string().trim().max(40).optional().or(z.literal('')),
  email: z.string().trim().email('Correo inválido').optional().or(z.literal('')),
  status: z.enum(STATUS_VALUES),
  source: z.string().trim().max(120).optional().or(z.literal('')),
  notes: z.string().trim().max(4000).optional().or(z.literal('')),
  commissionEstimated: money,
  commissionConfirmed: money,
  productIds: z.array(z.string().uuid()).max(20).default([]),
})

function toResult(error: unknown): ActionResult {
  if (error instanceof CrmError || error instanceof SessionError) {
    return { ok: false, error: error.message }
  }
  console.error('[prospectos]', error)
  return { ok: false, error: 'Ocurrió un error inesperado. Inténtalo otra vez.' }
}

export async function saveProspectAction(
  prospectId: string | null,
  raw: unknown,
): Promise<ActionResult> {
  try {
    const { userId, tenantId, plan } = await requireSeller()

    const parsed = prospectSchema.safeParse(raw)
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
    }
    const input = { ...parsed.data, status: parsed.data.status as ProspectStatus }

    if (prospectId) {
      await updateProspect(userId, tenantId, prospectId, input)
    } else {
      prospectId = await createProspect(userId, tenantId, plan, input)
    }

    revalidatePath('/prospectos')
    revalidatePath('/panel')
    return { ok: true, prospectId }
  } catch (error) {
    return toResult(error)
  }
}

export async function changeStatusAction(
  prospectId: string,
  status: string,
): Promise<ActionResult> {
  try {
    const { userId } = await requireSeller()

    const parsed = z.enum(STATUS_VALUES).safeParse(status)
    if (!parsed.success) return { ok: false, error: 'Estado no válido' }

    await changeStatus(userId, prospectId, parsed.data as ProspectStatus)
    revalidatePath('/prospectos')
    revalidatePath('/panel')
    return { ok: true }
  } catch (error) {
    return toResult(error)
  }
}

export async function deleteProspectAction(prospectId: string): Promise<ActionResult> {
  try {
    const { userId } = await requireSeller()
    await deleteProspect(userId, prospectId)
    revalidatePath('/prospectos')
    revalidatePath('/panel')
    return { ok: true }
  } catch (error) {
    return toResult(error)
  }
}
