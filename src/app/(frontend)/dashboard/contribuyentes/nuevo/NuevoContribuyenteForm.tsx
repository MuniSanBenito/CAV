'use client'

import {
  IconAlertCircle,
  IconArrowLeft,
  IconCircleCheck,
  IconSend,
  IconUser,
} from '@tabler/icons-react'
import { useRouter } from 'next/navigation'
import { FormEvent, useEffect, useState } from 'react'

const RETURN_URL = '/dashboard/contribuyentes'
const ALLOWED_ROLES = ['admin', 'carga'] as const

interface FormState {
  nombre: string
  apellido: string
  dni: string
  telefono: string
  email: string
  direccion: string
}

const EMPTY_FORM: FormState = {
  nombre: '',
  apellido: '',
  dni: '',
  telefono: '',
  email: '',
  direccion: '',
}

export default function NuevoContribuyenteForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [createdId, setCreatedId] = useState<string | null>(null)
  const [createdNumero, setCreatedNumero] = useState<number | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)

  useEffect(() => {
    fetch('/api/users/me', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        const role = data?.user?.role
        if (!role || !ALLOWED_ROLES.includes(role)) {
          router.replace(RETURN_URL)
          return
        }
        setLoading(false)
      })
      .catch(() => router.replace('/login'))
  }, [router])

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    if (!form.nombre.trim() || !form.apellido.trim()) {
      setError('Nombre y apellido son obligatorios.')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/contribuyentes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          nombre: form.nombre.trim(),
          apellido: form.apellido.trim(),
          dni: form.dni.trim() || undefined,
          telefono: form.telefono.trim() || undefined,
          email: form.email.trim() || undefined,
          direccion: form.direccion.trim() || undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.errors?.[0]?.message || 'Error al crear contribuyente.')
      }

      const created = await res.json()
      setCreatedId(created.doc?.id ?? null)
      setCreatedNumero(created.doc?.numero_contribuyente ?? null)
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
          <h2>Contribuyente creado exitosamente</h2>
          {createdNumero != null && <p className="nuevo-success-numero">Nº {createdNumero}</p>}
          <div className="nuevo-success-actions">
            <button
              className="dash-action-btn dash-action-btn--secondary"
              onClick={() => router.push(RETURN_URL)}
            >
              Ver Contribuyentes
            </button>
            {createdId ? (
              <button
                className="dash-action-btn dash-action-btn--primary"
                onClick={() => router.push(`/dashboard/contribuyentes/${createdId}`)}
              >
                Ver detalle
              </button>
            ) : (
              <button
                className="dash-action-btn dash-action-btn--primary"
                onClick={() => {
                  setSuccess(false)
                  setForm(EMPTY_FORM)
                  setCreatedId(null)
                  setCreatedNumero(null)
                }}
              >
                Cargar otro
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="nuevo-reclamo-page">
      <div className="nuevo-header">
        <button type="button" className="nuevo-back-btn" onClick={() => router.push(RETURN_URL)}>
          <IconArrowLeft size={20} />
          Volver
        </button>
        <div>
          <h1 className="nuevo-title">Nuevo Contribuyente</h1>
          <p className="nuevo-subtitle">
            Completá los datos para dar de alta un nuevo contribuyente
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="nuevo-form">
        {error && (
          <div className="modal-error">
            <IconAlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <div className="nuevo-section">
          <div className="nuevo-section-header">
            <IconUser size={20} stroke={1.5} />
            <span>Datos del contribuyente</span>
          </div>

          <div className="modal-row">
            <div className="modal-field">
              <label className="modal-label" htmlFor="contrib-nombre">
                Nombre <span className="modal-required">*</span>
              </label>
              <input
                id="contrib-nombre"
                className="modal-input"
                placeholder="Nombre"
                value={form.nombre}
                onChange={(e) => updateField('nombre', e.target.value)}
                required
              />
            </div>
            <div className="modal-field">
              <label className="modal-label" htmlFor="contrib-apellido">
                Apellido <span className="modal-required">*</span>
              </label>
              <input
                id="contrib-apellido"
                className="modal-input"
                placeholder="Apellido"
                value={form.apellido}
                onChange={(e) => updateField('apellido', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="modal-row">
            <div className="modal-field">
              <label className="modal-label" htmlFor="contrib-dni">
                DNI
              </label>
              <input
                id="contrib-dni"
                className="modal-input"
                placeholder="DNI"
                value={form.dni}
                onChange={(e) => updateField('dni', e.target.value)}
              />
            </div>
            <div className="modal-field">
              <label className="modal-label" htmlFor="contrib-telefono">
                Teléfono
              </label>
              <input
                id="contrib-telefono"
                className="modal-input"
                placeholder="Teléfono"
                value={form.telefono}
                onChange={(e) => updateField('telefono', e.target.value)}
              />
            </div>
          </div>

          <div className="modal-row">
            <div className="modal-field">
              <label className="modal-label" htmlFor="contrib-email">
                Email
              </label>
              <input
                id="contrib-email"
                type="email"
                className="modal-input"
                placeholder="Email"
                value={form.email}
                onChange={(e) => updateField('email', e.target.value)}
              />
            </div>
            <div className="modal-field">
              <label className="modal-label" htmlFor="contrib-direccion">
                Dirección
              </label>
              <input
                id="contrib-direccion"
                className="modal-input"
                placeholder="Dirección"
                value={form.direccion}
                onChange={(e) => updateField('direccion', e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="nuevo-submit-row">
          <button
            type="button"
            className="dash-action-btn dash-action-btn--secondary"
            onClick={() => router.push(RETURN_URL)}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className={`dash-action-btn dash-action-btn--primary ${submitting ? 'dash-action-btn--loading' : ''}`}
            disabled={submitting}
          >
            {submitting ? (
              <span className="loading loading-spinner loading-sm" />
            ) : (
              <>
                <IconSend size={18} />
                Crear Contribuyente
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
