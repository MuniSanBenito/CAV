'use client'

import {
  estadoBadgeClass,
  estadoLabel,
  getSlaStatus,
  medioLabel,
  prioridadBadgeClass,
  prioridadLabel,
  slaBadgeClass,
  slaLabel,
  tipoBadgeClass,
  tipoLabel,
} from '@/lib/constants'
import { buildContribuyenteSearchParams } from '@/lib/contribuyente-map'
import {
  IconChevronLeft,
  IconChevronRight,
  IconDownload,
  IconFilter,
  IconPlus,
  IconRefresh,
  IconSearch,
  IconSelector,
  IconSortAscending,
  IconSortDescending,
} from '@tabler/icons-react'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnFiltersState,
  type PaginationState,
  type SortingState,
} from '@tanstack/react-table'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'

interface Area {
  id: string
  nombre: string
}

interface Contribuyente {
  id: string
  nombre?: string | null
  numero_documento?: string | null
  telefono_web?: string | null
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
  contribuyente: Contribuyente
  createdAt: string
  fechaCompromiso?: string | null
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
  area_derivada: 'area_derivada',
  estado: 'estado',
  prioridad: 'prioridad',
  createdAt: 'createdAt',
}

async function fetchContribuyenteIdsForSearch(query: string): Promise<string[]> {
  if (!query.trim()) return []
  try {
    const params = buildContribuyenteSearchParams(query, 20)
    const res = await fetch(`/api/contribuyentes?${params}`, { credentials: 'include' })
    const data = await res.json()
    return (data?.docs || []).map((c: { id: string }) => c.id)
  } catch {
    return []
  }
}

function escapeCsvCell(value: unknown): string {
  const str = value == null ? '' : String(value)
  if (/[;"\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function toStartOfDayISO(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00`).toISOString()
}

function toEndOfDayISO(dateStr: string): string {
  return new Date(`${dateStr}T23:59:59.999`).toISOString()
}

function buildReclamosQueryParams(options: {
  columnFilters: ColumnFiltersState
  debouncedSearch: string
  sorting: SortingState
  fechaDesde?: string
  fechaHasta?: string
  pagination?: { pageIndex: number; pageSize: number }
  exportAll?: boolean
  contribuyenteIds?: string[]
}): URLSearchParams {
  const {
    columnFilters,
    debouncedSearch,
    sorting,
    fechaDesde,
    fechaHasta,
    pagination,
    exportAll,
    contribuyenteIds,
  } = options
  const params = new URLSearchParams()
  params.set('depth', '1')

  if (exportAll) {
    params.set('limit', '0')
  } else if (pagination) {
    params.set('limit', String(pagination.pageSize))
    params.set('page', String(pagination.pageIndex + 1))
  }

  const sort = sorting[0]
  const sortField =
    sort && sort.id !== 'contribuyente' ? SORT_FIELD_MAP[sort.id] || sort.id : 'numero'
  const sortDir = sort?.desc === false ? '' : '-'
  params.set('sort', `${sortDir}${sortField}`)

  const estado = columnFilters.find((f) => f.id === 'estado')?.value as string | undefined
  if (estado) params.set('where[estado][equals]', estado)
  const tipo = columnFilters.find((f) => f.id === 'tipo')?.value as string | undefined
  if (tipo) params.set('where[tipo][equals]', tipo)
  const areaId = columnFilters.find((f) => f.id === 'area_derivada')?.value as string | undefined
  if (areaId) params.set('where[area_derivada][equals]', areaId)
  const sla = columnFilters.find((f) => f.id === 'sla')?.value as string | undefined
  if (sla === 'vencido') {
    params.set('where[fechaCompromiso][less_than]', new Date().toISOString())
    params.set('where[estado][in]', 'pendiente,en_proceso')
  } else if (sla === 'por_vencer') {
    const limite = new Date(Date.now() + 48 * 60 * 60 * 1000)
    params.set('where[fechaCompromiso][greater_than_equal]', new Date().toISOString())
    params.set('where[fechaCompromiso][less_than_equal]', limite.toISOString())
    params.set('where[estado][in]', 'pendiente,en_proceso')
  }

  if (fechaDesde) {
    params.set('where[createdAt][greater_than_equal]', toStartOfDayISO(fechaDesde))
  }
  if (fechaHasta) {
    params.set('where[createdAt][less_than_equal]', toEndOfDayISO(fechaHasta))
  }

  if (debouncedSearch) {
    params.set('where[or][0][descripcion][like]', debouncedSearch)
    let orIndex = 1
    if (contribuyenteIds && contribuyenteIds.length > 0) {
      params.set(`where[or][${orIndex}][contribuyente.externoId][in]`, contribuyenteIds.join(','))
      orIndex += 1
    }
    const asNumber = Number(debouncedSearch)
    if (!Number.isNaN(asNumber) && /^\d+$/.test(debouncedSearch)) {
      params.set(`where[or][${orIndex}][numero][equals]`, String(asNumber))
    }
  }

  return params
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
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const [exporting, setExporting] = useState(false)
  const firstLoadDone = useRef(false)

  // Debounce search input (350ms) and reset to page 0
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(globalFilter.trim()), 350)
    return () => clearTimeout(t)
  }, [globalFilter])

  // Reset to first page when filters/search/sort change
  useEffect(() => {
    setPagination((p) => (p.pageIndex === 0 ? p : { ...p, pageIndex: 0 }))
  }, [columnFilters, sorting, debouncedSearch, fechaDesde, fechaHasta])

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

    async function loadReclamos() {
      if (!firstLoadDone.current) setLoading(true)
      else setFetching(true)

      try {
        const contribuyenteIds = debouncedSearch
          ? await fetchContribuyenteIdsForSearch(debouncedSearch)
          : undefined

        if (controller.signal.aborted) return

        const params = buildReclamosQueryParams({
          columnFilters,
          debouncedSearch,
          sorting,
          fechaDesde,
          fechaHasta,
          pagination,
          contribuyenteIds,
        })

        const res = await fetch(`/api/reclamos?${params.toString()}`, {
          credentials: 'include',
          signal: controller.signal,
        })
        const json = await res.json()

        if (controller.signal.aborted) return

        if (json?.docs) {
          setData(json.docs)
          setTotalDocs(json.totalDocs ?? 0)
          setTotalPages(json.totalPages ?? 1)
        }
      } catch (e) {
        if ((e as Error).name !== 'AbortError') console.error('Error fetching reclamos', e)
      } finally {
        if (!controller.signal.aborted) {
          firstLoadDone.current = true
          setLoading(false)
          setFetching(false)
        }
      }
    }

    loadReclamos()
    return () => controller.abort()
  }, [
    pagination.pageIndex,
    pagination.pageSize,
    sorting,
    columnFilters,
    debouncedSearch,
    fechaDesde,
    fechaHasta,
    refreshKey,
  ])

  const fetchData = () => setRefreshKey((k) => k + 1)

  async function handleExportCSV() {
    setExporting(true)
    try {
      const contribuyenteIds = debouncedSearch
        ? await fetchContribuyenteIdsForSearch(debouncedSearch)
        : undefined

      // Paginated fetch to avoid truncation on large datasets
      const pageSize = 100
      let allDocs: Record<string, unknown>[] = []
      let totalDocs = 0
      let currentPage = 1
      let totalPages = 1

      while (currentPage <= totalPages) {
        const params = buildReclamosQueryParams({
          columnFilters,
          debouncedSearch,
          sorting,
          fechaDesde,
          fechaHasta,
          pagination: { pageIndex: currentPage - 1, pageSize },
          contribuyenteIds,
        })

        const res = await fetch(`/api/reclamos?${params.toString()}`, {
          credentials: 'include',
        })
        const json = await res.json()
        const docs: Record<string, unknown>[] = json.docs || []
        allDocs = allDocs.concat(docs)
        totalDocs = json.totalDocs ?? allDocs.length
        totalPages = json.totalPages ?? Math.ceil(totalDocs / pageSize)
        currentPage += 1
      }

      if (allDocs.length === 0) {
        alert('No hay reclamos para exportar con los filtros actuales.')
        return
      }

      const headers = [
        'Número',
        'Tipo',
        'Estado',
        'Prioridad',
        'SLA',
        'Medio',
        'Área Receptora',
        'Área Derivada',
        'Concepto',
        'Contribuyente',
        'DNI',
        'Teléfono',
        'Descripción',
        'Dirección',
        'Barrio',
        'Observaciones',
        'Fecha Creación',
        'Fecha Compromiso',
        'Fecha Resolución',
      ]
      const rows = allDocs.map((r: Record<string, unknown>) => {
        const areaReceptora = r.area_receptora as Area | string | undefined
        const areaDerivada = r.area_derivada as Area | string | undefined
        const concepto = r.concepto as { nombre?: string } | string | undefined
        const contribuyente = r.contribuyente as Contribuyente | undefined
        const ubicacion = r.ubicacion as
          | { direccionIngresada?: string; barrio?: string }
          | undefined
        const slaStatus = getSlaStatus(
          (r.fechaCompromiso as string) ?? null,
          (r.estado as string) ?? null,
        )

        return [
          r.numero ?? '',
          tipoLabel[r.tipo as string] || (r.tipo ?? ''),
          estadoLabel[r.estado as string] || (r.estado ?? ''),
          prioridadLabel[r.prioridad as string] || (r.prioridad ?? ''),
          slaStatus ? slaLabel[slaStatus] : '',
          medioLabel[r.medio as string] || (r.medio ?? ''),
          typeof areaReceptora === 'object' && areaReceptora
            ? areaReceptora.nombre
            : (areaReceptora ?? ''),
          typeof areaDerivada === 'object' && areaDerivada
            ? areaDerivada.nombre
            : (areaDerivada ?? ''),
          typeof concepto === 'object' && concepto ? concepto.nombre : (concepto ?? ''),
          contribuyente?.nombre ?? '',
          contribuyente?.numero_documento ?? '',
          contribuyente?.telefono_web ?? '',
          r.descripcion ?? '',
          ubicacion?.direccionIngresada ?? '',
          ubicacion?.barrio ?? '',
          r.observaciones ?? '',
          r.createdAt
            ? new Date(r.createdAt as string).toLocaleDateString('es-AR')
            : '',
          r.fechaCompromiso
            ? new Date(r.fechaCompromiso as string).toLocaleDateString('es-AR')
            : '',
          r.fechaResolucion
            ? new Date(r.fechaResolucion as string).toLocaleDateString('es-AR')
            : '',
        ]
      })

      const csvContent = [headers, ...rows]
        .map((row) => row.map(escapeCsvCell).join(';'))
        .join('\n')
      const bom = '\uFEFF'
      const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `reclamos-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Error exportando CSV', err)
      alert('Error al exportar CSV.')
    } finally {
      setExporting(false)
    }
  }

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
      columnHelper.accessor((row) => row.contribuyente?.nombre ?? '', {
        id: 'contribuyente',
        header: 'Contribuyente',
        cell: (info) => <span className="reclamos-cell-title">{info.getValue() || '—'}</span>,
        enableSorting: false,
      }),
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
      columnHelper.accessor((row) => getSlaStatus(row.fechaCompromiso, row.estado), {
        id: 'sla',
        header: 'SLA',
        enableSorting: false,
        cell: (info) => {
          const status = info.getValue()
          if (!status) return '—'
          return (
            <span className={`dash-badge ${slaBadgeClass[status] || ''}`}>{slaLabel[status]}</span>
          )
        },
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
        {(userRole === 'admin' || userRole === 'carga') && (
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

        <div className="reclamos-toolbar-actions">
          <button
            className="reclamos-refresh-btn"
            onClick={handleExportCSV}
            title="Exportar CSV (todos los resultados filtrados)"
            disabled={exporting}
          >
            {exporting ? (
              <span className="loading loading-spinner loading-xs" />
            ) : (
              <IconDownload size={18} />
            )}
          </button>

          <button className="reclamos-refresh-btn" onClick={fetchData} title="Actualizar">
            <IconRefresh size={18} className={fetching || loading ? 'spin-animation' : ''} />
          </button>
        </div>
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

        <div className="reclamos-filter-group">
          <select
            id="filter-sla"
            className="reclamos-filter-select"
            value={(columnFilters.find((f) => f.id === 'sla')?.value as string) || ''}
            onChange={(e) => {
              setColumnFilters((prev) => {
                const next = prev.filter((f) => f.id !== 'sla')
                if (e.target.value) next.push({ id: 'sla', value: e.target.value })
                return next
              })
            }}
          >
            <option value="">SLA: todos</option>
            <option value="vencido">Vencidos</option>
            <option value="por_vencer">Por vencer (48hs)</option>
          </select>
        </div>

        <div className="reclamos-filter-group">
          <span className="reclamos-filter-label">Desde</span>
          <input
            id="filter-fecha-desde"
            type="date"
            className="reclamos-filter-select"
            value={fechaDesde}
            onChange={(e) => setFechaDesde(e.target.value)}
            title="Fecha desde"
            aria-label="Fecha desde"
          />
        </div>

        <div className="reclamos-filter-group">
          <span className="reclamos-filter-label">Hasta</span>
          <input
            id="filter-fecha-hasta"
            type="date"
            className="reclamos-filter-select"
            value={fechaHasta}
            min={fechaDesde || undefined}
            onChange={(e) => setFechaHasta(e.target.value)}
            title="Fecha hasta"
            aria-label="Fecha hasta"
          />
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
