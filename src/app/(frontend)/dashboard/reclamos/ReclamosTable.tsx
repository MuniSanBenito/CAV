'use client'

import React, { useEffect, useState, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
  type ColumnFiltersState,
  type PaginationState,
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
import {
  estadoLabel,
  estadoBadgeClass,
  prioridadLabel,
  prioridadBadgeClass,
  tipoLabel,
  tipoBadgeClass,
} from '@/lib/constants'

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

// All label/badge constants imported from @/lib/constants
const estadoBadge = estadoBadgeClass
const prioridadBadge = prioridadBadgeClass
const tipoBadge = tipoBadgeClass

const columnHelper = createColumnHelper<Reclamo>()

// Map tanstack column id -> Payload sort field
const SORT_FIELD_MAP: Record<string, string> = {
  numero: 'numero',
  tipo: 'tipo',
  contribuyente: 'contribuyente.apellido',
  area_derivada: 'area_derivada',
  estado: 'estado',
  prioridad: 'prioridad',
  createdAt: 'createdAt',
}

export default function ReclamosTable() {
  const router = useRouter()
  const [data, setData] = useState<Reclamo[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [userRole, setUserRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [fetching, setFetching] = useState(false)

  // Server-side totals
  const [totalDocs, setTotalDocs] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  // Table state
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 15 })
  const [sorting, setSorting] = useState<SortingState>([{ id: 'numero', desc: true }])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const firstLoadDone = useRef(false)

  // Debounce search input (350ms) and reset to page 0
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(globalFilter.trim()), 350)
    return () => clearTimeout(t)
  }, [globalFilter])

  // Reset to first page when filters/search/sort change
  useEffect(() => {
    setPagination((p) => (p.pageIndex === 0 ? p : { ...p, pageIndex: 0 }))
  }, [columnFilters, sorting, debouncedSearch])

  // Load static data (areas + user) once
  useEffect(() => {
    Promise.all([
      fetch('/api/areas?limit=100', { credentials: 'include' }).then((r) => r.json()),
      fetch('/api/users/me', { credentials: 'include' }).then((r) => r.json()),
    ])
      .then(([areasData, userData]) => {
        if (areasData?.docs) setAreas(areasData.docs)
        if (userData?.user?.role) setUserRole(userData.user.role)
      })
      .catch(() => {})
  }, [])

  // Fetch paginated reclamos whenever query state changes
  useEffect(() => {
    const controller = new AbortController()

    if (!firstLoadDone.current) setLoading(true)
    else setFetching(true)

    const params = new URLSearchParams()
    params.set('limit', String(pagination.pageSize))
    params.set('page', String(pagination.pageIndex + 1))
    params.set('depth', '1')

    // Sort
    const sort = sorting[0]
    const sortField = sort ? SORT_FIELD_MAP[sort.id] || sort.id : 'numero'
    const sortDir = sort?.desc === false ? '' : '-'
    params.set('sort', `${sortDir}${sortField}`)

    // Column filters
    const estado = columnFilters.find((f) => f.id === 'estado')?.value as string | undefined
    if (estado) params.set('where[estado][equals]', estado)
    const tipo = columnFilters.find((f) => f.id === 'tipo')?.value as string | undefined
    if (tipo) params.set('where[tipo][equals]', tipo)
    const areaId = columnFilters.find((f) => f.id === 'area_derivada')?.value as string | undefined
    if (areaId) params.set('where[area_derivada][equals]', areaId)

    // Global search: OR across descripcion, contribuyente.*, numero
    if (debouncedSearch) {
      params.set('where[or][0][descripcion][like]', debouncedSearch)
      params.set('where[or][1][contribuyente.nombre][like]', debouncedSearch)
      params.set('where[or][2][contribuyente.apellido][like]', debouncedSearch)
      params.set('where[or][3][contribuyente.dni][like]', debouncedSearch)
      const asNumber = Number(debouncedSearch)
      if (!Number.isNaN(asNumber) && /^\d+$/.test(debouncedSearch)) {
        params.set('where[or][4][numero][equals]', String(asNumber))
      }
    }

    fetch(`/api/reclamos?${params.toString()}`, {
      credentials: 'include',
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then((json) => {
        if (json?.docs) {
          setData(json.docs)
          setTotalDocs(json.totalDocs ?? 0)
          setTotalPages(json.totalPages ?? 1)
        }
      })
      .catch((e) => {
        if ((e as Error).name !== 'AbortError') console.error('Error fetching reclamos', e)
      })
      .finally(() => {
        firstLoadDone.current = true
        setLoading(false)
        setFetching(false)
      })

    return () => controller.abort()
  }, [
    pagination.pageIndex,
    pagination.pageSize,
    sorting,
    columnFilters,
    debouncedSearch,
    refreshKey,
  ])

  const fetchData = () => setRefreshKey((k) => k + 1)

  const columns = useMemo(
    () => [
      columnHelper.accessor('numero', {
        header: 'Nº',
        cell: (info) => <span className="reclamos-cell-numero">#{info.getValue()}</span>,
        size: 70,
      }),
      columnHelper.accessor('tipo', {
        header: 'Tipo',
        cell: (info) => (
          <span className={`dash-badge ${tipoBadge[info.getValue()] || ''}`}>
            {tipoLabel[info.getValue()] || info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor(
        (row) => {
          if (typeof row.contribuyente === 'object' && row.contribuyente !== null) {
            return `${row.contribuyente.nombre} ${row.contribuyente.apellido}`
          }
          return ''
        },
        {
          id: 'contribuyente',
          header: 'Contribuyente',
          cell: (info) => <span className="reclamos-cell-title">{info.getValue() || '—'}</span>,
        },
      ),
      columnHelper.accessor(
        (row) => {
          if (typeof row.area_derivada === 'object' && row.area_derivada !== null)
            return row.area_derivada.nombre
          return ''
        },
        {
          id: 'area_derivada',
          header: 'Área Derivada',
          cell: (info) => info.getValue() || '—',
          enableSorting: false,
        },
      ),
      columnHelper.accessor('estado', {
        header: 'Estado',
        cell: (info) => (
          <span className={`dash-badge ${estadoBadge[info.getValue()] || ''}`}>
            {estadoLabel[info.getValue()] || info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor('prioridad', {
        header: 'Prioridad',
        cell: (info) => (
          <span className={`dash-badge ${prioridadBadge[info.getValue()] || ''}`}>
            {prioridadLabel[info.getValue()] || info.getValue()}
          </span>
        ),
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
    ],
    [],
  )

  const table = useReactTable({
    data,
    columns,
    state: { pagination, sorting, columnFilters, globalFilter },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    pageCount: totalPages,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="reclamos-page">
      {/* Header */}
      <div className="reclamos-header">
        <div>
          <h1 className="reclamos-title">Reclamos</h1>
          <p className="reclamos-subtitle">
            {totalDocs.toLocaleString('es-AR')} reclamo{totalDocs !== 1 ? 's' : ''} registrado
            {totalDocs !== 1 ? 's' : ''}
          </p>
        </div>
        {userRole !== 'visualizador' && (
          <button
            id="btn-nuevo-reclamo"
            className="dash-action-btn dash-action-btn--primary"
            onClick={() => router.push('/dashboard/reclamos/nuevo')}
          >
            <IconPlus size={18} />
            Nuevo Reclamo
          </button>
        )}
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
                <option key={a.id} value={a.id}>
                  {a.nombre}
                </option>
              ))}
            </select>
          </div>

          <button className="reclamos-refresh-btn" onClick={fetchData} title="Actualizar">
            <IconRefresh size={18} className={fetching || loading ? 'spin-animation' : ''} />
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
      {!loading && totalDocs > 0 && (
        <div className="reclamos-pagination">
          <span className="reclamos-pagination-info">
            Mostrando {pagination.pageIndex * pagination.pageSize + 1}–
            {Math.min((pagination.pageIndex + 1) * pagination.pageSize, totalDocs)} de{' '}
            {totalDocs.toLocaleString('es-AR')}
            {fetching && (
              <span
                className="loading loading-spinner loading-xs"
                style={{ marginLeft: '0.5rem' }}
              />
            )}
          </span>
          <div className="reclamos-pagination-btns">
            <select
              className="reclamos-filter-select"
              value={pagination.pageSize}
              onChange={(e) => setPagination({ pageIndex: 0, pageSize: Number(e.target.value) })}
              title="Filas por página"
            >
              <option value={15}>15 / pág</option>
              <option value={30}>30 / pág</option>
              <option value={50}>50 / pág</option>
              <option value={100}>100 / pág</option>
            </select>
            <button
              className="reclamos-page-btn"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage() || fetching}
            >
              <IconChevronLeft size={18} />
            </button>
            <span className="reclamos-page-current">
              {pagination.pageIndex + 1} / {totalPages}
            </span>
            <button
              className="reclamos-page-btn"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage() || fetching}
            >
              <IconChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
