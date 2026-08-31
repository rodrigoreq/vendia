import type { NextAuthConfig } from 'next-auth'

/** Configuración compartida, segura para el runtime Edge (middleware).
 *  Sin proveedores ni bcrypt: eso vive en `auth.ts`, que corre en Node. */
export const authConfig = {
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  callbacks: {
    jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.tenantId = user.tenantId
        token.plan = user.plan
      }

      // El rol y el tenant NUNCA se toman de aquí: los fija el servidor al
      // iniciar sesión. Permitir que el cliente los cambie vía update()
      // sería una escalada de privilegios directa.
      if (trigger === 'update' && session) {
        if (typeof session.name === 'string') token.name = session.name
      }

      return token
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as typeof session.user.role
        session.user.tenantId = token.tenantId as string | null
        session.user.plan = token.plan as typeof session.user.plan
      }
      return session
    },
  },
  providers: [],
} satisfies NextAuthConfig
