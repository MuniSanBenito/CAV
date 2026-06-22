import { getPayload } from 'payload'
import config from '@payload-config'
import { NextRequest, NextResponse } from 'next/server'
import { getMongoCollection } from '@/lib/mongodb'
import { ObjectId } from 'bson'

const ALLOWED_ROLES = ['admin', 'carga', 'visualizador']
const MAX_RESULTS = 5000

type ReclamosCollection = {
  aggregate: (
    pipeline: Record<string, unknown>[],
    options?: Record<string, unknown>,
  ) => { toArray: () => Promise<unknown[]> }
}

export async function GET(request: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const { user } = await payload.auth({ headers: request.headers })

    if (!user || !ALLOWED_ROLES.includes(user.role as string)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = request.nextUrl
    const fechaDesde = searchParams.get('fechaDesde')
    const fechaHasta = searchParams.get('fechaHasta')
    const estado = searchParams.get('estado')
    const tipo = searchParams.get('tipo')
    const areaId = searchParams.get('areaId')

    const match: Record<string, unknown> = {}

    if (fechaDesde || fechaHasta) {
      const dateFilter: Record<string, Date> = {}
      if (fechaDesde) dateFilter.$gte = new Date(fechaDesde)
      if (fechaHasta) {
        const hasta = new Date(fechaHasta)
        hasta.setHours(23, 59, 59, 999)
        dateFilter.$lte = hasta
      }
      match.createdAt = dateFilter
    }

    if (estado) {
      const estados = estado.split(',').filter(Boolean)
      if (estados.length === 1) {
        match.estado = estados[0]
      } else if (estados.length > 1) {
        match.estado = { $in: estados }
      }
    }

    if (tipo) {
      const tipos = tipo.split(',').filter(Boolean)
      if (tipos.length === 1) {
        match.tipo = tipos[0]
      } else if (tipos.length > 1) {
        match.tipo = { $in: tipos }
      }
    }

    if (areaId) {
      try {
        match.area_derivada = new ObjectId(areaId)
      } catch {
        match.area_derivada = areaId
      }
    }

    const reclamosCol = getMongoCollection<ReclamosCollection>(payload, 'reclamos')

    const pipeline: Record<string, unknown>[] = [
      { $match: match },
      { $sort: { createdAt: -1 } },
      { $limit: MAX_RESULTS },
      {
        $lookup: {
          from: 'areas',
          localField: 'area_derivada',
          foreignField: '_id',
          as: '_area',
        },
      },
      { $unwind: { path: '$_area', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'conceptos-reclamo',
          localField: 'concepto',
          foreignField: '_id',
          as: '_concepto',
        },
      },
      { $unwind: { path: '$_concepto', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'contribuyentes',
          localField: 'contribuyente',
          foreignField: '_id',
          as: '_contribuyente',
        },
      },
      { $unwind: { path: '$_contribuyente', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          numero: 1,
          tipo: 1,
          estado: 1,
          prioridad: 1,
          createdAt: 1,
          'ubicacion.direccionIngresada': 1,
          'ubicacion.barrio': 1,
          area: '$_area.nombre',
          concepto: '$_concepto.nombre',
          contribuyenteNombre: {
            $concat: [
              { $ifNull: ['$_contribuyente.nombre', ''] },
              ' ',
              { $ifNull: ['$_contribuyente.apellido', ''] },
            ],
          },
          contribuyenteDni: '$_contribuyente.dni',
        },
      },
    ]

    const results = (await reclamosCol.aggregate(pipeline).toArray()) as Array<{
      _id: unknown
      numero: number
      tipo: string
      estado: string
      prioridad: string
      createdAt: string
      ubicacion?: { direccionIngresada?: string; barrio?: string }
      area?: string
      concepto?: string
      contribuyenteNombre?: string
      contribuyenteDni?: string
    }>

    const total = results.length
    const data = results.map((r) => ({
      numero: r.numero,
      fecha: r.createdAt ? new Date(r.createdAt).toLocaleDateString('es-AR') : '',
      tipo: r.tipo,
      estado: r.estado,
      prioridad: r.prioridad,
      area: r.area || '',
      concepto: r.concepto || '',
      contribuyente: (r.contribuyenteNombre || '').trim(),
      dni: r.contribuyenteDni || '',
      direccion: r.ubicacion?.direccionIngresada || '',
      barrio: r.ubicacion?.barrio || '',
    }))

    return NextResponse.json({ total, data })
  } catch (error) {
    console.error('Reportes endpoint error:', error)
    return NextResponse.json({ error: 'Error generando reporte' }, { status: 500 })
  }
}
