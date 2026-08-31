import { and, asc, desc, eq, ilike, isNull, or, sql } from 'drizzle-orm'
import { UNCATEGORIZED } from '@/constants/plans'
import { schema, withTenantDb } from '@/lib/db'
import { PLANS, type PlanId } from '@/constants/plans'

export interface CategoryRow {
  id: string
  name: string
  isDefault: boolean
  productCount: number
}

export interface ProductRow {
  id: string
  name: string
  description: string | null
  price: string | null
  currency: string
  supplier: string | null
  categoryId: string | null
  categoryName: string | null
  photoUrl: string | null
  updatedAt: Date
}

export interface ProductInput {
  name: string
  description?: string | null
  price?: string | null
  supplier?: string | null
  categoryId?: string | null
}

/** Error de negocio con mensaje pensado para mostrarse al vendedor. */
export class CatalogError extends Error {}

/* ============================================================
   LECTURA
   ============================================================ */

export async function listCategories(userId: string): Promise<CategoryRow[]> {
  return withTenantDb(userId, async (tx) => {
    const rows = await tx
      .select({
        id: schema.categories.id,
        name: schema.categories.name,
        isDefault: schema.categories.isDefault,
        productCount: sql<number>`count(${schema.products.id})::int`,
      })
      .from(schema.categories)
      .leftJoin(
        schema.products,
        and(
          eq(schema.products.categoryId, schema.categories.id),
          eq(schema.products.archived, false),
        ),
      )
      .groupBy(schema.categories.id)
      .orderBy(asc(schema.categories.name))

    return rows
  })
}




/** Total real de productos. NO se calcula sumando los contadores por
 *  categoría: los productos sin categoría quedarían fuera, y como este
 *  número gobierna el tope del plan, dejarlos sin contar permitiría
 *  superar el límite simplemente no categorizando. */
export async function countProducts(userId: string): Promise<number> {
  return withTenantDb(userId, async (tx) => {
    const [row] = await tx
      .select({ n: sql<number>`count(*)::int` })
      .from(schema.products)
      .where(eq(schema.products.archived, false))
    return row?.n ?? 0
  })
}

export async function countUncategorized(userId: string): Promise<number> {
  return withTenantDb(userId, async (tx) => {
    const [row] = await tx
      .select({ n: sql<number>`count(*)::int` })
      .from(schema.products)
      .where(and(eq(schema.products.archived, false), isNull(schema.products.categoryId)))
    return row?.n ?? 0
  })
}

export async function listProducts(
  userId: string,
  filters: { search?: string; categoryId?: string } = {},
): Promise<ProductRow[]> {
  return withTenantDb(userId, async (tx) => {
    const conditions = [eq(schema.products.archived, false)]

    if (filters.categoryId === UNCATEGORIZED) {
      conditions.push(isNull(schema.products.categoryId))
    } else if (filters.categoryId) {
      conditions.push(eq(schema.products.categoryId, filters.categoryId))
    }
    if (filters.search) {
      const term = `%${filters.search}%`
      // Se busca también en proveedor: "SION" es lo primero que escribiría
      // un vendedor que promociona productos de esa empresa.
      const match = or(
        ilike(schema.products.name, term),
        ilike(schema.products.description, term),
        ilike(schema.products.supplier, term),
      )
      if (match) conditions.push(match)
    }

    return tx
      .select({
        id: schema.products.id,
        name: schema.products.name,
        description: schema.products.description,
        price: schema.products.price,
        currency: schema.products.currency,
        supplier: schema.products.supplier,
        categoryId: schema.products.categoryId,
        categoryName: schema.categories.name,
        // Solo la primera foto: el listado no necesita las demás.
        photoUrl: sql<string | null>`(
          SELECT p.url FROM product_photos p
          WHERE p.product_id = ${schema.products.id}
          ORDER BY p.sort_order ASC LIMIT 1
        )`,
        updatedAt: schema.products.updatedAt,
      })
      .from(schema.products)
      .leftJoin(schema.categories, eq(schema.categories.id, schema.products.categoryId))
      .where(and(...conditions))
      .orderBy(desc(schema.products.updatedAt))
  })
}

export async function getProduct(userId: string, productId: string) {
  return withTenantDb(userId, async (tx) => {
    const [product] = await tx
      .select()
      .from(schema.products)
      .where(eq(schema.products.id, productId))
      .limit(1)

    if (!product) return null

    const photos = await tx
      .select({ id: schema.productPhotos.id, url: schema.productPhotos.url })
      .from(schema.productPhotos)
      .where(eq(schema.productPhotos.productId, productId))
      .orderBy(asc(schema.productPhotos.sortOrder))

    return { ...product, photos }
  })
}

/* ============================================================
   ESCRITURA
   ============================================================ */

/** El tope de productos es del plan, así que se comprueba antes de
 *  insertar. Se cuenta dentro de la misma transacción para que dos
 *  pestañas abiertas no puedan superar el límite entre las dos. */
export async function createProduct(
  userId: string,
  tenantId: string,
  plan: PlanId,
  input: ProductInput,
  photoUrls: string[] = [],
): Promise<string> {
  const max = PLANS[plan].maxProducts

  return withTenantDb(userId, async (tx) => {
    if (max !== null) {
      const [{ n }] = await tx
        .select({ n: sql<number>`count(*)::int` })
        .from(schema.products)
        .where(eq(schema.products.archived, false))

      if (n >= max) {
        throw new CatalogError(
          `Tu plan ${PLANS[plan].name} permite hasta ${max} productos. Elimina alguno o cambia de plan para añadir más.`,
        )
      }
    }

    const [product] = await tx
      .insert(schema.products)
      .values({
        tenantId,
        name: input.name,
        description: input.description || null,
        price: input.price || null,
        supplier: input.supplier || null,
        categoryId: input.categoryId || null,
      })
      .returning({ id: schema.products.id })

    if (photoUrls.length > 0) {
      await tx.insert(schema.productPhotos).values(
        photoUrls.map((url, index) => ({
          tenantId,
          productId: product.id,
          url,
          sortOrder: index,
        })),
      )
    }

    return product.id
  })
}

export async function updateProduct(
  userId: string,
  tenantId: string,
  productId: string,
  input: ProductInput,
  photoUrls: string[],
): Promise<void> {
  await withTenantDb(userId, async (tx) => {
    const updated = await tx
      .update(schema.products)
      .set({
        name: input.name,
        description: input.description || null,
        price: input.price || null,
        supplier: input.supplier || null,
        categoryId: input.categoryId || null,
        updatedAt: new Date(),
      })
      .where(eq(schema.products.id, productId))
      .returning({ id: schema.products.id })

    // RLS filtra por tenant: si no devolvió filas, el producto no es suyo.
    if (updated.length === 0) {
      throw new CatalogError('El producto no existe o no es tuyo.')
    }

    // Las fotos se rehacen por completo: es más simple y más predecible
    // que intentar reconciliar altas y bajas una por una.
    await tx
      .delete(schema.productPhotos)
      .where(eq(schema.productPhotos.productId, productId))

    if (photoUrls.length > 0) {
      await tx.insert(schema.productPhotos).values(
        photoUrls.map((url, index) => ({
          tenantId,
          productId,
          url,
          sortOrder: index,
        })),
      )
    }
  })
}

export async function deleteProduct(userId: string, productId: string): Promise<void> {
  await withTenantDb(userId, async (tx) => {
    const deleted = await tx
      .delete(schema.products)
      .where(eq(schema.products.id, productId))
      .returning({ id: schema.products.id })

    if (deleted.length === 0) {
      throw new CatalogError('El producto no existe o no es tuyo.')
    }
  })
}

export async function createCategory(
  userId: string,
  tenantId: string,
  name: string,
): Promise<CategoryRow> {
  const clean = name.trim()
  if (clean.length < 2) {
    throw new CatalogError('El nombre de la categoría es demasiado corto.')
  }

  return withTenantDb(userId, async (tx) => {
    const [existing] = await tx
      .select({ id: schema.categories.id })
      .from(schema.categories)
      .where(ilike(schema.categories.name, clean))
      .limit(1)

    if (existing) {
      throw new CatalogError(`Ya tienes una categoría llamada "${clean}".`)
    }

    const [created] = await tx
      .insert(schema.categories)
      .values({ tenantId, name: clean, isDefault: false })
      .returning({
        id: schema.categories.id,
        name: schema.categories.name,
        isDefault: schema.categories.isDefault,
      })

    return { ...created, productCount: 0 }
  })
}

export async function deleteCategory(userId: string, categoryId: string): Promise<void> {
  await withTenantDb(userId, async (tx) => {
    // Los productos no se borran: la referencia queda en null y pasan a
    // "Sin categoría". Perder productos por borrar una etiqueta sería
    // una sorpresa desagradable.
    const deleted = await tx
      .delete(schema.categories)
      .where(eq(schema.categories.id, categoryId))
      .returning({ id: schema.categories.id })

    if (deleted.length === 0) {
      throw new CatalogError('La categoría no existe o no es tuya.')
    }
  })
}
