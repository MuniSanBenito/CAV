import { Outfit } from 'next/font/google'
import React from 'react'
import './styles.css'

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-outfit',
  display: 'swap',
})

export const metadata = {
  description: 'Centro de Atención al Vecino — Municipalidad de San Benito',
  title: 'CAV — San Benito',
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
