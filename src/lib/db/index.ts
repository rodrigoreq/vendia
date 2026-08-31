import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

/** `true` cuando ya hay base de datos configurada. Sin ella la aplicación
 *  arranca en modo demostración para poder revisar la interfaz. */
export const isDatabaseConfigured = Boolean(process.env.DATABASE_URL)

let cached: ReturnType<typeof drizzle<typeof schema>> | null = null

export function getDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      'DATABASE_URL no está configurada. Crea el proyecto en Neon y añádela a .env.local.',
    )
  }
  if (!cached) {
    cached = drizzle(neon(process.env.DATABASE_URL), { schema })
  }
  return cached
}

export { schema }
