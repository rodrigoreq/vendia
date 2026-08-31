import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { authConfig } from './auth.config'
import { getDb, isDatabaseConfigured, schema } from '@/lib/db'
import { DEMO_ACCOUNTS } from '@/lib/demo-data'
import type { PlanId } from '@/constants/plans'
import type { UserRole } from '@/types/next-auth'

const INVALID_CREDENTIALS = 'Correo o contraseña incorrectos'
const SUSPENDED_ACCOUNT = 'Tu cuenta está suspendida. Contacta al administrador.'

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Correo electrónico', type: 'email' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? '')
          .trim()
          .toLowerCase()
        const password = String(credentials?.password ?? '')
        if (!email || !password) return null

        // Modo demostración: sin base de datos se aceptan las cuentas
        // ficticias para poder revisar la interfaz.
        if (!isDatabaseConfigured) {
          const account = DEMO_ACCOUNTS.find(
            (candidate) => candidate.email === email && candidate.password === password,
          )
          if (!account) throw new Error(INVALID_CREDENTIALS)
          return {
            id: account.id,
            name: account.name,
            email: account.email,
            role: account.role,
            tenantId: account.tenantId,
            plan: account.plan,
          }
        }

        const db = getDb()
        const [record] = await db
          .select({
            id: schema.users.id,
            email: schema.users.email,
            name: schema.users.name,
            passwordHash: schema.users.passwordHash,
            role: schema.users.role,
            tenantId: schema.users.tenantId,
            plan: schema.tenants.plan,
            tenantStatus: schema.tenants.status,
          })
          .from(schema.users)
          .leftJoin(schema.tenants, eq(schema.tenants.id, schema.users.tenantId))
          .where(eq(schema.users.email, email))
          .limit(1)

        // Se compara siempre contra un hash aunque el usuario no exista, para
        // que el tiempo de respuesta no revele qué correos están registrados.
        const hash =
          record?.passwordHash ??
          '$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidiu'
        const valid = await bcrypt.compare(password, hash)

        if (!record || !record.passwordHash || !valid) {
          throw new Error(INVALID_CREDENTIALS)
        }

        // Una cuenta dada de baja por el super-admin no puede entrar.
        if (record.role !== 'superadmin' && record.tenantStatus !== 'active') {
          throw new Error(SUSPENDED_ACCOUNT)
        }

        return {
          id: record.id,
          name: record.name,
          email: record.email,
          role: record.role as UserRole,
          tenantId: record.tenantId,
          plan: (record.plan ?? null) as PlanId | null,
        }
      },
    }),
  ],
})
