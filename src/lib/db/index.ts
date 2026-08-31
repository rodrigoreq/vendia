import { neon, Pool } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { drizzle as drizzlePool } from 'drizzle-orm/neon-serverless'
import { sql } from 'drizzle-orm'
import * as schema from './schema'

/** `true` cuando ya hay base de datos configurada. Sin ella la aplicación
 *  arranca en modo demostración para poder revisar la interfaz. */
export const isDatabaseConfigured = Boolean(process.env.DATABASE_URL)

function requireUrl(name: 'DATABASE_URL' | 'DATABASE_URL_APP') {
  const value = process.env[name]
  if (!value) {
    throw new Error(`${name} no está configurada. Revisa .env.local.`)
  }
  return value
}

/* ============================================================
   DOS CONEXIONES, A PROPÓSITO

   getDb()  — rol propietario. Postgres exime al propietario de las
              políticas RLS, así que esta conexión las ignora. Se usa
              SOLO donde no puede haber sesión todavía (registro) o
              donde el dato es agregado y no pertenece a nadie (panel
              de super-admin). Nunca para leer datos de un vendedor.

   withTenantDb() — rol `app_user`, sujeto a RLS. Es la conexión de todo
              lo que toca datos de un vendedor. Abre una transacción y
              fija app.user_id dentro de ella, que es la única forma de
              que set_config(..., true) sobreviva hasta la consulta:
              el driver HTTP manda cada sentencia por separado y perdería
              el valor, dejando RLS sin efecto.
   ============================================================ */

let ownerDb: ReturnType<typeof drizzle<typeof schema>> | null = null

export function getDb() {
  if (!ownerDb) {
    ownerDb = drizzle(neon(requireUrl('DATABASE_URL')), { schema })
  }
  return ownerDb
}

let appPool: Pool | null = null

function getAppPool() {
  if (!appPool) {
    // Si no se define una cadena propia para app_user se reutiliza la
    // principal; en ese caso RLS no se aplicará, así que se avisa fuerte.
    const url = process.env.DATABASE_URL_APP
    if (!url) {
      console.warn(
        '[db] DATABASE_URL_APP no está configurada: las consultas usarán el rol propietario y RLS NO se aplicará.',
      )
    }
    appPool = new Pool({ connectionString: url ?? requireUrl('DATABASE_URL') })
  }
  return appPool
}

/** Ejecuta `fn` dentro de una transacción donde las políticas RLS conocen
 *  al usuario autenticado. Toda lectura o escritura de datos de un
 *  vendedor debe pasar por aquí. */
export async function withTenantDb<T>(
  userId: string,
  fn: (tx: Parameters<Parameters<ReturnType<typeof drizzlePool<typeof schema>>['transaction']>[0]>[0]) => Promise<T>,
): Promise<T> {
  const db = drizzlePool(getAppPool(), { schema })

  return db.transaction(async (tx) => {
    // El tercer argumento `true` limita el valor a esta transacción: no se
    // filtra a la siguiente petición que reutilice la misma conexión.
    await tx.execute(sql`SELECT set_config('app.user_id', ${userId}, true)`)
    return fn(tx)
  })
}

export { schema }
