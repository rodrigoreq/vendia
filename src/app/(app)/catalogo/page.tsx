import { Suspense } from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { PackagePlus, PackageSearch } from 'lucide-react'
import { auth } from '@/auth'
import { requireSeller } from '@/lib/session'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { CatalogFilters } from '@/components/catalogo/CatalogFilters'
import { ProductCard } from '@/components/catalogo/ProductCard'
import { PLANS } from '@/constants/plans'
import {
  countProducts,
  countUncategorized,
  listCategories,
  listProducts,
} from '@/services/catalog'

export default async function CatalogoPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; categoria?: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const { q, categoria } = await searchParams
  const userId = session.user.id
  const { plan: planId } = await requireSeller()
  const plan = PLANS[planId]

  const [categories, products, totalProducts, uncategorized] = await Promise.all([
    listCategories(userId),
    listProducts(userId, { search: q, categoryId: categoria }),
    countProducts(userId),
    countUncategorized(userId),
  ])

  const atLimit = plan.maxProducts !== null && totalProducts >= plan.maxProducts
  const filtering = Boolean(q || categoria)

  return (
    <div className="mx-auto max-w-7xl">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-tinta sm:text-[28px]">Catálogo</h1>
          {/* Con tope, el sustantivo concuerda con el total, no con la
              cantidad: "1 de 15 productos", nunca "1 de 15 producto". */}
          <p className="mt-1 text-humo">
            {plan.maxProducts !== null
              ? `${totalProducts} de ${plan.maxProducts} productos`
              : `${totalProducts} ${totalProducts === 1 ? 'producto' : 'productos'}`}
          </p>
        </div>

        <Link href="/catalogo/nuevo">
          <Button disabled={atLimit}>
            <PackagePlus aria-hidden className="size-4" />
            Nuevo producto
          </Button>
        </Link>
      </header>

      {atLimit && (
        <Alert tone="warning" title="Llegaste al tope de tu plan" className="mt-4">
          El plan {plan.name} permite hasta {plan.maxProducts} productos. Elimina alguno o
          cambia de plan para añadir más.
        </Alert>
      )}

      <div className="mt-5">
        <Suspense fallback={<div className="h-24" aria-hidden />}>
          <CatalogFilters
            categories={categories}
            totalProducts={totalProducts}
            uncategorized={uncategorized}
          />
        </Suspense>
      </div>

      {products.length === 0 ? (
        <Card className="mt-5 text-center">
          <span
            aria-hidden
            className="mx-auto flex size-14 items-center justify-center rounded-full bg-linea-soft text-humo"
          >
            <PackageSearch className="size-7" />
          </span>

          {filtering ? (
            <>
              <h2 className="mt-4 font-display text-lg font-semibold text-tinta">
                Ningún producto coincide
              </h2>
              <p className="mx-auto mt-1.5 max-w-md text-sm text-humo">
                Prueba con otra palabra o quita el filtro de categoría.
              </p>
            </>
          ) : (
            <>
              <h2 className="mt-4 font-display text-lg font-semibold text-tinta">
                Tu catálogo está vacío
              </h2>
              <p className="mx-auto mt-1.5 max-w-md text-sm text-humo">
                Carga tu primer producto para poder mostrarlo a tus prospectos y usarlo en la
                publicidad con IA.
              </p>
              <Link href="/catalogo/nuevo" className="mt-5 inline-block">
                <Button>
                  <PackagePlus aria-hidden className="size-4" />
                  Cargar mi primer producto
                </Button>
              </Link>
            </>
          )}
        </Card>
      ) : (
        <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <li key={product.id}>
              <ProductCard product={product} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
