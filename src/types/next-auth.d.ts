import type { DefaultSession } from 'next-auth'
import type { PlanId } from '@/constants/plans'

export type UserRole = 'owner' | 'superadmin'

declare module 'next-auth' {
  interface User {
    role: UserRole
    /** Nulo para el super-admin, que no pertenece a ningún tenant. */
    tenantId: string | null
    plan: PlanId | null
  }

  interface Session {
    user: {
      id: string
      role: UserRole
      tenantId: string | null
      plan: PlanId | null
    } & DefaultSession['user']
  }
}
