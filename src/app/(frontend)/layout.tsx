import React from 'react'
import './styles.css'

export const metadata = {
  description: 'Centro de Atención al Vecino — Municipalidad de San Benito',
  title: 'CAV — San Benito',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="es">
      <body>
        <main>{children}</main>
      </body>
    </html>
  )
}
