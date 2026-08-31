'use client'

import { useState, type FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Eye, EyeOff, Lock, Mail } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError(null)

    const result = await signIn('credentials', { email, password, redirect: false })

    if (result?.error) {
      setError('Correo o contraseña incorrectos. Verifica tus datos e inténtalo otra vez.')
      setLoading(false)
      return
    }

    // El middleware decide el destino según el rol; /panel es solo el punto
    // de partida para un vendedor, y redirige al super-admin a /admin.
    router.push(next ?? '/panel')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {error && <Alert tone="danger">{error}</Alert>}

      <Input
        label="Correo electrónico"
        type="email"
        name="email"
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
        name="password"
        autoComplete="current-password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Ingresa tu contraseña"
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

      <div className="flex justify-end">
        <a href="/recuperar" className="text-sm font-medium text-berry hover:underline">
          ¿Olvidaste tu contraseña?
        </a>
      </div>

      <Button type="submit" size="lg" fullWidth loading={loading}>
        {loading ? 'Entrando…' : 'Entrar'}
      </Button>
    </form>
  )
}
