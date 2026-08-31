'use client'

import { useId, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  hint?: string
  error?: string
}

export function Textarea({ label, hint, error, className, id, ...props }: TextareaProps) {
  const generatedId = useId()
  const areaId = id ?? generatedId
  const hintId = `${areaId}-hint`
  const errorId = `${areaId}-error`

  return (
    <div className="w-full">
      <label htmlFor={areaId} className="mb-1.5 block text-sm font-medium text-tinta">
        {label}
        {props.required && (
          <span aria-hidden className="ml-0.5 text-berry">
            *
          </span>
        )}
      </label>

      <textarea
        id={areaId}
        rows={4}
        aria-invalid={error ? true : undefined}
        aria-describedby={cn(error ? errorId : undefined, hint ? hintId : undefined) || undefined}
        className={cn(
          'w-full rounded-control border bg-superficie px-3 py-2.5 text-sm text-tinta',
          'placeholder:text-humo transition-colors focus:outline-none',
          error ? 'border-berry focus:border-berry-600' : 'border-linea focus:border-dorado',
          className,
        )}
        {...props}
      />

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
