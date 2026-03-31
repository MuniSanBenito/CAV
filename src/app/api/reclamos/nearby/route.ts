import { getPayload } from 'payload'
import config from '@payload-config'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/reclamos/nearby?lat=-31.7795&lng=-60.4414&radius=500
 * Busca reclamos dentro de un radio (metros) desde un punto
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const lat = parseFloat(searchParams.get('lat') || '')
    const lng = parseFloat(searchParams.get('lng') || '')
    const radius = parseInt(searchParams.get('radius') || '500', 10) // default 500m

    // Validación de parámetros
    if (isNaN(lat) || isNaN(lng) || isNaN(radius)) {
      return NextResponse.json(
        { error: 'Parámetros inválidos. Se requiere lat, lng y radius numéricos' },
        { status: 400 },
      )
    }

    if (radius > 10000) {
      return NextResponse.json(
        { error: 'Radio máximo permitido: 10000 metros (10km)' },
        { status: 400 },
      )
    }

    const payload = await getPayload({ config })

    // Acceso directo a MongoDB para query geoespacial con $near
    const db = payload.db
    const mongoose = (
      db as unknown as { connection: { db: { collection: (name: string) => unknown } } }
    ).connection.db
    const reclamosCollection = mongoose.collection('reclamos') as {
      find: (query: unknown, options?: unknown) => Promise<unknown[]>
      findOne: (query: unknown) => Promise<unknown | null>
    }

    // Query usando índice geoespacial 2dsphere directamente en MongoDB
    const docs = (await reclamosCollection.find(
      {
        'ubicacion.location': {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [lng, lat],
            },
            $maxDistance: radius,
          },
        },
      },
      {
        limit: 100,
      },
    )) as Array<{
      id: string
      _id: string
      numero?: number
      ubicacion?: {
        location?: { coordinates: [number, number] }
        direccionIngresada?: string
        direccionNormalizada?: string
        barrio?: string
      }
      [key: string]: unknown
    }>

    // Agregar distancia calculada a cada resultado (aproximada)
    const reclamosConDistancia = docs.map((doc: (typeof docs)[0]) => {
      const location = doc.ubicacion?.location as { coordinates: [number, number] } | undefined
      let distancia = null

      if (location?.coordinates) {
        const [docLng, docLat] = location.coordinates
        distancia = calcularDistanciaHaversine(lat, lng, docLat, docLng)
      }

      return {
        ...doc,
        distanciaMetros: Math.round(distancia || 0),
      }
    })

    // Ordenar por distancia
    reclamosConDistancia.sort(
      (a: (typeof reclamosConDistancia)[0], b: (typeof reclamosConDistancia)[0]) =>
        (a.distanciaMetros || 0) - (b.distanciaMetros || 0),
    )

    return NextResponse.json({
      docs: reclamosConDistancia,
      totalDocs: docs.length,
      meta: {
        lat,
        lng,
        radius,
      },
    })
  } catch (error) {
    console.error('Error en nearby search:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

/**
 * Fórmula de Haversine para calcular distancia entre dos coordenadas
 * Retorna distancia en metros
 */
function calcularDistanciaHaversine(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371e3 // Radio de la Tierra en metros
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lng2 - lng1) * Math.PI) / 180

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}
