import {
  LayoutDashboard,
  Package,
  Users,
  Sparkles,
  MessageCircle,
  Settings,
  Building2,
  BarChart3,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  href: string
  label: string
  icon: LucideIcon
}

/** Navegación del vendedor. El orden refleja su día: mira el panel,
 *  atiende prospectos, y usa catálogo y publicidad como apoyo. */
export const SELLER_NAV: NavItem[] = [
  { href: '/panel', label: 'Panel', icon: LayoutDashboard },
  { href: '/prospectos', label: 'Prospectos', icon: Users },
  { href: '/catalogo', label: 'Catálogo', icon: Package },
  { href: '/publicidad', label: 'Publicidad IA', icon: Sparkles },
  { href: '/plantillas', label: 'Plantillas', icon: MessageCircle },
  { href: '/cuenta', label: 'Mi cuenta', icon: Settings },
]

/** Navegación del super-administrador. Deliberadamente corta: solo
 *  cuentas y métricas, sin acceso al contenido de nadie. */
export const ADMIN_NAV: NavItem[] = [
  { href: '/admin', label: 'Métricas', icon: BarChart3 },
  { href: '/admin/cuentas', label: 'Cuentas', icon: Building2 },
]

/** En móvil, la barra inferior del vendedor. */
export const SELLER_MOBILE_NAV: NavItem[] = [
  { href: '/panel', label: 'Panel', icon: LayoutDashboard },
  { href: '/prospectos', label: 'Prospectos', icon: Users },
  { href: '/publicidad', label: 'Publicidad', icon: Sparkles },
]
