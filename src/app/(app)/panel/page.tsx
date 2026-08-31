import Link from 'next/link'
import { ArrowRight, Package, Sparkles, Users, Wallet } from 'lucide-react'
import { auth } from '@/auth'
import { Alert } from '@/components/ui/Alert'
import { Card, CardHeader } from '@/components/ui/Card'
import { PLANS } from '@/constants/plans'
import { isDatabaseConfigured } from '@/lib/db'

/** Métricas de ejemplo. En el paso 3 salen del CRM real. */
const DEMO_STATS = {
  prospects: 147,
  products: 23,
  imagesThisMonth: 31,
  commissionMonth: 4850,
}

export default async function PanelPage() {
  const session = await auth()
  const firstName = (session?.user?.name ?? 'Vendedor').split(' ')[0]
  const plan = session?.user?.plan ? PLANS[session.user.plan] : PLANS.basico

  const imagesLeft = plan.maxImagesPerMonth - DEMO_STATS.imagesThisMonth

  return (
    <div className="mx-auto max-w-7xl">
      <header>
        <h1 className="font-display text-2xl font-bold text-tinta sm:text-[28px]">
          Hola, {firstName}
        </h1>
        <p className="mt-1 text-humo">Esto es lo que tienes en marcha hoy.</p>
      </header>

      {!isDatabaseConfigured && (
        <Alert tone="warning" title="Modo demostración" className="mt-5">
          No hay base de datos conectada: los números que ves son de ejemplo. Se reemplazan
          por datos reales al configurar Neon.
        </Alert>
      )}

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <span aria-hidden className="flex size-10 items-center justify-center rounded-control bg-berry-50 text-berry">
            <Users className="size-5" />
          </span>
          <p className="mt-3 font-display text-2xl font-bold text-tinta">{DEMO_STATS.prospects}</p>
          <p className="text-sm text-humo">Prospectos activos</p>
        </Card>

        <Card>
          <span aria-hidden className="flex size-10 items-center justify-center rounded-control bg-ciruela-50 text-ciruela-600">
            <Package className="size-5" />
          </span>
          <p className="mt-3 font-display text-2xl font-bold text-tinta">
            {DEMO_STATS.products}
            {plan.maxProducts && (
              <span className="text-base font-normal text-humo"> / {plan.maxProducts}</span>
            )}
          </p>
          <p className="text-sm text-humo">Productos en catálogo</p>
        </Card>

        <Card>
          <span aria-hidden className="flex size-10 items-center justify-center rounded-control bg-dorado-50 text-dorado-700">
            <Sparkles className="size-5" />
          </span>
          <p className="mt-3 font-display text-2xl font-bold text-tinta">
            {DEMO_STATS.imagesThisMonth}
            <span className="text-base font-normal text-humo"> / {plan.maxImagesPerMonth}</span>
          </p>
          <p className="text-sm text-humo">Imágenes IA este mes</p>
        </Card>

        {/* La comisión va en dorado: es el número que le importa al vendedor. */}
        <Card className="border-dorado-200 bg-dorado-50">
          <span aria-hidden className="flex size-10 items-center justify-center rounded-control bg-dorado text-ciruela">
            <Wallet className="size-5" />
          </span>
          <p className="mt-3 font-display text-2xl font-bold text-ciruela">
            Bs {DEMO_STATS.commissionMonth.toLocaleString('es-BO')}
          </p>
          <p className="text-sm text-dorado-700">Comisión del mes</p>
        </Card>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card>
          <CardHeader
            title="Próximos módulos"
            description="Paso 1 completado. Esto es lo que sigue."
          />
          <ol className="space-y-3">
            {[
              { n: 2, t: 'Catálogo de productos', d: 'Productos, categorías y fotos.' },
              { n: 3, t: 'CRM de prospectos', d: 'Estados, filtros y comisión.' },
              { n: 4, t: 'Generador de publicidad', d: 'Copy con Claude + fondo con FLUX.' },
              { n: 5, t: 'Mensajes de WhatsApp', d: 'Plantillas y enlace wa.me.' },
              { n: 6, t: 'Panel de uso', d: 'Consumo y topes del plan.' },
            ].map((step) => (
              <li key={step.n} className="flex items-start gap-3">
                <span
                  aria-hidden
                  className="flex size-7 shrink-0 items-center justify-center rounded-full bg-linea-soft text-xs font-semibold text-humo"
                >
                  {step.n}
                </span>
                <span>
                  <span className="block text-sm font-medium text-tinta">{step.t}</span>
                  <span className="block text-sm text-humo">{step.d}</span>
                </span>
              </li>
            ))}
          </ol>
        </Card>

        <aside>
          <Card>
            <CardHeader title={`Plan ${plan.name}`} />
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-humo">Precio</dt>
                <dd className="font-medium text-tinta">Bs {plan.priceMonthly}/mes</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-humo">Productos</dt>
                <dd className="font-medium text-tinta">{plan.maxProducts ?? 'Ilimitados'}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-humo">Prospectos</dt>
                <dd className="font-medium text-tinta">{plan.maxProspects ?? 'Ilimitados'}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-humo">Imágenes/mes</dt>
                <dd className="font-medium text-tinta">{plan.maxImagesPerMonth}</dd>
              </div>
            </dl>

            <div className="mt-4 border-t border-linea pt-4">
              <p className="text-sm text-humo">
                Te quedan <strong className="text-tinta">{imagesLeft} imágenes</strong> este mes.
              </p>
              <Link
                href="/cuenta"
                className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-berry hover:underline"
              >
                Ver mi cuenta
                <ArrowRight aria-hidden className="size-4" />
              </Link>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  )
}
