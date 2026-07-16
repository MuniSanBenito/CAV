import { Metadata } from 'next'
import EjecutorNuevoShell from './EjecutorNuevoShell'

export const metadata: Metadata = {
  title: 'Nuevo Reclamo',
  description: 'Cargar un nuevo reclamo en su área',
}

export default function MiAreaNuevoReclamoPage() {
  return <EjecutorNuevoShell />
}
