import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { AppShell } from '@/components/layout/AppShell'
import { PLANS } from '@/constants/plans'

export default async function AppLayout({ children }: LayoutProps<'/'>) {
  const session = await auth()
  if (!session?.user) redirect('/login')
  // Defensa en profundidad: el middleware ya lo redirige, pero el layout
  // no debe confiar solo en eso.
  if (session.user.role === 'superadmin') redirect('/admin')

  const plan = session.user.plan ? PLANS[session.user.plan] : null

  return (
    <AppShell
      userName={session.user.name ?? 'Vendedor'}
      userSubtitle={plan ? `Plan ${plan.name}` : 'Vendedor'}
      variant="seller"
    >
      {children}
    </AppShell>
  )
}
