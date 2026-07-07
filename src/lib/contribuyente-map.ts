import type { CreateContribuyenteInput } from '@/mi-sanbenito/client'

export interface LegacyContribuyenteBody {
  nombre?: string
  apellido?: string
  dni?: string
  telefono?: string
  email?: string
  direccion?: string
}

export function mapLegacyBodyToExternal(body: LegacyContribuyenteBody): {
  data: CreateContribuyenteInput
  error?: string
} {
  const nombreParts = [body.nombre?.trim(), body.apellido?.trim()].filter(Boolean)
  const nombre = nombreParts.join(' ').trim()

  if (!nombre) {
    return { data: {}, error: 'Nombre y apellido son obligatorios.' }
  }

  return {
    data: {
      nombre,
      numero_documento: body.dni?.trim() || undefined,
      telefono_web: body.telefono?.trim() || undefined,
      email: body.email?.trim() || undefined,
      domicilio: body.direccion?.trim() || undefined,
    },
  }
}

export function splitNombreApellido(nombre?: string | null): { nombre: string; apellido: string } {
  const parts = (nombre ?? '').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return { nombre: '', apellido: '' }
  if (parts.length === 1) return { nombre: parts[0], apellido: '' }
  return { nombre: parts[0], apellido: parts.slice(1).join(' ') }
}

export function buildContribuyenteSearchParams(query: string, limit = 10): URLSearchParams {
  const params = new URLSearchParams()
  params.set('limit', String(limit))
  params.set('where[or][0][nombre][contains]', query.trim())
  params.set('where[or][1][numero_documento][contains]', query.trim())

  if (/^\d+$/.test(query.trim())) {
    params.set('where[or][2][numero_contribuyente][equals]', query.trim())
  }

  return params
}
