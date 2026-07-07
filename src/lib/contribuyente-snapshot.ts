import { getMongoCollection } from '@/lib/mongodb'
import type { Contribuyente } from '@/mi-sanbenito/types'
import type { Payload } from 'payload'

export interface ContribuyenteSnapshot {
  externoId: string
  numero_contribuyente?: number | null
  nombre?: string | null
  numero_documento?: string | null
  telefono_web?: string | null
  email?: string | null
  domicilio?: string | null
}

function isObjectIdLike(value: unknown): boolean {
  return (
    value != null &&
    typeof value === 'object' &&
    (value as { constructor?: { name?: string } }).constructor?.name === 'ObjectId'
  )
}

export function toContribuyenteSnapshot(contribuyente: Contribuyente): ContribuyenteSnapshot {
  return {
    externoId: contribuyente.id,
    numero_contribuyente: contribuyente.numero_contribuyente ?? null,
    nombre: contribuyente.nombre ?? null,
    numero_documento:
      contribuyente.numero_documento != null ? String(contribuyente.numero_documento) : null,
    telefono_web: contribuyente.telefono_web ?? null,
    email: contribuyente.email ?? null,
    domicilio: contribuyente.domicilio ?? null,
  }
}

function snapshotFromGroup(group: Record<string, unknown>): ContribuyenteSnapshot {
  const externoId = group.externoId ?? group.id
  return {
    externoId: externoId != null ? String(externoId) : 'desconocido',
    numero_contribuyente: group.numero_contribuyente as number | null | undefined,
    nombre: (group.nombre as string | null | undefined) ?? null,
    numero_documento: group.numero_documento != null ? String(group.numero_documento) : null,
    telefono_web: group.telefono_web as string | null | undefined,
    email: group.email as string | null | undefined,
    domicilio: group.domicilio as string | null | undefined,
  }
}

async function readLegacyContribuyenteId(
  payload: Payload,
  reclamoId: string,
): Promise<string | null> {
  const col = getMongoCollection<{
    findOne: (
      filter: { _id: string },
      options?: { projection: { contribuyente: 1 } },
    ) => Promise<{ contribuyente?: unknown } | null>
  }>(payload, 'reclamos')

  const raw = await col.findOne({ _id: reclamoId }, { projection: { contribuyente: 1 } })

  const rawContribuyente = raw?.contribuyente
  if (!rawContribuyente) return null

  if (typeof rawContribuyente === 'string') return rawContribuyente
  if (isObjectIdLike(rawContribuyente)) {
    return String(rawContribuyente)
  }

  return null
}

export async function normalizeContribuyenteForRead(
  contribuyente: unknown,
  reclamoId: string,
  payload: Payload,
): Promise<ContribuyenteSnapshot> {
  if (typeof contribuyente === 'string') {
    return { externoId: contribuyente, nombre: 'Contribuyente (legacy)' }
  }

  if (isObjectIdLike(contribuyente)) {
    const legacyId = await readLegacyContribuyenteId(payload, reclamoId)
    return {
      externoId: legacyId ?? 'legacy',
      nombre: 'Contribuyente (legacy)',
    }
  }

  if (contribuyente && typeof contribuyente === 'object') {
    const group = contribuyente as Record<string, unknown>
    const snapshot = snapshotFromGroup(group)
    if (!snapshot.externoId || snapshot.externoId === 'desconocido') {
      const legacyId = await readLegacyContribuyenteId(payload, reclamoId)
      if (legacyId) {
        snapshot.externoId = legacyId
      }
    }
    return snapshot
  }

  return { externoId: 'desconocido', nombre: 'Contribuyente (legacy)' }
}
