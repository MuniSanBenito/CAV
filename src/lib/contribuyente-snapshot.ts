import { getMongoCollection } from '@/lib/mongodb'
import { getContribuyenteById } from '@/mi-sanbenito/client'
import type { Contribuyente } from '@/mi-sanbenito/types'
import type { PayloadRequest } from 'payload'

export interface ContribuyenteSnapshot {
  externoId: string
  numero_contribuyente?: number | null
  nombre?: string | null
  numero_documento?: string | null
  telefono_web?: string | null
  email?: string | null
  domicilio?: string | null
}

type ContribuyenteCache = Map<string, ContribuyenteSnapshot>

function isObjectIdLike(value: unknown): boolean {
  return (
    value != null &&
    typeof value === 'object' &&
    (value as { constructor?: { name?: string } }).constructor?.name === 'ObjectId'
  )
}

function extractExternoId(contribuyente: unknown): string | null {
  if (typeof contribuyente === 'string') return contribuyente

  if (isObjectIdLike(contribuyente)) {
    return String(contribuyente)
  }

  if (contribuyente && typeof contribuyente === 'object') {
    const group = contribuyente as Record<string, unknown>
    if (group.externoId != null && String(group.externoId).trim()) {
      return String(group.externoId)
    }
    if (group.id != null && String(group.id).trim()) {
      return String(group.id)
    }
  }

  return null
}

function toHydratedSnapshot(contribuyente: Contribuyente): ContribuyenteSnapshot {
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

function unavailableSnapshot(externoId: string): ContribuyenteSnapshot {
  return {
    externoId,
    nombre: 'Contribuyente no disponible',
  }
}

function legacySnapshot(externoId: string): ContribuyenteSnapshot {
  return {
    externoId,
    nombre: 'Contribuyente (legacy)',
  }
}

function getCache(req: PayloadRequest): ContribuyenteCache {
  if (!req.context.contribuyenteCache) {
    req.context.contribuyenteCache = new Map<string, ContribuyenteSnapshot>()
  }
  return req.context.contribuyenteCache as ContribuyenteCache
}

async function readLegacyContribuyenteId(
  req: PayloadRequest,
  reclamoId: string,
): Promise<string | null> {
  const col = getMongoCollection<{
    findOne: (
      filter: { _id: string },
      options?: { projection: { contribuyente: 1 } },
    ) => Promise<{ contribuyente?: unknown } | null>
  }>(req.payload, 'reclamos')

  const raw = await col.findOne({ _id: reclamoId }, { projection: { contribuyente: 1 } })
  const rawContribuyente = raw?.contribuyente
  if (!rawContribuyente) return null

  if (typeof rawContribuyente === 'string') return rawContribuyente
  if (isObjectIdLike(rawContribuyente)) return String(rawContribuyente)

  return null
}

async function fetchContribuyenteSnapshot(
  externoId: string,
  req: PayloadRequest,
): Promise<ContribuyenteSnapshot> {
  const cache = getCache(req)
  const cached = cache.get(externoId)
  if (cached) return cached

  try {
    const { doc } = await getContribuyenteById(externoId)
    if (!doc?.id) {
      const fallback = unavailableSnapshot(externoId)
      cache.set(externoId, fallback)
      return fallback
    }
    const snapshot = toHydratedSnapshot(doc)
    cache.set(externoId, snapshot)
    return snapshot
  } catch {
    const fallback = unavailableSnapshot(externoId)
    cache.set(externoId, fallback)
    return fallback
  }
}

export async function hydrateContribuyenteForRead(
  contribuyente: unknown,
  reclamoId: string,
  req: PayloadRequest,
): Promise<ContribuyenteSnapshot> {
  let externoId = extractExternoId(contribuyente)

  if (!externoId || externoId === 'desconocido') {
    const legacyId = await readLegacyContribuyenteId(req, reclamoId)
    if (legacyId) {
      externoId = legacyId
    }
  }

  if (!externoId) {
    return { externoId: 'desconocido', nombre: 'Contribuyente (legacy)' }
  }

  if (externoId === 'legacy' || externoId === 'desconocido') {
    return legacySnapshot(externoId)
  }

  return fetchContribuyenteSnapshot(externoId, req)
}

/** @deprecated Use { externoId } when creating reclamos */
export function toContribuyenteSnapshot(contribuyente: Contribuyente): ContribuyenteSnapshot {
  return toHydratedSnapshot(contribuyente)
}
