import Link from 'next/link'
import { Phone, Tag } from 'lucide-react'
import { StatusBadge } from './StatusBadge'
import type { ProspectRow as Row } from '@/services/crm'

function money(value: string | null): string | null {
  if (!value) return null
  const n = Number(value)
  if (Number.isNaN(n)) return null
  return `Bs ${n.toLocaleString('es-BO', { maximumFractionDigits: 2 })}`
}

function shortDate(date: Date): string {
  return new Date(date).toLocaleDateString('es-BO', { day: '2-digit', month: 'short' })
}

export function ProspectRow({ prospect }: { prospect: Row }) {
  const closed = prospect.status === 'cerrado'
  // Al cerrar manda la confirmada; mientras negocia, la estimada.
  const amount = closed
    ? money(prospect.commissionConfirmed)
    : money(prospect.commissionEstimated)

  return (
    <Link
      href={`/prospectos/${prospect.id}`}
      className="flex items-start gap-3 border-b border-linea px-4 py-3.5 transition-colors last:border-0 hover:bg-crema sm:items-center"
    >
      <span
        aria-hidden
        className="flex size-10 shrink-0 items-center justify-center rounded-full bg-ciruela text-sm font-bold text-dorado"
      >
        {prospect.name.charAt(0).toUpperCase()}
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-medium text-tinta">{prospect.name}</span>
          <StatusBadge status={prospect.status} />
        </span>

        <span className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-humo">
          {prospect.phone && (
            <span className="inline-flex items-center gap-1">
              <Phone aria-hidden className="size-3" />
              {prospect.phone}
            </span>
          )}
          {prospect.productNames.length > 0 && (
            <span className="inline-flex items-center gap-1">
              <Tag aria-hidden className="size-3" />
              {prospect.productNames.slice(0, 2).join(', ')}
              {prospect.productNames.length > 2 && ` +${prospect.productNames.length - 2}`}
            </span>
          )}
          {prospect.source && <span>{prospect.source}</span>}
        </span>
      </span>

      <span className="shrink-0 text-right">
        {amount && (
          <span
            className={
              closed
                ? 'block font-display font-bold text-dorado-700'
                : 'block font-display text-sm font-semibold text-humo'
            }
          >
            {amount}
          </span>
        )}
        <span className="block text-xs text-humo">{shortDate(prospect.createdAt)}</span>
      </span>
    </Link>
  )
}
