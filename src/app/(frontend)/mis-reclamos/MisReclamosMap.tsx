'use client'

import type { ReclamoEjecutor } from '@/app/(frontend)/mis-reclamos/types'
import { ESTADO_MAP_COLORS, estadoLabel } from '@/lib/constants'
import { getReclamoCoords } from '@/lib/reclamo-utils'
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import shadowUrl from 'leaflet/dist/images/marker-shadow.png'
import 'leaflet/dist/leaflet.css'
import { useCallback, useEffect, useRef, useState } from 'react'

const SAN_BENITO_CENTER = { lat: -31.7795, lng: -60.4414 }
const DEFAULT_ZOOM = 14

interface Props {
  reclamos: ReclamoEjecutor[]
  selectedReclamo?: ReclamoEjecutor | null
  isVisible?: boolean
  onMarkerClick: (reclamo: ReclamoEjecutor) => void
}

export default function MisReclamosMap({
  reclamos,
  selectedReclamo,
  isVisible = true,
  onMarkerClick,
}: Props) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markersLayerRef = useRef<L.LayerGroup | null>(null)
  const LRef = useRef<typeof import('leaflet') | null>(null)
  const onMarkerClickRef = useRef(onMarkerClick)
  const [mounted, setMounted] = useState(false)

  onMarkerClickRef.current = onMarkerClick

  useEffect(() => {
    let cancelled = false

    async function init() {
      const L = await import('leaflet')

      delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: (iconRetinaUrl as { src: string }).src,
        iconUrl: (iconUrl as { src: string }).src,
        shadowUrl: (shadowUrl as { src: string }).src,
      })

      if (cancelled || !mapContainerRef.current) return
      LRef.current = L

      const map = L.map(mapContainerRef.current, {
        center: [SAN_BENITO_CENTER.lat, SAN_BENITO_CENTER.lng],
        zoom: DEFAULT_ZOOM,
        zoomControl: true,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 19,
      }).addTo(map)

      const markersLayer = L.layerGroup().addTo(map)
      markersLayerRef.current = markersLayer
      mapRef.current = map
      setMounted(true)
    }

    init()

    return () => {
      cancelled = true
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
        markersLayerRef.current = null
      }
    }
  }, [])

  const updateMarkers = useCallback(() => {
    if (!mounted || !LRef.current || !markersLayerRef.current) return

    const L = LRef.current
    markersLayerRef.current.clearLayers()

    const withCoords = reclamos
      .map((r) => ({ reclamo: r, coords: getReclamoCoords(r) }))
      .filter((item): item is { reclamo: ReclamoEjecutor; coords: { lat: number; lng: number } } =>
        Boolean(item.coords),
      )

    withCoords.forEach(({ reclamo, coords }) => {
      const color = ESTADO_MAP_COLORS[reclamo.estado] || '#6b7280'
      const isSelected = selectedReclamo?.numero === reclamo.numero

      const marker = L.circleMarker([coords.lat, coords.lng], {
        radius: isSelected ? 11 : 8,
        fillColor: color,
        color: isSelected ? '#b6c544' : '#fff',
        weight: isSelected ? 3 : 2,
        opacity: 1,
        fillOpacity: 0.9,
      })

      marker.on('click', () => onMarkerClickRef.current(reclamo))
      marker.addTo(markersLayerRef.current!)
    })
  }, [mounted, reclamos, selectedReclamo])

  useEffect(() => {
    updateMarkers()
  }, [updateMarkers])

  useEffect(() => {
    if (!selectedReclamo || !mapRef.current) return
    const coords = getReclamoCoords(selectedReclamo)
    if (coords) {
      mapRef.current.panTo([coords.lat, coords.lng])
    }
  }, [selectedReclamo])

  useEffect(() => {
    if (!isVisible || !mapRef.current) return
    const timer = setTimeout(() => {
      mapRef.current?.invalidateSize()
    }, 100)
    return () => clearTimeout(timer)
  }, [isVisible])

  const geoCount = reclamos.filter((r) => getReclamoCoords(r)).length

  return (
    <div className="mis-reclamos-map-panel">
      <div className="mis-reclamos-map-meta">
        {geoCount} de {reclamos.length} con ubicación
      </div>

      <div className="mapa-legend mapa-legend--compact">
        {Object.entries(ESTADO_MAP_COLORS).map(([key, color]) => (
          <div key={key} className="mapa-legend-item">
            <span className="mapa-legend-dot" style={{ background: color }} />
            <span>{estadoLabel[key]}</span>
          </div>
        ))}
      </div>

      <div className="mis-reclamos-map-container">
        <div ref={mapContainerRef} className="mis-reclamos-map-canvas" />
      </div>
    </div>
  )
}
