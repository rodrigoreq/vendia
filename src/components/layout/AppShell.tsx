'use client'

import { useState, type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { LogOut, Menu, X } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import {
  ADMIN_NAV,
  SELLER_MOBILE_NAV,
  SELLER_NAV,
  type NavItem,
} from '@/constants/navigation'
import { cn } from '@/lib/cn'

/** La navegación se importa aquí, no llega por props: los iconos son
 *  componentes de React y no se pueden serializar desde un Server
 *  Component hacia un Client Component. */
const NAV_BY_VARIANT = {
  seller: { nav: SELLER_NAV, mobileNav: SELLER_MOBILE_NAV as NavItem[] | undefined },
  admin: { nav: ADMIN_NAV, mobileNav: undefined },
} as const

interface AppShellProps {
  userName: string
  userSubtitle: string
  variant: keyof typeof NAV_BY_VARIANT
  children: ReactNode
}

function NavLinks({
  nav,
  pathname,
  onNavigate,
}: {
  nav: NavItem[]
  pathname: string
  onNavigate?: () => void
}) {
  return (
    <>
      {nav.map((item) => {
        const Icon = item.icon
        // Comparación exacta: si no, /panel quedaría activo en todas las rutas.
        const active = pathname === item.href

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex items-center gap-3 rounded-control px-3 py-2.5 text-sm font-medium transition-colors',
              active
                ? 'bg-dorado text-ciruela'
                : 'text-crema/75 hover:bg-ciruela-700 hover:text-crema',
            )}
          >
            <Icon aria-hidden className="size-[18px] shrink-0" />
            <span className="truncate">{item.label}</span>
          </Link>
        )
      })}
    </>
  )
}

export function AppShell({ userName, userSubtitle, variant, children }: AppShellProps) {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const { nav, mobileNav } = NAV_BY_VARIANT[variant]

  const sidebar = (onNavigate?: () => void) => (
    <div className="flex h-full flex-col bg-ciruela">
      <div className="px-4 py-5">
        <Link href={nav[0].href} onClick={onNavigate}>
          <Logo onDark />
        </Link>
      </div>

      <nav aria-label="Navegación principal" className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
        <NavLinks nav={nav} pathname={pathname} onNavigate={onNavigate} />
      </nav>

      <div className="border-t border-ciruela-700 p-3">
        <div className="flex items-center gap-3 px-1 py-2">
          <span
            aria-hidden
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-dorado text-sm font-bold text-ciruela"
          >
            {userName.charAt(0).toUpperCase()}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-crema">{userName}</span>
            <span className="block truncate text-xs text-crema/50">{userSubtitle}</span>
          </span>
        </div>

        {/* Cierre directo: enlazar a /api/auth/signout mostraría la página
            intersticial de Auth.js, en inglés y sin estilos. */}
        <button
          type="button"
          onClick={() => {
            onNavigate?.()
            void signOut({ callbackUrl: '/login' })
          }}
          className="mt-1 flex w-full items-center gap-3 rounded-control px-3 py-2.5 text-sm font-medium text-crema/75 transition-colors hover:bg-ciruela-700 hover:text-crema"
        >
          <LogOut aria-hidden className="size-[18px] shrink-0" />
          Cerrar sesión
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-crema">
      <a
        href="#contenido"
        className="skip-link rounded-control bg-ciruela px-4 py-2 text-sm font-medium text-crema"
      >
        Saltar al contenido
      </a>

      <aside className="fixed inset-y-0 left-0 hidden w-64 lg:block">{sidebar()}</aside>

      {menuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-ciruela-950/60"
            onClick={() => setMenuOpen(false)}
            aria-hidden
          />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] shadow-overlay">
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              aria-label="Cerrar menú"
              className="absolute right-2 top-4 z-10 rounded-control p-2 text-crema/75 transition-colors hover:bg-ciruela-700 hover:text-crema"
            >
              <X aria-hidden className="size-5" />
            </button>
            {sidebar(() => setMenuOpen(false))}
          </div>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-linea bg-superficie">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Abrir menú de navegación"
              className="-ml-1 rounded-control p-2 text-tinta transition-colors hover:bg-linea-soft lg:hidden"
            >
              <Menu aria-hidden className="size-5" />
            </button>

            <div className="lg:hidden">
              <Logo variant="mark" />
            </div>

            <span className="ml-auto flex items-center gap-2 text-sm text-humo">
              <span className="hidden sm:inline">{userSubtitle}</span>
              <span
                aria-hidden
                className="flex size-9 items-center justify-center rounded-full bg-ciruela text-sm font-bold text-dorado"
              >
                {userName.charAt(0).toUpperCase()}
              </span>
            </span>
          </div>
        </header>

        <main id="contenido" className={cn('px-4 pt-6 sm:px-6', mobileNav ? 'pb-20 lg:pb-10' : 'pb-10')}>
          {children}
        </main>
      </div>

      {mobileNav && (
        <nav
          aria-label="Navegación rápida"
          className="fixed inset-x-0 bottom-0 z-30 border-t border-linea bg-superficie pb-[env(safe-area-inset-bottom)] lg:hidden"
        >
          <ul className="flex">
            {mobileNav.map((item) => {
              const Icon = item.icon
              const active = pathname === item.href
              return (
                <li key={item.href} className="flex-1">
                  <Link
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex min-h-14 flex-col items-center justify-center gap-0.5 px-2 py-2 text-xs font-medium transition-colors',
                      active ? 'text-berry' : 'text-humo',
                    )}
                  >
                    <Icon aria-hidden className="size-5" />
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
      )}
    </div>
  )
}
