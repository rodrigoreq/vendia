import {
  boolean,
  integer,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

/* ============================================================
   TENANTS
   Un tenant es la cuenta de un vendedor independiente. Hoy es
   1 vendedor = 1 tenant, pero modelarlo aparte permite sumar
   un ayudante más adelante sin migrar datos.
   Todo dato del negocio cuelga de tenant_id y es invisible
   para los demás tenants (ver 0001_rls.sql).
   ============================================================ */

export const tenants = pgTable('tenants', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  /** basico | profesional | elite */
  plan: text('plan').notNull().default('basico'),
  /** active | suspended — el super-admin da de alta y de baja aquí. */
  status: text('status').notNull().default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

/* ============================================================
   AUTENTICACIÓN (Auth.js)
   ============================================================ */

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  /** Nulo solo para el super-admin, que no pertenece a ningún tenant. */
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }),
  name: text('name'),
  email: text('email').notNull().unique(),
  emailVerified: timestamp('email_verified', { withTimezone: true }),
  image: text('image'),
  passwordHash: text('password_hash'),
  /** owner | superadmin */
  role: text('role').notNull().default('owner'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const accounts = pgTable(
  'accounts',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('provider_account_id').notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state'),
  },
  (table) => [primaryKey({ columns: [table.provider, table.providerAccountId] })],
)

export const sessions = pgTable('sessions', {
  sessionToken: text('session_token').primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { withTimezone: true }).notNull(),
})

export const verificationTokens = pgTable(
  'verification_tokens',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: timestamp('expires', { withTimezone: true }).notNull(),
  },
  (table) => [primaryKey({ columns: [table.identifier, table.token] })],
)

/** Tokens de recuperación de contraseña. Se guarda el hash, nunca el token
 *  en claro: quien lea la base de datos no debe poder secuestrar cuentas. */
export const passwordResetTokens = pgTable('password_reset_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  usedAt: timestamp('used_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

/* ============================================================
   CATÁLOGO (paso 2)
   ============================================================ */

export const categories = pgTable(
  'categories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    /** Las predefinidas se crean con la cuenta; el usuario puede añadir más. */
    isDefault: boolean('is_default').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex('categories_tenant_name').on(table.tenantId, table.name)],
)

export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'set null' }),
  name: text('name').notNull(),
  description: text('description'),
  /** Precio referencial: la app no cobra, solo informa. */
  price: numeric('price', { precision: 12, scale: 2 }),
  currency: text('currency').notNull().default('BOB'),
  /** Empresa proveedora que cobra directamente (SION, etc.). */
  supplier: text('supplier'),
  archived: boolean('archived').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const productPhotos = pgTable('product_photos', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  productId: uuid('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

/* ============================================================
   CRM (paso 3)
   ============================================================ */

export const prospects = pgTable('prospects', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  phone: text('phone'),
  email: text('email'),
  /** nuevo | contactado | interesado | negociacion | cerrado | descartado */
  status: text('status').notNull().default('nuevo'),
  /** Referido, Facebook, feria, etc. */
  source: text('source'),
  notes: text('notes'),
  /** Comisión estimada mientras se negocia, confirmada al cerrar. */
  commissionEstimated: numeric('commission_estimated', { precision: 12, scale: 2 }),
  commissionConfirmed: numeric('commission_confirmed', { precision: 12, scale: 2 }),
  closedAt: timestamp('closed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

/** Un prospecto puede interesarse en varios productos. */
export const prospectProducts = pgTable(
  'prospect_products',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    prospectId: uuid('prospect_id')
      .notNull()
      .references(() => prospects.id, { onDelete: 'cascade' }),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
  },
  (table) => [uniqueIndex('prospect_products_unique').on(table.prospectId, table.productId)],
)

/* ============================================================
   PLANTILLAS DE WHATSAPP (paso 5)
   ============================================================ */

export const messageTemplates = pgTable('message_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  /** Cuerpo con variables tipo {{nombre}} y {{producto}}. */
  body: text('body').notNull(),
  isDefault: boolean('is_default').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

/* ============================================================
   GENERADOR DE IMÁGENES (paso 4)
   ============================================================ */

export const generatedImages = pgTable('generated_images', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'set null' }),
  prompt: text('prompt').notNull(),
  /** Fondo generado por el modelo, sin texto. */
  backgroundUrl: text('background_url'),
  /** Pieza final ya compuesta con el texto real encima. */
  compositeUrl: text('composite_url'),
  /** vertical | horizontal */
  format: text('format').notNull().default('vertical'),
  /** Copy que redactó Claude, guardado para poder reeditarlo sin regenerar. */
  headline: text('headline'),
  bodyCopy: text('body_copy'),
  callToAction: text('call_to_action'),
  costUsd: numeric('cost_usd', { precision: 8, scale: 4 }).notNull().default('0'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

/* ============================================================
   CUOTAS
   Un contador por tenant y por mes. Solo cuenta generaciones de
   fondo, que son las que cuestan dinero: recomponer el texto es
   gratis y no debe descontar de la cuota.
   ============================================================ */

export const usageCounters = pgTable(
  'usage_counters',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    /** Mes en formato AAAA-MM. */
    period: text('period').notNull(),
    imagesGenerated: integer('images_generated').notNull().default(0),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex('usage_counters_tenant_period').on(table.tenantId, table.period)],
)
