import type { PlanId } from '@/constants/plans'
import type { UserRole } from '@/types/next-auth'

/** Cuentas ficticias para revisar la interfaz antes de aprovisionar Neon.
 *  Desaparecen en cuanto DATABASE_URL tiene valor. */

interface DemoAccount {
  id: string
  email: string
  password: string
  name: string
  role: UserRole
  tenantId: string | null
  plan: PlanId | null
  tenantName: string | null
}

export const DEMO_SELLER: DemoAccount = {
  id: '00000000-0000-4000-8000-000000000001',
  email: 'vendedor@vendia.bo',
  password: 'demo1234',
  name: 'Carlos Mendoza',
  role: 'owner',
  tenantId: '00000000-0000-4000-8000-0000000000a1',
  plan: 'profesional',
  tenantName: 'Carlos Mendoza — Ventas',
}

export const DEMO_SUPERADMIN: DemoAccount = {
  id: '00000000-0000-4000-8000-000000000002',
  email: 'admin@vendia.bo',
  password: 'demo1234',
  name: 'Administrador VendIA',
  role: 'superadmin',
  tenantId: null,
  plan: null,
  tenantName: null,
}

export const DEMO_ACCOUNTS = [DEMO_SELLER, DEMO_SUPERADMIN]

/** Métricas agregadas del panel de super-admin. Deliberadamente no
 *  contienen nombres de productos ni de prospectos: el super-admin no
 *  ve el contenido de las cuentas. */
export const DEMO_TENANTS = [
  {
    id: '00000000-0000-4000-8000-0000000000a1',
    name: 'Carlos Mendoza — Ventas',
    plan: 'profesional' as PlanId,
    status: 'active',
    products: 23,
    prospects: 147,
    imagesThisMonth: 31,
    createdAt: '12/03/2026',
  },
  {
    id: '00000000-0000-4000-8000-0000000000a2',
    name: 'Lucía Vargas — Bienes Raíces',
    plan: 'elite' as PlanId,
    status: 'active',
    products: 88,
    prospects: 612,
    imagesThisMonth: 104,
    createdAt: '02/04/2026',
  },
  {
    id: '00000000-0000-4000-8000-0000000000a3',
    name: 'Ronald Ticona',
    plan: 'basico' as PlanId,
    status: 'suspended',
    products: 9,
    prospects: 41,
    imagesThisMonth: 0,
    createdAt: '20/06/2026',
  },
]
