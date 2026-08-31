'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { upload } from '@vercel/blob/client'
import { ImagePlus, Loader2, X } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'

const MAX_PHOTOS = 6
const MAX_SIDE = 1600

/** Reduce la foto antes de subirla. Una foto de celular pesa varios MB y
 *  para un catálogo no aporta nada por encima de 1600px: se ahorra
 *  almacenamiento, datos móviles del vendedor y tiempo de espera. */
async function downscale(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) return file

  const bitmap = await createImageBitmap(file).catch(() => null)
  if (!bitmap) return file

  const { width, height } = bitmap
  if (width <= MAX_SIDE && height <= MAX_SIDE) {
    bitmap.close()
    return file
  }

  const scale = MAX_SIDE / Math.max(width, height)
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(width * scale)
  canvas.height = Math.round(height * scale)

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    bitmap.close()
    return file
  }
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', 0.85),
  )
  if (!blob) return file

  return new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' })
}

interface PhotoUploaderProps {
  photos: string[]
  onChange: (photos: string[]) => void
  /** Falso cuando no hay BLOB_READ_WRITE_TOKEN configurado. */
  enabled: boolean
}

export function PhotoUploader({ photos, onChange, enabled }: PhotoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return

    const room = MAX_PHOTOS - photos.length
    if (room <= 0) {
      setError(`Puedes subir hasta ${MAX_PHOTOS} fotos por producto.`)
      return
    }

    setUploading(true)
    setError(null)

    try {
      const uploaded: string[] = []
      for (const file of Array.from(files).slice(0, room)) {
        const optimized = await downscale(file)
        const blob = await upload(optimized.name, optimized, {
          access: 'public',
          handleUploadUrl: '/api/blob/upload',
        })
        uploaded.push(blob.url)
      }
      onChange([...photos, ...uploaded])
    } catch (err) {
      setError(
        err instanceof Error
          ? `No se pudo subir la foto: ${err.message}`
          : 'No se pudo subir la foto.',
      )
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-tinta">Fotos</span>

      {!enabled && (
        <Alert tone="warning" className="mb-2">
          La subida de fotos necesita <strong>BLOB_READ_WRITE_TOKEN</strong>. Créalo en Vercel
          → Storage → Blob y añádelo a <code>.env.local</code>. El resto del producto se puede
          guardar igual.
        </Alert>
      )}

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {photos.map((url, index) => (
          <div
            key={url}
            className="group relative aspect-square overflow-hidden rounded-control border border-linea bg-linea-soft"
          >
            <Image
              src={url}
              alt={`Foto ${index + 1}`}
              fill
              sizes="(max-width: 640px) 33vw, 160px"
              className="object-cover"
            />
            <button
              type="button"
              onClick={() => onChange(photos.filter((p) => p !== url))}
              aria-label={`Quitar foto ${index + 1}`}
              className="absolute right-1 top-1 rounded-full bg-ciruela/85 p-1.5 text-crema transition-colors hover:bg-berry"
            >
              <X aria-hidden className="size-3.5" />
            </button>
            {index === 0 && (
              <span className="absolute bottom-1 left-1 rounded-full bg-dorado px-2 py-0.5 text-[10px] font-semibold text-ciruela">
                Principal
              </span>
            )}
          </div>
        ))}

        {photos.length < MAX_PHOTOS && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={!enabled || uploading}
            className="flex aspect-square flex-col items-center justify-center gap-1 rounded-control border border-dashed border-linea bg-superficie text-humo transition-colors hover:border-dorado hover:text-dorado-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 aria-hidden className="size-5 animate-spin" />
            ) : (
              <ImagePlus aria-hidden className="size-5" />
            )}
            <span className="text-xs font-medium">{uploading ? 'Subiendo…' : 'Añadir'}</span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="sr-only"
        onChange={(e) => handleFiles(e.target.files)}
      />

      <p className="mt-1.5 text-xs text-humo">
        Hasta {MAX_PHOTOS} fotos. La primera es la que se ve en el catálogo.
      </p>

      {error && (
        <p role="alert" className="mt-1.5 text-xs font-medium text-berry">
          {error}
        </p>
      )}
    </div>
  )
}
