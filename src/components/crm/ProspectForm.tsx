'use client'

import { useState, useTransition, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, Phone, Save, Trash2, User } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader } from '@/components/ui/Card'
import { SelectableCard } from '@/components/ui/Checkbox'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { PROSPECT_STATUSES, type ProspectStatus } from '@/constants/plans'

import { deleteProspectAction, saveProspectAction } from '@/app/(app)/prospectos/actions'

interface ProspectFormProps {
  prospectId: string | null
  products: { id: string; name: string }[]
  initial?: {
    name: string
    phone: string
    email: string
    status: ProspectStatus
    source: string
    notes: string
    commissionEstimated: string
    commissionConfirmed: string
    productIds: string[]
  }
}

const EMPTY = {
  name: '',
  phone: '',
  email: '',
  status: 'nuevo' as ProspectStatus,
  source: '',
  notes: '',
  commissionEstimated: '',
  commissionConfirmed: '',
  productIds: [] as string[],
}

export function ProspectForm({ prospectId, products, initial }: ProspectFormProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [form, setForm] = useState({ ...EMPTY, ...initial })
  const [error, setError] = useState<string | null>(null)
  const [deleteModal, setDeleteModal] = useState(false)

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function toggleProduct(id: string) {
    set(
      'productIds',
      form.productIds.includes(id)
        ? form.productIds.filter((p) => p !== id)
        : [...form.productIds, id],
    )
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    startTransition(async () => {
      const result = await saveProspectAction(prospectId, form)
      if (!result.ok) {
        setError(result.error ?? 'No se pudo guardar.')
        return
      }
      router.push('/prospectos')
      router.refresh()
    })
  }

  function handleDelete() {
    startTransition(async () => {
      if (!prospectId) return
      const result = await deleteProspectAction(prospectId)
      if (!result.ok) {
        setError(result.error ?? 'No se pudo eliminar.')
        setDeleteModal(false)
        return
      }
      router.push('/prospectos')
      router.refresh()
    })
  }

  const isClosed = form.status === 'cerrado'

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {error && <Alert tone="danger">{error}</Alert>}

        <Card className="space-y-4">
          <Input
            label="Nombre"
            required
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="María Fernández"
            icon={<User className="size-4" />}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Teléfono / WhatsApp"
              type="tel"
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
              placeholder="+591 700 12345"
              hint="Con código de país, para el enlace de WhatsApp."
              icon={<Phone className="size-4" />}
            />
            <Input
              label="Correo electrónico"
              type="email"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              placeholder="cliente@correo.com"
              icon={<Mail className="size-4" />}
            />
          </div>

          {/* El estado solo se elige aquí al registrar. Al editar, su único
              dueño es el selector rápido de arriba. No se repite aquí ni
              siquiera como campo de solo lectura: quedaría desincronizado
              en cuanto se use el selector, mostrando dos estados distintos
              en la misma pantalla. */}
          <div className="grid gap-4 sm:grid-cols-2">
            {prospectId === null && (
              <Select
                label="Estado"
                required
                value={form.status}
                onChange={(e) => set('status', e.target.value as ProspectStatus)}
                options={PROSPECT_STATUSES.map((s) => ({ value: s.value, label: s.label }))}
              />
            )}
            <Input
              label="Origen del contacto"
              value={form.source}
              onChange={(e) => set('source', e.target.value)}
              placeholder="Referido, Facebook, feria…"
            />
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Productos de interés"
            description="Se usan para armar el mensaje de WhatsApp y la publicidad."
          />
          {products.length === 0 ? (
            <p className="text-sm text-humo">
              Todavía no tienes productos en el catálogo. Puedes registrar el prospecto igual y
              asociarlos después.
            </p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {products.map((product) => (
                <SelectableCard
                  key={product.id}
                  label={product.name}
                  checked={form.productIds.includes(product.id)}
                  onToggle={() => toggleProduct(product.id)}
                />
              ))}
            </div>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Comisión"
            description="La estimada es tu proyección; la confirmada, lo que realmente cobraste."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Comisión estimada (Bs)"
              inputMode="decimal"
              value={form.commissionEstimated}
              onChange={(e) => set('commissionEstimated', e.target.value)}
              placeholder="1200"
            />
            <Input
              label="Comisión confirmada (Bs)"
              inputMode="decimal"
              value={form.commissionConfirmed}
              onChange={(e) => set('commissionConfirmed', e.target.value)}
              placeholder="1350"
              hint={
                isClosed
                  ? 'Esta suma al total del mes en tu panel.'
                  : 'Se llena cuando marques el prospecto como cerrado.'
              }
            />
          </div>
        </Card>

        <Card>
          <Textarea
            label="Notas"
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
            placeholder="Qué conversaron, objeciones, cuándo volver a llamar…"
          />
        </Card>

        <div className="flex flex-wrap items-center justify-between gap-3">
          {prospectId ? (
            <Button variant="ghost" onClick={() => setDeleteModal(true)} disabled={pending}>
              <Trash2 aria-hidden className="size-4" />
              Eliminar prospecto
            </Button>
          ) : (
            <span />
          )}

          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => router.push('/prospectos')}>
              Cancelar
            </Button>
            <Button type="submit" loading={pending}>
              <Save aria-hidden className="size-4" />
              {prospectId ? 'Guardar cambios' : 'Registrar prospecto'}
            </Button>
          </div>
        </div>
      </form>

      <Modal
        open={deleteModal}
        onClose={() => setDeleteModal(false)}
        title="¿Eliminar este prospecto?"
        description="Se borra con sus notas y su historial. No se puede deshacer."
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
          <strong>{form.name || 'Este prospecto'}</strong> desaparecerá de tu CRM. Si solo
          quieres dejar de seguirlo, márcalo como <strong>Descartado</strong> en vez de
          borrarlo: así conservas el historial.
        </p>
      </Modal>
    </>
  )
}
