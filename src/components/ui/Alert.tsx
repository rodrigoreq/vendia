import type { ReactNode } from 'react'
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react'
import { cn } from '@/lib/cn'

type Tone = 'info' | 'success' | 'warning' | 'danger'

const TONES: Record<Tone, { wrap: string; icon: string; Icon: typeof Info }> = {
  info: { wrap: 'bg-ciruela-50 border-ciruela-200 text-ciruela-700', icon: 'text-ciruela-600', Icon: Info },
  success: { wrap: 'bg-dorado-50 border-dorado-200 text-dorado-700', icon: 'text-dorado-600', Icon: CheckCircle2 },
  warning: { wrap: 'bg-dorado-50 border-dorado-200 text-dorado-700', icon: 'text-dorado-600', Icon: AlertTriangle },
  danger: { wrap: 'bg-berry-50 border-berry-200 text-berry-700', icon: 'text-berry', Icon: XCircle },
}

interface AlertProps {
  tone?: Tone
  title?: string
  children: ReactNode
  className?: string
}

export function Alert({ tone = 'info', title, children, className }: AlertProps) {
  const { wrap, icon, Icon } = TONES[tone]

  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className={cn('flex gap-3 rounded-control border px-4 py-3 text-sm', wrap, className)}
    >
      <Icon aria-hidden className={cn('mt-0.5 size-4 shrink-0', icon)} />
      <div className="min-w-0">
        {title && <p className="font-semibold">{title}</p>}
        <div className={cn(title && 'mt-0.5')}>{children}</div>
      </div>
    </div>
  )
}
