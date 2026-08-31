import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { PLANS } from '@/constants/plans'
import { DEMO_TENANTS } from '@/lib/demo-data'
import { isDatabaseConfigured } from '@/lib/db'

export default function AdminAccountsPage() {
  return (
    <div className="mx-auto max-w-7xl">
      <header>
        <h1 className="font-display text-2xl font-bold text-tinta sm:text-[28px]">Cuentas</h1>
        <p className="mt-1 text-humo">Alta, baja y plan de cada vendedor.</p>
      </header>

      {!isDatabaseConfigured && (
        <Alert tone="warning" title="Modo demostración" className="mt-5">
          Las acciones de alta y baja quedan activas al conectar la base de datos.
        </Alert>
      )}

      <Card className="mt-6" padded={false}>
        <div className="p-5 sm:p-6">
          <CardHeader
            title={`${DEMO_TENANTS.length} cuentas registradas`}
            description="Solo se muestran totales de uso, nunca contenido."
            className="mb-0"
          />
        </div>

        {/* La tabla desborda en móvil: se desplaza dentro de su contenedor,
            nunca haciendo que la página entera scrollee de lado. */}
        <div className="overflow-x-auto border-t border-linea">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-linea-soft text-left text-xs uppercase tracking-wide text-humo">
              <tr>
                <th scope="col" className="px-5 py-3 font-semibold">Cuenta</th>
                <th scope="col" className="px-5 py-3 font-semibold">Plan</th>
                <th scope="col" className="px-5 py-3 font-semibold">Estado</th>
                <th scope="col" className="px-5 py-3 text-right font-semibold">Productos</th>
                <th scope="col" className="px-5 py-3 text-right font-semibold">Prospectos</th>
                <th scope="col" className="px-5 py-3 text-right font-semibold">Imágenes</th>
                <th scope="col" className="px-5 py-3 text-right font-semibold">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-linea">
              {DEMO_TENANTS.map((tenant) => {
                const activa = tenant.status === 'active'
                return (
                  <tr key={tenant.id}>
                    <td className="px-5 py-3.5">
                      <span className="block font-medium text-tinta">{tenant.name}</span>
                      <span className="block text-xs text-humo">Alta: {tenant.createdAt}</span>
                    </td>
                    <td className="px-5 py-3.5 text-tinta">{PLANS[tenant.plan].name}</td>
                    <td className="px-5 py-3.5">
                      <span
                        className={
                          activa
                            ? 'inline-flex rounded-full bg-dorado-50 px-2.5 py-0.5 text-xs font-medium text-dorado-700'
                            : 'inline-flex rounded-full bg-berry-50 px-2.5 py-0.5 text-xs font-medium text-berry-700'
                        }
                      >
                        {activa ? 'Activa' : 'Suspendida'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right tabular-nums text-tinta">{tenant.products}</td>
                    <td className="px-5 py-3.5 text-right tabular-nums text-tinta">{tenant.prospects}</td>
                    <td className="px-5 py-3.5 text-right tabular-nums text-tinta">{tenant.imagesThisMonth}</td>
                    <td className="px-5 py-3.5 text-right">
                      <Button variant={activa ? 'secondary' : 'dorado'} size="sm" disabled>
                        {activa ? 'Suspender' : 'Reactivar'}
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
