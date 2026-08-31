import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  padded?: boolean
}

export function Card({ children, padded = true, className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-card border border-linea bg-superficie shadow-card',
        padded && 'p-5 sm:p-6',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

interface CardHeaderProps {
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function CardHeader({ title, description, action, className }: CardHeaderProps) {
  return (
    <div className={cn('mb-4 flex items-start justify-between gap-4', className)}>
      <div className="min-w-0">
        <h2 className="font-display text-base font-semibold text-tinta">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-humo">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
