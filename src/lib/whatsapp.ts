/** Lógica de plantillas y enlaces de WhatsApp.
 *
 *  No se usa la API oficial de WhatsApp Business: solo se abre wa.me con
 *  el mensaje ya escrito, y el vendedor pulsa enviar. Eso evita el trámite
 *  con Meta y el costo por conversación, a cambio de un clic manual.
 */

export interface TemplateVariable {
  key: string
  label: string
  /** Solo disponible en el plan Elite. */
  advanced?: boolean
}

export const TEMPLATE_VARIABLES: TemplateVariable[] = [
  { key: 'nombre', label: 'Nombre del prospecto' },
  { key: 'producto', label: 'Producto de interés' },
  { key: 'precio', label: 'Precio del producto', advanced: true },
  { key: 'proveedor', label: 'Empresa proveedora', advanced: true },
  { key: 'vendedor', label: 'Tu nombre', advanced: true },
]

export interface MessageContext {
  nombre: string
  producto: string
  precio: string
  proveedor: string
  vendedor: string
}

/** Reemplaza {{variable}} por su valor. Las variables desconocidas se
 *  dejan tal cual en lugar de borrarse: si el vendedor escribió mal el
 *  nombre, prefiere verlo en el mensaje que descubrir un hueco. */
export function renderTemplate(body: string, context: Partial<MessageContext>): string {
  return body.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key: string) => {
    const value = context[key as keyof MessageContext]
    return value !== undefined && value !== '' ? value : match
  })
}

export interface PhoneResult {
  /** Número listo para wa.me: solo dígitos, con código de país. */
  normalized: string
  valid: boolean
  /** Verdadero cuando se asumió Bolivia por no venir código de país. */
  assumedCountry: boolean
}

/** wa.me exige el número en dígitos, con código de país y sin símbolos. */
export function normalizePhone(raw: string | null | undefined): PhoneResult {
  const digits = (raw ?? '').replace(/\D/g, '')

  if (digits.length === 0) {
    return { normalized: '', valid: false, assumedCountry: false }
  }

  // Un celular boliviano son 8 dígitos y empieza en 6 o 7. Si llega así,
  // se asume Bolivia — pero se avisa en la interfaz, porque adivinar el
  // país y equivocarse manda el mensaje a un desconocido.
  if (digits.length === 8 && /^[67]/.test(digits)) {
    return { normalized: `591${digits}`, valid: true, assumedCountry: true }
  }

  // Con código de país, lo más corto ronda los 10 dígitos.
  return {
    normalized: digits,
    valid: digits.length >= 10 && digits.length <= 15,
    assumedCountry: false,
  }
}

export function buildWhatsAppUrl(phone: string, message: string): string {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
}

/** Las tres plantillas que recibe toda cuenta nueva. En el plan Básico son
 *  las únicas y no se pueden editar; desde Profesional sirven de punto de
 *  partida. */
export const DEFAULT_TEMPLATES = [
  {
    name: 'Primer contacto',
    body:
      'Hola {{nombre}}, ¿cómo está? Le escribo por el interés que mostró en {{producto}}. ' +
      '¿Tiene unos minutos para que le cuente los detalles?',
  },
  {
    name: 'Seguimiento',
    body:
      'Hola {{nombre}}, ¿cómo le fue? Quedamos en conversar sobre {{producto}}. ' +
      '¿Le queda cómodo que lo llame hoy o prefiere mañana?',
  },
  {
    name: 'Cierre',
    body:
      'Hola {{nombre}}, le confirmo que {{producto}} sigue disponible. ' +
      'Si quiere avanzamos hoy mismo con la reserva. ¿Le parece?',
  },
] as const
