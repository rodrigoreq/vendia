'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Eye, EyeOff, Lock, Mail, User } from 'lucide-react'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function RegistroPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })

      if (!response.ok) {
        const body = await response.json().catch(() => null)
        setError(body?.error ?? 'No se pudo crear la cuenta. Inténtalo otra vez.')
        setLoading(false)
        return
      }

      await signIn('credentials', { email, password, redirect: false })
      router.push('/panel')
      router.refresh()
    } catch {
      setError('No se pudo conectar con el servidor. Revisa tu conexión.')
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Crea tu cuenta"
      subtitle="Empiezas en el plan Básico. Puedes cambiarlo cuando quieras."
      footer={
        <>
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="font-medium text-berry hover:underline">
            Entra aquí
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {error && <Alert tone="danger">{error}</Alert>}

        <Input
          label="Nombre completo"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Carlos Mendoza"
          icon={<User className="size-4" />}
        />

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

        <Input
          label="Contraseña"
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Mínimo 8 caracteres"
          icon={<Lock className="size-4" />}
          trailing={
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              className="rounded-control p-2 text-humo transition-colors hover:text-tinta"
            >
              {showPassword ? <EyeOff aria-hidden className="size-4" /> : <Eye aria-hidden className="size-4" />}
            </button>
          }
        />

        <Button type="submit" size="lg" fullWidth loading={loading}>
          {loading ? 'Creando cuenta…' : 'Crear mi cuenta'}
        </Button>
      </form>
    </AuthLayout>
  )
}
