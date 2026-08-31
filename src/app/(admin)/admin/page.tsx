import { Building2, Sparkles, TrendingUp, Users } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Card, CardHeader } from '@/components/ui/Card'
import { PLANS, PLAN_IDS } from '@/constants/plans'
import { isDatabaseConfigured } from '@/lib/db'
import { DEMO_TENANTS } from '@/lib/demo-data'

export default function AdminMetricsPage() {
  const active = DEMO_TENANTS.filter((t) => t.status === 'active')
  const imagesTotal = DEMO_TENANTS.reduce((sum, t) => sum + t.imagesThisMonth, 0)

  // Ingreso recurrente mensual según el plan de cada cuenta activa.
  const mrr = active.reduce((sum, t) => sum + PLANS[t.plan].priceMonthly, 0)

  // Costo aproximado de la IA: solo los fondos generados cuestan dinero.
  const costUsd = imagesTotal * 0.01

  return (
    <div className="mx-auto max-w-7xl">
      <header>
        <h1 className="font-display text-2xl font-bold text-tinta sm:text-[28px]">Métricas</h1>
        <p className="mt-1 text-humo">Uso agregado de todas las cuentas.</p>
      </header>

      <Alert tone="info" title="Privacidad por diseño" className="mt-5">
        Este panel muestra totales de uso, nunca el contenido de las cuentas. No puedes ver
        productos ni prospectos de ningún vendedor, y las políticas de la base de datos lo
        impiden aunque alguien modifique la interfaz.
      </Alert>

      {!isDatabaseConfigured && (
        <Alert tone="warning" title="Modo demostración" className="mt-3">
          Sin base de datos conectada: las cuentas y los números son de ejemplo.
        </Alert>
      )}

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <span aria-hidden className="flex size-10 items-center justify-center rounded-control bg-ciruela-50 text-ciruela-600">
            <Building2 className="size-5" />
          </span>
          <p className="mt-3 font-display text-2xl font-bold text-tinta">{DEMO_TENANTS.length}</p>
          <p className="text-sm text-humo">Cuentas totales</p>
        </Card>

        <Card>
          <span aria-hidden className="flex size-10 items-center justify-center rounded-control bg-berry-50 text-berry">
            <Users className="size-5" />
          </span>
          <p className="mt-3 font-display text-2xl font-bold text-tinta">{active.length}</p>
          <p className="text-sm text-humo">Cuentas activas</p>
        </Card>

        <Card>
          <span aria-hidden className="flex size-10 items-center justify-center rounded-control bg-dorado-50 text-dorado-700">
            <Sparkles className="size-5" />
          </span>
          <p className="mt-3 font-display text-2xl font-bold text-tinta">{imagesTotal}</p>
          <p className="text-sm text-humo">
            Imágenes este mes · ~${costUsd.toFixed(2)} de costo
          </p>
        </Card>

        <Card className="border-dorado-200 bg-dorado-50">
          <span aria-hidden className="flex size-10 items-center justify-center rounded-control bg-dorado text-ciruela">
            <TrendingUp className="size-5" />
          </span>
          <p className="mt-3 font-display text-2xl font-bold text-ciruela">
            Bs {mrr.toLocaleString('es-BO')}
          </p>
          <p className="text-sm text-dorado-700">Ingreso mensual recurrente</p>
        </Card>
      </div>

      <Card className="mt-5">
        <CardHeader title="Distribución por plan" />
        <ul className="space-y-3">
          {PLAN_IDS.map((planId) => {
            const plan = PLANS[planId]
            const count = DEMO_TENANTS.filter((t) => t.plan === planId).length
            const percent = Math.round((count / DEMO_TENANTS.length) * 100)

            return (
              <li key={planId}>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-medium text-tinta">{plan.name}</span>
                  <span className="text-humo">
                    {count} {count === 1 ? 'cuenta' : 'cuentas'} · Bs {plan.priceMonthly}/mes
                  </span>
                </div>
                <div
                  role="progressbar"
                  aria-valuenow={count}
                  aria-valuemin={0}
                  aria-valuemax={DEMO_TENANTS.length}
                  aria-label={`Plan ${plan.name}: ${count} de ${DEMO_TENANTS.length} cuentas`}
                  className="mt-1.5 h-2 overflow-hidden rounded-full bg-linea"
                >
                  <div className="h-full rounded-full bg-dorado" style={{ width: `${percent}%` }} />
                </div>
              </li>
            )
          })}
        </ul>
      </Card>
    </div>
  )
}
