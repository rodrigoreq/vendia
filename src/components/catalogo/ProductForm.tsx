'use client'

import { useState, useTransition, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Save, Trash2 } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { PhotoUploader } from './PhotoUploader'
import {
  createCategoryAction,
  deleteProductAction,
  saveProductAction,
} from '@/app/(app)/catalogo/actions'

interface Category {
  id: string
  name: string
}

interface ProductFormProps {
  productId: string | null
  categories: Category[]
  blobEnabled: boolean
  initial?: {
    name: string
    description: string
    price: string
    supplier: string
    categoryId: string
    photos: string[]
  }
}

const EMPTY = {
  name: '',
  description: '',
  price: '',
  supplier: '',
  categoryId: '',
  photos: [] as string[],
}

export function ProductForm({
  productId,
  categories,
  blobEnabled,
  initial,
}: ProductFormProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const [form, setForm] = useState({ ...EMPTY, ...initial })
  const [error, setError] = useState<string | null>(null)

  const [categoryModal, setCategoryModal] = useState(false)
  const [newCategory, setNewCategory] = useState('')
  const [categoryError, setCategoryError] = useState<string | null>(null)
  const [creatingCategory, setCreatingCategory] = useState(false)

  const [deleteModal, setDeleteModal] = useState(false)

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    startTransition(async () => {
      const result = await saveProductAction(productId, {
        name: form.name,
        description: form.description,
        price: form.price,
        supplier: form.supplier,
        categoryId: form.categoryId,
        photoUrls: form.photos,
      })

      if (!result.ok) {
        setError(result.error ?? 'No se pudo guardar.')
        return
      }
      router.push('/catalogo')
      router.refresh()
    })
  }

  async function handleCreateCategory() {
    setCreatingCategory(true)
    setCategoryError(null)

    const result = await createCategoryAction(newCategory)
    setCreatingCategory(false)

    if (!result.ok) {
      setCategoryError(result.error ?? 'No se pudo crear la categoría.')
      return
    }

    setCategoryModal(false)
    setNewCategory('')
    // La lista de categorías la calcula el servidor: se recarga para que
    // aparezca la recién creada y quede seleccionable.
    router.refresh()
  }

  function handleDelete() {
    startTransition(async () => {
      if (!productId) return
      const result = await deleteProductAction(productId)
      if (!result.ok) {
        setError(result.error ?? 'No se pudo eliminar.')
        setDeleteModal(false)
        return
      }
      router.push('/catalogo')
      router.refresh()
    })
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {error && <Alert tone="danger">{error}</Alert>}

        <Card className="space-y-4">
          <Input
            label="Nombre del producto"
            required
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="Terreno Zona Norte 300 m²"
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Select
                label="Categoría"
                value={form.categoryId}
                onChange={(e) => set('categoryId', e.target.value)}
                options={categories.map((c) => ({ value: c.id, label: c.name }))}
                placeholder="Sin categoría"
              />
              <button
                type="button"
                onClick={() => setCategoryModal(true)}
                className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-berry hover:underline"
              >
                <Plus aria-hidden className="size-3.5" />
                Crear una categoría nueva
              </button>
            </div>

            <Input
              label="Empresa proveedora"
              value={form.supplier}
              onChange={(e) => set('supplier', e.target.value)}
              placeholder="SION"
              hint="Quién cobra al cliente."
            />
          </div>

          <Input
            label="Precio referencial (Bs)"
            inputMode="decimal"
            value={form.price}
            onChange={(e) => set('price', e.target.value)}
            placeholder="45000"
            hint="Solo informativo. VendIA no cobra."
          />

          <Textarea
            label="Descripción"
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="Superficie, ubicación, financiamiento, beneficios…"
          />
        </Card>

        <Card>
          <PhotoUploader
            photos={form.photos}
            onChange={(photos) => set('photos', photos)}
            enabled={blobEnabled}
          />
        </Card>

        <div className="flex flex-wrap items-center justify-between gap-3">
          {productId ? (
            <Button variant="ghost" onClick={() => setDeleteModal(true)} disabled={pending}>
              <Trash2 aria-hidden className="size-4" />
              Eliminar producto
            </Button>
          ) : (
            <span />
          )}

          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => router.push('/catalogo')}>
              Cancelar
            </Button>
            <Button type="submit" loading={pending}>
              <Save aria-hidden className="size-4" />
              {productId ? 'Guardar cambios' : 'Guardar producto'}
            </Button>
          </div>
        </div>
      </form>

      <Modal
        open={categoryModal}
        onClose={() => setCategoryModal(false)}
        title="Nueva categoría"
        description="Se suma a las que ya tienes, solo en tu cuenta."
        footer={
          <>
            <Button variant="secondary" onClick={() => setCategoryModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateCategory} loading={creatingCategory}>
              Crear
            </Button>
          </>
        }
      >
        <Input
          label="Nombre de la categoría"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          placeholder="Seguros, Vehículos, Cursos…"
          error={categoryError ?? undefined}
        />
      </Modal>

      <Modal
        open={deleteModal}
        onClose={() => setDeleteModal(false)}
        title="¿Eliminar este producto?"
        description="Se borra junto con sus fotos y no se puede deshacer."
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteModal(false)}>
              Cancelar
            </Button>
            <Button variant="berry" onClick={handleDelete} loading={pending}>
              <Trash2 aria-hidden className="size-4" />
              Sí, eliminar
            </Button>
          </>
        }
      >
        <p className="text-sm text-tinta-soft">
          <strong>{form.name || 'Este producto'}</strong> dejará de aparecer en tu catálogo y
          en el generador de publicidad.
        </p>
      </Modal>
    </>
  )
}
