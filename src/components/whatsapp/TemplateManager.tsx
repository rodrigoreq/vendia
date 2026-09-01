'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, Pencil, Plus, Trash2 } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Textarea } from '@/components/ui/Textarea'
import { TEMPLATE_VARIABLES, renderTemplate } from '@/lib/whatsapp'
import {
  deleteTemplateAction,
  saveTemplateAction,
} from '@/app/(app)/plantillas/actions'

interface Template {
  id: string
  name: string
  body: string
  isDefault: boolean
}

interface TemplateManagerProps {
  templates: Template[]
  canCustomize: boolean
  canUseAdvanced: boolean
  planName: string
}

/** Ejemplo con el que se previsualiza la plantilla. */
const PREVIEW = {
  nombre: 'María Fernández',
  producto: 'Terreno Zona Norte',
  precio: 'Bs 48.500',
  proveedor: 'SION',
  vendedor: 'Carlos',
}

export function TemplateManager({
  templates,
  canCustomize,
  canUseAdvanced,
  planName,
}: TemplateManagerProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const [editing, setEditing] = useState<Template | null>(null)
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [body, setBody] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<Template | null>(null)

  const variables = TEMPLATE_VARIABLES.filter((v) => canUseAdvanced || !v.advanced)

  function openCreate() {
    setCreating(true)
    setEditing(null)
    setName('')
    setBody('')
    setError(null)
  }

  function openEdit(template: Template) {
    setEditing(template)
    setCreating(false)
    setName(template.name)
    setBody(template.body)
    setError(null)
  }

  function close() {
    setCreating(false)
    setEditing(null)
    setError(null)
  }

  function insertVariable(key: string) {
    setBody((prev) => `${prev}{{${key}}}`)
  }

  function handleSave() {
    setError(null)
    startTransition(async () => {
      const result = await saveTemplateAction(editing?.id ?? null, { name, body })
      if (!result.ok) {
        setError(result.error ?? 'No se pudo guardar.')
        return
      }
      close()
      router.refresh()
    })
  }

  function handleDelete() {
    startTransition(async () => {
      if (!deleting) return
      const result = await deleteTemplateAction(deleting.id)
      if (!result.ok) {
        setError(result.error ?? 'No se pudo eliminar.')
        setDeleting(null)
        return
      }
      setDeleting(null)
      router.refresh()
    })
  }

  const modalOpen = creating || editing !== null

  return (
    <>
      {!canCustomize && (
        <Alert tone="info" title={`Plan ${planName}: 3 plantillas fijas`} className="mb-5">
          Puedes usar estas tres plantillas en todos tus mensajes. Para editarlas o crear las
          tuyas, cambia al plan Profesional.
        </Alert>
      )}

      {canCustomize && (
        <div className="mb-5 flex justify-end">
          <Button onClick={openCreate}>
            <Plus aria-hidden className="size-4" />
            Nueva plantilla
          </Button>
        </div>
      )}

      <ul className="space-y-3">
        {templates.map((template) => (
          <li key={template.id}>
            <Card>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-display font-semibold text-tinta">{template.name}</h3>
                  {template.isDefault && (
                    <span className="mt-0.5 inline-flex items-center gap-1 text-xs text-humo">
                      <Lock aria-hidden className="size-3" />
                      Plantilla incluida
                    </span>
                  )}
                </div>

                {canCustomize && (
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      onClick={() => openEdit(template)}
                      aria-label={`Editar ${template.name}`}
                      className="rounded-control p-2 text-humo transition-colors hover:bg-linea-soft hover:text-tinta"
                    >
                      <Pencil aria-hidden className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleting(template)}
                      aria-label={`Eliminar ${template.name}`}
                      className="rounded-control p-2 text-humo transition-colors hover:bg-berry-50 hover:text-berry"
                    >
                      <Trash2 aria-hidden className="size-4" />
                    </button>
                  </div>
                )}
              </div>

              <p className="mt-3 whitespace-pre-wrap rounded-control bg-crema px-3 py-2.5 text-sm text-tinta-soft">
                {template.body}
              </p>

              <p className="mt-2 text-xs text-humo">
                <span className="font-medium">Así se verá:</span>{' '}
                {renderTemplate(template.body, PREVIEW)}
              </p>
            </Card>
          </li>
        ))}
      </ul>

      <Modal
        open={modalOpen}
        onClose={close}
        title={editing ? 'Editar plantilla' : 'Nueva plantilla'}
        description="Usa variables para que el mensaje se personalice solo."
        footer={
          <>
            <Button variant="secondary" onClick={close}>
              Cancelar
            </Button>
            <Button onClick={handleSave} loading={pending}>
              Guardar
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {error && <Alert tone="danger">{error}</Alert>}

          <Input
            label="Nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Recordatorio de visita"
          />

          <div>
            <Textarea
              label="Mensaje"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={5}
              placeholder="Hola {{nombre}}, le escribo por {{producto}}…"
            />

            <div className="mt-2 flex flex-wrap gap-1.5">
              <span className="text-xs text-humo">Insertar:</span>
              {variables.map((variable) => (
                <button
                  key={variable.key}
                  type="button"
                  onClick={() => insertVariable(variable.key)}
                  title={variable.label}
                  className="rounded-full border border-linea bg-superficie px-2 py-0.5 text-xs font-medium text-tinta-soft transition-colors hover:border-dorado hover:text-dorado-700"
                >
                  {`{{${variable.key}}}`}
                </button>
              ))}
            </div>

            {!canUseAdvanced && (
              <p className="mt-2 text-xs text-humo">
                Las variables de precio, proveedor y tu nombre están en el plan Elite.
              </p>
            )}
          </div>

          {body && (
            <div className="rounded-control border border-linea bg-crema px-3 py-2.5">
              <p className="text-xs font-medium text-humo">Vista previa</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-tinta">
                {renderTemplate(body, PREVIEW)}
              </p>
            </div>
          )}
        </div>
      </Modal>

      <Modal
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title="¿Eliminar esta plantilla?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleting(null)}>
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
          <strong>{deleting?.name}</strong> dejará de estar disponible al escribir a tus
          prospectos.
        </p>
      </Modal>
    </>
  )
}
