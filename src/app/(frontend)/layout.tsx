import type { Metadata, Viewport } from 'next'
import { Outfit } from 'next/font/google'
import React from 'react'
import './styles.css'

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-outfit',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SERVER_URL || 'https://cav.sanbenito.gob.ar'),
  title: {
    default: 'CAV — San Benito',
    template: '%s | CAV San Benito',
  },
  description:
    'Centro de Atención al Vecino — Municipalidad de San Benito. Gestión interna de reclamos vecinales.',
  applicationName: 'CAV San Benito',
  authors: [{ name: 'Municipalidad de San Benito' }],
  creator: 'Municipalidad de San Benito',
  publisher: 'Municipalidad de San Benito',
  robots: { index: false, follow: false },
  manifest: '/manifest.json',
  appleWebApp: {
    title: 'CAV San Benito',
    capable: true,
    statusBarStyle: 'default',
  },
  openGraph: {
    type: 'website',
    locale: 'es_AR',
    url: '/',
    siteName: 'CAV — Municipalidad de San Benito',
    title: 'CAV — San Benito',
    description: 'Centro de Atención al Vecino — Municipalidad de San Benito',
    images: [
      {
        url: '/og-image.png',
        width: 1536,
        height: 672,
        alt: 'Municipalidad de San Benito',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CAV — San Benito',
    description: 'Centro de Atención al Vecino — Municipalidad de San Benito',
    images: ['/og-image.png'],
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#b6c544' },
    { media: '(prefers-color-scheme: dark)', color: '#076633' },
  ],
  width: 'device-width',
  initialScale: 1,
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="es" className={outfit.variable} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.getItem('cav-theme') === 'dark')
                  document.documentElement.setAttribute('data-theme', 'dark');
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body>
        <main>{children}</main>
      </body>
    </html>
  )
}
