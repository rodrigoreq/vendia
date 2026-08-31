import { neon, Pool } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { drizzle as drizzlePool } from 'drizzle-orm/neon-serverless'
import { sql } from 'drizzle-orm'
import * as schema from './schema'

/** `true` cuando ya hay base de datos configurada. Sin ella la aplicación
 *  arranca en modo demostración para poder revisar la interfaz. */
export const isDatabaseConfigured = Boolean(process.env.DATABASE_URL)

function requireUrl() {
  const value = process.env.DATABASE_URL
  if (!value) {
    throw new Error('DATABASE_URL no está configurada. Revisa .env.local.')
  }
  return value
}

/* ============================================================
   DOS MODOS DE ACCESO, UNA SOLA CREDENCIAL

   getDb()  — rol propietario. Postgres exime al propietario de las
              políticas RLS, así que este modo las ignora. Se usa SOLO
              donde no puede haber sesión todavía (registro) o donde el
              dato es agregado y no pertenece a nadie (super-admin).
              Nunca para leer datos de un vendedor.

   withTenantDb() — abre una transacción, baja de privilegios con
              SET LOCAL ROLE app_user y fija app.user_id dentro de ella.
              Ambas cosas tienen que ocurrir en la misma transacción: el
              driver HTTP manda cada sentencia por separado y perdería el
              valor, dejando RLS sin efecto. Por eso aquí se usa el driver
              WebSocket, que sí sostiene transacciones.
   ============================================================ */

let ownerDb: ReturnType<typeof drizzle<typeof schema>> | null = null

export function getDb() {
  if (!ownerDb) {
    ownerDb = drizzle(neon(requireUrl()), { schema })
  }
  return ownerDb
}

let pool: Pool | null = null

function getPool() {
  if (!pool) {
    pool = new Pool({ connectionString: requireUrl() })
  }
  return pool
}

type Tx = Parameters<
  Parameters<ReturnType<typeof drizzlePool<typeof schema>>['transaction']>[0]
>[0]

/** Ejecuta `fn` con las políticas RLS activas y conociendo al usuario
 *  autenticado. Toda lectura o escritura de datos de un vendedor debe
 *  pasar por aquí. */
export async function withTenantDb<T>(
  userId: string,
  fn: (tx: Tx) => Promise<T>,
): Promise<T> {
  const db = drizzlePool(getPool(), { schema })

  return db.transaction(async (tx) => {
    // El orden importa: primero se declara quién es el usuario y luego se
    // baja de privilegios. Al revés, app_user no tendría permiso para
    // escribir el ajuste de configuración.
    // El tercer argumento `true` limita el valor a esta transacción, para
    // que no se filtre a la siguiente petición que reutilice la conexión.
    await tx.execute(sql`SELECT set_config('app.user_id', ${userId}, true)`)
    await tx.execute(sql`SET LOCAL ROLE app_user`)
    return fn(tx)
  })
}

export { schema }
