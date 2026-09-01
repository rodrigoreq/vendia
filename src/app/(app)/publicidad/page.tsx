import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowRight, ImageIcon, Sparkles, Type } from 'lucide-react'
import { auth } from '@/auth'
import { requireSeller } from '@/lib/session'
import { Card, CardHeader } from '@/components/ui/Card'
import { PLANS } from '@/constants/plans'
import { getUsageReport } from '@/services/usage'

/** Marcador del paso 4. La ruta ya está en el menú, así que debe existir:
 *  un enlace del menú que lleva a un 404 se lee como una app rota. */
export default async function PublicidadPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const { userId, plan: planId } = await requireSeller()
  const plan = PLANS[planId]
  const usage = await getUsageReport(userId, planId)
  const images = usage.items.find((i) => i.key === 'images')

  return (
    <div className="mx-auto max-w-3xl">
      <header>
        <h1 className="font-display text-2xl font-bold text-tinta sm:text-[28px]">
          Publicidad IA
        </h1>
        <p className="mt-1 text-humo">
          Piezas listas para WhatsApp y redes, a partir de tu catálogo.
        </p>
      </header>

      <Card className="mt-6 text-center">
        <span
          aria-hidden
          className="mx-auto flex size-14 items-center justify-center rounded-full bg-dorado-50 text-dorado-700"
        >
          <Sparkles className="size-7" />
        </span>

        <h2 className="mt-4 font-display text-lg font-semibold text-tinta">
          En construcción
        </h2>
        <p className="mx-auto mt-1.5 max-w-md text-sm text-humo">
          Es el siguiente módulo. Necesita las claves de Anthropic y de Fal.ai para
          funcionar.
        </p>

        <div className="mx-auto mt-6 max-w-md space-y-3 text-left">
          <div className="flex items-start gap-3">
            <span
              aria-hidden
              className="flex size-9 shrink-0 items-center justify-center rounded-control bg-ciruela-50 text-ciruela-600"
            >
              <Type className="size-4" />
            </span>
            <p className="text-sm text-tinta-soft">
              <strong className="text-tinta">Claude escribe el aviso</strong> con los datos
              reales del producto que elijas.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span
              aria-hidden
              className="flex size-9 shrink-0 items-center justify-center rounded-control bg-berry-50 text-berry"
            >
              <ImageIcon className="size-4" />
            </span>
            <p className="text-sm text-tinta-soft">
              <strong className="text-tinta">FLUX genera el fondo</strong>, y la app compone
              el precio y el nombre encima con tu tipografía: así el precio nunca sale mal.
            </p>
          </div>
        </div>
      </Card>

      <Card className="mt-5">
        <CardHeader
          title="Tu cuota de imágenes"
          description={`Se reinicia el ${usage.imagesRenewAt}.`}
        />
        <p className="font-display text-2xl font-bold text-tinta">
          {images?.used ?? 0}
          <span className="text-base font-normal text-humo">
            {' '}
            / {plan.maxImagesPerMonth} este mes
          </span>
        </p>
        <p className="mt-1.5 text-sm text-humo">
          Solo se descuenta al generar un fondo nuevo. Reescribir el texto de una pieza que
          ya existe no consume cuota.
        </p>
        <Link
          href="/cuenta"
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-berry hover:underline"
        >
          Ver todo mi consumo
          <ArrowRight aria-hidden className="size-4" />
        </Link>
      </Card>
    </div>
  )
}
