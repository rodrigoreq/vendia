'use client'

import { useMemo, useState } from 'react'
import { AlertTriangle, MessageCircle, Send } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader } from '@/components/ui/Card'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import {
  buildWhatsAppUrl,
  normalizePhone,
  renderTemplate,
  type MessageContext,
} from '@/lib/whatsapp'

interface Template {
  id: string
  name: string
  body: string
}

interface WhatsAppSenderProps {
  phone: string | null
  templates: Template[]
  context: MessageContext
  /** Productos del prospecto, para elegir cuál nombra el mensaje. */
  products: { id: string; name: string; price: string | null; supplier: string | null }[]
}

export function WhatsAppSender({
  phone,
  templates,
  context,
  products,
}: WhatsAppSenderProps) {
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? '')
  const [productIndex, setProductIndex] = useState(0)
  const [edited, setEdited] = useState<string | null>(null)

  const phoneInfo = useMemo(() => normalizePhone(phone), [phone])

  // Si el prospecto se interesó en varios productos, el mensaje nombra el
  // que el vendedor elija; no tiene sentido listarlos todos.
  const product = products[productIndex]

  const rendered = useMemo(() => {
    const template = templates.find((t) => t.id === templateId)
    if (!template) return ''

    return renderTemplate(template.body, {
      ...context,
      producto: product?.name ?? context.producto,
      precio: product?.price
        ? `Bs ${Number(product.price).toLocaleString('es-BO')}`
        : context.precio,
      proveedor: product?.supplier ?? context.proveedor,
    })
  }, [templateId, templates, context, product])

  // Mientras el vendedor no toque el texto, el mensaje sigue a la plantilla.
  const message = edited ?? rendered

  function selectTemplate(id: string) {
    setTemplateId(id)
    setEdited(null)
  }

  if (templates.length === 0) {
    return (
      <Card>
        <CardHeader title="Enviar por WhatsApp" />
        <Alert tone="info">
          Todavía no tienes plantillas. Crea una en la sección Plantillas para poder escribir
          desde aquí.
        </Alert>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader
        title="Enviar por WhatsApp"
        description="Se abre WhatsApp con el mensaje escrito. Tú pulsas enviar."
      />

      {!phoneInfo.valid && (
        <Alert tone="warning" className="mb-4">
          {phone
            ? 'El teléfono no parece válido. Revísalo e incluye el código de país.'
            : 'Este prospecto no tiene teléfono cargado. Añádelo para poder escribirle.'}
        </Alert>
      )}

      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Plantilla"
            value={templateId}
            onChange={(e) => selectTemplate(e.target.value)}
            options={templates.map((t) => ({ value: t.id, label: t.name }))}
          />

          {products.length > 1 && (
            <Select
              label="Producto que se nombra"
              value={String(productIndex)}
              onChange={(e) => {
                setProductIndex(Number(e.target.value))
                setEdited(null)
              }}
              options={products.map((p, i) => ({ value: String(i), label: p.name }))}
            />
          )}
        </div>

        <Textarea
          label="Mensaje"
          value={message}
          onChange={(e) => setEdited(e.target.value)}
          rows={5}
          hint={
            edited !== null
              ? 'Editado a mano. Cambia de plantilla para volver al texto original.'
              : 'Puedes ajustarlo antes de abrir WhatsApp.'
          }
        />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-humo">
            {phoneInfo.valid ? (
              <>
                Se enviará a <strong className="text-tinta">+{phoneInfo.normalized}</strong>
                {phoneInfo.assumedCountry && (
                  <span className="ml-1 inline-flex items-center gap-1 text-dorado-700">
                    <AlertTriangle aria-hidden className="size-3" />
                    asumimos Bolivia
                  </span>
                )}
              </>
            ) : (
              'Sin número válido'
            )}
          </span>

          <a
            href={
              phoneInfo.valid ? buildWhatsAppUrl(phoneInfo.normalized, message) : undefined
            }
            target="_blank"
            rel="noopener noreferrer"
            aria-disabled={!phoneInfo.valid}
            onClick={(e) => {
              if (!phoneInfo.valid) e.preventDefault()
            }}
            className={phoneInfo.valid ? '' : 'pointer-events-none'}
          >
            <Button disabled={!phoneInfo.valid}>
              <MessageCircle aria-hidden className="size-4" />
              Abrir WhatsApp
              <Send aria-hidden className="size-3.5" />
            </Button>
          </a>
        </div>
      </div>
    </Card>
  )
}
