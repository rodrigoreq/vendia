import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    // Las fotos de producto viven en Vercel Blob, que sirve desde
    // <id>.public.blob.vercel-storage.com. Se restringe a ese patrón en
    // lugar de abrir cualquier host remoto.
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
      },
    ],
  },
}

export default nextConfig
