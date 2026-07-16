import { Metadata } from 'next'
import MisReclamosClient from './MisReclamosClient'

export const metadata: Metadata = {
  title: 'Mis Reclamos',
  description: 'Gestión de reclamos asignados a mi área',
}

export default function MisReclamosPage() {
  return <MisReclamosClient />
}
