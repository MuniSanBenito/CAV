import { Metadata } from 'next'
import EjecutorNuevoShell from './EjecutorNuevoShell'

export const metadata: Metadata = {
  title: 'Nuevo Reclamo | Mis Tareas',
  description: 'Cargar un nuevo reclamo en su área',
}

export default function MiAreaNuevoReclamoPage() {
  return <EjecutorNuevoShell />
}
