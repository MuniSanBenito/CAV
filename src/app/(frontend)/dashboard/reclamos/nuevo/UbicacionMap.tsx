'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { IconSearch, IconMapPin, IconCurrentLocation } from '@tabler/icons-react'

interface Coords {
  lat: number
  lng: number
}

interface Props {
  value: Coords | null
  onChange: (coords: Coords | null) => void
  address: string
  onAddressChange: (address: string) => void
}

// San Benito, Entre Ríos center
const SAN_BENITO_CENTER: Coords = { lat: -31.7795, lng: -60.4414 }
const DEFAULT_ZOOM = 15

export default function UbicacionMap({ value, onChange, address, onAddressChange }: Props) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const [searching, setSearching] = useState(false)
  const [mounted, setMounted] = useState(false)
  const LRef = useRef<typeof import('leaflet') | null>(null)

  const [searchError, setSearchError] = useState('')

  // Dynamic import of Leaflet (client-side only)
  useEffect(() => {
    let cancelled = false
    async function init() {
      const L = await import('leaflet')
      // Fix default marker icon
      delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      if (cancelled || !mapContainerRef.current) return
      LRef.current = L

      const map = L.map(mapContainerRef.current, {
        center: [value?.lat ?? SAN_BENITO_CENTER.lat, value?.lng ?? SAN_BENITO_CENTER.lng],
        zoom: DEFAULT_ZOOM,
        zoomControl: true,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map)

      // Reverse geocode function
      const reverseGeocode = async (lat: number, lng: number) => {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
          const data = await res.json()
          if (data && data.address) {
            const road = data.address.road || data.address.pedestrian || ''
            const houseNumber = data.address.house_number || ''
            const calleStr = `${road} ${houseNumber}`.trim()
            if (calleStr) {
              onAddressChange(calleStr)
            } else {
              // Fallback if no road found
              const parts = data.display_name.split(', ')
              onAddressChange(parts[0])
            }
          }
        } catch (error) {
          console.error("Error reverse geocoding:", error)
        }
      }

      // Place existing marker if value provided
      if (value) {
        const marker = L.marker([value.lat, value.lng], { draggable: true }).addTo(map)
        marker.on('dragend', () => {
          const pos = marker.getLatLng()
          onChange({ lat: pos.lat, lng: pos.lng })
          reverseGeocode(pos.lat, pos.lng)
        })
        markerRef.current = marker
      }

      // Click to place marker
      map.on('click', (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng
        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng])
        } else {
          const marker = L.marker([lat, lng], { draggable: true }).addTo(map)
          marker.on('dragend', () => {
            const pos = marker.getLatLng()
            onChange({ lat: pos.lat, lng: pos.lng })
            reverseGeocode(pos.lat, pos.lng)
          })
          markerRef.current = marker
        }
        onChange({ lat, lng })
        reverseGeocode(lat, lng)
      })

      mapRef.current = map
      setMounted(true)
    }
    init()
    return () => {
      cancelled = true
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onAddressChange, onChange])

  // Keep marker in sync with external value changes
  useEffect(() => {
    if (!mounted || !LRef.current || !mapRef.current) return
    if (value && markerRef.current) {
      markerRef.current.setLatLng([value.lat, value.lng])
    }
  }, [value, mounted])

const handleGeoSearch = useCallback(async () => {
  if (!address.trim() || !mapRef.current || !LRef.current) return
  setSearching(true)
  setSearchError('')

  try {
    // 1. Try exact string + San Benito + Entre Ríos
    let q = encodeURIComponent(`${address.trim()}, San Benito, Entre Ríos, Argentina`)
    let res = await fetch(`https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1&countrycodes=ar`)
    let data = await res.json()

    // 2. If no result, try stripping out numbers (often the cause of failure in Nominatim for small towns)
    if (!data || data.length === 0) {
      const stringWithoutNumbers = address.trim().replace(/[0-9]/g, '').trim()
      if (stringWithoutNumbers) {
        q = encodeURIComponent(`${stringWithoutNumbers}, San Benito, Entre Ríos, Argentina`)
        res = await fetch(`https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1&countrycodes=ar`)
        data = await res.json()
      }
    }
    
    // 3. Try just the raw string in Entre Ríos just in case Nominatim maps it differently
    if (!data || data.length === 0) {
      q = encodeURIComponent(`${address.trim()}, Entre Ríos, Argentina`)
      res = await fetch(`https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1&countrycodes=ar`)
      data = await res.json()
    }

    if (data && data.length > 0) {
      const lat = parseFloat(data[0].lat)
      const lng = parseFloat(data[0].lon)

      mapRef.current.setView([lat, lng], 17)

      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng])
      } else {
        const L = LRef.current
        const marker = L.marker([lat, lng], { draggable: true }).addTo(mapRef.current)

        marker.on('dragend', () => {
          const pos = marker.getLatLng()
          onChange({ lat: pos.lat, lng: pos.lng })
          reverseGeocodeGeoSearch(pos.lat, pos.lng)
        })

        markerRef.current = marker
      }

      onChange({ lat, lng })
      
      // Auto-fill address from search result if available
      // Just extract the part before San Benito
      const displayName = data[0].display_name || ''
      const parts = displayName.split(', ')
      // Nominatim returns e.g. "San Martin, San Benito..."
      // Or if it's just a point, it might be different. Let's do reverse geocode to be sure
      reverseGeocodeGeoSearch(lat, lng)
    } else {
      setSearchError('No se encontró la dirección.')
    }

  } catch {
    setSearchError('Error al buscar la dirección.')
  } finally {
    setSearching(false)
  }
}, [address, onChange, onAddressChange])

const reverseGeocodeGeoSearch = async (lat: number, lng: number) => {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
    const data = await res.json()
    if (data && data.address) {
      const road = data.address.road || data.address.pedestrian || ''
      const houseNumber = data.address.house_number || ''
      const calleStr = `${road} ${houseNumber}`.trim()
      if (calleStr) {
        onAddressChange(calleStr)
      } else {
        const parts = data.display_name.split(', ')
        onAddressChange(parts[0])
      }
    }
  } catch (error) {
    console.error("Error reverse geocoding:", error)
  }
}

  function centerOnSanBenito() {
    if (mapRef.current) {
      mapRef.current.setView([SAN_BENITO_CENTER.lat, SAN_BENITO_CENTER.lng], DEFAULT_ZOOM)
    }
  }

  return (
    <div className="ubicacion-wrap">
      {/* Search bar */}
      <div className="ubicacion-search-row">
        <div className="ubicacion-search-wrap">
          <IconSearch size={16} className="ubicacion-search-icon" />
          <input
            type="text"
            className="ubicacion-search-input"
            placeholder="Calle o punto de interés (o buscar en mapa...)"
            value={address}
            onChange={(e) => onAddressChange(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleGeoSearch() } }}
          />
          {searching && <span className="loading loading-spinner loading-xs" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }} />}
        </div>
        <button type="button" className="ubicacion-search-btn" onClick={handleGeoSearch} title="Buscar">
          <IconMapPin size={18} />
        </button>
        <button type="button" className="ubicacion-center-btn" onClick={centerOnSanBenito} title="Centrar en San Benito">
          <IconCurrentLocation size={18} />
        </button>
      </div>

      {searchError && (
        <div style={{ color: '#ff6b6b', fontSize: '0.8rem', marginBottom: '0.5rem', marginTop: '-0.25rem' }}>
          {searchError}
        </div>
      )}

      {/* Map */}
      <div className="ubicacion-map-container">
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <div ref={mapContainerRef} className="ubicacion-map" />
      </div>

      {/* Coords display */}
      {value && (
        <div className="ubicacion-coords">
          <IconMapPin size={14} />
          <span>Lat: {value.lat.toFixed(6)}, Lng: {value.lng.toFixed(6)}</span>
        </div>
      )}
    </div>
  )
}
