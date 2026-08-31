import Link from 'next/link'
import Image from 'next/image'
import { ImageOff } from 'lucide-react'
import type { ProductRow } from '@/services/catalog'

function formatPrice(price: string | null, currency: string): string | null {
  if (!price) return null
  const value = Number(price)
  if (Number.isNaN(value)) return null
  const symbol = currency === 'BOB' ? 'Bs' : currency
  return `${symbol} ${value.toLocaleString('es-BO', { maximumFractionDigits: 2 })}`
}

export function ProductCard({ product }: { product: ProductRow }) {
  const price = formatPrice(product.price, product.currency)

  return (
    <Link
      href={`/catalogo/${product.id}`}
      className="group flex flex-col overflow-hidden rounded-card border border-linea bg-superficie shadow-card transition-colors hover:border-dorado"
    >
      <div className="relative aspect-[4/3] bg-linea-soft">
        {product.photoUrl ? (
          <Image
            src={product.photoUrl}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 280px"
            className="object-cover"
          />
        ) : (
          <span className="flex h-full items-center justify-center text-humo">
            <ImageOff aria-hidden className="size-8" />
            <span className="sr-only">Sin foto</span>
          </span>
        )}

        {product.categoryName && (
          <span className="absolute left-2 top-2 rounded-full bg-superficie/95 px-2.5 py-0.5 text-xs font-medium text-tinta-soft">
            {product.categoryName}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-display font-semibold leading-snug text-tinta">{product.name}</h3>

        {product.supplier && (
          <p className="mt-0.5 text-xs text-humo">{product.supplier}</p>
        )}

        {/* El precio va en dorado y al pie: es lo que el vendedor busca
            con la vista al recorrer la cuadrícula. */}
        <p className="mt-auto pt-3 font-display text-lg font-bold text-dorado-700">
          {price ?? <span className="text-sm font-normal text-humo">Sin precio</span>}
        </p>
      </div>
    </Link>
  )
}
