import React from 'react'
import { Outfit } from 'next/font/google'
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
    <html lang="es" className={outfit.variable}>
      <body>
        <main>{children}</main>
      </body>
    </html>
  )
}
