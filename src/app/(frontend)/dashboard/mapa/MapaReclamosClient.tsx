'use client'

import React, { useEffect, useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import { IconArrowLeft, IconFilter, IconCurrentLocation, IconRefresh } from '@tabler/icons-react'
import { estadoLabel, estadoBadgeClass, prioridadLabel, tipoLabel } from '@/lib/constants'
import AddressSearch from '@/components/AddressSearch'

interface Coords {
  lat: number
  lng: number
}

interface Reclamo {
  id: string
  numero: number
  tipo: string
  estado: string
  prioridad: string
  calle?: string
  descripcion: string
  coordenadas?: Coords
  createdAt: string
  area_derivada?: { id: string; nombre: string } | string
}

const SAN_BENITO_CENTER: Coords = { lat: -31.7795, lng: -60.4414 }
const DEFAULT_ZOOM = 14

const ESTADO_COLORS: Record<string, string> = {
  pendiente: '#f59e0b',
  en_proceso: '#3b82f6',
  resuelto: '#22c55e',
  rechazado: '#ef4444',
}

export default function MapaReclamosClient() {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markersLayerRef = useRef<L.LayerGroup | null>(null)
  const LRef = useRef<typeof import('leaflet') | null>(null)
  const [reclamos, setReclamos] = useState<Reclamo[]>([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  // Filters
  const [filterEstado, setFilterEstado] = useState('')
  const [filterTipo, setFilterTipo] = useState('')

  const fetchReclamos = async () => {
    setLoading(true)
    try {
      const res = await fetch(
        '/api/reclamos?limit=0&depth=1&select[numero]=true&select[tipo]=true&select[estado]=true&select[prioridad]=true&select[calle]=true&select[descripcion]=true&select[coordenadas]=true&select[area_derivada]=true&select[createdAt]=true',
        {
          credentials: 'include',
        },
      )
      const data = await res.json()
      if (data?.docs) {
        setReclamos(data.docs)
      }
    } catch {
      console.error('Error fetching reclamos for map')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReclamos()
  }, [])

  // Init map
  useEffect(() => {
    let cancelled = false

    async function init() {
      if (!document.getElementById('leaflet-css-mapa')) {
        const link = document.createElement('link')
        link.id = 'leaflet-css-mapa'
        link.rel = 'stylesheet'
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
        document.head.appendChild(link)
        await new Promise((resolve) => setTimeout(resolve, 150))
      }

      const L = await import('leaflet')

      delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      if (cancelled || !mapContainerRef.current) return
      LRef.current = L

      const map = L.map(mapContainerRef.current, {
        center: [SAN_BENITO_CENTER.lat, SAN_BENITO_CENTER.lng],
        zoom: DEFAULT_ZOOM,
        zoomControl: true,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
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

  // Update markers when reclamos or filters change
  const updateMarkers = useCallback(() => {
    if (!mounted || !LRef.current || !markersLayerRef.current) return

    const L = LRef.current
    markersLayerRef.current.clearLayers()

    let filtered = reclamos.filter((r) => r.coordenadas?.lat && r.coordenadas?.lng)
    if (filterEstado) {
      filtered = filtered.filter((r) => r.estado === filterEstado)
    }
    if (filterTipo) {
      filtered = filtered.filter((r) => r.tipo === filterTipo)
    }

    filtered.forEach((r) => {
      const color = ESTADO_COLORS[r.estado] || '#6b7280'
      const areaName = typeof r.area_derivada === 'object' ? r.area_derivada?.nombre : ''

      // Create colored circle marker
      const circleMarker = L.circleMarker([r.coordenadas!.lat, r.coordenadas!.lng], {
        radius: 8,
        fillColor: color,
        color: '#fff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.85,
      })

      circleMarker.bindPopup(`
        <div style="font-family:'Outfit',system-ui,sans-serif;min-width:200px">
          <div style="font-weight:600;font-size:15px;margin-bottom:6px">
            #${r.numero} — ${tipoLabel[r.tipo] || r.tipo}
          </div>
          <div style="display:flex;gap:6px;margin-bottom:8px">
            <span style="background:${color};color:#fff;padding:2px 8px;border-radius:10px;font-size:12px;font-weight:500">
              ${estadoLabel[r.estado] || r.estado}
            </span>
            <span style="background:#f3f4f6;color:#374151;padding:2px 8px;border-radius:10px;font-size:12px;font-weight:500">
              ${prioridadLabel[r.prioridad] || r.prioridad}
            </span>
          </div>
          ${r.calle ? `<div style="font-size:13px;color:#6b7280;margin-bottom:4px">📍 ${r.calle}</div>` : ''}
          ${areaName ? `<div style="font-size:13px;color:#6b7280;margin-bottom:4px">🏢 ${areaName}</div>` : ''}
          <div style="font-size:13px;color:#374151;margin-bottom:8px">${r.descripcion?.slice(0, 120)}${(r.descripcion?.length || 0) > 120 ? '…' : ''}</div>
          <a href="/dashboard/reclamos/${r.id}" style="color:#3b82f6;font-size:13px;font-weight:500;text-decoration:none">
            Ver detalle →
          </a>
        </div>
      `)

      circleMarker.addTo(markersLayerRef.current!)
    })
  }, [mounted, reclamos, filterEstado, filterTipo])

  useEffect(() => {
    updateMarkers()
  }, [updateMarkers])

  function centerMap() {
    if (mapRef.current) {
      mapRef.current.setView([SAN_BENITO_CENTER.lat, SAN_BENITO_CENTER.lng], DEFAULT_ZOOM)
    }
  }

  const geoCount = reclamos.filter((r) => r.coordenadas?.lat && r.coordenadas?.lng).length

  return (
    <div className="reclamos-page">
      {/* Header */}
      <div className="reclamos-header">
        <div>
          <h1 className="reclamos-title">Mapa de Reclamos</h1>
          <p className="reclamos-subtitle">
            {geoCount} de {reclamos.length} reclamos con geolocalización
          </p>
        </div>
        <Link href="/dashboard" className="dash-action-btn dash-action-btn--secondary">
          <IconArrowLeft size={18} />
          Dashboard
        </Link>
      </div>

      {/* Filter toolbar with address search */}
      <div className="reclamos-toolbar">
        <div className="reclamos-filters">
          {/* Buscador de dirección */}
          <div className="reclamos-filter-group" style={{ minWidth: '300px' }}>
            <AddressSearch
              placeholder="Buscar dirección en San Benito..."
              onSelect={(result) => {
                if (mapRef.current) {
                  mapRef.current.setView([result.lat, result.lng], 16)
                }
              }}
            />
          </div>

          <div className="reclamos-filter-group">
            <IconFilter size={16} />
            <select
              className="reclamos-filter-select"
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
            >
              <option value="">Todos los estados</option>
              <option value="pendiente">Pendiente</option>
              <option value="en_proceso">En Proceso</option>
              <option value="resuelto">Resuelto</option>
              <option value="rechazado">Rechazado</option>
            </select>
          </div>
          <div className="reclamos-filter-group">
            <select
              className="reclamos-filter-select"
              value={filterTipo}
              onChange={(e) => setFilterTipo(e.target.value)}
            >
              <option value="">Todos los tipos</option>
              <option value="reclamo">Reclamo</option>
              <option value="sugerencia">Sugerencia</option>
              <option value="denuncia">Denuncia</option>
              <option value="consulta">Consulta</option>
            </select>
          </div>
          <button
            className="reclamos-refresh-btn"
            onClick={centerMap}
            title="Centrar en San Benito"
          >
            <IconCurrentLocation size={18} />
          </button>
          <button className="reclamos-refresh-btn" onClick={fetchReclamos} title="Actualizar">
            <IconRefresh size={18} className={loading ? 'spin-animation' : ''} />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="mapa-legend">
        {Object.entries(ESTADO_COLORS).map(([key, color]) => (
          <div key={key} className="mapa-legend-item">
            <span className="mapa-legend-dot" style={{ background: color }} />
            <span>{estadoLabel[key]}</span>
          </div>
        ))}
      </div>

      {/* Map */}
      <div className="mapa-container">
        <div ref={mapContainerRef} className="mapa-full" />
        {loading && (
          <div className="mapa-loading-overlay">
            <span className="loading loading-spinner loading-lg" />
          </div>
        )}
      </div>
    </div>
  )
}
