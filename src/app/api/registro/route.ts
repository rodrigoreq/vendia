import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { getDb, isDatabaseConfigured, schema } from '@/lib/db'
import { DEFAULT_CATEGORIES } from '@/constants/plans'

const registroSchema = z.object({
  name: z.string().trim().min(3, 'Escribe tu nombre completo').max(120),
  email: z.string().trim().toLowerCase().email('Correo electrónico inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres').max(72),
})

export async function POST(request: Request) {
  if (!isDatabaseConfigured) {
    return NextResponse.json(
      {
        error:
          'El registro necesita la base de datos conectada. Por ahora usa las cuentas de demostración.',
      },
      { status: 503 },
    )
  }

  const parsed = registroSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' },
      { status: 400 },
    )
  }

  const { name, email, password } = parsed.data
  const db = getDb()

  const [existing] = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.email, email))
    .limit(1)

  if (existing) {
    return NextResponse.json(
      { error: 'Ya existe una cuenta con este correo electrónico.' },
      { status: 409 },
    )
  }

  // Cada registro crea su propio tenant: es el aislamiento del producto.
  const [tenant] = await db
    .insert(schema.tenants)
    .values({ name, plan: 'basico', status: 'active' })
    .returning({ id: schema.tenants.id })

  const passwordHash = await bcrypt.hash(password, 10)

  await db.insert(schema.users).values({
    tenantId: tenant.id,
    name,
    email,
    passwordHash,
    role: 'owner',
  })

  // Categorías predefinidas para que el catálogo no arranque vacío.
  await db.insert(schema.categories).values(
    DEFAULT_CATEGORIES.map((categoryName) => ({
      tenantId: tenant.id,
      name: categoryName,
      isDefault: true,
    })),
  )

  return NextResponse.json({ ok: true }, { status: 201 })
}
