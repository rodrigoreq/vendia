'use client'

import { useId, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string
}

export function Checkbox({ label, className, id, ...props }: CheckboxProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <input
        id={inputId}
        type="checkbox"
        className="size-4 shrink-0 cursor-pointer rounded border-linea accent-dorado"
        {...props}
      />
      <label htmlFor={inputId} className="cursor-pointer text-sm text-tinta-soft">
        {label}
      </label>
    </div>
  )
}

interface SelectableCardProps {
  label: string
  checked: boolean
  onToggle: () => void
  meta?: string
}

/** Casilla presentada como tarjeta. Se usa donde el vendedor elige varios
 *  elementos y necesita objetivos táctiles grandes en el celular. */
export function SelectableCard({ label, checked, onToggle, meta }: SelectableCardProps) {
  return (
    <label
      className={cn(
        'flex cursor-pointer items-center gap-3 rounded-control border px-3 py-2.5 transition-colors',
        checked
          ? 'border-dorado bg-dorado-50'
          : 'border-linea bg-superficie hover:border-dorado-200 hover:bg-dorado-50/40',
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        className="size-4 shrink-0 cursor-pointer rounded border-linea accent-dorado"
      />
      <span className="min-w-0">
        <span
          className={cn(
            'block truncate text-sm font-medium',
            checked ? 'text-dorado-700' : 'text-tinta',
          )}
        >
          {label}
        </span>
        {meta && <span className="block truncate text-xs text-humo">{meta}</span>}
      </span>
    </label>
  )
}
