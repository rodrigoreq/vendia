import { redirect } from 'next/navigation'
import { CalendarClock, Mail, User } from 'lucide-react'
import { auth } from '@/auth'
import { requireSeller } from '@/lib/session'
import { Alert } from '@/components/ui/Alert'
import { Card, CardHeader } from '@/components/ui/Card'
import { PlanComparison } from '@/components/cuenta/PlanComparison'
import { UsageMeter } from '@/components/cuenta/UsageMeter'
import { PLANS } from '@/constants/plans'
import { getUsageReport } from '@/services/usage'

export default async function CuentaPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const { userId, plan: planId, name } = await requireSeller()
  const plan = PLANS[planId]
  const usage = await getUsageReport(userId, planId)

  const atSomeLimit = usage.items.some(
    (item) => item.limit !== null && item.used >= item.limit,
  )

  return (
    <div className="mx-auto max-w-3xl">
      <header>
        <h1 className="font-display text-2xl font-bold text-tinta sm:text-[28px]">
          Mi cuenta
        </h1>
        <p className="mt-1 text-humo">Tu plan, tu consumo y tus datos.</p>
      </header>

      {atSomeLimit && (
        <Alert tone="warning" title="Llegaste a algún tope" className="mt-5">
          Revisa abajo cuál. Puedes liberar espacio eliminando lo que ya no uses, o cambiar
          de plan.
        </Alert>
      )}

      <Card className="mt-5">
        <CardHeader
          title={`Tu consumo · Plan ${plan.name}`}
          description={`Las imágenes se reinician el ${usage.imagesRenewAt}.`}
        />
        <ul className="divide-y divide-linea">
          {usage.items.map((item) => (
            <UsageMeter key={item.key} item={item} />
          ))}
        </ul>
      </Card>

      <section className="mt-5">
        <h2 className="font-display text-lg font-semibold text-tinta">Planes</h2>
        <p className="mt-1 text-sm text-humo">
          Para cambiar de plan, escríbenos. El cobro todavía no está automatizado.
        </p>
        <div className="mt-3">
          <PlanComparison current={planId} />
        </div>
      </section>

      <Card className="mt-5">
        <CardHeader title="Tus datos" />
        <dl className="space-y-3 text-sm">
          <div className="flex items-center gap-3">
            <span aria-hidden className="text-humo">
              <User className="size-4" />
            </span>
            <dt className="sr-only">Nombre</dt>
            <dd className="font-medium text-tinta">{name ?? 'Sin nombre'}</dd>
          </div>
          <div className="flex items-center gap-3">
            <span aria-hidden className="text-humo">
              <Mail className="size-4" />
            </span>
            <dt className="sr-only">Correo</dt>
            <dd className="text-tinta">{session.user.email}</dd>
          </div>
          {usage.createdAt && (
            <div className="flex items-center gap-3">
              <span aria-hidden className="text-humo">
                <CalendarClock className="size-4" />
              </span>
              <dt className="sr-only">Cuenta creada</dt>
              <dd className="text-tinta">
                Cuenta creada el{' '}
                {new Date(usage.createdAt).toLocaleDateString('es-BO', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </dd>
            </div>
          )}
        </dl>
      </Card>
    </div>
  )
}
