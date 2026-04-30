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
import AddressSearch from '@/components/AddressSearch'

// Dynamic import for Leaflet map (SSR-safe)
const UbicacionMap = dynamic(() => import('./UbicacionMap'), { ssr: false })

interface Area {
  id: string
  nombre: string
}

interface Concepto {
  id: string
  nombre: string
  area: { id: string; nombre: string } | string
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

interface NuevoReclamoFormProps {
  returnUrl?: string
}

export default function NuevoReclamoForm({
  returnUrl = '/dashboard/reclamos',
}: NuevoReclamoFormProps = {}) {
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
  const [conceptos, setConceptos] = useState<Concepto[]>([])
  const [concepto, setConcepto] = useState('')
  const [areaDerivada, setAreaDerivada] = useState('')
  const [direccionBusqueda, setDireccionBusqueda] = useState('') // Texto original del buscador
  const [barrio, setBarrio] = useState('')
  const [ubicacion, setUbicacion] = useState<{
    direccionIngresada: string
    direccionNormalizada: string
    numero: string
    barrio: string
    localidad: string
    location: { lat: number; lng: number } | null
  } | null>(null)
  const [calle, setCalle] = useState('') // Dirección en texto plano (reverse geocode del mapa)
  const [coordenadas, setCoordenadas] = useState<Coords | null>(null)

  // Lista de barrios de San Benito para matching
  const BARRIOS = [
    '250 Viviendas',
    'Altos del Este',
    'Centro',
    'Jardines',
    'La Loma',
    'La Virgencita II',
    'Las Tunas',
    'Loteo Aguer Cavallo',
    'Loteo Bizai',
    'Loteo Cumini',
    'Loteo Dobanton Mizawak Martinez',
    'Loteo Furios',
    'Portal del Sol',
    'Puesta del Sol',
    'San Martín',
    'San Miguel',
    'San Pedro',
    'San Sebastián',
    'Senger',
    'Solvencia',
    'Sur',
  ]

  // Intentar hacer match del barrio detectado por OSM contra nuestra lista
  const handleBarrioDetectado = (barrioOSM: string) => {
    const normalizar = (s: string) =>
      s
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
    const barrioNorm = normalizar(barrioOSM)
    const match = BARRIOS.find((b) => {
      const bNorm = normalizar(b)
      return bNorm === barrioNorm || bNorm.includes(barrioNorm) || barrioNorm.includes(bNorm)
    })
    if (match) setBarrio(match)
  }

  // Cuando el mapa hace reverse geocode, también actualizar ubicacion.location
  const handleMapCoordsChange = (coords: Coords | null) => {
    setCoordenadas(coords)
    if (coords) {
      setUbicacion((prev) =>
        prev
          ? { ...prev, location: coords }
          : {
              direccionIngresada: calle,
              direccionNormalizada: calle,
              numero: '',
              barrio: '',
              localidad: 'San Benito',
              location: coords,
            },
      )
    }
  }
  const [observaciones, setObservaciones] = useState('')

  useEffect(() => {
    Promise.allSettled([
      fetch('/api/users/me', { credentials: 'include' }).then((r) => r.json()),
      fetch('/api/areas?limit=100&where[activa][equals]=true', { credentials: 'include' }).then(
        (r) => r.json(),
      ),
      fetch('/api/conceptos-reclamo?where[activo][equals]=true&depth=1&limit=500', {
        credentials: 'include',
      }).then((r) => r.json()),
    ])
      .then(([userResult, areasResult, conceptosResult]) => {
        if (userResult.status === 'fulfilled') {
          const userData = userResult.value
          if (userData?.user) {
            if (userData.user.role === 'visualizador') {
              router.replace('/dashboard/reclamos')
              return
            }
            setUser(userData.user)
            if (userData.user.role === 'ejecutor') {
              const userAreaId =
                typeof userData.user.area === 'string' ? userData.user.area : userData.user.area?.id
              if (userAreaId) setAreaDerivada(userAreaId)
            }
          }
        }
        if (areasResult.status === 'fulfilled' && areasResult.value?.docs) {
          setAreas(areasResult.value.docs)
        }
        if (conceptosResult.status === 'fulfilled' && conceptosResult.value?.docs) {
          setConceptos(conceptosResult.value.docs)
        }
      })
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

  function handleConceptoChange(conceptoId: string) {
    setConcepto(conceptoId)
    if (conceptoId) {
      const found = conceptos.find((c) => c.id === conceptoId)
      if (found) {
        const areaId = typeof found.area === 'string' ? found.area : found.area.id
        setAreaDerivada(areaId)
      }
    }
  }

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
        concepto: concepto || undefined,
        estado: 'pendiente',
        observaciones: observaciones.trim() || undefined,
      }

      // Enviar datos de ubicación completos si existen
      if (ubicacion || barrio || direccionBusqueda) {
        body.ubicacion = {
          direccionIngresada: direccionBusqueda || ubicacion?.direccionIngresada,
          direccionNormalizada: ubicacion?.direccionNormalizada,
          barrio: barrio || ubicacion?.barrio,
          localidad: ubicacion?.localidad || 'San Benito',
          location: ubicacion?.location
            ? {
                type: 'Point',
                coordinates: [ubicacion.location.lng, ubicacion.location.lat],
              }
            : undefined,
        }
      }

      // Legacy: mantener calle y coordenadas para compatibilidad
      if (calle) {
        body.calle = calle.trim()
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
            <button
              className="dash-action-btn dash-action-btn--secondary"
              onClick={() => router.push(returnUrl)}
            >
              Ver Reclamos
            </button>
            <button
              className="dash-action-btn dash-action-btn--primary"
              onClick={() => {
                setSuccess(false)
                setContribuyente(null)
                setDescripcion('')
                setDireccionBusqueda('')
                setBarrio('')
                setUbicacion(null)
                setCalle('')
                setCoordenadas(null)
                setConcepto('')
                setObservaciones('')
                setCreatedNumero(null)
              }}
            >
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
        <button type="button" className="nuevo-back-btn" onClick={() => router.push(returnUrl)}>
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
              <label className="modal-label" htmlFor="nuevo-tipo">
                Tipo <span className="modal-required">*</span>
              </label>
              <select
                id="nuevo-tipo"
                className="modal-select"
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
              >
                <option value="reclamo">Reclamo</option>
                <option value="sugerencia">Sugerencia</option>
                <option value="denuncia">Denuncia</option>
                <option value="consulta">Consulta</option>
              </select>
            </div>
            <div className="modal-field">
              <label className="modal-label" htmlFor="nuevo-medio">
                Medio <span className="modal-required">*</span>
              </label>
              <select
                id="nuevo-medio"
                className="modal-select"
                value={medio}
                onChange={(e) => setMedio(e.target.value)}
              >
                <option value="presencial">Presencial</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="correo">Correo</option>
                <option value="calle">Calle</option>
                <option value="otro">Otro</option>
              </select>
            </div>
            <div className="modal-field">
              <label className="modal-label" htmlFor="nuevo-prioridad">
                Prioridad
              </label>
              <select
                id="nuevo-prioridad"
                className="modal-select"
                value={prioridad}
                onChange={(e) => setPrioridad(e.target.value)}
              >
                <option value="baja">Baja</option>
                <option value="media">Media</option>
                <option value="alta">Alta</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section: Áreas y Concepto */}
        <div className="nuevo-section">
          <div className="nuevo-section-header">
            <IconBuildingCommunity size={20} stroke={1.5} />
            <span>Clasificación y Derivación</span>
          </div>
          <div className="modal-row">
            <div className="modal-field">
              <label className="modal-label">Área Receptora</label>
              <div className="nuevo-area-readonly">{areaReceptoraNombre}</div>
            </div>
            <div className="modal-field">
              <label className="modal-label" htmlFor="nuevo-concepto">
                Concepto
              </label>
              <select
                id="nuevo-concepto"
                className="modal-select"
                value={concepto}
                onChange={(e) => handleConceptoChange(e.target.value)}
              >
                <option value="">Seleccionar concepto...</option>
                {conceptos.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="modal-row">
            <div className="modal-field">
              <label className="modal-label" htmlFor="nuevo-area-derivada">
                Área Derivada <span className="modal-required">*</span>
              </label>
              <select
                id="nuevo-area-derivada"
                className="modal-select"
                value={areaDerivada}
                onChange={(e) => setAreaDerivada(e.target.value)}
                disabled={user?.role === 'ejecutor'}
              >
                <option value="">Seleccionar área...</option>
                {areas.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nombre}
                  </option>
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
            <label className="modal-label" htmlFor="nuevo-observaciones">
              Observaciones internas
            </label>
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

          {/* Buscador de dirección */}
          <div className="modal-field" style={{ marginBottom: '16px' }}>
            <label className="modal-label">Buscar dirección</label>
            <AddressSearch
              placeholder="Ej: San Martín 123..."
              value={calle}
              onSelect={(result) => {
                // Guardar texto original de búsqueda
                setDireccionBusqueda(result.displayName)

                // Guardar objeto completo de ubicación
                setUbicacion({
                  direccionIngresada: result.displayName,
                  direccionNormalizada: result.displayName,
                  numero: result.address.houseNumber || '',
                  barrio: result.address.suburb || '',
                  localidad: result.address.city || 'San Benito',
                  location: { lat: result.lat, lng: result.lng },
                })

                // Actualizar legacy fields para el mapa
                setCalle(result.displayName)
                setCoordenadas({ lat: result.lat, lng: result.lng })
              }}
            />
            <p className="text-xs text-gray-500 mt-1">
              Buscá la dirección y seleccioná el resultado correcto
            </p>

            {/* Mostrar coordenadas detectadas */}
            {ubicacion?.location && (
              <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                <IconMapPin size={13} />
                <span>
                  Coordenadas: {ubicacion.location.lat.toFixed(6)},{' '}
                  {ubicacion.location.lng.toFixed(6)}
                </span>
              </div>
            )}
          </div>

          {/* Barrio */}
          <div className="modal-field" style={{ marginBottom: '16px' }}>
            <label className="modal-label" htmlFor="nuevo-barrio">
              Barrio
            </label>
            <select
              id="nuevo-barrio"
              className="modal-select"
              value={barrio}
              onChange={(e) => setBarrio(e.target.value)}
            >
              <option value="">Seleccionar barrio...</option>
              <option value="250 Viviendas">250 Viviendas</option>
              <option value="Altos del Este">Altos del Este</option>
              <option value="Centro">Centro</option>
              <option value="Jardines">Jardines</option>
              <option value="La Loma">La Loma</option>
              <option value="La Virgencita II">La Virgencita II</option>
              <option value="Loteo Aguer Cavallo">Loteo Aguer Cavallo</option>
              <option value="Loteo Bizai">Loteo Bizai</option>
              <option value="Loteo Cumini">Loteo Cumini</option>
              <option value="Loteo Dobanton Mizawak Martinez">
                Loteo Dobanton Mizawak Martinez
              </option>
              <option value="Loteo Furios">Loteo Furios</option>
              <option value="Las Tunas">Las Tunas</option>
              <option value="Portal del Sol">Portal del Sol</option>
              <option value="Puesta del Sol">Puesta del Sol</option>
              <option value="San Martín">San Martín</option>
              <option value="San Miguel">San Miguel</option>
              <option value="San Pedro">San Pedro</option>
              <option value="San Sebastián">San Sebastián</option>
              <option value="Senger">Senger</option>
              <option value="Solvencia">Solvencia</option>
              <option value="Sur">Sur</option>
            </select>
          </div>

          <UbicacionMap
            address={calle}
            onAddressChange={setCalle}
            value={coordenadas}
            onChange={handleMapCoordsChange}
            onBarrioChange={handleBarrioDetectado}
          />
        </div>

        {/* Submit */}
        <div className="nuevo-submit-row">
          <button
            type="button"
            className="dash-action-btn dash-action-btn--secondary"
            onClick={() => router.push(returnUrl)}
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
