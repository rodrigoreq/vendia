import type { Metadata, Viewport } from 'next'
import { Inter, Space_Grotesk } from 'next/font/google'
import { SessionProvider } from 'next-auth/react'
import './globals.css'

const inter = Inter({ variable: '--font-inter', subsets: ['latin'], display: 'swap' })
const spaceGrotesk = Space_Grotesk({
  variable: '--font-space-grotesk',
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'VendIA — Vende más, gana más',
  description:
    'Catálogo, prospectos y publicidad con IA para vendedores y comisionistas independientes.',
}

export const viewport: Viewport = {
  themeColor: '#241b3a',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="es" className={`${inter.variable} ${spaceGrotesk.variable} h-full antialiased`}>
      <body className="min-h-full">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  )
}
