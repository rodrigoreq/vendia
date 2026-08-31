import { Suspense } from 'react'
import Link from 'next/link'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { LoginForm } from '@/components/auth/LoginForm'
import { Alert } from '@/components/ui/Alert'
import { isDatabaseConfigured } from '@/lib/db'
import { DEMO_SELLER, DEMO_SUPERADMIN } from '@/lib/demo-data'

export default function LoginPage() {
  return (
    <AuthLayout
      title="Entra a tu cuenta"
      subtitle="Tus productos, tus prospectos y tus comisiones."
      footer={
        <>
          ¿No tienes cuenta?{' '}
          <Link href="/registro" className="font-medium text-berry hover:underline">
            Regístrate aquí
          </Link>
        </>
      }
    >
      <div className="space-y-5">
        <Suspense fallback={<div className="h-72" aria-hidden />}>
          <LoginForm />
        </Suspense>

        {!isDatabaseConfigured && (
          <Alert tone="warning" title="Modo demostración">
            Todavía no hay base de datos conectada. Cuentas de prueba (contraseña{' '}
            <strong>{DEMO_SELLER.password}</strong>):
            <ul className="mt-1.5 list-disc space-y-0.5 pl-4">
              <li>
                <strong>{DEMO_SELLER.email}</strong> — vendedor
              </li>
              <li>
                <strong>{DEMO_SUPERADMIN.email}</strong> — super-administrador
              </li>
            </ul>
          </Alert>
        )}
      </div>
    </AuthLayout>
  )
}
