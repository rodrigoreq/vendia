'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { UNCATEGORIZED } from '@/constants/plans'

interface Category {
  id: string
  name: string
  productCount: number
}

interface CatalogFiltersProps {
  categories: Category[]
  totalProducts: number
  /** Cuántos productos no tienen categoría. Si es 0 no se muestra el chip. */
  uncategorized: number
}

export function CatalogFilters({
  categories,
  totalProducts,
  uncategorized,
}: CatalogFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const activeCategory = searchParams.get('categoria') ?? ''
  const [search, setSearch] = useState(searchParams.get('q') ?? '')

  // El filtro vive en la URL para que el vendedor pueda volver atrás o
  // compartir la vista. Se espera 300 ms para no consultar en cada tecla.
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

  function selectCategory(id: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (id) params.set('categoria', id)
    else params.delete('categoria')
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search
          aria-hidden
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-humo"
        />
        <label htmlFor="buscar-producto" className="sr-only">
          Buscar en el catálogo
        </label>
        <input
          id="buscar-producto"
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre, descripción o proveedor…"
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

      {/* Fila desplazable: con muchas categorías propias no debe romper
          el ancho de la página en móvil. */}
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        <button
          type="button"
          onClick={() => selectCategory('')}
          aria-pressed={!activeCategory}
          className={cn(
            'shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
            !activeCategory
              ? 'border-ciruela bg-ciruela text-crema'
              : 'border-linea bg-superficie text-tinta-soft hover:border-dorado',
          )}
        >
          Todos <span className="opacity-60">({totalProducts})</span>
        </button>

        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => selectCategory(category.id)}
            aria-pressed={activeCategory === category.id}
            className={cn(
              'shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
              activeCategory === category.id
                ? 'border-ciruela bg-ciruela text-crema'
                : 'border-linea bg-superficie text-tinta-soft hover:border-dorado',
            )}
          >
            {category.name} <span className="opacity-60">({category.productCount})</span>
          </button>
        ))}

        {/* Sin este chip, los productos sin categoría no serían filtrables
            y quedarían escondidos en cuanto el vendedor elija cualquier otra. */}
        {uncategorized > 0 && (
          <button
            type="button"
            onClick={() => selectCategory(UNCATEGORIZED)}
            aria-pressed={activeCategory === UNCATEGORIZED}
            className={cn(
              'shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
              activeCategory === UNCATEGORIZED
                ? 'border-ciruela bg-ciruela text-crema'
                : 'border-dashed border-linea bg-superficie text-humo hover:border-dorado',
            )}
          >
            Sin categoría <span className="opacity-60">({uncategorized})</span>
          </button>
        )}
      </div>
    </div>
  )
}
