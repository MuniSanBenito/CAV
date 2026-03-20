'use client'

import React, { useEffect, useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import {
  IconArrowLeft,
  IconClock,
  IconUser,
  IconMapPin,
  IconNotes,
  IconCircleCheck,
  IconSend,
  IconAlertCircle,
  IconHistory
} from '@tabler/icons-react'

const estadoLabel: Record<string, string> = {
  pendiente: 'Pendiente',
  en_proceso: 'En Proceso',
  resuelto: 'Resuelto',
  rechazado: 'Rechazado',
}

const estadoBadge: Record<string, string> = {
  pendiente: 'dash-badge--pending',
  en_proceso: 'dash-badge--progress',
  resuelto: 'dash-badge--resolved',
  rechazado: 'dash-badge--rejected',
}

const prioridadLabel: Record<string, string> = {
  baja: 'Baja',
  media: 'Media',
  alta: 'Alta',
  urgente: 'Urgente',
}

export default function ReclamoDetailClient({ id }: { id: string }) {
  const router = useRouter()
  const [reclamo, setReclamo] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  // Update state
  const [nuevoEstado, setNuevoEstado] = useState('')
  const [nuevaNota, setNuevaNota] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const fetchDetail = async () => {
    try {
      setLoading(true)
      const [reclamoRes, userRes] = await Promise.all([
        fetch(`/api/reclamos/${id}?depth=2`, { credentials: 'include' }).then(r => r.json()),
        fetch('/api/users/me', { credentials: 'include' }).then(r => r.json())
      ])
      
      if (reclamoRes && !reclamoRes.errors) {
        setReclamo(reclamoRes)
        setNuevoEstado(reclamoRes.estado || 'pendiente')
      }
      
      if (userRes?.user) {
        setUser(userRes.user)
      }
    } catch (err) {
      console.error('Error fetching reclamo detail', err)
      setError('Error al cargar la información del reclamo.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDetail()
  }, [id])

  async function handleStatusUpdate(e: FormEvent) {
    e.preventDefault()
    setError('')
    setSuccessMsg('')
    
    if (!nuevaNota.trim()) {
      setError('Debes incluir una nota explicando el cambio o la actualización.')
      return
    }

    setSubmitting(true)
    try {
      const body = {
        estado: nuevoEstado,
        movimientos: [
          ...(reclamo.movimientos || []),
          {
            estado: nuevoEstado,
            nota: nuevaNota.trim(),
            fecha: new Date().toISOString(),
            usuario: user?.id,
          }
        ]
      }
      
      const res = await fetch(`/api/reclamos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body)
      })

      if (!res.ok) {
        throw new Error('No se pudo actualizar el estado.')
      }
      
      setSuccessMsg('Estado y nota actualizados correctamente.')
      setNuevaNota('')
      fetchDetail() // Reload to get the new history
    } catch (err: any) {
      setError(err.message || 'Error inesperado al guardar.')
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

  if (!reclamo) {
    return (
      <div className="nuevo-reclamo-page">
        <div className="nuevo-header">
          <button type="button" className="nuevo-back-btn" onClick={() => router.push('/dashboard/reclamos')}>
            <IconArrowLeft size={20} />
            Volver
          </button>
          <h1 className="nuevo-title">Reclamo no encontrado</h1>
        </div>
      </div>
    )
  }

  const { contribuyente, area_derivada, area_receptora, creadoPor } = reclamo

  return (
    <div className="nuevo-reclamo-page">
      <div className="nuevo-header">
        <button type="button" className="nuevo-back-btn" onClick={() => router.push('/dashboard/reclamos')}>
          <IconArrowLeft size={20} />
          Volver
        </button>
        <div>
          <h1 className="nuevo-title">Reclamo #{reclamo.numero}</h1>
          <p className="nuevo-subtitle">
            Cargado el {new Date(reclamo.createdAt).toLocaleDateString()} a las {new Date(reclamo.createdAt).toLocaleTimeString()}
          </p>
        </div>
      </div>

      <div className="modal-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'start' }}>
        
        {/* LADO IZQUIERDO: DETALLES */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Tarjeta Info */}
          <div className="nuevo-section" style={{ margin: 0 }}>
            <div className="nuevo-section-header">
              <IconNotes size={20} stroke={1.5} />
              <span>Información Principal</span>
            </div>
            <div style={{ padding: '1rem', background: 'var(--theme-elevation-50)', borderRadius: 'var(--border-radius-m)' }}>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <span className={`dash-badge ${estadoBadge[reclamo.estado] || ''}`}>
                  {estadoLabel[reclamo.estado] || reclamo.estado}
                </span>
                <span className={`dash-badge dash-badge--outline`}>
                  {reclamo.tipo}
                </span>
                <span className={`dash-badge`}>
                  Prioridad {prioridadLabel[reclamo.prioridad] || reclamo.prioridad}
                </span>
              </div>
              <p style={{ fontSize: '1.1rem', marginBottom: '1rem' }}><strong>{reclamo.descripcion}</strong></p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--theme-text-muted)' }}>
                {contribuyente && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <IconUser size={16} /> Contribuyente: {contribuyente.nombre} {contribuyente.apellido} (DNI: {contribuyente.dni})
                  </div>
                )}
                {reclamo.calle && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <IconMapPin size={16} /> Ubicación: {reclamo.calle}
                  </div>
                )}
                {area_derivada && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <IconArrowLeft size={16} style={{ transform: 'rotate(180deg)' }} /> Derivado a: {area_derivada.nombre}
                  </div>
                )}
                {area_receptora && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <IconCircleCheck size={16} /> Recepcionado en: {area_receptora.nombre}
                  </div>
                )}
              </div>
            </div>
            
            {reclamo.observaciones && (
              <div style={{ marginTop: '1rem', padding: '1rem', background: '#fff3cd', color: '#856404', borderRadius: 'var(--border-radius-m)' }}>
                <strong>Observaciones internas del alta:</strong> {reclamo.observaciones}
              </div>
            )}
          </div>
          
          {/* Fotos (si existen) */}
          {reclamo.fotos && reclamo.fotos.length > 0 && (
            <div className="nuevo-section" style={{ margin: 0 }}>
              <div className="nuevo-section-header">
                <span>Fotos Adjuntas</span>
              </div>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                {reclamo.fotos.map((foto: any) => (
                  <a key={foto.id} href={foto.url} target="_blank" rel="noopener noreferrer">
                    <img 
                      src={foto.url} 
                      alt="Archivo adjunto" 
                      style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: 'var(--border-radius-s)', border: '1px solid var(--theme-border)' }} 
                    />
                  </a>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* LADO DERECHO: HISTORIAL Y CAMBIO ESTADO */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="nuevo-section" style={{ margin: 0 }}>
            <div className="nuevo-section-header">
              <IconHistory size={20} stroke={1.5} />
              <span>Historial y Seguimiento</span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {(!reclamo.movimientos || reclamo.movimientos.length === 0) ? (
                <div style={{ color: 'var(--theme-text-muted)', fontStyle: 'italic', fontSize: '0.9rem' }}>
                  No hay movimientos registrados.
                </div>
              ) : (
                reclamo.movimientos.map((mov: any, idx: number) => (
                  <div key={idx} style={{ padding: '0.75rem', background: 'var(--theme-elevation-50)', borderRadius: 'var(--border-radius-s)', borderLeft: '3px solid var(--theme-primary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                      <span className={`dash-badge ${estadoBadge[mov.estado] || ''}`} style={{ padding: '0.1rem 0.5rem', fontSize: '0.75rem' }}>
                        {estadoLabel[mov.estado] || mov.estado}
                      </span>
                      <span style={{ color: 'var(--theme-text-muted)' }}>
                        {new Date(mov.fecha).toLocaleString()}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.95rem' }}>{mov.nota}</p>
                    {mov.usuario && (
                      <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--theme-text-muted)' }}>
                        Por: {mov.usuario.nombre} {mov.usuario.apellido}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
          
          <div className="nuevo-section" style={{ margin: 0 }}>
            <div className="nuevo-section-header">
              <span>Actualizar Estado / Agregar Nota</span>
            </div>
            
            <form onSubmit={handleStatusUpdate} className="nuevo-form" style={{ gap: '1rem' }}>
              {error && (
                <div className="modal-error">
                  <IconAlertCircle size={18} /><span>{error}</span>
                </div>
              )}
              {successMsg && (
                <div style={{ padding: '0.75rem', background: '#d4edda', color: '#155724', borderRadius: 'var(--border-radius-s)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                  <IconCircleCheck size={18} /><span>{successMsg}</span>
                </div>
              )}
              
              <div className="modal-field">
                <label className="modal-label">Nuevo Estado <span className="modal-required">*</span></label>
                <select className="modal-select" value={nuevoEstado} onChange={e => setNuevoEstado(e.target.value)}>
                  <option value="pendiente">Pendiente</option>
                  <option value="en_proceso">En Proceso</option>
                  <option value="resuelto">Resuelto</option>
                  <option value="rechazado">Rechazado</option>
                </select>
              </div>
              
              <div className="modal-field">
                <label className="modal-label">Nota o Descripción del movimiento <span className="modal-required">*</span></label>
                <textarea 
                  className="modal-textarea" 
                  rows={3}
                  value={nuevaNota}
                  onChange={e => setNuevaNota(e.target.value)}
                  placeholder="Detalles sobre por qué cambió el estado o el progreso actual..."
                  required
                />
              </div>
              
              <button
                type="submit"
                className={`dash-action-btn dash-action-btn--primary ${submitting ? 'dash-action-btn--loading' : ''}`}
                disabled={submitting || !nuevaNota.trim()}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                {submitting ? <span className="loading loading-spinner loading-sm" /> : <><IconSend size={18} />Guardar Movimiento</>}
              </button>
            </form>
          </div>

        </div>
      </div>
      
    </div>
  )
}
