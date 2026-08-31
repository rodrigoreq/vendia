-- ============================================================
-- VendIA — Row Level Security
--
-- Aislamiento total por tenant. La aplicación abre cada
-- transacción con:
--     SELECT set_config('app.user_id', '<uuid>', true);
-- y las políticas derivan el tenant desde ese usuario.
--
-- Es RLS nativo de Postgres sobre Neon, sin dependencias externas.
-- No aplica al rol propietario de la base (Postgres lo exime),
-- por eso la aplicación se conecta con `app_user`.
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_user') THEN
    CREATE ROLE app_user NOLOGIN;
  END IF;
END
$$;

GRANT USAGE ON SCHEMA public TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_user;

-- ---------- Funciones auxiliares ----------

CREATE OR REPLACE FUNCTION app_current_user_id() RETURNS uuid
LANGUAGE sql STABLE AS $$
  SELECT NULLIF(current_setting('app.user_id', true), '')::uuid;
$$;

CREATE OR REPLACE FUNCTION app_current_tenant_id() RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT tenant_id FROM users WHERE id = app_current_user_id();
$$;

-- SECURITY DEFINER a propósito: leer `users` desde dentro de una política
-- SOBRE `users` volvería a disparar la política y Postgres abortaría con
-- "infinite recursion detected in policy for relation users".
CREATE OR REPLACE FUNCTION app_current_role() RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT role FROM users WHERE id = app_current_user_id();
$$;

CREATE OR REPLACE FUNCTION app_is_superadmin() RETURNS boolean
LANGUAGE sql STABLE AS $$
  SELECT app_current_role() = 'superadmin';
$$;

-- ---------- Activar RLS ----------

ALTER TABLE tenants               ENABLE ROW LEVEL SECURITY;
ALTER TABLE users                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories            ENABLE ROW LEVEL SECURITY;
ALTER TABLE products              ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_photos        ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospects             ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospect_products     ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_templates     ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_images      ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_counters        ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- ---------- tenants ----------
-- El vendedor ve su propia cuenta. El super-admin ve todas las cuentas
-- y puede darlas de alta y de baja: esto es lo que alimenta sus métricas
-- agregadas, y es lo ÚNICO del negocio que se le permite ver.

CREATE POLICY tenants_select ON tenants FOR SELECT
USING (id = app_current_tenant_id() OR app_is_superadmin());

CREATE POLICY tenants_write ON tenants FOR ALL
USING (app_is_superadmin()) WITH CHECK (app_is_superadmin());

-- ---------- users ----------
-- Un vendedor ve a los usuarios de su tenant y edita el suyo, pero NO
-- puede cambiarse el rol: sin esta comprobación cualquiera podría
-- ascenderse a superadmin editando su propio perfil.

CREATE POLICY users_select ON users FOR SELECT
USING (
  id = app_current_user_id()
  OR tenant_id = app_current_tenant_id()
  OR app_is_superadmin()
);

CREATE POLICY users_update ON users FOR UPDATE
USING (id = app_current_user_id() OR app_is_superadmin())
WITH CHECK (
  app_is_superadmin()
  OR (
    id = app_current_user_id()
    AND role = app_current_role()
    AND tenant_id IS NOT DISTINCT FROM app_current_tenant_id()
  )
);

CREATE POLICY users_write ON users FOR INSERT
WITH CHECK (app_is_superadmin() OR tenant_id = app_current_tenant_id());

-- ---------- Datos del negocio ----------
-- Nota deliberada: el super-admin NO aparece en estas políticas.
-- Puede administrar cuentas y ver totales, pero no puede leer el
-- catálogo ni los prospectos de nadie. Es el requisito de privacidad
-- del producto, y vive en la base de datos, no en la interfaz.

CREATE POLICY categories_all ON categories FOR ALL
USING (tenant_id = app_current_tenant_id())
WITH CHECK (tenant_id = app_current_tenant_id());

CREATE POLICY products_all ON products FOR ALL
USING (tenant_id = app_current_tenant_id())
WITH CHECK (tenant_id = app_current_tenant_id());

CREATE POLICY product_photos_all ON product_photos FOR ALL
USING (tenant_id = app_current_tenant_id())
WITH CHECK (tenant_id = app_current_tenant_id());

CREATE POLICY prospects_all ON prospects FOR ALL
USING (tenant_id = app_current_tenant_id())
WITH CHECK (tenant_id = app_current_tenant_id());

CREATE POLICY prospect_products_all ON prospect_products FOR ALL
USING (tenant_id = app_current_tenant_id())
WITH CHECK (tenant_id = app_current_tenant_id());

CREATE POLICY message_templates_all ON message_templates FOR ALL
USING (tenant_id = app_current_tenant_id())
WITH CHECK (tenant_id = app_current_tenant_id());

CREATE POLICY generated_images_all ON generated_images FOR ALL
USING (tenant_id = app_current_tenant_id())
WITH CHECK (tenant_id = app_current_tenant_id());

-- ---------- Cuotas ----------
-- El vendedor consulta su consumo; solo el servidor lo incrementa.
-- Si el usuario pudiera escribir aquí, se regalaría imágenes.
-- El super-admin sí lee, porque son métricas agregadas de uso.

CREATE POLICY usage_select ON usage_counters FOR SELECT
USING (tenant_id = app_current_tenant_id() OR app_is_superadmin());

CREATE POLICY usage_write ON usage_counters FOR ALL
USING (app_is_superadmin()) WITH CHECK (app_is_superadmin());

-- ---------- Recuperación de contraseña ----------
-- Nadie los lee desde la aplicación: se verifican en el servidor con
-- privilegios elevados. Sin políticas de lectura, quedan cerrados.

CREATE POLICY reset_tokens_none ON password_reset_tokens FOR SELECT
USING (false);
