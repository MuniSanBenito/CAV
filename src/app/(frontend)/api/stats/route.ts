import { getPayload } from 'payload'
import config from '@payload-config'
import { NextResponse } from 'next/server'

/**
 * Server-side stats endpoint.
 * Returns reclamo counts by estado using MongoDB aggregation
 * instead of fetching ALL documents and counting in the client.
 */
export async function GET() {
  try {
    const payload = await getPayload({ config })
    const db = payload.db
    const mongoose = (
      db as unknown as { connection: { db: { collection: (name: string) => unknown } } }
    ).connection.db
    const reclamosCol = mongoose.collection('reclamos') as {
      aggregate: (pipeline: Record<string, unknown>[]) => { toArray: () => Promise<unknown[]> }
    }

    const pipeline = [
      {
        $group: {
          _id: '$estado',
          count: { $sum: 1 },
        },
      },
    ]

    const results = (await reclamosCol.aggregate(pipeline).toArray()) as {
      _id: string
      count: number
    }[]

    const stats = {
      pendiente: 0,
      en_proceso: 0,
      resuelto: 0,
      rechazado: 0,
      total: 0,
    }

    for (const r of results) {
      if (r._id in stats) {
        ;(stats as Record<string, number>)[r._id] = r.count
      }
      stats.total += r.count
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Stats endpoint error:', error)
    return NextResponse.json(
      { error: 'Error fetching stats' },
      { status: 500 },
    )
  }
}
