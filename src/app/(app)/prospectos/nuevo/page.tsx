import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { auth } from '@/auth'
import { ProspectForm } from '@/components/crm/ProspectForm'
import { listProductOptions } from '@/services/crm'

export default async function NuevoProspectoPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const products = await listProductOptions(session.user.id)

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/prospectos"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-humo transition-colors hover:text-tinta"
      >
        <ArrowLeft aria-hidden className="size-4" />
        Volver a prospectos
      </Link>

      <h1 className="mt-3 font-display text-2xl font-bold text-tinta">Nuevo prospecto</h1>
      <p className="mt-1 text-humo">Registra al interesado para no perderle el rastro.</p>

      <div className="mt-6">
        <ProspectForm prospectId={null} products={products} />
      </div>
    </div>
  )
}
