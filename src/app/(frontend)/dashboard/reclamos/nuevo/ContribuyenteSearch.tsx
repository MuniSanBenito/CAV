'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  IconSearch,
  IconPlus,
  IconCheck,
  IconX,
  IconUser,
} from '@tabler/icons-react'

interface Contribuyente {
  id: string
  nombre: string
  apellido: string
  dni: string
  telefono?: string
  email?: string
  direccion?: string
}

interface Props {
  value: Contribuyente | null
  onChange: (c: Contribuyente | null) => void
}

export default function ContribuyenteSearch({ value, onChange }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Contribuyente[]>([])
  const [searching, setSearching] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [showNewForm, setShowNewForm] = useState(false)
  const [newForm, setNewForm] = useState({ nombre: '', apellido: '', dni: '', telefono: '', email: '', direccion: '' })
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const wrapRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

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
        const encoded = encodeURIComponent(q.trim())
        const res = await fetch(
          `/api/contribuyentes?limit=10&where[or][0][nombre][contains]=${encoded}&where[or][1][apellido][contains]=${encoded}&where[or][2][dni][contains]=${encoded}`,
          { credentials: 'include' },
        )
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
  }

  function clearSelection() {
    onChange(null)
    setQuery('')
  }

  async function handleCreateNew() {
    setCreateError('')
    if (!newForm.nombre.trim() || !newForm.apellido.trim() || !newForm.dni.trim()) {
      setCreateError('Nombre, apellido y DNI son obligatorios.')
      return
    }
    setCreating(true)
    try {
      const res = await fetch('/api/contribuyentes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          nombre: newForm.nombre.trim(),
          apellido: newForm.apellido.trim(),
          dni: newForm.dni.trim(),
          telefono: newForm.telefono.trim() || undefined,
          email: newForm.email.trim() || undefined,
          direccion: newForm.direccion.trim() || undefined,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.errors?.[0]?.message || 'Error al crear contribuyente.')
      }
      const created = await res.json()
      selectContribuyente(created.doc)
      setShowNewForm(false)
      setNewForm({ nombre: '', apellido: '', dni: '', telefono: '', email: '', direccion: '' })
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setCreating(false)
    }
  }

  // Selected state
  if (value) {
    return (
      <div className="contrib-selected">
        <div className="contrib-selected-avatar">
          <IconUser size={18} />
        </div>
        <div className="contrib-selected-info">
          <span className="contrib-selected-name">{value.nombre} {value.apellido}</span>
          <span className="contrib-selected-dni">DNI: {value.dni}{value.telefono ? ` · Tel: ${value.telefono}` : ''}</span>
        </div>
        <button type="button" className="contrib-clear-btn" onClick={clearSelection}>
          <IconX size={16} />
        </button>
      </div>
    )
  }

  return (
    <div className="contrib-search-wrap" ref={wrapRef}>
      {/* Search input */}
      <div className="contrib-search-input-wrap">
        <IconSearch size={16} className="contrib-search-icon" />
        <input
          id="contrib-search"
          type="text"
          className="contrib-search-input"
          placeholder="Buscar por nombre o DNI..."
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => { if (results.length > 0) setShowDropdown(true) }}
        />
        {searching && <span className="loading loading-spinner loading-xs contrib-search-spinner" />}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div className="contrib-dropdown">
          {results.length > 0 ? (
            results.map((c) => (
              <button
                key={c.id}
                type="button"
                className="contrib-dropdown-item"
                onClick={() => selectContribuyente(c)}
              >
                <div className="contrib-dropdown-avatar">
                  {c.nombre.charAt(0)}{c.apellido.charAt(0)}
                </div>
                <div className="contrib-dropdown-info">
                  <span className="contrib-dropdown-name">{c.nombre} {c.apellido}</span>
                  <span className="contrib-dropdown-dni">DNI: {c.dni}</span>
                </div>
                <IconCheck size={16} className="contrib-dropdown-check" />
              </button>
            ))
          ) : (
            <div className="contrib-dropdown-empty">
              No se encontraron contribuyentes.
            </div>
          )}
          <button
            type="button"
            className="contrib-dropdown-new"
            onClick={() => { setShowNewForm(true); setShowDropdown(false) }}
          >
            <IconPlus size={16} />
            Nuevo Contribuyente
          </button>
        </div>
      )}

      {/* New inline button when no dropdown */}
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

      {/* New contribuyente inline form */}
      {showNewForm && (
        <div className="contrib-new-form">
          <div className="contrib-new-header">
            <span>Nuevo Contribuyente</span>
            <button type="button" className="modal-close-btn" onClick={() => { setShowNewForm(false); setCreateError('') }}>
              <IconX size={16} />
            </button>
          </div>
          {createError && <div className="modal-error" style={{ marginBottom: 12 }}><span>{createError}</span></div>}
          <div className="modal-row">
            <div className="modal-field">
              <label className="modal-label">Nombre <span className="modal-required">*</span></label>
              <input className="modal-input" placeholder="Nombre" value={newForm.nombre} onChange={(e) => setNewForm((p) => ({ ...p, nombre: e.target.value }))} />
            </div>
            <div className="modal-field">
              <label className="modal-label">Apellido <span className="modal-required">*</span></label>
              <input className="modal-input" placeholder="Apellido" value={newForm.apellido} onChange={(e) => setNewForm((p) => ({ ...p, apellido: e.target.value }))} />
            </div>
          </div>
          <div className="modal-row">
            <div className="modal-field">
              <label className="modal-label">DNI <span className="modal-required">*</span></label>
              <input className="modal-input" placeholder="DNI" value={newForm.dni} onChange={(e) => setNewForm((p) => ({ ...p, dni: e.target.value }))} />
            </div>
            <div className="modal-field">
              <label className="modal-label">Teléfono</label>
              <input className="modal-input" placeholder="Teléfono" value={newForm.telefono} onChange={(e) => setNewForm((p) => ({ ...p, telefono: e.target.value }))} />
            </div>
          </div>
          <div className="modal-row">
            <div className="modal-field">
              <label className="modal-label">Email</label>
              <input className="modal-input" placeholder="Email" value={newForm.email} onChange={(e) => setNewForm((p) => ({ ...p, email: e.target.value }))} />
            </div>
            <div className="modal-field">
              <label className="modal-label">Dirección</label>
              <input className="modal-input" placeholder="Dirección" value={newForm.direccion} onChange={(e) => setNewForm((p) => ({ ...p, direccion: e.target.value }))} />
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="modal-btn modal-btn--cancel" onClick={() => { setShowNewForm(false); setCreateError('') }}>
              Cancelar
            </button>
            <button type="button" className={`modal-btn modal-btn--submit ${creating ? 'modal-btn--loading' : ''}`} disabled={creating} onClick={handleCreateNew}>
              {creating ? <span className="loading loading-spinner loading-sm" /> : <><IconCheck size={16} /> Crear</>}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
