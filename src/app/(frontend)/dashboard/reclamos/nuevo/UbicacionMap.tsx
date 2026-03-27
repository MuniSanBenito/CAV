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

  // Keep stable refs to callbacks to avoid re-initializing map
  const onChangeRef = useRef(onChange)
  const onAddressChangeRef = useRef(onAddressChange)
  useEffect(() => { onChangeRef.current = onChange }, [onChange])
  useEffect(() => { onAddressChangeRef.current = onAddressChange }, [onAddressChange])

  // Reverse geocode
  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
      const data = await res.json()
      if (data?.address) {
        const road = data.address.road || data.address.pedestrian || ''
        const houseNumber = data.address.house_number || ''
        const calleStr = `${road} ${houseNumber}`.trim()
        onAddressChangeRef.current(calleStr || data.display_name.split(', ')[0])
      }
    } catch (err) {
      console.error('Error reverse geocoding:', err)
    }
  }, [])

  // Initialize map ONCE
  useEffect(() => {
    let cancelled = false

    async function init() {
      // Load Leaflet CSS dynamically (reliable way)
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link')
        link.id = 'leaflet-css'
        link.rel = 'stylesheet'
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
        document.head.appendChild(link)
        // Wait a tick for styles to apply
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      const L = await import('leaflet')

      // Fix default marker icon paths
      delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      if (cancelled || !mapContainerRef.current) return
      LRef.current = L

      const initialCoords: [number, number] = value
        ? [value.lat, value.lng]
        : [SAN_BENITO_CENTER.lat, SAN_BENITO_CENTER.lng]

      const map = L.map(mapContainerRef.current, {
        center: initialCoords,
        zoom: DEFAULT_ZOOM,
        zoomControl: true,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map)

      // Place existing marker if value provided
      if (value) {
        const marker = L.marker([value.lat, value.lng], { draggable: true }).addTo(map)
        marker.on('dragend', () => {
          const pos = marker.getLatLng()
          onChangeRef.current({ lat: pos.lat, lng: pos.lng })
          reverseGeocode(pos.lat, pos.lng)
        })
        markerRef.current = marker
      }

      // Click to place/move marker
      map.on('click', (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng
        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng])
        } else {
          const marker = L.marker([lat, lng], { draggable: true }).addTo(map)
          marker.on('dragend', () => {
            const pos = marker.getLatLng()
            onChangeRef.current({ lat: pos.lat, lng: pos.lng })
            reverseGeocode(pos.lat, pos.lng)
          })
          markerRef.current = marker
        }
        onChangeRef.current({ lat, lng })
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
        markerRef.current = null
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Run only once on mount

  // Sync marker with external value changes (after mount)
  useEffect(() => {
    if (!mounted || !LRef.current || !mapRef.current) return
    if (value) {
      if (markerRef.current) {
        markerRef.current.setLatLng([value.lat, value.lng])
      } else {
        const L = LRef.current
        const marker = L.marker([value.lat, value.lng], { draggable: true }).addTo(mapRef.current)
        marker.on('dragend', () => {
          const pos = marker.getLatLng()
          onChangeRef.current({ lat: pos.lat, lng: pos.lng })
          reverseGeocode(pos.lat, pos.lng)
        })
        markerRef.current = marker
      }
      mapRef.current.setView([value.lat, value.lng], DEFAULT_ZOOM)
    }
  }, [value, mounted, reverseGeocode])

  const handleGeoSearch = useCallback(async () => {
    if (!address.trim() || !mapRef.current || !LRef.current) return
    setSearching(true)
    setSearchError('')

    try {
      // Try multiple strategies
      const tries = [
        `${address.trim()}, San Benito, Entre Ríos, Argentina`,
        `${address.trim().replace(/[0-9]/g, '').trim()}, San Benito, Entre Ríos, Argentina`,
        `${address.trim()}, Entre Ríos, Argentina`,
      ]

      let data: { lat: string; lon: string; display_name: string }[] = []
      for (const query of tries) {
        const q = encodeURIComponent(query)
        const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1&countrycodes=ar`)
        data = await res.json()
        if (data.length > 0) break
      }

      if (data.length > 0) {
        const lat = parseFloat(data[0].lat)
        const lng = parseFloat(data[0].lon)
        const L = LRef.current

        mapRef.current.setView([lat, lng], 17)

        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng])
        } else {
          const marker = L.marker([lat, lng], { draggable: true }).addTo(mapRef.current)
          marker.on('dragend', () => {
            const pos = marker.getLatLng()
            onChangeRef.current({ lat: pos.lat, lng: pos.lng })
            reverseGeocode(pos.lat, pos.lng)
          })
          markerRef.current = marker
        }

        onChangeRef.current({ lat, lng })
        reverseGeocode(lat, lng)
      } else {
        setSearchError('No se encontró la dirección. Intentá marcar en el mapa.')
      }
    } catch {
      setSearchError('Error al buscar la dirección.')
    } finally {
      setSearching(false)
    }
  }, [address, reverseGeocode])

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
            placeholder="Buscar calle o punto (Enter para buscar)"
            value={address}
            onChange={(e) => onAddressChange(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleGeoSearch() } }}
          />
          {searching && (
            <span
              className="loading loading-spinner loading-xs"
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }}
            />
          )}
        </div>
        <button type="button" className="ubicacion-search-btn" onClick={handleGeoSearch} title="Buscar dirección">
          <IconMapPin size={18} />
        </button>
        <button type="button" className="ubicacion-center-btn" onClick={centerOnSanBenito} title="Centrar en San Benito">
          <IconCurrentLocation size={18} />
        </button>
      </div>

      {searchError && (
        <div className="ubicacion-search-error">
          {searchError}
        </div>
      )}

      {/* Map container */}
      <div className="ubicacion-map-container">
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
