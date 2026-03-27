'use client'

import React, { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import {
  IconSearch,
  IconMapPin,
  IconCamera,
  IconCheck,
  IconX,
  IconAlertTriangle,
  IconCircleCheck,
  IconLocation,
  IconArrowLeft,
  IconPlus,
  IconSend,
  IconClock,
} from '@tabler/icons-react'
import { estadoLabel, estadoBadgeClass, cardGlowClass } from '@/lib/constants'

interface User {
  id: string
  nombre: string
  apellido: string
  role: string
  area?: string | { id: string; nombre: string }
}

interface Coordenadas {
  lat: number
  lng: number
}

interface Reclamo {
  id: string
  numero: number
  tipo: string
  estado: string
  prioridad: string
  calle: string
  descripcion: string
  createdAt: string
  coordenadas?: Coordenadas
  movimientos?: any[]
  fotos?: any[]
}

// estadoLabel, estadoBadgeClass, cardGlowClass imported from @/lib/constants

export default function MisReclamosClient() {
  const [user, setUser] = useState<User | null>(null)
  const [reclamos, setReclamos] = useState<Reclamo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [userCoords, setUserCoords] = useState<Coordenadas | null>(null)

  // Resolución Modal
  const [selectedReclamo, setSelectedReclamo] = useState<Reclamo | null>(null)
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

      if (!loggedUser.area) {
        setError('No tienes un área asignada para ver reclamos.')
        return
      }

      const areaId = typeof loggedUser.area === 'object' ? loggedUser.area.id : loggedUser.area

      const reclamosRes = await fetch(
        `/api/reclamos?where[area_derivada][equals]=${areaId}&sort=createdAt&limit=0`,
        { credentials: 'include' }
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
      () => alert('No se pudo obtener tu ubicación. Verifica los permisos.')
    )
  }

  const captureResolutionLocation = () => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition((pos) => {
      setFormCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
    })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFormFoto(e.target.files[0])
    }
  }

  const openResolution = (reclamo: Reclamo) => {
    setSelectedReclamo(reclamo)
    setFormEstado('resuelto')
    setFormNota('')
    setFormFoto(null)
    setFormCoords(null)
  }

  const closeResolution = () => setSelectedReclamo(null)

  const submitResolution = async () => {
    if (!selectedReclamo || !user) return

    if (formEstado !== 'resuelto' && !formNota.trim()) {
      alert('Debes ingresar una nota si el reclamo no fue resuelto.')
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
        const uploadData = await uploadRes.json()
        if (uploadData.doc?.id) fotoId = uploadData.doc.id
      }

      let notaFinal = formNota.trim()
      if (formCoords) {
        notaFinal = `[GPS: ${formCoords.lat.toFixed(5)}, ${formCoords.lng.toFixed(5)}]\n${notaFinal}`
      }

      const fotosCargadas = selectedReclamo.fotos
        ? selectedReclamo.fotos.map((f: any) => f.id || f)
        : []
      if (fotoId) fotosCargadas.push(fotoId)

      const patchRes = await fetch(`/api/reclamos/${selectedReclamo.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          estado: formEstado,
          _nuevoMovimiento: {
            estado: formEstado,
            nota: notaFinal || 'Atención completada en sitio.',
          },
          fotos: fotosCargadas,
        }),
      })

      if (patchRes.ok) {
        // Refresh from server to get the authoritative movimientos
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

  // Filter & sort
  let displayedReclamos = [...reclamos]
  if (searchTerm) {
    const term = searchTerm.toLowerCase()
    displayedReclamos = displayedReclamos.filter(
      (r) =>
        (r.calle || '').toLowerCase().includes(term) ||
        r.numero.toString().includes(term) ||
        (r.descripcion || '').toLowerCase().includes(term)
    )
  }
  if (userCoords) {
    displayedReclamos.sort((a, b) => {
      if (!a.coordenadas?.lat || !b.coordenadas?.lat) return 0
      return (
        getDistanceKm(userCoords.lat, userCoords.lng, a.coordenadas.lat, a.coordenadas.lng) -
        getDistanceKm(userCoords.lat, userCoords.lng, b.coordenadas.lat, b.coordenadas.lng)
      )
    })
  }

  // ── Loading ──
  if (loading) {
    return (
      <div className="mis-reclamos-loading">
        <span className="loading loading-spinner loading-lg" />
      </div>
    )
  }

  // ── Error ──
  if (error) {
    return (
      <div className="mis-reclamos-error-screen">
        <IconAlertTriangle size={56} color="#ff6b6b" strokeWidth={1.5} />
        <h2 className="mis-reclamos-error-title">{error}</h2>
        {user?.role !== 'ejecutor' ? (
          <Link href="/dashboard" className="mis-reclamos-error-btn mis-reclamos-error-btn--primary">
            Volver al Menú
          </Link>
        ) : (
          <button
            className="mis-reclamos-error-btn mis-reclamos-error-btn--secondary"
            onClick={async () => {
              await fetch('/api/users/logout', { method: 'POST', credentials: 'include' })
              window.location.href = '/login'
            }}
          >
            Cerrar Sesión
          </button>
        )}
      </div>
    )
  }

  // ── Main ──
  return (
    <div className="mis-reclamos-layout">
      {/* HEADER */}
      <div className="mis-reclamos-header">
        <div className="mis-reclamos-toprow">
          {user?.role !== 'ejecutor' ? (
            <Link
              href="/dashboard"
              className="mis-reclamos-back-btn"
              title="Volver al Dashboard"
            >
              <IconArrowLeft size={20} />
            </Link>
          ) : (
            <button
              className="mis-reclamos-back-btn mis-reclamos-back-btn--danger"
              title="Cerrar Sesión"
              onClick={async () => {
                await fetch('/api/users/logout', { method: 'POST', credentials: 'include' })
                window.location.href = '/login'
              }}
            >
              <IconArrowLeft size={20} />
            </button>
          )}
          <h1 className="mis-reclamos-title">Mis Tareas</h1>
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
      </div>

      {/* LIST */}
      <div className="mis-reclamos-list">
        <p className="mis-reclamos-count">
          {displayedReclamos.length}{' '}
          {displayedReclamos.length === 1 ? 'actividad' : 'actividades'}
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
              <div key={reclamo.id} className="mis-reclamo-card">
                {/* Subtle glow based on state */}
                {cardGlowClass[reclamo.estado] && (
                  <div className={cardGlowClass[reclamo.estado]} />
                )}

                <div className="mis-reclamo-card-body">
                  <div className="mis-reclamo-card-toprow">
                    <span className="mis-reclamo-card-numero">#{reclamo.numero}</span>
                    <span className={`dash-badge ${estadoBadgeClass[reclamo.estado] || ''}`}>
                      {estadoLabel[reclamo.estado] || reclamo.estado}
                    </span>
                  </div>

                  <div className="mis-reclamo-card-tipo">{reclamo.tipo}</div>

                  <div className="mis-reclamo-card-address">
                    <IconLocation size={14} className="mis-reclamo-card-address-icon" />
                    <span>{reclamo.calle || 'Sin dirección específica'}</span>
                  </div>

                  {reclamo.descripcion && (
                    <p className="mis-reclamo-card-desc">{reclamo.descripcion}</p>
                  )}

                  <button
                    className="mis-reclamo-card-action-btn"
                    onClick={() => openResolution(reclamo)}
                  >
                    Actuar <IconArrowLeft size={15} style={{ transform: 'rotate(180deg)' }} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RESOLUTION DRAWER */}
      {selectedReclamo && (
        <div className="mis-reclamos-drawer-overlay">
          <div className="mis-reclamos-drawer-backdrop" onClick={closeResolution} />

          <div className="mis-reclamos-drawer">
            <div className="mis-reclamos-drawer-handle" />

            <div className="mis-reclamos-drawer-header">
              <h2 className="mis-reclamos-drawer-title">Ticket #{selectedReclamo.numero}</h2>
              <button className="mis-reclamos-drawer-close" onClick={closeResolution}>
                <IconX size={18} />
              </button>
            </div>

            <div className="mis-reclamos-drawer-body">
              {/* Estado */}
              <div>
                <div className="mis-reclamos-drawer-section-label">Acción</div>
                <div className="mis-reclamos-estado-options">
                  <label
                    className={`mis-reclamos-estado-option${
                      formEstado === 'resuelto' ? ' mis-reclamos-estado-option--resuelto-active' : ''
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
                      formEstado === 'en_proceso' ? ' mis-reclamos-estado-option--proceso-active' : ''
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

              {/* Evidencia */}
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
                    className={`mis-reclamos-evidence-btn${formFoto ? ' mis-reclamos-evidence-btn--active' : ''}`}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {formFoto ? <IconCheck size={24} /> : <IconCamera size={24} />}
                    <span>{formFoto ? 'Foto cargada' : 'Tomar foto'}</span>
                  </button>
                  <button
                    className={`mis-reclamos-evidence-btn${formCoords ? ' mis-reclamos-evidence-btn--active' : ''}`}
                    onClick={captureResolutionLocation}
                  >
                    {formCoords ? <IconCheck size={24} /> : <IconMapPin size={24} />}
                    <span>{formCoords ? 'GPS guardado' : 'Fijar GPS'}</span>
                  </button>
                </div>
              </div>

              {/* Nota */}
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
