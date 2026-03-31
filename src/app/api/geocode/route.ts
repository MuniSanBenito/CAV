import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/geocode?q=San Martín 123
 * Geocodifica una dirección usando Nominatim (OpenStreetMap)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    if (!query || query.trim().length < 3) {
      return NextResponse.json({ error: 'Query debe tener al menos 3 caracteres' }, { status: 400 })
    }

    // Bounding box aproximado de San Benito y alrededores (aprox 15km radio)
    const SAN_BENITO_BOUNDS = '-60.55,-60.33,-31.88,-31.68'

    // Llamar a Nominatim con contexto de San Benito, restringido a Argentina y bounding box
    const searchQuery = encodeURIComponent(`${query}, San Benito, Entre Ríos, Argentina`)

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${searchQuery}&format=json&addressdetails=1&limit=5&countrycodes=ar&viewbox=${SAN_BENITO_BOUNDS}&bounded=1`,
      {
        headers: {
          'User-Agent': 'CAV-SanBenito/1.0 (municipalidad@sanbenito.gob.ar)',
          'Accept-Language': 'es',
        },
      },
    )

    if (!response.ok) {
      return NextResponse.json({ error: 'Error en servicio de geocodificación' }, { status: 503 })
    }

    const data = await response.json()

    // Transformar resultado para el frontend
    const results = data.map(
      (item: {
        place_id: number
        display_name: string
        lat: string
        lon: string
        address?: {
          road?: string
          house_number?: string
          suburb?: string
          neighbourhood?: string
          city?: string
          town?: string
        }
      }) => ({
        placeId: item.place_id,
        displayName: item.display_name,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        address: {
          street: item.address?.road || '',
          houseNumber: item.address?.house_number || '',
          suburb: item.address?.suburb || item.address?.neighbourhood || '',
          city: item.address?.city || item.address?.town || 'San Benito',
        },
      }),
    )

    return NextResponse.json({
      query: query.trim(),
      results,
    })
  } catch (error) {
    console.error('Error en geocoding:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
