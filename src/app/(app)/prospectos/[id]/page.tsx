import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { auth } from '@/auth'
import { ProspectForm } from '@/components/crm/ProspectForm'
import { StatusPicker } from '@/components/crm/StatusPicker'
import { Card } from '@/components/ui/Card'
import { listProductOptions, getProspect } from '@/services/crm'
import type { ProspectStatus } from '@/constants/plans'

export default async function EditarProspectoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const { id } = await params

  const [prospect, products] = await Promise.all([
    getProspect(session.user.id, id),
    listProductOptions(session.user.id),
  ])

  // getProspect pasa por RLS: el de otra cuenta llega null y se ve un 404,
  // no un error de permisos que confirme que existe.
  if (!prospect) notFound()

  const status = prospect.status as ProspectStatus

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/prospectos"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-humo transition-colors hover:text-tinta"
      >
        <ArrowLeft aria-hidden className="size-4" />
        Volver a prospectos
      </Link>

      <h1 className="mt-3 font-display text-2xl font-bold text-tinta">{prospect.name}</h1>
      <p className="mt-1 text-humo">
        Registrado el{' '}
        {new Date(prospect.createdAt).toLocaleDateString('es-BO', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        })}
        {prospect.closedAt && (
          <>
            {' · cerrado el '}
            {new Date(prospect.closedAt).toLocaleDateString('es-BO', {
              day: '2-digit',
              month: 'long',
            })}
          </>
        )}
      </p>

      {/* El cambio de estado va arriba y separado del formulario: es la
          acción que el vendedor repite a diario, y no debería obligarle
          a recorrer todo el formulario ni a pulsar Guardar. */}
      <Card className="mt-5">
        <StatusPicker prospectId={prospect.id} current={status} />
      </Card>

      <div className="mt-5">
        <ProspectForm
          prospectId={prospect.id}
          products={products}
          initial={{
            name: prospect.name,
            phone: prospect.phone ?? '',
            email: prospect.email ?? '',
            status,
            source: prospect.source ?? '',
            notes: prospect.notes ?? '',
            commissionEstimated: prospect.commissionEstimated ?? '',
            commissionConfirmed: prospect.commissionConfirmed ?? '',
            productIds: prospect.productIds,
          }}
        />
      </div>
    </div>
  )
}
