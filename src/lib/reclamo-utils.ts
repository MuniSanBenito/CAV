import { ReclamoEjecutor } from '@/app/(frontend)/mis-reclamos/types'

export const TERMINAL_ESTADOS = ['resuelto', 'rechazado'] as const

export function isTerminalEstado(estado: string) {
  return TERMINAL_ESTADOS.includes(estado as (typeof TERMINAL_ESTADOS)[number])
}

export function getReclamoCoords(r: {
  coordenadas?: ReclamoEjecutor['coordenadas']
  ubicacion?: ReclamoEjecutor['ubicacion']
}): { lat: number; lng: number } | null {
  if (r.coordenadas?.lat != null && r.coordenadas?.lng != null) {
    return { lat: r.coordenadas.lat, lng: r.coordenadas.lng }
  }
  const loc = r.ubicacion?.location
  if (loc?.length === 2) return { lat: loc[1], lng: loc[0] }
  return null
}

export function getGoogleMapsUrl(lat: number, lng: number) {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
}

export function formatFechaRelativa(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''

  const now = Date.now()
  const diffMs = now - date.getTime()
  const diffMin = Math.floor(diffMs / 60_000)
  const diffHrs = Math.floor(diffMs / 3_600_000)
  const diffDays = Math.floor(diffMs / 86_400_000)

  if (diffMin < 1) return 'Hace un momento'
  if (diffMin < 60) return `Hace ${diffMin} min`
  if (diffHrs < 24) return `Hace ${diffHrs} h`
  if (diffDays < 7) return `Hace ${diffDays} días`

  return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function formatFechaLarga(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function getConceptoNombre(concepto: ReclamoEjecutor['concepto']): string | null {
  if (!concepto) return null
  if (typeof concepto === 'object' && concepto.nombre) return concepto.nombre
  return null
}

export function getAreaNombre(area: ReclamoEjecutor['area_derivada']): string | null {
  if (!area) return null
  if (typeof area === 'object' && area.nombre) return area.nombre
  return null
}

export function getContribuyenteNombre(
  contribuyente: ReclamoEjecutor['contribuyente'],
): string | null {
  if (!contribuyente || typeof contribuyente !== 'object') return null
  return `${contribuyente.nombre} ${contribuyente.apellido}`.trim()
}
