'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { ArrowLeft, Mail } from 'lucide-react'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function RecuperarPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setLoading(true)

    // El envío real de correo queda pendiente de elegir proveedor. La
    // respuesta es la misma exista o no la cuenta, para no revelar qué
    // correos están registrados.
    await new Promise((resolve) => setTimeout(resolve, 600))

    setLoading(false)
    setSent(true)
  }

  return (
    <AuthLayout
      title="Recuperar contraseña"
      subtitle="Te enviaremos un enlace para crear una nueva."
      footer={
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 font-medium text-berry hover:underline"
        >
          <ArrowLeft aria-hidden className="size-4" />
          Volver a entrar
        </Link>
      }
    >
      {sent ? (
        <div className="space-y-4">
          <Alert tone="success" title="Revisa tu correo">
            Si <strong>{email}</strong> corresponde a una cuenta registrada, recibirás un
            enlace para restablecer tu contraseña.
          </Alert>
          <Alert tone="info" title="Pendiente en esta fase">
            El envío de correos aún no está conectado a un proveedor, así que el mensaje no
            llegará todavía. La pantalla y el flujo ya están listos.
          </Alert>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <Input
            label="Correo electrónico"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tucorreo@ejemplo.com"
            icon={<Mail className="size-4" />}
          />
          <Button type="submit" size="lg" fullWidth loading={loading}>
            {loading ? 'Enviando…' : 'Enviar enlace'}
          </Button>
        </form>
      )}
    </AuthLayout>
  )
}
