import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { auth } from '@/auth'
import { ProductForm } from '@/components/catalogo/ProductForm'
import { listCategories } from '@/services/catalog'

export default async function NuevoProductoPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const categories = await listCategories(session.user.id)

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/catalogo"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-humo transition-colors hover:text-tinta"
      >
        <ArrowLeft aria-hidden className="size-4" />
        Volver al catálogo
      </Link>

      <h1 className="mt-3 font-display text-2xl font-bold text-tinta">Nuevo producto</h1>
      <p className="mt-1 text-humo">Lo que cargues aquí alimenta tu publicidad y tus mensajes.</p>

      <div className="mt-6">
        <ProductForm
          productId={null}
          categories={categories}
          blobEnabled={Boolean(process.env.BLOB_READ_WRITE_TOKEN)}
        />
      </div>
    </div>
  )
}
