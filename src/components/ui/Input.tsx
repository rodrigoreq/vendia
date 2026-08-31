'use client'

import { useId, type InputHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  hint?: string
  error?: string
  icon?: ReactNode
  trailing?: ReactNode
}

export function Input({
  label,
  hint,
  error,
  icon,
  trailing,
  className,
  id,
  ...props
}: InputProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const hintId = `${inputId}-hint`
  const errorId = `${inputId}-error`

  return (
    <div className="w-full">
      <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-tinta">
        {label}
        {props.required && (
          <span aria-hidden className="ml-0.5 text-berry">
            *
          </span>
        )}
      </label>

      <div className="relative">
        {icon && (
          <span
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-humo"
          >
            {icon}
          </span>
        )}

        <input
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={cn(error ? errorId : undefined, hint ? hintId : undefined) || undefined}
          className={cn(
            'h-11 w-full rounded-control border bg-superficie text-sm text-tinta',
            // Placeholder a plena opacidad: humo/70 daba 2.8:1 sobre blanco.
            'placeholder:text-humo transition-colors focus:outline-none',
            icon ? 'pl-10' : 'pl-3',
            trailing ? 'pr-11' : 'pr-3',
            error ? 'border-berry focus:border-berry-600' : 'border-linea focus:border-dorado',
            'disabled:cursor-not-allowed disabled:bg-linea-soft disabled:text-humo',
            className,
          )}
          {...props}
        />

        {trailing && <span className="absolute right-1 top-1/2 -translate-y-1/2">{trailing}</span>}
      </div>

      {hint && !error && (
        <p id={hintId} className="mt-1.5 text-xs text-humo">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="mt-1.5 text-xs font-medium text-berry">
          {error}
        </p>
      )}
    </div>
  )
}
