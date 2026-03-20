'use client'

import React, { useState, useEffect, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import {
  IconArrowLeft,
  IconSend,
  IconAlertCircle,
  IconCircleCheck,
  IconHash,
  IconCategory,
  IconMessage,
  IconBuildingCommunity,
  IconMapPin,
} from '@tabler/icons-react'
import ContribuyenteSearch from './ContribuyenteSearch'

// Dynamic import for Leaflet map (SSR-safe)
const UbicacionMap = dynamic(() => import('./UbicacionMap'), { ssr: false })

interface Area {
  id: string
  nombre: string
}

interface Contribuyente {
  id: string
  nombre: string
  apellido: string
  dni: string
  telefono?: string
  email?: string
  direccion?: string
}

interface Coords {
  lat: number
  lng: number
}

interface UserInfo {
  id: string
  nombre: string
  apellido: string
  role: string
  area?: { id: string; nombre: string } | string
}

export default function NuevoReclamoForm() {
  const router = useRouter()
  const [user, setUser] = useState<UserInfo | null>(null)
  const [areas, setAreas] = useState<Area[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [createdNumero, setCreatedNumero] = useState<number | null>(null)

  // Form state
  const [contribuyente, setContribuyente] = useState<Contribuyente | null>(null)
  const [tipo, setTipo] = useState('reclamo')
  const [descripcion, setDescripcion] = useState('')
  const [medio, setMedio] = useState('presencial')
  const [prioridad, setPrioridad] = useState('media')
  const [areaDerivada, setAreaDerivada] = useState('')
  const [calle, setCalle] = useState('')
  const [coordenadas, setCoordenadas] = useState<Coords | null>(null)
  const [observaciones, setObservaciones] = useState('')

  useEffect(() => {
    Promise.all([
      fetch('/api/users/me', { credentials: 'include' }).then((r) => r.json()),
      fetch('/api/areas?limit=100&where[activa][equals]=true', { credentials: 'include' }).then((r) => r.json()),
    ])
      .then(([userData, areasData]) => {
        if (userData?.user) setUser(userData.user)
        if (areasData?.docs) setAreas(areasData.docs)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Derive area_receptora from user
  const areaReceptoraId = user?.area
    ? typeof user.area === 'string'
      ? user.area
      : user.area.id
    : ''
  const areaReceptoraNombre = user?.area
    ? typeof user.area === 'string'
      ? areas.find((a) => a.id === user.area)?.nombre || '—'
      : user.area.nombre
    : 'Sin área asignada'

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    if (!contribuyente) {
      setError('Seleccioná un contribuyente.')
      return
    }
    if (!descripcion.trim()) {
      setError('La descripción es obligatoria.')
      return
    }
    if (!areaDerivada) {
      setError('Seleccioná el área a la que se deriva.')
      return
    }

    setSubmitting(true)
    try {
      const body: Record<string, unknown> = {
        contribuyente: contribuyente.id,
        tipo,
        descripcion: descripcion.trim(),
        medio,
        prioridad,
        area_receptora: areaReceptoraId || undefined,
        area_derivada: areaDerivada,
        estado: 'pendiente',
        calle: calle.trim() || undefined,
        observaciones: observaciones.trim() || undefined,
      }
      if (coordenadas) {
        body.coordenadas = { lat: coordenadas.lat, lng: coordenadas.lng }
      }

      const res = await fetch('/api/reclamos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.errors?.[0]?.message || 'Error al crear el reclamo.')
      }

      const data = await res.json()
      setCreatedNumero(data.doc?.numero ?? null)
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="dash-loading">
        <span className="loading loading-spinner loading-lg" />
      </div>
    )
  }

  if (success) {
    return (
      <div className="nuevo-success-page">
        <div className="nuevo-success-card">
          <IconCircleCheck size={56} stroke={1.5} />
          <h2>Reclamo creado exitosamente</h2>
          {createdNumero && <p className="nuevo-success-numero">Nº {createdNumero}</p>}
          <div className="nuevo-success-actions">
            <button className="dash-action-btn dash-action-btn--secondary" onClick={() => router.push('/dashboard/reclamos')}>
              Ver Reclamos
            </button>
            <button className="dash-action-btn dash-action-btn--primary" onClick={() => { setSuccess(false); setContribuyente(null); setDescripcion(''); setCalle(''); setCoordenadas(null); setObservaciones(''); setCreatedNumero(null) }}>
              Cargar otro
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="nuevo-reclamo-page">
      {/* Header */}
      <div className="nuevo-header">
        <button type="button" className="nuevo-back-btn" onClick={() => router.push('/dashboard/reclamos')}>
          <IconArrowLeft size={20} />
          Volver
        </button>
        <div>
          <h1 className="nuevo-title">Nuevo Reclamo</h1>
          <p className="nuevo-subtitle">Completá los datos para dar de alta un nuevo reclamo</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="nuevo-form">
        {error && (
          <div className="modal-error">
            <IconAlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Section: Contribuyente */}
        <div className="nuevo-section">
          <div className="nuevo-section-header">
            <IconCategory size={20} stroke={1.5} />
            <span>Contribuyente</span>
          </div>
          <ContribuyenteSearch value={contribuyente} onChange={setContribuyente} />
        </div>

        {/* Section: Clasificación */}
        <div className="nuevo-section">
          <div className="nuevo-section-header">
            <IconHash size={20} stroke={1.5} />
            <span>Clasificación</span>
          </div>
          <div className="nuevo-row-3">
            <div className="modal-field">
              <label className="modal-label" htmlFor="nuevo-tipo">Tipo <span className="modal-required">*</span></label>
              <select id="nuevo-tipo" className="modal-select" value={tipo} onChange={(e) => setTipo(e.target.value)}>
                <option value="reclamo">Reclamo</option>
                <option value="sugerencia">Sugerencia</option>
                <option value="denuncia">Denuncia</option>
                <option value="consulta">Consulta</option>
              </select>
            </div>
            <div className="modal-field">
              <label className="modal-label" htmlFor="nuevo-medio">Medio <span className="modal-required">*</span></label>
              <select id="nuevo-medio" className="modal-select" value={medio} onChange={(e) => setMedio(e.target.value)}>
                <option value="presencial">Presencial</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="correo">Correo</option>
                <option value="calle">Calle</option>
                <option value="otro">Otro</option>
              </select>
            </div>
            <div className="modal-field">
              <label className="modal-label" htmlFor="nuevo-prioridad">Prioridad</label>
              <select id="nuevo-prioridad" className="modal-select" value={prioridad} onChange={(e) => setPrioridad(e.target.value)}>
                <option value="baja">Baja</option>
                <option value="media">Media</option>
                <option value="alta">Alta</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section: Áreas */}
        <div className="nuevo-section">
          <div className="nuevo-section-header">
            <IconBuildingCommunity size={20} stroke={1.5} />
            <span>Áreas</span>
          </div>
          <div className="modal-row">
            <div className="modal-field">
              <label className="modal-label">Área Receptora</label>
              <div className="nuevo-area-readonly">
                {areaReceptoraNombre}
              </div>
            </div>
            <div className="modal-field">
              <label className="modal-label" htmlFor="nuevo-area-derivada">Área Derivada <span className="modal-required">*</span></label>
              <select id="nuevo-area-derivada" className="modal-select" value={areaDerivada} onChange={(e) => setAreaDerivada(e.target.value)}>
                <option value="">Seleccionar área...</option>
                {areas.map((a) => (
                  <option key={a.id} value={a.id}>{a.nombre}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section: Descripción */}
        <div className="nuevo-section">
          <div className="nuevo-section-header">
            <IconMessage size={20} stroke={1.5} />
            <span>Descripción</span>
          </div>
          <div className="modal-field">
            <textarea
              id="nuevo-descripcion"
              className="modal-textarea"
              rows={4}
              placeholder="Descripción detallada del reclamo, sugerencia, denuncia o consulta..."
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
            />
          </div>
          <div className="modal-field">
            <label className="modal-label" htmlFor="nuevo-observaciones">Observaciones internas</label>
            <textarea
              id="nuevo-observaciones"
              className="modal-textarea"
              rows={2}
              placeholder="Notas internas (no visibles al contribuyente)"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
            />
          </div>
        </div>

        {/* Section: Ubicación */}
        <div className="nuevo-section">
          <div className="nuevo-section-header">
            <IconMapPin size={20} stroke={1.5} />
            <span>Ubicación</span>
          </div>
          <UbicacionMap 
            address={calle}
            onAddressChange={setCalle}
            value={coordenadas} 
            onChange={setCoordenadas} 
          />
        </div>

        {/* Submit */}
        <div className="nuevo-submit-row">
          <button
            type="button"
            className="dash-action-btn dash-action-btn--secondary"
            onClick={() => router.push('/dashboard/reclamos')}
          >
            Cancelar
          </button>
          <button
            id="btn-submit-reclamo"
            type="submit"
            className={`dash-action-btn dash-action-btn--primary ${submitting ? 'dash-action-btn--loading' : ''}`}
            disabled={submitting}
          >
            {submitting ? (
              <span className="loading loading-spinner loading-sm" />
            ) : (
              <>
                <IconSend size={18} />
                Crear Reclamo
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
