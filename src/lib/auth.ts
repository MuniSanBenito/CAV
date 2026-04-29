import 'server-only'
import { cache } from 'react'
import { headers as nextHeaders } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'

/**
 * Devuelve el usuario autenticado para la request actual.
 * Usa React.cache() para deduplicar la llamada entre layouts y páginas
 * dentro de la misma request server-side.
 */
export const getCurrentUser = cache(async () => {
  try {
    const payload = await getPayload({ config })
    const { user } = await payload.auth({ headers: await nextHeaders() })
    return user
  } catch {
    return null
  }
})

export const getPayloadClient = cache(async () => {
  return getPayload({ config })
})
