'use client'

import { buildContribuyenteSearchParams } from '@/lib/contribuyente-map'
import type { Contribuyente } from '@/mi-sanbenito/types'
import {
  IconChevronLeft,
  IconChevronRight,
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
  type PaginationState,
  type SortingState,
} from '@tanstack/react-table'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'

const columnHelper = createColumnHelper<Contribuyente>()

const SORT_FIELD_MAP: Record<string, string> = {
  numero_contribuyente: 'numero_contribuyente',
  nombre: 'nombre',
  numero_documento: 'numero_documento',
  domicilio: 'domicilio',
  telefono_web: 'telefono_web',
  email: 'email',
}

function buildContribuyentesQueryParams(options: {
  debouncedSearch: string
  sorting: SortingState
  pagination: { pageIndex: number; pageSize: number }
}): URLSearchParams {
  const { debouncedSearch, sorting, pagination } = options

  const params = debouncedSearch.trim()
    ? buildContribuyenteSearchParams(debouncedSearch, pagination.pageSize)
    : new URLSearchParams()

  params.set('limit', String(pagination.pageSize))
  params.set('page', String(pagination.pageIndex + 1))

  const sort = sorting[0]
  const sortField = sort ? SORT_FIELD_MAP[sort.id] || sort.id : 'numero_contribuyente'
  const sortDir = sort?.desc === false ? '' : '-'
  params.set('sort', `${sortDir}${sortField}`)

  return params
}

export default function ContribuyentesTable() {
  const router = useRouter()
  const [data, setData] = useState<Contribuyente[]>([])
  const [userRole, setUserRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [fetching, setFetching] = useState(false)

  const [totalDocs, setTotalDocs] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 15 })
  const [sorting, setSorting] = useState<SortingState>([{ id: 'numero_contribuyente', desc: true }])
  const [globalFilter, setGlobalFilter] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const firstLoadDone = useRef(false)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(globalFilter.trim()), 350)
    return () => clearTimeout(t)
  }, [globalFilter])

  useEffect(() => {
    setPagination((p) => (p.pageIndex === 0 ? p : { ...p, pageIndex: 0 }))
  }, [sorting, debouncedSearch])

  useEffect(() => {
    fetch('/api/users/me', { credentials: 'include' })
      .then((r) => r.json())
      .then((userData) => {
        if (userData?.user?.role) setUserRole(userData.user.role)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const controller = new AbortController()

    async function loadContribuyentes() {
      if (!firstLoadDone.current) setLoading(true)
      else setFetching(true)

      try {
        const params = buildContribuyentesQueryParams({
          debouncedSearch,
          sorting,
          pagination,
        })

        const res = await fetch(`/api/contribuyentes?${params.toString()}`, {
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
        if ((e as Error).name !== 'AbortError') console.error('Error fetching contribuyentes', e)
      } finally {
        if (!controller.signal.aborted) {
          firstLoadDone.current = true
          setLoading(false)
          setFetching(false)
        }
      }
    }

    loadContribuyentes()
    return () => controller.abort()
  }, [pagination.pageIndex, pagination.pageSize, sorting, debouncedSearch, refreshKey])

  const fetchData = () => setRefreshKey((k) => k + 1)

  const columns = useMemo(
    () => [
      columnHelper.accessor('numero_contribuyente', {
        header: 'N°',
        cell: (info) => <span className="reclamos-cell-numero">#{info.getValue() ?? '—'}</span>,
        size: 90,
      }),
      columnHelper.accessor('nombre', {
        header: 'Nombre',
        cell: (info) => <span className="reclamos-cell-title">{info.getValue() || '—'}</span>,
      }),
      columnHelper.accessor('numero_documento', {
        header: 'DNI',
        cell: (info) => info.getValue() || '—',
      }),
      columnHelper.accessor('domicilio', {
        header: 'Domicilio',
        cell: (info) => info.getValue() || '—',
      }),
      columnHelper.accessor('telefono_web', {
        header: 'Teléfono',
        cell: (info) => info.getValue() || '—',
      }),
      columnHelper.accessor('email', {
        header: 'Email',
        cell: (info) => info.getValue() || '—',
      }),
    ],
    [],
  )

  const table = useReactTable({
    data,
    columns,
    state: { pagination, sorting, globalFilter },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    pageCount: totalPages,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="reclamos-page">
      <div className="reclamos-header">
        <div>
          <h1 className="reclamos-title">Contribuyentes</h1>
          <p className="reclamos-subtitle">
            {totalDocs.toLocaleString('es-AR')} contribuyente{totalDocs !== 1 ? 's' : ''} registrado
            {totalDocs !== 1 ? 's' : ''}
          </p>
        </div>
        {(userRole === 'admin' || userRole === 'carga') && (
          <button
            id="btn-nuevo-contribuyente"
            className="dash-action-btn dash-action-btn--primary"
            onClick={() => router.push('/dashboard/contribuyentes/nuevo')}
          >
            <IconPlus size={18} />
            Nuevo Contribuyente
          </button>
        )}
      </div>

      <div className="reclamos-toolbar">
        <div className="reclamos-search-wrap">
          <IconSearch size={18} stroke={1.6} className="reclamos-search-icon" />
          <input
            id="contribuyentes-search"
            type="text"
            className="reclamos-search"
            placeholder="Buscar por nombre, DNI o N° contribuyente..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
          />
        </div>

        <div className="reclamos-toolbar-actions">
          <button className="reclamos-refresh-btn" onClick={fetchData} title="Actualizar">
            <IconRefresh size={18} className={fetching || loading ? 'spin-animation' : ''} />
          </button>
        </div>
      </div>

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
                    No se encontraron contribuyentes.
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => router.push(`/dashboard/contribuyentes/${row.original.id}`)}
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
