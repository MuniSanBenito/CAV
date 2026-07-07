import { mapLegacyBodyToExternal, type LegacyContribuyenteBody } from '@/lib/contribuyente-map'
import { ExternalApiError, getContribuyenteById, updateContribuyente } from '@/mi-sanbenito/client'
import config from '@payload-config'
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'

function canReadContribuyentes(role: string | undefined): boolean {
  return role === 'admin' || role === 'carga' || role === 'visualizador' || role === 'ejecutor'
}

function canUpdateContribuyente(role: string | undefined): boolean {
  return role === 'admin' || role === 'carga'
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = await getPayload({ config })
    const { user } = await payload.auth({ headers: request.headers })

    if (!user || !canReadContribuyentes(user.role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    const data = await getContribuyenteById(id)
    return NextResponse.json(data)
  } catch (error) {
    if (error instanceof ExternalApiError) {
      return NextResponse.json(error.data ?? { errors: [{ message: error.message }] }, {
        status: error.status,
      })
    }
    console.error('Error en GET /api/contribuyentes/[id]:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = await getPayload({ config })
    const { user } = await payload.auth({ headers: request.headers })

    if (!user || !canUpdateContribuyente(user.role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    const body = (await request.json()) as LegacyContribuyenteBody
    const { data, error } = mapLegacyBodyToExternal(body)

    if (error) {
      return NextResponse.json({ errors: [{ message: error }] }, { status: 400 })
    }

    const result = await updateContribuyente(id, data)
    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof ExternalApiError) {
      return NextResponse.json(error.data ?? { errors: [{ message: error.message }] }, {
        status: error.status,
      })
    }
    console.error('Error en PATCH /api/contribuyentes/[id]:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
