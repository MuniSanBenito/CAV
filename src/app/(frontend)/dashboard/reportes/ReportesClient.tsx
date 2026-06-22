'use client'

import React, { useState } from 'react'
import {
  IconSearch,
  IconDownload,
  IconFilter,
  IconFileSpreadsheet,
  IconX,
} from '@tabler/icons-react'

interface Area {
  id: string
  nombre: string
}

interface ReclamoRow {
  numero: number
  fecha: string
  tipo: string
  estado: string
  prioridad: string
  area: string
  concepto: string
  contribuyente: string
  dni: string
  direccion: string
  barrio: string
}

const TIPO_OPTIONS = [
  { value: 'reclamo', label: 'Reclamo' },
  { value: 'sugerencia', label: 'Sugerencia' },
  { value: 'denuncia', label: 'Denuncia' },
  { value: 'consulta', label: 'Consulta' },
]

const ESTADO_OPTIONS = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'en_proceso', label: 'En Proceso' },
  { value: 'resuelto', label: 'Resuelto' },
  { value: 'rechazado', label: 'Rechazado' },
]

const ESTADO_BADGE: Record<string, string> = {
  pendiente: 'badge-warning',
  en_proceso: 'badge-info',
  resuelto: 'badge-success',
  rechazado: 'badge-error',
}

const TIPO_LABEL: Record<string, string> = {
  reclamo: 'Reclamo',
  sugerencia: 'Sugerencia',
  denuncia: 'Denuncia',
  consulta: 'Consulta',
}

const ESTADO_LABEL: Record<string, string> = {
  pendiente: 'Pendiente',
  en_proceso: 'En Proceso',
  resuelto: 'Resuelto',
  rechazado: 'Rechazado',
}

function buildQueryString(filters: {
  fechaDesde: string
  fechaHasta: string
  estados: string[]
  tipos: string[]
  areaId: string
}) {
  const params = new URLSearchParams()
  if (filters.fechaDesde) params.set('fechaDesde', filters.fechaDesde)
  if (filters.fechaHasta) params.set('fechaHasta', filters.fechaHasta)
  if (filters.estados.length > 0) params.set('estado', filters.estados.join(','))
  if (filters.tipos.length > 0) params.set('tipo', filters.tipos.join(','))
  if (filters.areaId) params.set('areaId', filters.areaId)
  return params.toString()
}

function toggleValue(arr: string[], val: string): string[] {
  return arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val]
}

export default function ReportesClient({ areas }: { areas: Area[] }) {
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [estados, setEstados] = useState<string[]>([])
  const [tipos, setTipos] = useState<string[]>([])
  const [areaId, setAreaId] = useState('')

  const [resultados, setResultados] = useState<ReclamoRow[] | null>(null)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState('')

  const filters = { fechaDesde, fechaHasta, estados, tipos, areaId }

  async function handleBuscar() {
    setLoading(true)
    setError('')
    try {
      const qs = buildQueryString(filters)
      const res = await fetch(`/api/reportes?${qs}`, { credentials: 'include' })
      if (!res.ok) throw new Error('Error al obtener datos')
      const json = await res.json()
      setResultados(json.data)
      setTotal(json.total)
    } catch {
      setError('No se pudieron obtener los datos. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  async function handleExportar() {
    setExporting(true)
    setError('')
    try {
      const qs = buildQueryString(filters)
      const res = await fetch(`/api/reportes?${qs}`, { credentials: 'include' })
      if (!res.ok) throw new Error('Error al obtener datos')
      const json = await res.json()
      const rows: ReclamoRow[] = json.data

      const XLSX = await import('xlsx')

      const wsData = rows.map((r) => ({
        'N° Reclamo': r.numero,
        Fecha: r.fecha,
        Tipo: TIPO_LABEL[r.tipo] || r.tipo,
        Estado: ESTADO_LABEL[r.estado] || r.estado,
        Prioridad: r.prioridad,
        'Área Derivada': r.area,
        Concepto: r.concepto,
        Contribuyente: r.contribuyente,
        DNI: r.dni,
        Dirección: r.direccion,
        Barrio: r.barrio,
      }))

      const ws = XLSX.utils.json_to_sheet(wsData)

      const colWidths = [
        { wch: 12 },
        { wch: 14 },
        { wch: 12 },
        { wch: 12 },
        { wch: 10 },
        { wch: 22 },
        { wch: 25 },
        { wch: 28 },
        { wch: 12 },
        { wch: 30 },
        { wch: 20 },
      ]
      ws['!cols'] = colWidths

      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Reclamos')

      const fecha = new Date().toISOString().slice(0, 10)
      XLSX.writeFile(wb, `reporte_reclamos_${fecha}.xlsx`)
    } catch {
      setError('Error al generar el Excel. Intentá de nuevo.')
    } finally {
      setExporting(false)
    }
  }

  function handleLimpiar() {
    setFechaDesde('')
    setFechaHasta('')
    setEstados([])
    setTipos([])
    setAreaId('')
    setResultados(null)
    setTotal(0)
    setError('')
  }

  const hasFilters =
    fechaDesde || fechaHasta || estados.length > 0 || tipos.length > 0 || areaId

  return (
    <div className="dash-home">
      {/* Header */}
      <div className="dash-welcome" style={{ animationDelay: '0s' }}>
        <div className="dash-welcome-text">
          <h1 className="dash-welcome-title">Reportes</h1>
          <p className="dash-welcome-sub">
            Filtrá y exportá reclamos a Excel para su análisis
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="nuevo-section" style={{ animationDelay: '0.1s' }}>
        <div className="nuevo-section-header">
          <IconFilter size={20} stroke={1.5} />
          <span>Filtros</span>
          {hasFilters && (
            <button
              onClick={handleLimpiar}
              style={{
                marginLeft: 'auto',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                fontSize: '0.8rem',
                color: 'var(--theme-text-muted)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <IconX size={14} />
              Limpiar
            </button>
          )}
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: '1rem',
          }}
        >
          {/* Fecha desde */}
          <div className="nuevo-field">
            <label className="nuevo-label">Fecha desde</label>
            <input
              type="date"
              className="nuevo-input"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
            />
          </div>

          {/* Fecha hasta */}
          <div className="nuevo-field">
            <label className="nuevo-label">Fecha hasta</label>
            <input
              type="date"
              className="nuevo-input"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
            />
          </div>

          {/* Área */}
          <div className="nuevo-field">
            <label className="nuevo-label">Área derivada</label>
            <select
              className="nuevo-select"
              value={areaId}
              onChange={(e) => setAreaId(e.target.value)}
            >
              <option value="">Todas las áreas</option>
              {areas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Estados */}
        <div className="nuevo-field" style={{ marginTop: '0.75rem' }}>
          <label className="nuevo-label">Estado</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {ESTADO_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setEstados(toggleValue(estados, opt.value))}
                style={{
                  padding: '0.3rem 0.75rem',
                  borderRadius: 'var(--border-radius-s)',
                  border: '1.5px solid',
                  borderColor: estados.includes(opt.value)
                    ? 'var(--theme-success-500, #22c55e)'
                    : 'var(--theme-elevation-200)',
                  background: estados.includes(opt.value)
                    ? 'var(--theme-success-100, #dcfce7)'
                    : 'var(--theme-elevation-50)',
                  color: estados.includes(opt.value)
                    ? 'var(--theme-success-700, #15803d)'
                    : 'inherit',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: estados.includes(opt.value) ? 600 : 400,
                  transition: 'all 0.15s',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tipos */}
        <div className="nuevo-field" style={{ marginTop: '0.75rem' }}>
          <label className="nuevo-label">Tipo</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {TIPO_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setTipos(toggleValue(tipos, opt.value))}
                style={{
                  padding: '0.3rem 0.75rem',
                  borderRadius: 'var(--border-radius-s)',
                  border: '1.5px solid',
                  borderColor: tipos.includes(opt.value)
                    ? 'var(--theme-success-500, #22c55e)'
                    : 'var(--theme-elevation-200)',
                  background: tipos.includes(opt.value)
                    ? 'var(--theme-success-100, #dcfce7)'
                    : 'var(--theme-elevation-50)',
                  color: tipos.includes(opt.value)
                    ? 'var(--theme-success-700, #15803d)'
                    : 'inherit',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: tipos.includes(opt.value) ? 600 : 400,
                  transition: 'all 0.15s',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Acciones */}
        <div
          style={{
            marginTop: '1.25rem',
            display: 'flex',
            gap: '0.75rem',
            flexWrap: 'wrap',
          }}
        >
          <button
            className="dash-action-btn dash-action-btn--primary"
            onClick={handleBuscar}
            disabled={loading}
          >
            <IconSearch size={18} />
            {loading ? 'Buscando…' : 'Buscar'}
          </button>

          {resultados !== null && resultados.length > 0 && (
            <button
              className="dash-action-btn dash-action-btn--secondary"
              onClick={handleExportar}
              disabled={exporting}
            >
              <IconDownload size={18} />
              {exporting ? 'Generando…' : `Exportar Excel (${total})`}
            </button>
          )}
        </div>

        {error && (
          <p
            style={{
              marginTop: '0.75rem',
              color: 'var(--theme-error-500, #ef4444)',
              fontSize: '0.875rem',
            }}
          >
            {error}
          </p>
        )}
      </div>

      {/* Resultados */}
      {resultados !== null && (
        <div className="nuevo-section" style={{ animationDelay: '0.2s' }}>
          <div className="nuevo-section-header">
            <IconFileSpreadsheet size={20} stroke={1.5} />
            <span>
              {total === 0
                ? 'Sin resultados'
                : `${total} resultado${total !== 1 ? 's' : ''}${total > 50 ? ' (mostrando primeros 50)' : ''}`}
            </span>
          </div>

          {resultados.length === 0 ? (
            <p style={{ color: 'var(--theme-text-muted)', fontSize: '0.9rem' }}>
              No hay reclamos que coincidan con los filtros seleccionados.
            </p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '0.85rem',
                }}
              >
                <thead>
                  <tr
                    style={{
                      borderBottom: '2px solid var(--theme-elevation-200)',
                      textAlign: 'left',
                    }}
                  >
                    {[
                      'N°',
                      'Fecha',
                      'Tipo',
                      'Estado',
                      'Área',
                      'Concepto',
                      'Contribuyente',
                      'Dirección',
                    ].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: '0.5rem 0.75rem',
                          fontWeight: 600,
                          color: 'var(--theme-text-muted)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {resultados.slice(0, 50).map((r) => (
                    <tr
                      key={r.numero}
                      style={{ borderBottom: '1px solid var(--theme-elevation-100)' }}
                    >
                      <td style={{ padding: '0.5rem 0.75rem', fontWeight: 600 }}>
                        #{r.numero}
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem', whiteSpace: 'nowrap' }}>
                        {r.fecha}
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem' }}>
                        {TIPO_LABEL[r.tipo] || r.tipo}
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem' }}>
                        <span
                          className={`badge badge-sm ${ESTADO_BADGE[r.estado] || ''}`}
                        >
                          {ESTADO_LABEL[r.estado] || r.estado}
                        </span>
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem' }}>{r.area || '—'}</td>
                      <td style={{ padding: '0.5rem 0.75rem' }}>{r.concepto || '—'}</td>
                      <td style={{ padding: '0.5rem 0.75rem' }}>
                        {r.contribuyente || '—'}
                      </td>
                      <td
                        style={{
                          padding: '0.5rem 0.75rem',
                          maxWidth: '200px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={r.direccion}
                      >
                        {r.direccion || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
