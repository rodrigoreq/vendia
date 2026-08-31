import NextAuth from 'next-auth'
import { NextResponse } from 'next/server'
import { authConfig } from './auth.config'

const { auth } = NextAuth(authConfig)

const PUBLIC_ROUTES = ['/login', '/registro', '/recuperar']

export default auth((req) => {
  const { pathname } = req.nextUrl
  const session = req.auth
  const isPublic = PUBLIC_ROUTES.some((route) => pathname.startsWith(route))

  if (!session?.user) {
    if (isPublic) return NextResponse.next()
    const loginUrl = new URL('/login', req.nextUrl.origin)
    if (pathname !== '/') loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  const isSuperadmin = session.user.role === 'superadmin'
  const inAdminArea = pathname.startsWith('/admin')

  if (isPublic) {
    return NextResponse.redirect(
      new URL(isSuperadmin ? '/admin' : '/panel', req.nextUrl.origin),
    )
  }

  // El panel de super-administrador es un área aparte: un vendedor no
  // entra ahí, y el super-admin no entra al área del vendedor (no tiene
  // tenant, y por diseño no debe ver contenido de cuentas).
  if (inAdminArea && !isSuperadmin) {
    return NextResponse.redirect(new URL('/panel', req.nextUrl.origin))
  }
  if (!inAdminArea && isSuperadmin) {
    return NextResponse.redirect(new URL('/admin', req.nextUrl.origin))
  }

  return NextResponse.next()
})

export const config = {
  // Se excluye TODO /api: esas rutas verifican la sesión por su cuenta y
  // deben responder JSON, no una redirección HTML.
  matcher: ['/((?!api/|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp)$).*)'],
}
