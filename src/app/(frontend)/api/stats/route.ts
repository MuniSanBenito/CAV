import { getPayload } from 'payload'
import config from '@payload-config'
import { NextRequest, NextResponse } from 'next/server'
import { getReclamosStats } from '@/lib/stats'

export const dynamic = 'force-dynamic'

/**
 * Server-side stats endpoint.
 * Returns reclamo counts by estado using MongoDB aggregation
 * instead of fetching ALL documents and counting in the client.
 */
export async function GET(request: NextRequest) {
  try {
    const payload = await getPayload({ config })

    const { user } = await payload.auth({ headers: request.headers })
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const stats = await getReclamosStats(payload)
    return NextResponse.json(stats)
  } catch (error) {
    console.error('Stats endpoint error:', error)
    return NextResponse.json(
      { error: 'Error fetching stats' },
      { status: 500 },
    )
  }
}
