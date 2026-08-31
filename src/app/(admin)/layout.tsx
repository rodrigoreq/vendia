import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { AppShell } from '@/components/layout/AppShell'

export default async function AdminLayout({ children }: LayoutProps<'/'>) {
  const session = await auth()
  if (!session?.user) redirect('/login')
  // Defensa en profundidad: no basta con que el middleware lo bloquee.
  if (session.user.role !== 'superadmin') redirect('/panel')

  return (
    <AppShell
      userName={session.user.name ?? 'Administrador'}
      userSubtitle="Super-administrador"
      variant="admin"
    >
      {children}
    </AppShell>
  )
}
