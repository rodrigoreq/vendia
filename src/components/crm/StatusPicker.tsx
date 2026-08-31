'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Loader2 } from 'lucide-react'
import { PROSPECT_STATUSES, STATUS_STYLES, type ProspectStatus } from '@/constants/plans'
import { changeStatusAction } from '@/app/(app)/prospectos/actions'
import { cn } from '@/lib/cn'

interface StatusPickerProps {
  prospectId: string
  current: ProspectStatus
}

/** Cambio de estado en un clic desde la ficha, sin abrir el formulario:
 *  es la acción más repetida del día de un vendedor. */
export function StatusPicker({ prospectId, current }: StatusPickerProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [status, setStatus] = useState<ProspectStatus>(current)
  const [error, setError] = useState<string | null>(null)

  function select(next: ProspectStatus) {
    if (next === status) return
    const previous = status

    // Se pinta el cambio de inmediato y se revierte si el servidor lo
    // rechaza: esperar a la respuesta hace que la ficha se sienta lenta.
    setStatus(next)
    setError(null)

    startTransition(async () => {
      const result = await changeStatusAction(prospectId, next)
      if (!result.ok) {
        setStatus(previous)
        setError(result.error ?? 'No se pudo cambiar el estado.')
        return
      }
      router.refresh()
    })
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-tinta">Estado</span>
        {pending && <Loader2 aria-hidden className="size-3.5 animate-spin text-humo" />}
      </div>

      <div role="radiogroup" aria-label="Estado del prospecto" className="mt-2 flex flex-wrap gap-2">
        {PROSPECT_STATUSES.map((option) => {
          const active = status === option.value
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => select(option.value)}
              disabled={pending}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-60',
                active
                  ? STATUS_STYLES[option.value]
                  : 'border-linea bg-superficie text-humo hover:border-dorado hover:text-tinta',
              )}
            >
              {active && <Check aria-hidden className="size-3.5" />}
              {option.label}
            </button>
          )
        })}
      </div>

      {error && (
        <p role="alert" className="mt-2 text-xs font-medium text-berry">
          {error}
        </p>
      )}
    </div>
  )
}
