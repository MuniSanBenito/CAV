'use client'

import { compressImage } from '@/components/FotoUploader'
import ThemeToggle from '@/components/ThemeToggle'
import { getContribuyenteNombre, getReclamoCoords } from '@/lib/reclamo-utils'
import {
  IconAlertTriangle,
  IconArrowLeft,
  IconCamera,
  IconCheck,
  IconCircleCheck,
  IconClock,
  IconList,
  IconLogout,
  IconMap,
  IconMapPin,
  IconPlus,
  IconSearch,
  IconSend,
  IconX,
} from '@tabler/icons-react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useEffect, useRef, useState } from 'react'
import MisReclamoCard from './MisReclamoCard'
import MisReclamoDetailDrawer from './MisReclamoDetailDrawer'
import type { ReclamoEjecutor } from './types'

const MisReclamosMap = dynamic(() => import('./MisReclamosMap'), { ssr: false })

interface User {
  id: string
  nombre: string
  apellido: string
  role: string
  areas?: (string | { id: string; nombre: string })[]
}

interface Coordenadas {
  lat: number
  lng: number
}

type ViewMode = 'list' | 'map'

export default function MisReclamosClient() {
  const router = useRouter()

  const [user, setUser] = useState<User | null>(null)
  const [reclamos, setReclamos] = useState<ReclamoEjecutor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [searchTerm, setSearchTerm] = useState('')
  const [userCoords, setUserCoords] = useState<Coordenadas | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const update = () => setIsDesktop(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  const [detailReclamo, setDetailReclamo] = useState<ReclamoEjecutor | null>(null)
  const [selectedReclamo, setSelectedReclamo] = useState<ReclamoEjecutor | null>(null)
  const [resolving, setResolving] = useState(false)
  const [formEstado, setFormEstado] = useState('resuelto')
  const [formNota, setFormNota] = useState('')
  const [formFoto, setFormFoto] = useState<File | null>(null)
  const [formCoords, setFormCoords] = useState<Coordenadas | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchUserAndReclamos()
  }, [])

  const fetchUserAndReclamos = async () => {
    try {
      setLoading(true)
      const userRes = await fetch('/api/users/me', { credentials: 'include' })
      const userData = await userRes.json()

      if (!userData?.user) {
        setError('No estás autenticado.')
        return
      }

      const loggedUser = userData.user
      setUser(loggedUser)

      if (loggedUser.role !== 'ejecutor' && loggedUser.role !== 'admin') {
        setError('No tienes permisos para esta sección.')
        return
      }

      if (!loggedUser.areas || loggedUser.areas.length === 0) {
        setError('No tienes un área asignada para ver reclamos.')
        return
      }

      const areaIds = loggedUser.areas
        .map((a: string | { id: string }) => (typeof a === 'object' ? a.id : a))
        .join(',')

      const reclamosRes = await fetch(
        `/api/reclamos?where[area_derivada][in]=${areaIds}&sort=createdAt&limit=0&depth=2`,
        { credentials: 'include' },
      )
      const reclamosData = await reclamosRes.json()

      if (reclamosData.docs) {
        setReclamos(reclamosData.docs)
      }
    } catch (err) {
      console.error(err)
      setError('Error al cargar la información.')
    } finally {
      setLoading(false)
    }
  }

  const getDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLon = ((lon2 - lon1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  }

  const handleSortByProximity = () => {
    if (!navigator.geolocation) {
      alert('La geolocalización no es soportada por tu navegador.')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => alert('No se pudo obtener tu ubicación. Verifica los permisos.'),
    )
  }

  const captureResolutionLocation = () => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition((pos) => {
      setFormCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
    })
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const compressed = await compressImage(e.target.files[0])
      setFormFoto(compressed)
    }
  }

  const openDetail = (reclamo: ReclamoEjecutor) => setDetailReclamo(reclamo)
  const closeDetail = () => setDetailReclamo(null)

  const openResolution = (reclamo: ReclamoEjecutor) => {
    setSelectedReclamo(reclamo)
    setFormEstado('resuelto')
    setFormNota('')
    setFormFoto(null)
    setFormCoords(null)
  }

  const openResolutionFromDetail = (reclamo: ReclamoEjecutor) => {
    closeDetail()
    openResolution(reclamo)
  }

  const closeResolution = () => setSelectedReclamo(null)

  const submitResolution = async () => {
    if (!selectedReclamo || !user) return

    if (formEstado !== 'resuelto' && !formNota.trim()) {
      alert('Debes ingresar una nota si el reclamo no fue resuelto o fue rechazado.')
      return
    }

    try {
      setResolving(true)

      let fotoId = null
      if (formFoto) {
        const fd = new FormData()
        fd.append('file', formFoto)
        fd.append('alt', `Resolución #${selectedReclamo.numero}`)
        const uploadRes = await fetch('/api/media', { method: 'POST', body: fd })
        const uploadData = await uploadRes.json().catch(() => null)
        if (uploadData?.doc?.id) {
          fotoId = uploadData.doc.id
        } else {
          alert('No se pudo subir la foto. Intentá de nuevo.')
          setResolving(false)
          return
        }
      }

      let notaFinal = formNota.trim()
      if (formCoords) {
        notaFinal = `[GPS: ${formCoords.lat.toFixed(5)}, ${formCoords.lng.toFixed(5)}]\n${notaFinal}`
      }

      const fotosCargadas = selectedReclamo.fotos
        ? selectedReclamo.fotos.map((f) => (typeof f === 'object' ? f.id : f))
        : []
      if (fotoId) fotosCargadas.push(fotoId)

      const movimientoAdjuntos = fotoId ? [fotoId] : undefined

      const patchBody: Record<string, unknown> = {
        estado: formEstado,
        _nuevoMovimiento: {
          estado: formEstado,
          nota: notaFinal || 'Atención completada en sitio.',
          adjuntos: movimientoAdjuntos,
        },
        fotos: fotosCargadas,
      }

      if (formCoords) {
        patchBody.coordenadas = { lat: formCoords.lat, lng: formCoords.lng }
        patchBody.ubicacion = { location: [formCoords.lng, formCoords.lat] }
      }

      const patchRes = await fetch(`/api/reclamos/${selectedReclamo.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patchBody),
      })

      if (patchRes.ok) {
        await fetchUserAndReclamos()
        closeResolution()
      } else if (patchRes.status === 403) {
        const errData = await patchRes.json().catch(() => null)
        alert(
          errData?.errors?.[0]?.message || 'Este reclamo ya está cerrado y no puede modificarse.',
        )
        await fetchUserAndReclamos()
        closeResolution()
      } else {
        alert('Hubo un error al actualizar.')
      }
    } catch (err) {
      console.error(err)
      alert('Error de conexión.')
    } finally {
      setResolving(false)
    }
  }

  let displayedReclamos = [...reclamos]
  if (searchTerm) {
    const term = searchTerm.toLowerCase()
    displayedReclamos = displayedReclamos.filter((r) => {
      const contribNombre = getContribuyenteNombre(r.contribuyente)?.toLowerCase() || ''
      return (
        (r.calle || '').toLowerCase().includes(term) ||
        (r.ubicacion?.barrio || '').toLowerCase().includes(term) ||
        r.numero.toString().includes(term) ||
        (r.descripcion || '').toLowerCase().includes(term) ||
        contribNombre.includes(term)
      )
    })
  }
  if (userCoords) {
    displayedReclamos.sort((a, b) => {
      const coordsA = getReclamoCoords(a)
      const coordsB = getReclamoCoords(b)
      if (!coordsA) return 1
      if (!coordsB) return -1
      return (
        getDistanceKm(userCoords.lat, userCoords.lng, coordsA.lat, coordsA.lng) -
        getDistanceKm(userCoords.lat, userCoords.lng, coordsB.lat, coordsB.lng)
      )
    })
  }

  const listPanel = (
    <div className="mis-reclamos-list">
      <p className="mis-reclamos-count">
        {displayedReclamos.length} {displayedReclamos.length === 1 ? 'actividad' : 'actividades'}
        {userCoords && ' · Por cercanía'}
      </p>

      {displayedReclamos.length === 0 ? (
        <div className="mis-reclamos-empty">
          <IconCircleCheck size={56} strokeWidth={1.2} />
          <span>Todo al día</span>
        </div>
      ) : (
        <div className="mis-reclamos-cards">
          {displayedReclamos.map((reclamo) => (
            <MisReclamoCard
              key={reclamo.id}
              reclamo={reclamo}
              onOpenDetail={openDetail}
              onActuar={openResolution}
            />
          ))}
        </div>
      )}
    </div>
  )

  const mapPanel = (
    <MisReclamosMap
      reclamos={displayedReclamos}
      selectedReclamo={detailReclamo}
      isVisible={isDesktop || viewMode === 'map'}
      onMarkerClick={openDetail}
    />
  )

  if (loading) {
    return (
      <div className="mis-reclamos-loading">
        <span className="loading loading-spinner loading-lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="mis-reclamos-error-screen">
        <ThemeToggle
          variant="inline"
          className="mis-reclamos-theme-btn mis-reclamos-theme-btn--floating"
        />
        <IconAlertTriangle size={56} color="#ff6b6b" strokeWidth={1.5} />
        <h2 className="mis-reclamos-error-title">{error}</h2>
        {user?.role !== 'ejecutor' ? (
          <Link
            href="/dashboard"
            className="mis-reclamos-error-btn mis-reclamos-error-btn--primary"
          >
            Volver al Menú
          </Link>
        ) : (
          <button
            className="mis-reclamos-error-btn mis-reclamos-error-btn--secondary"
            onClick={async () => {
              await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
              })
              router.replace('/login')
            }}
          >
            Cerrar Sesión
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="mis-reclamos-layout">
      <div className="mis-reclamos-header">
        <div className="mis-reclamos-toprow">
          {user?.role !== 'ejecutor' ? (
            <Link href="/dashboard" className="mis-reclamos-back-btn" title="Volver al Dashboard">
              <IconArrowLeft size={20} />
            </Link>
          ) : (
            <button
              className="mis-reclamos-back-btn mis-reclamos-back-btn--danger"
              title="Cerrar Sesión"
              onClick={async () => {
                await fetch('/api/auth/logout', {
                  method: 'POST',
                  credentials: 'include',
                  headers: { 'Content-Type': 'application/json' },
                })
                router.replace('/login')
              }}
            >
              <IconLogout size={20} />
            </button>
          )}
          <h1 className="mis-reclamos-title">Mis Tareas</h1>
          <ThemeToggle variant="inline" />
        </div>

        <div className="mis-reclamos-toolbar">
          <div className="mis-reclamos-search-wrap">
            <IconSearch size={16} className="mis-reclamos-search-icon" />
            <input
              type="text"
              placeholder="Buscar reclamo..."
              className="mis-reclamos-search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            className={`mis-reclamos-icon-btn${userCoords ? ' mis-reclamos-icon-btn--active' : ''}`}
            onClick={handleSortByProximity}
            title="Ordenar por cercanía"
            type="button"
          >
            <IconMapPin size={20} />
          </button>
          <Link
            href="/mis-reclamos/nuevo"
            className="mis-reclamos-icon-btn mis-reclamos-icon-btn--primary"
            title="Nuevo Reclamo"
          >
            <IconPlus size={20} />
          </Link>
        </div>

        <div className="mis-reclamos-view-tabs" role="tablist" aria-label="Vista de tareas">
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === 'list'}
            className={`mis-reclamos-view-tab${viewMode === 'list' ? ' mis-reclamos-view-tab--active' : ''}`}
            onClick={() => setViewMode('list')}
          >
            <IconList size={16} />
            Lista
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === 'map'}
            className={`mis-reclamos-view-tab${viewMode === 'map' ? ' mis-reclamos-view-tab--active' : ''}`}
            onClick={() => setViewMode('map')}
          >
            <IconMap size={16} />
            Mapa
          </button>
        </div>
      </div>

      <div className="mis-reclamos-split">
        <div
          className={`mis-reclamos-split-list${viewMode === 'map' ? ' mis-reclamos-split-list--hidden-mobile' : ''}`}
        >
          {listPanel}
        </div>
        <div
          className={`mis-reclamos-split-map${viewMode === 'list' ? ' mis-reclamos-split-map--hidden-mobile' : ''}${detailReclamo || selectedReclamo ? ' mis-reclamos-split-map--behind-drawer' : ''}`}
        >
          {mapPanel}
        </div>
      </div>

      {detailReclamo && (
        <MisReclamoDetailDrawer
          reclamo={detailReclamo}
          onClose={closeDetail}
          onActuar={openResolutionFromDetail}
        />
      )}

      {selectedReclamo && (
        <div className="mis-reclamos-drawer-overlay">
          <div className="mis-reclamos-drawer-backdrop" onClick={closeResolution} />

          <div className="mis-reclamos-drawer">
            <div className="mis-reclamos-drawer-handle" />

            <div className="mis-reclamos-drawer-header">
              <h2 className="mis-reclamos-drawer-title">Ticket #{selectedReclamo.numero}</h2>
              <button className="mis-reclamos-drawer-close" onClick={closeResolution} type="button">
                <IconX size={18} />
              </button>
            </div>

            <div className="mis-reclamos-drawer-body">
              <div>
                <div className="mis-reclamos-drawer-section-label">Acción</div>
                <div className="mis-reclamos-estado-options">
                  <label
                    className={`mis-reclamos-estado-option${
                      formEstado === 'resuelto'
                        ? ' mis-reclamos-estado-option--resuelto-active'
                        : ''
                    }`}
                  >
                    <input
                      type="radio"
                      name="estado"
                      value="resuelto"
                      checked={formEstado === 'resuelto'}
                      onChange={() => setFormEstado('resuelto')}
                    />
                    <IconCircleCheck size={20} />
                    <span>Completado exitosamente</span>
                  </label>
                  <label
                    className={`mis-reclamos-estado-option${
                      formEstado === 'rechazado'
                        ? ' mis-reclamos-estado-option--rechazado-active'
                        : ''
                    }`}
                  >
                    <input
                      type="radio"
                      name="estado"
                      value="rechazado"
                      checked={formEstado === 'rechazado'}
                      onChange={() => setFormEstado('rechazado')}
                    />
                    <IconAlertTriangle size={20} />
                    <span>Rechazado / No procede</span>
                  </label>
                  <label
                    className={`mis-reclamos-estado-option${
                      formEstado === 'en_proceso'
                        ? ' mis-reclamos-estado-option--proceso-active'
                        : ''
                    }`}
                  >
                    <input
                      type="radio"
                      name="estado"
                      value="en_proceso"
                      checked={formEstado === 'en_proceso'}
                      onChange={() => setFormEstado('en_proceso')}
                    />
                    <IconClock size={20} />
                    <span>Programado / No resuelto aún</span>
                  </label>
                </div>
              </div>

              <div>
                <div className="mis-reclamos-drawer-section-label">Evidencia</div>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                <div className="mis-reclamos-evidence-grid">
                  <button
                    type="button"
                    className={`mis-reclamos-evidence-btn${formFoto ? ' mis-reclamos-evidence-btn--active' : ''}`}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {formFoto ? <IconCheck size={24} /> : <IconCamera size={24} />}
                    <span>{formFoto ? 'Foto cargada' : 'Tomar foto'}</span>
                  </button>
                  <button
                    type="button"
                    className={`mis-reclamos-evidence-btn${formCoords ? ' mis-reclamos-evidence-btn--active' : ''}`}
                    onClick={captureResolutionLocation}
                  >
                    {formCoords ? <IconCheck size={24} /> : <IconMapPin size={24} />}
                    <span>{formCoords ? 'GPS guardado' : 'Fijar GPS'}</span>
                  </button>
                </div>
              </div>

              <div style={{ paddingBottom: '8px' }}>
                <div className="mis-reclamos-nota-label">
                  <span>Nota Final</span>
                  {formEstado !== 'resuelto' && (
                    <span className="mis-reclamos-nota-required">Obligatorio</span>
                  )}
                </div>
                <textarea
                  className="mis-reclamos-nota-textarea"
                  placeholder="Detalles del trabajo u observaciones..."
                  value={formNota}
                  onChange={(e) => setFormNota(e.target.value)}
                />
              </div>
            </div>

            <div className="mis-reclamos-drawer-footer">
              <button
                type="button"
                className="mis-reclamos-submit-btn"
                onClick={submitResolution}
                disabled={resolving || (formEstado !== 'resuelto' && formNota.trim() === '')}
              >
                {resolving ? (
                  <span className="loading loading-spinner" style={{ width: 22, height: 22 }} />
                ) : (
                  <>
                    Registrar <IconSend size={18} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
