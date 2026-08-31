import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { NextResponse } from 'next/server'
import { auth } from '@/auth'

export const isBlobConfigured = Boolean(process.env.BLOB_READ_WRITE_TOKEN)

/** Emite un token de subida de vida corta para que el navegador suba la
 *  foto directamente a Vercel Blob. Se hace así, y no a través del
 *  servidor, porque las rutas de Next tienen un tope de 4.5 MB de cuerpo
 *  y una foto de celular lo supera con facilidad. */
export async function POST(request: Request): Promise<NextResponse> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      {
        error:
          'La subida de fotos necesita BLOB_READ_WRITE_TOKEN. Créalo en Vercel → Storage → Blob.',
      },
      { status: 503 },
    )
  }

  const session = await auth()
  if (!session?.user?.id || !session.user.tenantId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  const tenantId = session.user.tenantId

  const body = (await request.json()) as HandleUploadBody

  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp'],
        maximumSizeInBytes: 5 * 1024 * 1024,
        // El tenant queda en la ruta del archivo, para poder auditar y
        // limpiar por cuenta más adelante.
        pathname: `productos/${tenantId}`,
        addRandomSuffix: true,
        tokenPayload: JSON.stringify({ tenantId }),
      }),
      onUploadCompleted: async () => {
        // La fila en product_photos se crea al guardar el producto, no
        // aquí: si el vendedor sube una foto y luego cancela, no debe
        // quedar registrada.
      },
    })

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al subir' },
      { status: 400 },
    )
  }
}
