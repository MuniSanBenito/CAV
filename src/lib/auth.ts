import 'server-only'

import config from '@payload-config'
import { cookies } from 'next/headers'
import { getPayload } from 'payload'
import { cache } from 'react'

/**
 * Devuelve el usuario autenticado para la request actual.
 * Usa React.cache() para deduplicar la llamada entre layouts y páginas
 * dentro de la misma request server-side.
 */
export const getCurrentUser = cache(async () => {
  try {
    const payload = await getPayload({ config })
    const cookieStore = await cookies()
    const token = cookieStore.get('payload-token')?.value
    if (!token) return null

    const { user } = await payload.auth({
      headers: new Headers({ Cookie: `payload-token=${token}` }),
    })
    return user ?? null
  } catch {
    return null
  }
})

export const getPayloadClient = cache(async () => {
  return getPayload({ config })
})
