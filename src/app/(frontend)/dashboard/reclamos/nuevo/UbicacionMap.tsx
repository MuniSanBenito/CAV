'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { IconMapPin, IconCurrentLocation } from '@tabler/icons-react'
import 'leaflet/dist/leaflet.css'
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import shadowUrl from 'leaflet/dist/images/marker-shadow.png'

interface Coords {
  lat: number
  lng: number
}

interface Props {
  value: Coords | null
  onChange: (coords: Coords | null) => void
  address: string
  onAddressChange: (address: string) => void
  onBarrioChange?: (barrio: string) => void
}

// San Benito, Entre Ríos center
const SAN_BENITO_CENTER: Coords = { lat: -31.7795, lng: -60.4414 }
const DEFAULT_ZOOM = 15

export default function UbicacionMap({
  value,
  onChange,
  address,
  onAddressChange,
  onBarrioChange,
}: Props) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const [mounted, setMounted] = useState(false)
  const LRef = useRef<typeof import('leaflet') | null>(null)

  // Keep stable refs to callbacks to avoid re-initializing map
  const onChangeRef = useRef(onChange)
  const onAddressChangeRef = useRef(onAddressChange)
  const onBarrioChangeRef = useRef(onBarrioChange)
  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])
  useEffect(() => {
    onAddressChangeRef.current = onAddressChange
  }, [onAddressChange])
  useEffect(() => {
    onBarrioChangeRef.current = onBarrioChange
  }, [onBarrioChange])

  // Reverse geocode
  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
      )
      const data = await res.json()
      if (data?.address) {
        const road = data.address.road || data.address.pedestrian || ''
        const houseNumber = data.address.house_number || ''
        const calleStr = `${road} ${houseNumber}`.trim()
        onAddressChangeRef.current(calleStr || data.display_name.split(', ')[0])

        // Intentar detectar barrio desde suburb / neighbourhood / city_district
        const barrioDetectado =
          data.address.suburb || data.address.neighbourhood || data.address.city_district || ''
        if (barrioDetectado && onBarrioChangeRef.current) {
          onBarrioChangeRef.current(barrioDetectado)
        }
      }
    } catch (err) {
      console.error('Error reverse geocoding:', err)
    }
  }, [])

  // Initialize map ONCE
  useEffect(() => {
    let cancelled = false

    async function init() {
      const L = await import('leaflet')

      // Fix default marker icon paths (assets bundled by Next, no CDN)
      delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: (iconRetinaUrl as { src: string }).src,
        iconUrl: (iconUrl as { src: string }).src,
        shadowUrl: (shadowUrl as { src: string }).src,
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

  function centerOnSanBenito() {
    if (mapRef.current) {
      mapRef.current.setView([SAN_BENITO_CENTER.lat, SAN_BENITO_CENTER.lng], DEFAULT_ZOOM)
    }
  }

  return (
    <div className="ubicacion-wrap">
      {/* Center button */}
      <div className="ubicacion-search-row">
        <button
          type="button"
          className="ubicacion-center-btn"
          onClick={centerOnSanBenito}
          title="Centrar en San Benito"
        >
          <IconCurrentLocation size={18} />
          <span className="text-sm">Centrar en San Benito</span>
        </button>
      </div>

      {/* Map container */}
      <div className="ubicacion-map-container">
        <div ref={mapContainerRef} className="ubicacion-map" />
      </div>

      {/* Coords display */}
      {value && (
        <div className="ubicacion-coords">
          <IconMapPin size={14} />
          <span>
            Lat: {value.lat.toFixed(6)}, Lng: {value.lng.toFixed(6)}
          </span>
        </div>
      )}
    </div>
  )
}
