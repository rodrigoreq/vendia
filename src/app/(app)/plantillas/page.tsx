import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { requireSeller } from '@/lib/session'
import { TemplateManager } from '@/components/whatsapp/TemplateManager'
import { PLANS } from '@/constants/plans'
import { canCustomize, canUseAdvancedVariables, listTemplates } from '@/services/templates'

export default async function PlantillasPage() {
  const session = await auth()
  if (!session?.user?.id || !session.user.tenantId) redirect('/login')

  const { plan } = await requireSeller()
  const templates = await listTemplates(session.user.id, session.user.tenantId)

  return (
    <div className="mx-auto max-w-3xl">
      <header>
        <h1 className="font-display text-2xl font-bold text-tinta sm:text-[28px]">
          Plantillas
        </h1>
        <p className="mt-1 text-humo">
          Mensajes listos para escribirle a tus prospectos por WhatsApp.
        </p>
      </header>

      <div className="mt-6">
        <TemplateManager
          templates={templates}
          canCustomize={canCustomize(plan)}
          canUseAdvanced={canUseAdvancedVariables(plan)}
          planName={PLANS[plan].name}
        />
      </div>
    </div>
  )
}
