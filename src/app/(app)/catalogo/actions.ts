'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { SessionError, requireSeller } from '@/lib/session'
import {
  CatalogError,
  createCategory,
  createProduct,
  deleteCategory,
  deleteProduct,
  updateProduct,
} from '@/services/catalog'

export interface ActionResult {
  ok: boolean
  error?: string
  productId?: string
}

const productSchema = z.object({
  name: z.string().trim().min(2, 'El nombre es demasiado corto').max(150),
  description: z.string().trim().max(2000).optional().or(z.literal('')),
  // Se acepta "45000" o "45000.50"; se valida como número para no guardar
  // texto que luego rompa los cálculos de comisión.
  price: z
    .string()
    .trim()
    .regex(/^\d{1,10}(\.\d{1,2})?$/, 'El precio debe ser un número')
    .optional()
    .or(z.literal('')),
  supplier: z.string().trim().max(120).optional().or(z.literal('')),
  categoryId: z.string().uuid().optional().or(z.literal('')),
  photoUrls: z.array(z.string().url()).max(6).default([]),
})

function toResult(error: unknown): ActionResult {
  if (error instanceof CatalogError || error instanceof SessionError) {
    return { ok: false, error: error.message }
  }
  console.error('[catalogo]', error)
  return { ok: false, error: 'Ocurrió un error inesperado. Inténtalo otra vez.' }
}

export async function saveProductAction(
  productId: string | null,
  raw: unknown,
): Promise<ActionResult> {
  try {
    const { userId, tenantId, plan } = await requireSeller()

    const parsed = productSchema.safeParse(raw)
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
    }
    const { photoUrls, ...input } = parsed.data

    if (productId) {
      await updateProduct(userId, tenantId, productId, input, photoUrls)
    } else {
      productId = await createProduct(userId, tenantId, plan, input, photoUrls)
    }

    revalidatePath('/catalogo')
    revalidatePath('/panel')
    return { ok: true, productId }
  } catch (error) {
    return toResult(error)
  }
}

export async function deleteProductAction(productId: string): Promise<ActionResult> {
  try {
    const { userId } = await requireSeller()
    await deleteProduct(userId, productId)
    revalidatePath('/catalogo')
    revalidatePath('/panel')
    return { ok: true }
  } catch (error) {
    return toResult(error)
  }
}

export async function createCategoryAction(name: string): Promise<ActionResult> {
  try {
    const { userId, tenantId } = await requireSeller()
    await createCategory(userId, tenantId, name)
    revalidatePath('/catalogo')
    return { ok: true }
  } catch (error) {
    return toResult(error)
  }
}

export async function deleteCategoryAction(categoryId: string): Promise<ActionResult> {
  try {
    const { userId } = await requireSeller()
    await deleteCategory(userId, categoryId)
    revalidatePath('/catalogo')
    return { ok: true }
  } catch (error) {
    return toResult(error)
  }
}
