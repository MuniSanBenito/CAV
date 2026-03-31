/**
 * Geocodificación usando Nominatim (OpenStreetMap)
 * Gratuito, no requiere API key para uso moderado
 */

interface GeocodingResult {
  lat: number
  lng: number
  displayName: string
  address: {
    road?: string
    house_number?: string
    suburb?: string
    neighbourhood?: string
    city?: string
    town?: string
    village?: string
    state?: string
    country?: string
  }
}

export async function geocodeAddress(direccion: string): Promise<GeocodingResult | null> {
  try {
    // Bounding box aproximado de San Benito y alrededores (aprox 15km radio)
    // viewbox: minX, maxX, minY, maxY (lng, lat)
    const SAN_BENITO_BOUNDS = '-60.55,-60.33,-31.88,-31.68'

    // Agregar "San Benito, Entre Ríos, Argentina" para mejorar precisión
    const query = encodeURIComponent(`${direccion}, San Benito, Entre Ríos, Argentina`)

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${query}&format=json&addressdetails=1&limit=1&countrycodes=ar&viewbox=${SAN_BENITO_BOUNDS}&bounded=1`,
      {
        headers: {
          'User-Agent': 'CAV-SanBenito/1.0 (municipalidad@sanbenito.gob.ar)',
          'Accept-Language': 'es',
        },
      },
    )

    if (!response.ok) {
      console.error('Geocoding error:', response.statusText)
      return null
    }

    const data = await response.json()

    if (!data || data.length === 0) {
      console.warn('No geocoding results for:', direccion)
      return null
    }

    const result = data[0]

    return {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      displayName: result.display_name,
      address: result.address || {},
    }
  } catch (error) {
    console.error('Geocoding failed:', error)
    return null
  }
}

/**
 * Extrae el barrio/neighbourhood de la respuesta de geocodificación
 */
export function extractBarrio(address: GeocodingResult['address']): string | null {
  return address.suburb || address.neighbourhood || null
}

/**
 * Extrae la localidad de la respuesta de geocodificación
 */
export function extractLocalidad(address: GeocodingResult['address']): string | null {
  return address.city || address.town || address.village || null
}
