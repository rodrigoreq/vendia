import { Infinity as InfinityIcon } from 'lucide-react'
import { cn } from '@/lib/cn'
import type { UsageItem } from '@/services/usage'

/** El color avisa antes de que el tope moleste: neutro mientras sobra
 *  espacio, ámbar cerca del límite, berry al llegar. */
function toneFor(used: number, limit: number): { bar: string; text: string } {
  const ratio = used / limit
  if (ratio >= 1) return { bar: 'bg-berry', text: 'text-berry' }
  if (ratio >= 0.8) return { bar: 'bg-dorado', text: 'text-dorado-700' }
  return { bar: 'bg-ciruela-600', text: 'text-tinta' }
}

export function UsageMeter({ item }: { item: UsageItem }) {
  if (item.display !== 'meter') {
    return (
      <li className="py-4">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-sm font-medium text-tinta">{item.label}</span>
          <span className="inline-flex items-center gap-1.5 font-display font-semibold text-tinta">
            {item.used}
            {/* El infinito solo aparece donde de verdad no hay techo. Para
                lo que no es cuota se muestra el número a secas, y el texto
                de abajo explica cuál es la restricción real. */}
            {item.display === 'unlimited' && (
              <>
                <span className="text-humo">/</span>
                <InfinityIcon aria-hidden className="size-4 text-dorado-700" />
                <span className="sr-only">sin límite</span>
              </>
            )}
          </span>
        </div>
        <p className="mt-1 text-xs text-humo">{item.hint}</p>
      </li>
    )
  }

  const limit = item.limit as number
  const percent = Math.min(100, Math.round((item.used / limit) * 100))
  const tone = toneFor(item.used, limit)
  const remaining = Math.max(0, limit - item.used)

  return (
    <li className="py-4">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium text-tinta">{item.label}</span>
        <span className={cn('font-display font-semibold tabular-nums', tone.text)}>
          {item.used} <span className="font-normal text-humo">/ {limit}</span>
        </span>
      </div>

      <div
        role="progressbar"
        aria-valuenow={item.used}
        aria-valuemin={0}
        aria-valuemax={limit}
        aria-label={`${item.label}: ${item.used} de ${limit}`}
        className="mt-2 h-2 overflow-hidden rounded-full bg-linea"
      >
        <div
          className={cn('h-full rounded-full transition-[width]', tone.bar)}
          style={{ width: `${percent}%` }}
        />
      </div>

      <p className="mt-1.5 text-xs text-humo">
        {remaining === 0 ? (
          <span className="font-medium text-berry">
            Llegaste al tope. {item.hint}
          </span>
        ) : (
          <>
            Te {remaining === 1 ? 'queda' : 'quedan'}{' '}
            <strong className="text-tinta">{remaining}</strong>. {item.hint}
          </>
        )}
      </p>
    </li>
  )
}
