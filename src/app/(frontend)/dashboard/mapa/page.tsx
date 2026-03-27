'use client'

import dynamic from 'next/dynamic'

const MapaReclamosClient = dynamic(() => import('./MapaReclamosClient'), { ssr: false })

export default function MapaPage() {
  return <MapaReclamosClient />
}
