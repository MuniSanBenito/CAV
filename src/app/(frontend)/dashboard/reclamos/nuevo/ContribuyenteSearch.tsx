'use client'

import { buildContribuyenteSearchParams, splitNombreApellido } from '@/lib/contribuyente-map'
import type { Contribuyente } from '@/mi-sanbenito/types'
import { IconCheck, IconPencil, IconPlus, IconSearch, IconUser, IconX } from '@tabler/icons-react'
import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react'
import ContribuyenteFormPanel, {
  EMPTY_CONTRIBUYENTE_FORM,
  type ContribuyenteFormValues,
} from './ContribuyenteFormPanel'

interface Props {
  value: Contribuyente | null
  onChange: (c: Contribuyente | null) => void
  canEdit?: boolean
}

function getInitials(nombre?: string | null): string {
  if (!nombre) return '?'
  const parts = nombre.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase()
  }
  return nombre.slice(0, 2).toUpperCase()
}

function contribuyenteToFormValues(c: Contribuyente): ContribuyenteFormValues {
  const { nombre, apellido } = splitNombreApellido(c.nombre)
  return {
    nombre,
    apellido,
    dni: c.numero_documento != null ? String(c.numero_documento) : '',
    telefono: c.telefono_web ?? '',
    email: c.email ?? '',
    direccion: c.domicilio ?? '',
  }
}

export default function ContribuyenteSearch({ value, onChange, canEdit = false }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Contribuyente[]>([])
  const [searching, setSearching] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [showNewForm, setShowNewForm] = useState(false)
  const [editingContribuyente, setEditingContribuyente] = useState<Contribuyente | null>(null)
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    function handleClick(e: globalThis.MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function closePanels() {
    setShowNewForm(false)
    setEditingContribuyente(null)
    setFormError('')
  }

  function handleSearch(q: string) {
    setQuery(q)
    if (timerRef.current) clearTimeout(timerRef.current)
    if (q.trim().length < 2) {
      setResults([])
      setShowDropdown(false)
      return
    }
    timerRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const params = buildContribuyenteSearchParams(q)
        const res = await fetch(`/api/contribuyentes?${params}`, { credentials: 'include' })
        const data = await res.json()
        setResults(data?.docs || [])
        setShowDropdown(true)
      } catch {
        setResults([])
      } finally {
        setSearching(false)
      }
    }, 300)
  }

  function selectContribuyente(c: Contribuyente) {
    onChange(c)
    setQuery('')
    setShowDropdown(false)
    setResults([])
    closePanels()
  }

  function clearSelection() {
    onChange(null)
    setQuery('')
    closePanels()
  }

  function openEdit(c: Contribuyente, e?: ReactMouseEvent) {
    e?.stopPropagation()
    setEditingContribuyente(c)
    setShowNewForm(false)
    setShowDropdown(false)
    setFormError('')
  }

  async function handleCreate(form: ContribuyenteFormValues) {
    setFormError('')
    if (!form.nombre.trim() || !form.apellido.trim()) {
      setFormError('Nombre y apellido son obligatorios.')
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
      selectContribuyente(created.doc)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleUpdate(form: ContribuyenteFormValues) {
    if (!editingContribuyente) return
    setFormError('')
    if (!form.nombre.trim() || !form.apellido.trim()) {
      setFormError('Nombre y apellido son obligatorios.')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch(`/api/contribuyentes/${editingContribuyente.id}`, {
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
        throw new Error(data?.errors?.[0]?.message || 'Error al actualizar contribuyente.')
      }
      const updated = await res.json()
      if (value?.id === editingContribuyente.id) {
        onChange(updated.doc)
      }
      setEditingContribuyente(null)
      setFormError('')
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setSubmitting(false)
    }
  }

  if (value && !editingContribuyente) {
    return (
      <div className="contrib-selected">
        <div className="contrib-selected-avatar">
          <IconUser size={18} />
        </div>
        <div className="contrib-selected-info">
          <span className="contrib-selected-name">{value.nombre}</span>
          <span className="contrib-selected-dni">
            {value.numero_documento ? `DNI: ${value.numero_documento}` : 'Sin DNI'}
            {value.telefono_web ? ` · Tel: ${value.telefono_web}` : ''}
          </span>
        </div>
        {canEdit && (
          <button
            type="button"
            className="contrib-edit-btn"
            onClick={() => openEdit(value)}
            title="Editar contribuyente"
          >
            <IconPencil size={16} />
          </button>
        )}
        <button type="button" className="contrib-clear-btn" onClick={clearSelection}>
          <IconX size={16} />
        </button>
      </div>
    )
  }

  if (editingContribuyente) {
    return (
      <ContribuyenteFormPanel
        mode="edit"
        initialValues={contribuyenteToFormValues(editingContribuyente)}
        numeroContribuyente={editingContribuyente.numero_contribuyente}
        onSubmit={handleUpdate}
        onCancel={() => {
          setEditingContribuyente(null)
          setFormError('')
        }}
        loading={submitting}
        error={formError}
      />
    )
  }

  return (
    <div className="contrib-search-wrap" ref={wrapRef}>
      <div className="contrib-search-input-wrap">
        <IconSearch size={16} className="contrib-search-icon" />
        <input
          id="contrib-search"
          type="text"
          className="contrib-search-input"
          placeholder="Buscar por nombre, DNI o N° contribuyente..."
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => {
            if (results.length > 0) setShowDropdown(true)
          }}
        />
        {searching && (
          <span className="loading loading-spinner loading-xs contrib-search-spinner" />
        )}
      </div>

      {showDropdown && (
        <div className="contrib-dropdown">
          {results.length > 0 ? (
            results.map((c) => (
              <div key={c.id} className="contrib-dropdown-item-wrap">
                <button
                  type="button"
                  className="contrib-dropdown-item"
                  onClick={() => selectContribuyente(c)}
                >
                  <div className="contrib-dropdown-avatar">{getInitials(c.nombre)}</div>
                  <div className="contrib-dropdown-info">
                    <span className="contrib-dropdown-name">{c.nombre}</span>
                    <span className="contrib-dropdown-dni">
                      {c.numero_documento ? `DNI: ${c.numero_documento}` : 'Sin DNI'}
                      {c.numero_contribuyente ? ` · N° ${c.numero_contribuyente}` : ''}
                    </span>
                  </div>
                  <IconCheck size={16} className="contrib-dropdown-check" />
                </button>
                {canEdit && (
                  <button
                    type="button"
                    className="contrib-dropdown-edit"
                    onClick={(e) => openEdit(c, e)}
                    title="Editar contribuyente"
                  >
                    <IconPencil size={16} />
                  </button>
                )}
              </div>
            ))
          ) : (
            <div className="contrib-dropdown-empty">No se encontraron contribuyentes.</div>
          )}
          <button
            type="button"
            className="contrib-dropdown-new"
            onClick={() => {
              setShowNewForm(true)
              setShowDropdown(false)
            }}
          >
            <IconPlus size={16} />
            Nuevo Contribuyente
          </button>
        </div>
      )}

      {!showDropdown && !showNewForm && (
        <button
          type="button"
          className="contrib-inline-new-btn"
          onClick={() => setShowNewForm(true)}
        >
          <IconPlus size={14} />
          Nuevo Contribuyente
        </button>
      )}

      {showNewForm && (
        <ContribuyenteFormPanel
          mode="create"
          initialValues={EMPTY_CONTRIBUYENTE_FORM}
          onSubmit={handleCreate}
          onCancel={closePanels}
          loading={submitting}
          error={formError}
        />
      )}
    </div>
  )
}
