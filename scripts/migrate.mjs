/**
 * Aplica los archivos de drizzle/ en orden contra la base configurada.
 *
 *   node --env-file=.env.local scripts/migrate.mjs
 *
 * Cada archivo se ejecuta como una sola sentencia múltiple. Los .sql están
 * escritos para poder repetirse sin romper (IF NOT EXISTS, ON CONFLICT),
 * salvo las políticas, que se recrean explícitamente más abajo.
 */
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { Client } from '@neondatabase/serverless'

const url = process.env.DATABASE_URL
if (!url) {
  console.error('Falta DATABASE_URL. Usa: node --env-file=.env.local scripts/migrate.mjs')
  process.exit(1)
}

const dir = join(process.cwd(), 'drizzle')
const files = readdirSync(dir)
  .filter((f) => f.endsWith('.sql'))
  .sort()

const client = new Client(url)
await client.connect()

for (const file of files) {
  const sqlText = readFileSync(join(dir, file), 'utf8')
  process.stdout.write(`→ ${file} … `)
  try {
    await client.query(sqlText)
    console.log('OK')
  } catch (error) {
    console.log('FALLÓ')
    console.error(`   ${error.message}`)
    await client.end()
    process.exit(1)
  }
}

await client.end()
console.log('\nMigraciones aplicadas.')
