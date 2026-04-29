import React from 'react'
import DashboardHome from './DashboardHome'
import { getCurrentUser, getPayloadClient } from '@/lib/auth'

interface RecentReclamo {
  id: string
  numero: number
  tipo: string
  estado: string
  createdAt: string
}

interface Stats {
  pendiente: number
  en_proceso: number
  resuelto: number
  rechazado: number
  total: number
}

async function getStats(): Promise<Stats> {
  const stats: Stats = { pendiente: 0, en_proceso: 0, resuelto: 0, rechazado: 0, total: 0 }
  try {
    const payload = await getPayloadClient()
    const db = payload.db
    const mongoose = (
      db as unknown as { connection: { db: { collection: (name: string) => unknown } } }
    ).connection.db
    const reclamosCol = mongoose.collection('reclamos') as {
      aggregate: (pipeline: Record<string, unknown>[]) => { toArray: () => Promise<unknown[]> }
    }
    const results = (await reclamosCol
      .aggregate([{ $group: { _id: '$estado', count: { $sum: 1 } } }])
      .toArray()) as { _id: string; count: number }[]

    for (const r of results) {
      if (r._id in stats) (stats as unknown as Record<string, number>)[r._id] = r.count
      stats.total += r.count
    }
  } catch (e) {
    console.error('Stats error', e)
  }
  return stats
}

async function getRecent(): Promise<RecentReclamo[]> {
  try {
    const payload = await getPayloadClient()
    const result = await payload.find({
      collection: 'reclamos',
      limit: 5,
      sort: '-createdAt',
      depth: 0,
      select: {
        numero: true,
        tipo: true,
        estado: true,
        createdAt: true,
      },
    })
    return result.docs.map((d) => ({
      id: String(d.id),
      numero: d.numero ?? 0,
      tipo: d.tipo ?? '',
      estado: d.estado ?? '',
      createdAt: d.createdAt ?? '',
    }))
  } catch (e) {
    console.error('Recent reclamos error', e)
    return []
  }
}

export default async function DashboardPage() {
  // user ya fue garantizado por el layout (admin/carga/visualizador)
  const [user, stats, recent] = await Promise.all([getCurrentUser(), getStats(), getRecent()])

  return (
    <DashboardHome
      user={{
        nombre: user?.nombre ?? '',
        apellido: user?.apellido ?? '',
        role: user?.role ?? '',
      }}
      stats={stats}
      recent={recent}
    />
  )
}
