/**
 * Prueba de aislamiento real contra la base. Crea dos vendedores y un
 * super-admin de prueba, y comprueba lo que cada uno puede y NO puede ver.
 * Limpia todo al terminar.
 *
 *   node --env-file=.env.local scripts/test-rls.mjs
 */
import { Client } from '@neondatabase/serverless'

const client = new Client(process.env.DATABASE_URL)
await client.connect()

let pass = 0
let fail = 0

function check(nombre, condicion, detalle = '') {
  if (condicion) {
    console.log(`  OK    ${nombre}`)
    pass++
  } else {
    console.log(`  FALLA ${nombre}${detalle ? ` — ${detalle}` : ''}`)
    fail++
  }
}

/** Ejecuta consultas como lo hace la app: usuario fijado y privilegios bajados. */
async function asUser(userId, fn) {
  await client.query('BEGIN')
  try {
    await client.query('SELECT set_config($1,$2,true)', ['app.user_id', userId])
    await client.query('SET LOCAL ROLE app_user')
    return await fn()
  } finally {
    await client.query('ROLLBACK')
  }
}

const TAG = 'rlstest'

try {
  // ---------- Preparación (como propietario, RLS no aplica) ----------
  await client.query(`DELETE FROM tenants WHERE name LIKE '${TAG}%'`)
  await client.query(`DELETE FROM users WHERE email LIKE '${TAG}%'`)

  const t1 = (await client.query(
    `INSERT INTO tenants (name, plan) VALUES ('${TAG}-uno','basico') RETURNING id`,
  )).rows[0].id
  const t2 = (await client.query(
    `INSERT INTO tenants (name, plan) VALUES ('${TAG}-dos','elite') RETURNING id`,
  )).rows[0].id

  const u1 = (await client.query(
    `INSERT INTO users (tenant_id,name,email,role) VALUES ($1,'Uno','${TAG}1@x.bo','owner') RETURNING id`,
    [t1],
  )).rows[0].id
  const u2 = (await client.query(
    `INSERT INTO users (tenant_id,name,email,role) VALUES ($1,'Dos','${TAG}2@x.bo','owner') RETURNING id`,
    [t2],
  )).rows[0].id
  const admin = (await client.query(
    `INSERT INTO users (tenant_id,name,email,role) VALUES (NULL,'Admin','${TAG}a@x.bo','superadmin') RETURNING id`,
  )).rows[0].id

  await client.query(
    `INSERT INTO products (tenant_id,name,price) VALUES ($1,'Terreno de Uno',1000)`,
    [t1],
  )
  await client.query(
    `INSERT INTO products (tenant_id,name,price) VALUES ($1,'Membresía de Dos',2000)`,
    [t2],
  )
  await client.query(
    `INSERT INTO prospects (tenant_id,name,status) VALUES ($1,'Prospecto de Uno','nuevo')`,
    [t1],
  )

  console.log('\n1. Aislamiento entre vendedores')
  await asUser(u1, async () => {
    const r = await client.query('SELECT name FROM products')
    check('El vendedor Uno ve solo su producto', r.rows.length === 1 && r.rows[0].name === 'Terreno de Uno',
      `vio ${r.rows.length}: ${r.rows.map((x) => x.name).join(', ')}`)
  })
  await asUser(u2, async () => {
    const r = await client.query('SELECT name FROM products')
    check('El vendedor Dos ve solo el suyo', r.rows.length === 1 && r.rows[0].name === 'Membresía de Dos',
      `vio ${r.rows.length}`)
    const p = await client.query('SELECT name FROM prospects')
    check('El vendedor Dos no ve prospectos ajenos', p.rows.length === 0, `vio ${p.rows.length}`)
  })

  console.log('\n2. El super-admin no ve contenido de nadie')
  await asUser(admin, async () => {
    const prod = await client.query('SELECT name FROM products')
    check('No ve ningún producto', prod.rows.length === 0, `vio ${prod.rows.length}`)
    const pros = await client.query('SELECT name FROM prospects')
    check('No ve ningún prospecto', pros.rows.length === 0, `vio ${pros.rows.length}`)
    const ten = await client.query(`SELECT name FROM tenants WHERE name LIKE '${TAG}%'`)
    check('Sí ve las cuentas (para administrarlas)', ten.rows.length === 2, `vio ${ten.rows.length}`)
  })

  console.log('\n3. Un vendedor no puede escalar privilegios')
  await asUser(u1, async () => {
    try {
      await client.query(`UPDATE users SET role='superadmin' WHERE id=$1`, [u1])
      const r = await client.query('SELECT role FROM users WHERE id=$1', [u1])
      check('No logra ascenderse a superadmin', r.rows[0]?.role !== 'superadmin',
        `quedó como ${r.rows[0]?.role}`)
    } catch (e) {
      check('No logra ascenderse a superadmin', true, `rechazado: ${e.message.slice(0, 60)}`)
    }
  })

  console.log('\n4. Editar el propio perfil sí funciona (sin recursión)')
  await asUser(u1, async () => {
    try {
      await client.query(`UPDATE users SET name='Uno Editado' WHERE id=$1`, [u1])
      const r = await client.query('SELECT name FROM users WHERE id=$1', [u1])
      check('Puede cambiar su nombre', r.rows[0]?.name === 'Uno Editado')
    } catch (e) {
      check('Puede cambiar su nombre', false, e.message.slice(0, 90))
    }
  })

  console.log('\n5. Nadie puede regalarse créditos')
  await client.query(
    `INSERT INTO usage_counters (tenant_id, period, images_generated) VALUES ($1,'2026-08',10)`,
    [t1],
  )
  await asUser(u1, async () => {
    try {
      const r = await client.query(
        `UPDATE usage_counters SET images_generated=0 WHERE tenant_id=$1`,
        [t1],
      )
      check('No puede poner su contador en cero', r.rowCount === 0, `actualizó ${r.rowCount} filas`)
    } catch (e) {
      check('No puede poner su contador en cero', true, `rechazado: ${e.message.slice(0, 50)}`)
    }
  })

  console.log('\n6. Un vendedor no puede escribir en el tenant de otro')
  await asUser(u1, async () => {
    try {
      await client.query(`INSERT INTO products (tenant_id,name) VALUES ($1,'Intruso')`, [t2])
      check('Rechaza insertar en tenant ajeno', false, 'la inserción fue aceptada')
    } catch {
      check('Rechaza insertar en tenant ajeno', true, 'rechazado por política')
    }
  })
} finally {
  await client.query(`DELETE FROM tenants WHERE name LIKE '${TAG}%'`).catch(() => {})
  await client.query(`DELETE FROM users WHERE email LIKE '${TAG}%'`).catch(() => {})
  await client.end()
}

console.log(`\n${pass} pruebas superadas, ${fail} fallidas`)
process.exit(fail === 0 ? 0 : 1)
