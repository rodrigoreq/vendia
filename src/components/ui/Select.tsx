'use client'

import { useId, type SelectHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/cn'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  hint?: string
  error?: string
  options: readonly { value: string; label: string }[]
  placeholder?: string
}

export function Select({
  label,
  hint,
  error,
  options,
  placeholder,
  className,
  id,
  ...props
}: SelectProps) {
  const generatedId = useId()
  const selectId = id ?? generatedId
  const hintId = `${selectId}-hint`
  const errorId = `${selectId}-error`

  return (
    <div className="w-full">
      <label htmlFor={selectId} className="mb-1.5 block text-sm font-medium text-tinta">
        {label}
        {props.required && (
          <span aria-hidden className="ml-0.5 text-berry">
            *
          </span>
        )}
      </label>

      <div className="relative">
        <select
          id={selectId}
          aria-invalid={error ? true : undefined}
          aria-describedby={cn(error ? errorId : undefined, hint ? hintId : undefined) || undefined}
          className={cn(
            'h-11 w-full appearance-none rounded-control border bg-superficie pl-3 pr-10',
            'text-sm text-tinta transition-colors focus:outline-none',
            error ? 'border-berry focus:border-berry-600' : 'border-linea focus:border-dorado',
            'disabled:cursor-not-allowed disabled:bg-linea-soft disabled:text-humo',
            className,
          )}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden
          className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-humo"
        />
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
