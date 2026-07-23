import 'server-only'

import type { Payload } from 'payload'
import { getMongoCollection } from '@/lib/mongodb'

export interface ReclamosStats {
  porEstado: {
    pendiente: number
    en_proceso: number
    resuelto: number
    rechazado: number
    total: number
  }
  porArea: { nombre: string; count: number }[]
  porBarrio: { nombre: string; count: number }[]
  porConcepto: { nombre: string; count: number }[]
  tiempoResolucion: { promedio: number; min: number; max: number }
  vencidos: number
}

const EMPTY_STATS: ReclamosStats = {
  porEstado: { pendiente: 0, en_proceso: 0, resuelto: 0, rechazado: 0, total: 0 },
  porArea: [],
  porBarrio: [],
  porConcepto: [],
  tiempoResolucion: { promedio: 0, min: 0, max: 0 },
  vencidos: 0,
}

type MongoCol = {
  aggregate: (pipeline: Record<string, unknown>[]) => { toArray: () => Promise<unknown[]> }
  countDocuments: (filter: Record<string, unknown>) => Promise<number>
}

/**
 * Calcula estadísticas de reclamos directamente desde MongoDB.
 * Usar server-side con una instancia de Payload ya inicializada.
 */
export async function getReclamosStats(payload: Payload): Promise<ReclamosStats> {
  try {
    const reclamosCol = getMongoCollection<MongoCol>(payload, 'reclamos')

    const [estadoResults, areaResults, barrioResults, conceptoResults, tiempoResolucion, vencidos] =
      await Promise.all([
        reclamosCol
          .aggregate([{ $group: { _id: '$estado', count: { $sum: 1 } } }])
          .toArray() as Promise<{ _id: string; count: number }[]>,
        reclamosCol
          .aggregate([
            {
              $lookup: {
                from: 'areas',
                localField: 'area_derivada',
                foreignField: '_id',
                as: 'area',
              },
            },
            { $unwind: { path: '$area', preserveNullAndEmptyArrays: true } },
            { $group: { _id: '$area.nombre', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 },
          ])
          .toArray() as Promise<{ _id: string; count: number }[]>,
        reclamosCol
          .aggregate([
            { $match: { 'ubicacion.barrio': { $exists: true, $ne: null } } },
            { $group: { _id: '$ubicacion.barrio', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 },
          ])
          .toArray() as Promise<{ _id: string; count: number }[]>,
        reclamosCol
          .aggregate([
            {
              $lookup: {
                from: 'conceptos-reclamo',
                localField: 'concepto',
                foreignField: '_id',
                as: 'concepto',
              },
            },
            { $unwind: { path: '$concepto', preserveNullAndEmptyArrays: true } },
            { $group: { _id: '$concepto.nombre', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 },
          ])
          .toArray() as Promise<{ _id: string; count: number }[]>,
        reclamosCol
          .aggregate([
            {
              $match: {
                estado: 'resuelto',
                fechaResolucion: { $exists: true },
                createdAt: { $exists: true },
              },
            },
            {
              $project: {
                dias: {
                  $divide: [
                    { $subtract: ['$fechaResolucion', '$createdAt'] },
                    1000 * 60 * 60 * 24,
                  ],
                },
              },
            },
            {
              $group: {
                _id: null,
                promedio: { $avg: '$dias' },
                min: { $min: '$dias' },
                max: { $max: '$dias' },
              },
            },
          ])
          .toArray() as Promise<{ _id: null; promedio: number; min: number; max: number }[]>,
        reclamosCol.countDocuments({
          estado: { $in: ['pendiente', 'en_proceso'] },
          fechaCompromiso: { $lt: new Date() },
        }),
      ])

    const stats: ReclamosStats = {
      porEstado: {
        pendiente: 0,
        en_proceso: 0,
        resuelto: 0,
        rechazado: 0,
        total: 0,
      },
      porArea: areaResults.map((r) => ({ nombre: r._id ?? 'Sin área', count: r.count })),
      porBarrio: barrioResults.map((r) => ({ nombre: r._id ?? 'Sin barrio', count: r.count })),
      porConcepto: conceptoResults.map((r) => ({
        nombre: r._id ?? 'Sin concepto',
        count: r.count,
      })),
      tiempoResolucion: tiempoResolucion[0] ?? { promedio: 0, min: 0, max: 0 },
      vencidos,
    }

    for (const r of estadoResults) {
      if (r._id && r._id in stats.porEstado) {
        ;(stats.porEstado as Record<string, number>)[r._id] = r.count
      }
      stats.porEstado.total += r.count
    }

    return stats
  } catch (error) {
    console.error('Stats helper error:', error)
    return EMPTY_STATS
  }
}
