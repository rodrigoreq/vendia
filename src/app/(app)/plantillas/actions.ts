'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { SessionError, requireSeller } from '@/lib/session'
import {
  TemplateError,
  createTemplate,
  deleteTemplate,
  updateTemplate,
} from '@/services/templates'

export interface ActionResult {
  ok: boolean
  error?: string
}

const templateSchema = z.object({
  name: z.string().trim().min(2, 'El nombre es demasiado corto').max(80),
  body: z
    .string()
    .trim()
    .min(10, 'El mensaje es demasiado corto')
    // WhatsApp corta los mensajes muy largos y wa.me los pasa por la URL,
    // así que se limita a algo que quepa cómodo.
    .max(1200, 'El mensaje no puede pasar de 1200 caracteres'),
})

function toResult(error: unknown): ActionResult {
  if (error instanceof TemplateError || error instanceof SessionError) {
    return { ok: false, error: error.message }
  }
  console.error('[plantillas]', error)
  return { ok: false, error: 'Ocurrió un error inesperado. Inténtalo otra vez.' }
}

export async function saveTemplateAction(
  templateId: string | null,
  raw: unknown,
): Promise<ActionResult> {
  try {
    const { userId, tenantId, plan } = await requireSeller()

    const parsed = templateSchema.safeParse(raw)
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
    }
    const { name, body } = parsed.data

    if (templateId) {
      await updateTemplate(userId, plan, templateId, name, body)
    } else {
      await createTemplate(userId, tenantId, plan, name, body)
    }

    revalidatePath('/plantillas')
    return { ok: true }
  } catch (error) {
    return toResult(error)
  }
}

export async function deleteTemplateAction(templateId: string): Promise<ActionResult> {
  try {
    const { userId, plan } = await requireSeller()
    await deleteTemplate(userId, plan, templateId)
    revalidatePath('/plantillas')
    return { ok: true }
  } catch (error) {
    return toResult(error)
  }
}
