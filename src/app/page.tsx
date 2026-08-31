import { redirect } from 'next/navigation'

/** La raíz no tiene contenido propio: el middleware decide el destino
 *  según la sesión y el rol. */
export default function RootPage() {
  redirect('/panel')
}
