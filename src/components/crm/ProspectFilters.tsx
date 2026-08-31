'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Search, X } from 'lucide-react'
import {
  DATE_FILTERS,
  PROSPECT_STATUSES,
  STATUS_STYLES,
  type ProspectStatus,
} from '@/constants/plans'
import { cn } from '@/lib/cn'

interface ProspectFiltersProps {
  total: number
  byStatus: Record<string, number>
  products: { id: string; name: string }[]
}

export function ProspectFilters({ total, byStatus, products }: ProspectFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const activeStatus = searchParams.get('estado') ?? ''
  const activeProduct = searchParams.get('producto') ?? ''
  const activeDays = searchParams.get('dias') ?? ''
  const [search, setSearch] = useState(searchParams.get('q') ?? '')

  // Los filtros viven en la URL: el vendedor puede volver atrás y
  // recuperar la vista donde estaba. 300 ms de espera al escribir.
  useEffect(() => {
    const current = searchParams.get('q') ?? ''
    if (search === current) return

    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (search) params.set('q', search)
      else params.delete('q')
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    }, 300)

    return () => clearTimeout(timer)
  }, [search, searchParams, pathname, router])

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const hasFilters = Boolean(activeStatus || activeProduct || activeDays || search)

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search
          aria-hidden
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-humo"
        />
        <label htmlFor="buscar-prospecto" className="sr-only">
          Buscar prospectos
        </label>
        <input
          id="buscar-prospecto"
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre, teléfono, correo u origen…"
          className="h-11 w-full rounded-control border border-linea bg-superficie pl-9 pr-9 text-sm text-tinta placeholder:text-humo focus:border-dorado focus:outline-none"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            aria-label="Limpiar búsqueda"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-control p-1.5 text-humo transition-colors hover:text-tinta"
          >
            <X aria-hidden className="size-4" />
          </button>
        )}
      </div>

      {/* Estados: fila desplazable para que no rompa el ancho en móvil. */}
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        <button
          type="button"
          onClick={() => setParam('estado', '')}
          aria-pressed={!activeStatus}
          className={cn(
            'shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
            !activeStatus
              ? 'border-ciruela bg-ciruela text-crema'
              : 'border-linea bg-superficie text-tinta-soft hover:border-dorado',
          )}
        >
          Todos <span className="opacity-60">({total})</span>
        </button>

        {PROSPECT_STATUSES.map((option) => {
          const active = activeStatus === option.value
          const n = byStatus[option.value] ?? 0
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setParam('estado', option.value)}
              aria-pressed={active}
              className={cn(
                'shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
                active
                  ? STATUS_STYLES[option.value as ProspectStatus]
                  : 'border-linea bg-superficie text-tinta-soft hover:border-dorado',
              )}
            >
              {option.label} <span className="opacity-60">({n})</span>
            </button>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="filtro-producto" className="sr-only">
          Filtrar por producto
        </label>
        <select
          id="filtro-producto"
          value={activeProduct}
          onChange={(e) => setParam('producto', e.target.value)}
          className="h-10 rounded-control border border-linea bg-superficie px-3 text-sm text-tinta focus:border-dorado focus:outline-none"
        >
          <option value="">Todos los productos</option>
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.name}
            </option>
          ))}
        </select>

        <label htmlFor="filtro-fecha" className="sr-only">
          Filtrar por fecha de registro
        </label>
        <select
          id="filtro-fecha"
          value={activeDays}
          onChange={(e) => setParam('dias', e.target.value)}
          className="h-10 rounded-control border border-linea bg-superficie px-3 text-sm text-tinta focus:border-dorado focus:outline-none"
        >
          {DATE_FILTERS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {hasFilters && (
          <button
            type="button"
            onClick={() => {
              setSearch('')
              router.replace(pathname, { scroll: false })
            }}
            className="inline-flex items-center gap-1 text-sm font-medium text-berry hover:underline"
          >
            <X aria-hidden className="size-3.5" />
            Quitar filtros
          </button>
        )}
      </div>
    </div>
  )
}
