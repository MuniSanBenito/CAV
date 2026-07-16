'use client'

import { splitNombreApellido } from '@/lib/contribuyente-map'
import type { Contribuyente } from '@/mi-sanbenito/types'
import { IconAlertCircle, IconArrowLeft, IconCheck, IconUser } from '@tabler/icons-react'
import { useRouter } from 'next/navigation'
import { FormEvent, useEffect, useState } from 'react'

const RETURN_URL = '/dashboard/contribuyentes'
const EDIT_ROLES = ['admin', 'carga'] as const

interface FormState {
  nombre: string
  apellido: string
  dni: string
  telefono: string
  email: string
  direccion: string
}

interface Props {
  id: string
}

export default function ContribuyenteDetailClient({ id }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [canEdit, setCanEdit] = useState(false)
  const [contribuyente, setContribuyente] = useState<Contribuyente | null>(null)
  const [form, setForm] = useState<FormState>({
    nombre: '',
    apellido: '',
    dni: '',
    telefono: '',
    email: '',
    direccion: '',
  })

  useEffect(() => {
    const controller = new AbortController()

    async function load() {
      setLoading(true)
      setError('')
      try {
        const [userRes, contribRes] = await Promise.all([
          fetch('/api/users/me', { credentials: 'include', signal: controller.signal }),
          fetch(`/api/contribuyentes/${id}`, { credentials: 'include', signal: controller.signal }),
        ])

        const userData = await userRes.json()
        if (!userData?.user) {
          router.replace('/login')
          return
        }

        const role = userData.user.role as string
        setCanEdit(EDIT_ROLES.includes(role as (typeof EDIT_ROLES)[number]))

        if (!contribRes.ok) {
          const data = await contribRes.json().catch(() => null)
          throw new Error(data?.errors?.[0]?.message || 'No se pudo cargar el contribuyente.')
        }

        const data = await contribRes.json()
        const doc = (data.doc ?? data) as Contribuyente
        setContribuyente(doc)

        const { nombre, apellido } = splitNombreApellido(doc.nombre)
        setForm({
          nombre,
          apellido,
          dni: doc.numero_documento ?? '',
          telefono: doc.telefono_web ?? '',
          email: doc.email ?? '',
          direccion: doc.domicilio ?? '',
        })
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setError(err instanceof Error ? err.message : 'Error inesperado')
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    load()
    return () => controller.abort()
  }, [id, router])

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setSuccessMsg('')
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!canEdit) return

    setError('')
    setSuccessMsg('')

    if (!form.nombre.trim() || !form.apellido.trim()) {
      setError('Nombre y apellido son obligatorios.')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch(`/api/contribuyentes/${id}`, {
        method: 'PATCH',
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
        throw new Error(data?.errors?.[0]?.message || 'Error al guardar contribuyente.')
      }

      const updated = await res.json()
      const doc = (updated.doc ?? updated) as Contribuyente
      setContribuyente(doc)

      const { nombre, apellido } = splitNombreApellido(doc.nombre)
      setForm({
        nombre,
        apellido,
        dni: doc.numero_documento ?? '',
        telefono: doc.telefono_web ?? '',
        email: doc.email ?? '',
        direccion: doc.domicilio ?? '',
      })
      setSuccessMsg('Cambios guardados correctamente.')
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

  if (!contribuyente && error) {
    return (
      <div className="nuevo-reclamo-page">
        <div className="nuevo-header">
          <button type="button" className="nuevo-back-btn" onClick={() => router.push(RETURN_URL)}>
            <IconArrowLeft size={20} />
            Volver
          </button>
        </div>
        <div className="modal-error">
          <IconAlertCircle size={18} />
          <span>{error}</span>
        </div>
      </div>
    )
  }

  const readOnly = !canEdit
  const titleNumero =
    contribuyente?.numero_contribuyente != null
      ? `Nº ${contribuyente.numero_contribuyente}`
      : 'Contribuyente'

  return (
    <div className="nuevo-reclamo-page">
      <div className="nuevo-header">
        <button type="button" className="nuevo-back-btn" onClick={() => router.push(RETURN_URL)}>
          <IconArrowLeft size={20} />
          Volver
        </button>
        <div>
          <h1 className="nuevo-title">{titleNumero}</h1>
          <p className="nuevo-subtitle">
            {canEdit ? 'Editá los datos del contribuyente' : 'Detalle del contribuyente'}
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
        {successMsg && (
          <div role="alert" className="alert alert-success" style={{ marginBottom: 16 }}>
            <IconCheck size={18} />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="nuevo-section">
          <div className="nuevo-section-header">
            <IconUser size={20} stroke={1.5} />
            <span>Datos del contribuyente</span>
          </div>

          {contribuyente?.numero_contribuyente != null && (
            <div className="modal-field" style={{ marginBottom: 16 }}>
              <label className="modal-label" htmlFor="contrib-numero">
                N° contribuyente
              </label>
              <input
                id="contrib-numero"
                className="modal-input"
                value={String(contribuyente.numero_contribuyente)}
                readOnly
                disabled
              />
            </div>
          )}

          <div className="modal-row">
            <div className="modal-field">
              <label className="modal-label" htmlFor="contrib-nombre">
                Nombre {!readOnly && <span className="modal-required">*</span>}
              </label>
              <input
                id="contrib-nombre"
                className="modal-input"
                placeholder="Nombre"
                value={form.nombre}
                onChange={(e) => updateField('nombre', e.target.value)}
                readOnly={readOnly}
                disabled={readOnly}
                required={!readOnly}
              />
            </div>
            <div className="modal-field">
              <label className="modal-label" htmlFor="contrib-apellido">
                Apellido {!readOnly && <span className="modal-required">*</span>}
              </label>
              <input
                id="contrib-apellido"
                className="modal-input"
                placeholder="Apellido"
                value={form.apellido}
                onChange={(e) => updateField('apellido', e.target.value)}
                readOnly={readOnly}
                disabled={readOnly}
                required={!readOnly}
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
                readOnly={readOnly}
                disabled={readOnly}
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
                readOnly={readOnly}
                disabled={readOnly}
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
                readOnly={readOnly}
                disabled={readOnly}
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
                readOnly={readOnly}
                disabled={readOnly}
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
            {canEdit ? 'Cancelar' : 'Volver al listado'}
          </button>
          {canEdit && (
            <button
              type="submit"
              className={`dash-action-btn dash-action-btn--primary ${submitting ? 'dash-action-btn--loading' : ''}`}
              disabled={submitting}
            >
              {submitting ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                <>
                  <IconCheck size={18} />
                  Guardar
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
