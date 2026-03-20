import React from 'react'
import MisReclamosClient from './MisReclamosClient'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mis Reclamos | CAV',
  description: 'Gestión de reclamos asignados a mi área',
}

export default function MisReclamosPage() {
  return <MisReclamosClient />
}
