import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { auth } from '@/auth'
import { ProductForm } from '@/components/catalogo/ProductForm'
import { getProduct, listCategories } from '@/services/catalog'

export default async function EditarProductoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const { id } = await params

  const [product, categories] = await Promise.all([
    getProduct(session.user.id, id),
    listCategories(session.user.id),
  ])

  // getProduct pasa por RLS: si el producto es de otra cuenta llega null
  // y el vendedor ve un 404, no un error de permisos que confirme que existe.
  if (!product) notFound()

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/catalogo"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-humo transition-colors hover:text-tinta"
      >
        <ArrowLeft aria-hidden className="size-4" />
        Volver al catálogo
      </Link>

      <h1 className="mt-3 font-display text-2xl font-bold text-tinta">Editar producto</h1>

      <div className="mt-6">
        <ProductForm
          productId={product.id}
          categories={categories}
          blobEnabled={Boolean(process.env.BLOB_READ_WRITE_TOKEN)}
          initial={{
            name: product.name,
            description: product.description ?? '',
            price: product.price ?? '',
            supplier: product.supplier ?? '',
            categoryId: product.categoryId ?? '',
            photos: product.photos.map((p) => p.url),
          }}
        />
      </div>
    </div>
  )
}
