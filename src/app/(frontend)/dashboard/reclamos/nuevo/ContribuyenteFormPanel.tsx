'use client'

import { IconCheck, IconX } from '@tabler/icons-react'
import { useEffect, useState } from 'react'

export interface ContribuyenteFormValues {
  nombre: string
  apellido: string
  dni: string
  telefono: string
  email: string
  direccion: string
}

export const EMPTY_CONTRIBUYENTE_FORM: ContribuyenteFormValues = {
  nombre: '',
  apellido: '',
  dni: '',
  telefono: '',
  email: '',
  direccion: '',
}

interface Props {
  mode: 'create' | 'edit'
  initialValues: ContribuyenteFormValues
  numeroContribuyente?: number | null
  onSubmit: (values: ContribuyenteFormValues) => void | Promise<void>
  onCancel: () => void
  loading?: boolean
  error?: string
}

export default function ContribuyenteFormPanel({
  mode,
  initialValues,
  numeroContribuyente,
  onSubmit,
  onCancel,
  loading = false,
  error = '',
}: Props) {
  const [form, setForm] = useState<ContribuyenteFormValues>(initialValues)

  useEffect(() => {
    setForm(initialValues)
  }, [initialValues])

  const title = mode === 'create' ? 'Nuevo Contribuyente' : 'Editar Contribuyente'
  const submitLabel = mode === 'create' ? 'Crear' : 'Guardar'

  return (
    <div className="contrib-new-form">
      <div className="contrib-new-header">
        <span>{title}</span>
        <button type="button" className="modal-close-btn" onClick={onCancel}>
          <IconX size={16} />
        </button>
      </div>
      {error && (
        <div className="modal-error" style={{ marginBottom: 12 }}>
          <span>{error}</span>
        </div>
      )}
      {mode === 'edit' && numeroContribuyente != null && (
        <div className="modal-field" style={{ marginBottom: 12 }}>
          <label className="modal-label">N° contribuyente</label>
          <input className="modal-input" value={String(numeroContribuyente)} readOnly disabled />
        </div>
      )}
      <div className="modal-row">
        <div className="modal-field">
          <label className="modal-label">
            Nombre <span className="modal-required">*</span>
          </label>
          <input
            className="modal-input"
            placeholder="Nombre"
            value={form.nombre}
            onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
          />
        </div>
        <div className="modal-field">
          <label className="modal-label">
            Apellido <span className="modal-required">*</span>
          </label>
          <input
            className="modal-input"
            placeholder="Apellido"
            value={form.apellido}
            onChange={(e) => setForm((p) => ({ ...p, apellido: e.target.value }))}
          />
        </div>
      </div>
      <div className="modal-row">
        <div className="modal-field">
          <label className="modal-label">DNI</label>
          <input
            className="modal-input"
            placeholder="DNI"
            value={form.dni}
            onChange={(e) => setForm((p) => ({ ...p, dni: e.target.value }))}
          />
        </div>
        <div className="modal-field">
          <label className="modal-label">Teléfono</label>
          <input
            className="modal-input"
            placeholder="Teléfono"
            value={form.telefono}
            onChange={(e) => setForm((p) => ({ ...p, telefono: e.target.value }))}
          />
        </div>
      </div>
      <div className="modal-row">
        <div className="modal-field">
          <label className="modal-label">Email</label>
          <input
            className="modal-input"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
          />
        </div>
        <div className="modal-field">
          <label className="modal-label">Dirección</label>
          <input
            className="modal-input"
            placeholder="Dirección"
            value={form.direccion}
            onChange={(e) => setForm((p) => ({ ...p, direccion: e.target.value }))}
          />
        </div>
      </div>
      <div className="modal-actions">
        <button type="button" className="modal-btn modal-btn--cancel" onClick={onCancel}>
          Cancelar
        </button>
        <button
          type="button"
          className={`modal-btn modal-btn--submit ${loading ? 'modal-btn--loading' : ''}`}
          disabled={loading}
          onClick={() => onSubmit(form)}
        >
          {loading ? (
            <span className="loading loading-spinner loading-sm" />
          ) : (
            <>
              <IconCheck size={16} /> {submitLabel}
            </>
          )}
        </button>
      </div>
    </div>
  )
}
