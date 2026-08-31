import type { ReactNode } from 'react'
import { ImageIcon, MessageCircle, Users } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'

const BENEFITS = [
  { Icon: Users, text: 'Tus prospectos ordenados por estado, sin perder ninguno' },
  { Icon: ImageIcon, text: 'Publicidad lista para WhatsApp en segundos' },
  { Icon: MessageCircle, text: 'Mensajes personalizados con un clic' },
]

interface AuthLayoutProps {
  title: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
}

export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen bg-crema">
      <aside className="relative hidden w-1/2 flex-col justify-between bg-ciruela p-10 lg:flex xl:w-[45%]">
        <Logo onDark />

        <div className="max-w-md">
          <h2 className="font-display text-[34px] font-bold leading-[1.15] text-crema">
            Tu comisión empieza por un
            <span className="text-dorado"> buen seguimiento</span>.
          </h2>

          <ul className="mt-8 space-y-4">
            {BENEFITS.map(({ Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-crema/85">
                <span
                  aria-hidden
                  className="flex size-9 shrink-0 items-center justify-center rounded-control bg-ciruela-700 text-dorado"
                >
                  <Icon className="size-[18px]" />
                </span>
                <span className="text-sm">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-crema/40">
          VendIA no cobra a tus clientes: cada empresa cobra directo, tú cobras tu comisión.
        </p>
      </aside>

      <main className="flex flex-1 flex-col justify-center px-5 py-10 sm:px-8">
        <div className="mx-auto w-full max-w-[400px]">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>

          <h1 className="font-display text-2xl font-bold text-tinta">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-humo">{subtitle}</p>}

          <div className="mt-7">{children}</div>

          {footer && <div className="mt-6 text-center text-sm text-humo">{footer}</div>}
        </div>
      </main>
    </div>
  )
}
