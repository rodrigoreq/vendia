/** Comprueba el estado real de la base: tablas, políticas y RLS activo. */
import { Client } from '@neondatabase/serverless'

const client = new Client(process.env.DATABASE_URL)
await client.connect()

const tables = await client.query(`
  SELECT c.relname AS tabla, c.relrowsecurity AS rls,
         (SELECT count(*) FROM pg_policies p WHERE p.tablename = c.relname) AS politicas
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relkind = 'r'
  ORDER BY c.relname;
`)

console.log('TABLA                     RLS   POLÍTICAS')
for (const r of tables.rows) {
  console.log(
    `${r.tabla.padEnd(25)} ${(r.rls ? 'sí ' : 'no ').padEnd(5)} ${r.politicas}`,
  )
}

const fns = await client.query(`
  SELECT proname, prosecdef AS security_definer
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname='public' AND proname LIKE 'app\\_%' ORDER BY proname;
`)
console.log('\nFUNCIONES AUXILIARES')
for (const r of fns.rows) {
  console.log(`  ${r.proname.padEnd(28)} SECURITY DEFINER: ${r.security_definer ? 'sí' : 'no'}`)
}

const role = await client.query(`
  SELECT rolname, rolcanlogin FROM pg_roles WHERE rolname='app_user';
`)
console.log(`\nROL app_user: ${role.rows.length ? 'existe' : 'NO EXISTE'}`)

await client.end()
