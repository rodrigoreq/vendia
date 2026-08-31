import { Suspense } from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { UserPlus, Users } from 'lucide-react'
import { auth } from '@/auth'
import { requireSeller } from '@/lib/session'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ProspectFilters } from '@/components/crm/ProspectFilters'
import { ProspectRow } from '@/components/crm/ProspectRow'
import { PLANS } from '@/constants/plans'
import { getProspectCounts, listProductOptions, listProspects } from '@/services/crm'

export default async function ProspectosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; estado?: string; producto?: string; dias?: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const { q, estado, producto, dias } = await searchParams
  const userId = session.user.id
  const { plan: planId } = await requireSeller()
  const plan = PLANS[planId]

  const [counts, prospects, products] = await Promise.all([
    getProspectCounts(userId),
    listProspects(userId, {
      search: q,
      status: estado,
      productId: producto,
      days: dias ? Number(dias) : undefined,
    }),
    listProductOptions(userId),
  ])

  const atLimit = plan.maxProspects !== null && counts.total >= plan.maxProspects
  const filtering = Boolean(q || estado || producto || dias)

  return (
    <div className="mx-auto max-w-5xl">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-tinta sm:text-[28px]">
            Prospectos
          </h1>
          {/* Con tope, el sustantivo concuerda con el total, no con la
              cantidad: "1 de 100 prospectos", nunca "1 de 100 prospecto". */}
          <p className="mt-1 text-humo">
            {plan.maxProspects !== null
              ? `${counts.total} de ${plan.maxProspects} prospectos`
              : `${counts.total} ${counts.total === 1 ? 'prospecto' : 'prospectos'}`}
          </p>
        </div>

        <Link href="/prospectos/nuevo">
          <Button disabled={atLimit}>
            <UserPlus aria-hidden className="size-4" />
            Nuevo prospecto
          </Button>
        </Link>
      </header>

      {atLimit && (
        <Alert tone="warning" title="Llegaste al tope de tu plan" className="mt-4">
          El plan {plan.name} permite hasta {plan.maxProspects} prospectos. Elimina alguno o
          cambia de plan para registrar más.
        </Alert>
      )}

      <div className="mt-5">
        <Suspense fallback={<div className="h-32" aria-hidden />}>
          <ProspectFilters
            total={counts.total}
            byStatus={counts.byStatus}
            products={products}
          />
        </Suspense>
      </div>

      {prospects.length === 0 ? (
        <Card className="mt-5 text-center">
          <span
            aria-hidden
            className="mx-auto flex size-14 items-center justify-center rounded-full bg-linea-soft text-humo"
          >
            <Users className="size-7" />
          </span>

          {filtering ? (
            <>
              <h2 className="mt-4 font-display text-lg font-semibold text-tinta">
                Ningún prospecto coincide
              </h2>
              <p className="mx-auto mt-1.5 max-w-md text-sm text-humo">
                Prueba con otro estado, otro producto o quita los filtros.
              </p>
            </>
          ) : (
            <>
              <h2 className="mt-4 font-display text-lg font-semibold text-tinta">
                Todavía no tienes prospectos
              </h2>
              <p className="mx-auto mt-1.5 max-w-md text-sm text-humo">
                Registra a tu primer interesado y ve moviéndolo por los estados hasta cerrar
                la venta.
              </p>
              <Link href="/prospectos/nuevo" className="mt-5 inline-block">
                <Button>
                  <UserPlus aria-hidden className="size-4" />
                  Registrar mi primer prospecto
                </Button>
              </Link>
            </>
          )}
        </Card>
      ) : (
        <Card className="mt-5 overflow-hidden" padded={false}>
          {prospects.map((prospect) => (
            <ProspectRow key={prospect.id} prospect={prospect} />
          ))}
        </Card>
      )}
    </div>
  )
}
