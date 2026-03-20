'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
  type ColumnFiltersState,
} from '@tanstack/react-table'
import {
  IconPlus,
  IconSearch,
  IconChevronLeft,
  IconChevronRight,
  IconSelector,
  IconSortAscending,
  IconSortDescending,
  IconFilter,
  IconRefresh,
} from '@tabler/icons-react'

interface Area {
  id: string
  nombre: string
}

interface Contribuyente {
  id: string
  nombre: string
  apellido: string
  dni: string
}

interface Reclamo {
  id: string
  numero: number
  tipo: string
  descripcion: string
  medio: string
  area_derivada: Area | string
  estado: string
  prioridad: string
  contribuyente: Contribuyente | string
  createdAt: string
}

const estadoLabel: Record<string, string> = {
  pendiente: 'Pendiente',
  en_proceso: 'En Proceso',
  resuelto: 'Resuelto',
  rechazado: 'Rechazado',
}

const prioridadLabel: Record<string, string> = {
  baja: 'Baja',
  media: 'Media',
  alta: 'Alta',
  urgente: 'Urgente',
}

const tipoLabel: Record<string, string> = {
  reclamo: 'Reclamo',
  sugerencia: 'Sugerencia',
  denuncia: 'Denuncia',
  consulta: 'Consulta',
}

const estadoBadge: Record<string, string> = {
  pendiente: 'dash-badge--pending',
  en_proceso: 'dash-badge--progress',
  resuelto: 'dash-badge--resolved',
  rechazado: 'dash-badge--rejected',
}

const prioridadBadge: Record<string, string> = {
  baja: 'dash-badge--low',
  media: 'dash-badge--medium',
  alta: 'dash-badge--high',
  urgente: 'dash-badge--urgent',
}

const tipoBadge: Record<string, string> = {
  reclamo: 'dash-badge--pending',
  sugerencia: 'dash-badge--progress',
  denuncia: 'dash-badge--rejected',
  consulta: 'dash-badge--low',
}

const columnHelper = createColumnHelper<Reclamo>()

export default function ReclamosTable() {
  const router = useRouter()
  const [data, setData] = useState<Reclamo[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [loading, setLoading] = useState(true)
  const [globalFilter, setGlobalFilter] = useState('')
  const [sorting, setSorting] = useState<SortingState>([{ id: 'numero', desc: true }])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  function fetchData() {
    setLoading(true)
    Promise.all([
      fetch('/api/reclamos?limit=500&sort=-numero&depth=1', { credentials: 'include' }).then((r) => r.json()),
      fetch('/api/areas?limit=100', { credentials: 'include' }).then((r) => r.json()),
    ])
      .then(([reclamosData, areasData]) => {
        if (reclamosData?.docs) setData(reclamosData.docs)
        if (areasData?.docs) setAreas(areasData.docs)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [])

  const columns = useMemo(() => [
    columnHelper.accessor('numero', {
      header: 'Nº',
      cell: (info) => (
        <span className="reclamos-cell-numero">#{info.getValue()}</span>
      ),
      size: 70,
    }),
    columnHelper.accessor('tipo', {
      header: 'Tipo',
      cell: (info) => (
        <span className={`dash-badge ${tipoBadge[info.getValue()] || ''}`}>
          {tipoLabel[info.getValue()] || info.getValue()}
        </span>
      ),
      filterFn: 'equalsString',
    }),
    columnHelper.accessor((row) => {
      if (typeof row.contribuyente === 'object' && row.contribuyente !== null) {
        return `${row.contribuyente.nombre} ${row.contribuyente.apellido}`
      }
      return ''
    }, {
      id: 'contribuyente',
      header: 'Contribuyente',
      cell: (info) => <span className="reclamos-cell-title">{info.getValue() || '—'}</span>,
    }),
    columnHelper.accessor((row) => {
      if (typeof row.area_derivada === 'object' && row.area_derivada !== null) return row.area_derivada.nombre
      return ''
    }, {
      id: 'area_derivada',
      header: 'Área Derivada',
      cell: (info) => info.getValue(),
      filterFn: 'equalsString',
    }),
    columnHelper.accessor('estado', {
      header: 'Estado',
      cell: (info) => (
        <span className={`dash-badge ${estadoBadge[info.getValue()] || ''}`}>
          {estadoLabel[info.getValue()] || info.getValue()}
        </span>
      ),
      filterFn: 'equalsString',
    }),
    columnHelper.accessor('prioridad', {
      header: 'Prioridad',
      cell: (info) => (
        <span className={`dash-badge ${prioridadBadge[info.getValue()] || ''}`}>
          {prioridadLabel[info.getValue()] || info.getValue()}
        </span>
      ),
      filterFn: 'equalsString',
    }),
    columnHelper.accessor('createdAt', {
      header: 'Fecha',
      cell: (info) =>
        new Date(info.getValue()).toLocaleDateString('es-AR', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }),
    }),
  ], [])

  const table = useReactTable({
    data,
    columns,
    state: { globalFilter, sorting, columnFilters },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: { pagination: { pageSize: 15 } },
  })

  return (
    <div className="reclamos-page">
      {/* Header */}
      <div className="reclamos-header">
        <div>
          <h1 className="reclamos-title">Reclamos</h1>
          <p className="reclamos-subtitle">
            {data.length} reclamo{data.length !== 1 ? 's' : ''} registrado{data.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          id="btn-nuevo-reclamo"
          className="dash-action-btn dash-action-btn--primary"
          onClick={() => router.push('/dashboard/reclamos/nuevo')}
        >
          <IconPlus size={18} />
          Nuevo Reclamo
        </button>
      </div>

      {/* Toolbar */}
      <div className="reclamos-toolbar">
        <div className="reclamos-search-wrap">
          <IconSearch size={18} stroke={1.6} className="reclamos-search-icon" />
          <input
            id="reclamos-search"
            type="text"
            className="reclamos-search"
            placeholder="Buscar por contribuyente, descripción..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
          />
        </div>

        <div className="reclamos-filters">
          <div className="reclamos-filter-group">
            <IconFilter size={16} />
            <select
              id="filter-estado"
              className="reclamos-filter-select"
              value={(columnFilters.find((f) => f.id === 'estado')?.value as string) || ''}
              onChange={(e) => {
                setColumnFilters((prev) => {
                  const next = prev.filter((f) => f.id !== 'estado')
                  if (e.target.value) next.push({ id: 'estado', value: e.target.value })
                  return next
                })
              }}
            >
              <option value="">Todos los estados</option>
              <option value="pendiente">Pendiente</option>
              <option value="en_proceso">En Proceso</option>
              <option value="resuelto">Resuelto</option>
              <option value="rechazado">Rechazado</option>
            </select>
          </div>

          <div className="reclamos-filter-group">
            <select
              id="filter-tipo"
              className="reclamos-filter-select"
              value={(columnFilters.find((f) => f.id === 'tipo')?.value as string) || ''}
              onChange={(e) => {
                setColumnFilters((prev) => {
                  const next = prev.filter((f) => f.id !== 'tipo')
                  if (e.target.value) next.push({ id: 'tipo', value: e.target.value })
                  return next
                })
              }}
            >
              <option value="">Todos los tipos</option>
              <option value="reclamo">Reclamo</option>
              <option value="sugerencia">Sugerencia</option>
              <option value="denuncia">Denuncia</option>
              <option value="consulta">Consulta</option>
            </select>
          </div>

          <div className="reclamos-filter-group">
            <select
              id="filter-area"
              className="reclamos-filter-select"
              value={(columnFilters.find((f) => f.id === 'area_derivada')?.value as string) || ''}
              onChange={(e) => {
                setColumnFilters((prev) => {
                  const next = prev.filter((f) => f.id !== 'area_derivada')
                  if (e.target.value) next.push({ id: 'area_derivada', value: e.target.value })
                  return next
                })
              }}
            >
              <option value="">Todas las áreas</option>
              {areas.map((a) => (
                <option key={a.id} value={a.nombre}>{a.nombre}</option>
              ))}
            </select>
          </div>

          <button className="reclamos-refresh-btn" onClick={fetchData} title="Actualizar">
            <IconRefresh size={18} className={loading ? 'spin-animation' : ''} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="reclamos-table-wrap">
        {loading ? (
          <div className="dash-loading">
            <span className="loading loading-spinner loading-lg" />
          </div>
        ) : (
          <table className="reclamos-table">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className={header.column.getCanSort() ? 'sortable-th' : ''}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className="th-content">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() && (
                          <span className="sort-icon">
                            {header.column.getIsSorted() === 'asc' ? (
                              <IconSortAscending size={14} />
                            ) : header.column.getIsSorted() === 'desc' ? (
                              <IconSortDescending size={14} />
                            ) : (
                              <IconSelector size={14} />
                            )}
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="reclamos-empty-cell">
                    No se encontraron reclamos.
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr 
                    key={row.id}
                    onClick={() => router.push(`/dashboard/reclamos/${row.original.id}`)}
                    className="cursor-pointer"
                    style={{ cursor: 'pointer' }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {!loading && data.length > 0 && (
        <div className="reclamos-pagination">
          <span className="reclamos-pagination-info">
            Mostrando {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}–
            {Math.min(
              (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
              table.getFilteredRowModel().rows.length,
            )}{' '}
            de {table.getFilteredRowModel().rows.length}
          </span>
          <div className="reclamos-pagination-btns">
            <button
              className="reclamos-page-btn"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <IconChevronLeft size={18} />
            </button>
            <span className="reclamos-page-current">
              {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
            </span>
            <button
              className="reclamos-page-btn"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <IconChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
