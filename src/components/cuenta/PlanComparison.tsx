import { Check } from 'lucide-react'
import { PLANS, PLAN_IDS, type PlanId } from '@/constants/plans'
import { cn } from '@/lib/cn'

function limitLabel(value: number | null): string {
  return value === null ? 'Ilimitados' : String(value)
}

const TEMPLATE_LABELS: Record<string, string> = {
  fijas: '3 fijas',
  personalizables: 'Personalizables',
  avanzadas: 'Variables avanzadas',
}

export function PlanComparison({ current }: { current: PlanId }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {PLAN_IDS.map((planId) => {
        const plan = PLANS[planId]
        const isCurrent = planId === current

        return (
          <div
            key={planId}
            className={cn(
              'rounded-card border p-4',
              isCurrent
                ? 'border-dorado bg-dorado-50'
                : 'border-linea bg-superficie',
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-display font-bold text-tinta">{plan.name}</h3>
              {isCurrent && (
                <span className="inline-flex items-center gap-1 rounded-full bg-dorado px-2 py-0.5 text-[11px] font-semibold text-ciruela">
                  <Check aria-hidden className="size-3" />
                  Tu plan
                </span>
              )}
            </div>

            <p className="mt-1">
              <span className="font-display text-xl font-bold text-tinta">
                Bs {plan.priceMonthly}
              </span>
              <span className="text-sm text-humo">/mes</span>
            </p>
            <p className="text-xs text-humo">
              o Bs {plan.priceYearly.toLocaleString('es-BO')} al año
            </p>

            <dl className="mt-3 space-y-1.5 border-t border-linea pt-3 text-sm">
              <div className="flex justify-between gap-2">
                <dt className="text-humo">Productos</dt>
                <dd className="font-medium text-tinta">{limitLabel(plan.maxProducts)}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-humo">Prospectos</dt>
                <dd className="font-medium text-tinta">{limitLabel(plan.maxProspects)}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-humo">Imágenes/mes</dt>
                <dd className="font-medium text-tinta">{plan.maxImagesPerMonth}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-humo">Plantillas</dt>
                <dd className="font-medium text-tinta">
                  {TEMPLATE_LABELS[plan.templates]}
                </dd>
              </div>
            </dl>
          </div>
        )
      })}
    </div>
  )
}
