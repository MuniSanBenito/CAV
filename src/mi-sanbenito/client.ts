import { EXTERNAL_API_BASE_URL, EXTERNAL_API_KEY } from '@/config'
import type { Contribuyente } from './types'

const SENSITIVE_FIELDS = ['clave_web'] as const

const LIST_SELECT_FIELDS = [
  'id',
  'numero_contribuyente',
  'nombre',
  'domicilio',
  'codigo_postal',
  'numero_documento',
  'email',
  'telefono_web',
  'telefono_secundario',
  'habilitado_web',
] as const

const DETAIL_SELECT_FIELDS = [
  'id',
  'numero_contribuyente',
  'nombre',
  'domicilio',
  'numero_documento',
  'email',
  'telefono_web',
] as const

function applySelectParams(params: URLSearchParams, fields: readonly string[]): void {
  if (params.has('select') || [...params.keys()].some((key) => key.startsWith('select['))) {
    return
  }
  for (const field of fields) {
    params.set(`select[${field}]`, 'true')
  }
}

function normalizeContribuyente(contribuyente: Contribuyente): Contribuyente {
  const safe = { ...contribuyente }
  for (const field of SENSITIVE_FIELDS) {
    delete (safe as Record<string, unknown>)[field]
  }
  if (safe.numero_documento != null) {
    safe.numero_documento = String(safe.numero_documento)
  }
  return safe
}

export interface ContribuyentesListResponse {
  docs: Contribuyente[]
  totalDocs: number
  limit: number
  totalPages: number
  page: number
  pagingCounter: number
  hasPrevPage: boolean
  hasNextPage: boolean
  prevPage: number | null
  nextPage: number | null
}

export interface ContribuyenteResponse {
  doc: Contribuyente
  message?: string
}

function getHeaders(): HeadersInit {
  if (!EXTERNAL_API_KEY) {
    console.error('[mi-sanbenito] EXTERNAL_API_KEY no está configurada')
  }
  return {
    'Content-Type': 'application/json',
    token: EXTERNAL_API_KEY,
  }
}

function stripSensitiveFields(contribuyente: Contribuyente): Contribuyente {
  return normalizeContribuyente(contribuyente)
}

function stripSensitiveFromList(data: ContribuyentesListResponse): ContribuyentesListResponse {
  return {
    ...data,
    docs: data.docs.map(stripSensitiveFields),
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    const message =
      (data as { errors?: { message?: string }[] })?.errors?.[0]?.message ||
      (data as { message?: string })?.message ||
      `Error ${res.status} al consultar API externa`
    throw new ExternalApiError(message, res.status, data)
  }
  return data as T
}

export class ExternalApiError extends Error {
  status: number
  data: unknown

  constructor(message: string, status: number, data?: unknown) {
    super(message)
    this.name = 'ExternalApiError'
    this.status = status
    this.data = data
  }
}

export async function findContribuyentes(
  searchParams: URLSearchParams,
): Promise<ContribuyentesListResponse> {
  const params = new URLSearchParams(searchParams)
  applySelectParams(params, LIST_SELECT_FIELDS)

  const res = await fetch(`${EXTERNAL_API_BASE_URL}/contribuyentes?${params}`, {
    headers: getHeaders(),
    cache: 'no-store',
  })

  const data = await handleResponse<ContribuyentesListResponse>(res)
  return stripSensitiveFromList(data)
}

export async function getContribuyenteById(id: string): Promise<ContribuyenteResponse> {
  const params = new URLSearchParams()
  applySelectParams(params, DETAIL_SELECT_FIELDS)

  const res = await fetch(`${EXTERNAL_API_BASE_URL}/contribuyentes/${id}?${params}`, {
    headers: getHeaders(),
    cache: 'no-store',
  })

  const data = await handleResponse<ContribuyenteResponse>(res)
  return { ...data, doc: stripSensitiveFields(data.doc) }
}

export type CreateContribuyenteInput = Partial<
  Pick<Contribuyente, 'nombre' | 'numero_documento' | 'telefono_web' | 'email' | 'domicilio'>
>

export type UpdateContribuyenteInput = CreateContribuyenteInput

export async function createContribuyente(
  data: CreateContribuyenteInput,
): Promise<ContribuyenteResponse> {
  const res = await fetch(`${EXTERNAL_API_BASE_URL}/contribuyentes`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
    cache: 'no-store',
  })

  const result = await handleResponse<ContribuyenteResponse>(res)
  return { ...result, doc: stripSensitiveFields(result.doc) }
}

export async function updateContribuyente(
  id: string,
  data: UpdateContribuyenteInput,
): Promise<ContribuyenteResponse> {
  const res = await fetch(`${EXTERNAL_API_BASE_URL}/contribuyentes/${id}`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify(data),
    cache: 'no-store',
  })

  const result = await handleResponse<ContribuyenteResponse>(res)
  return { ...result, doc: stripSensitiveFields(result.doc) }
}
