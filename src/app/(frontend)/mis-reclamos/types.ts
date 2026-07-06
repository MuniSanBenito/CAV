import type { Media } from '@/payload-types'

export interface AreaRef {
  id: string
  nombre: string
}

export interface ContribuyenteRef {
  id: string
  nombre: string
  apellido: string
  dni?: string | null
  telefono?: string | null
  email?: string | null
}

export interface ConceptoRef {
  id: string
  nombre: string
}

export interface UsuarioRef {
  id: string
  nombre: string
  apellido: string
}

export interface MovimientoReclamo {
  estado: string
  nota: string
  fecha: string
  adjuntos?: (string | Media)[] | null
  usuario?: string | UsuarioRef | null
  id?: string | null
}

export interface ReclamoEjecutor {
  id: string
  numero: number
  tipo: string
  estado: string
  prioridad: string
  medio?: string
  calle?: string | null
  descripcion: string
  createdAt: string
  fechaCompromiso?: string | null
  fechaResolucion?: string | null
  observaciones?: string | null
  coordenadas?: { lat?: number | null; lng?: number | null } | null
  ubicacion?: {
    direccionIngresada?: string | null
    direccionNormalizada?: string | null
    barrio?: string | null
    localidad?: string | null
    location?: [number, number] | null
  } | null
  contribuyente?: string | ContribuyenteRef | null
  concepto?: string | ConceptoRef | null
  area_derivada?: string | AreaRef | null
  fotos?: (string | Media)[] | null
  movimientos?: MovimientoReclamo[] | null
}
