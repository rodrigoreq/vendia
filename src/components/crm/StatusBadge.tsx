import { PROSPECT_STATUSES, STATUS_STYLES, type ProspectStatus } from '@/constants/plans'
import { cn } from '@/lib/cn'

const LABELS = Object.fromEntries(
  PROSPECT_STATUSES.map((s) => [s.value, s.label]),
) as Record<ProspectStatus, string>

export function StatusBadge({
  status,
  className,
}: {
  status: ProspectStatus
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        STATUS_STYLES[status],
        className,
      )}
    >
      {LABELS[status]}
    </span>
  )
}

export { LABELS as STATUS_LABELS }
