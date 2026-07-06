import { createContribuyente, ExternalApiError, findContribuyentes } from '@/mi-sanbenito/client'
import config from '@payload-config'
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'

function canReadContribuyentes(role: string | undefined): boolean {
  return role === 'admin' || role === 'carga' || role === 'visualizador' || role === 'ejecutor'
}

function canCreateContribuyente(role: string | undefined): boolean {
  return role === 'admin' || role === 'carga'
}

export async function GET(request: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const { user } = await payload.auth({ headers: request.headers })

    if (!user || !canReadContribuyentes(user.role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const data = await findContribuyentes(searchParams)
    return NextResponse.json(data)
  } catch (error) {
    if (error instanceof ExternalApiError) {
      return NextResponse.json(error.data ?? { errors: [{ message: error.message }] }, {
        status: error.status,
      })
    }
    console.error('Error en GET /api/contribuyentes:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

interface LegacyCreateBody {
  nombre?: string
  apellido?: string
  dni?: string
  telefono?: string
  email?: string
  direccion?: string
}

export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const { user } = await payload.auth({ headers: request.headers })

    if (!user || !canCreateContribuyente(user.role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = (await request.json()) as LegacyCreateBody

    const nombreParts = [body.nombre?.trim(), body.apellido?.trim()].filter(Boolean)
    const nombre = nombreParts.join(' ').trim()

    if (!nombre) {
      return NextResponse.json(
        { errors: [{ message: 'Nombre y apellido son obligatorios.' }] },
        { status: 400 },
      )
    }

    const data = await createContribuyente({
      nombre,
      numero_documento: body.dni?.trim() || undefined,
      telefono_web: body.telefono?.trim() || undefined,
      email: body.email?.trim() || undefined,
      domicilio: body.direccion?.trim() || undefined,
    })

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    if (error instanceof ExternalApiError) {
      return NextResponse.json(error.data ?? { errors: [{ message: error.message }] }, {
        status: error.status,
      })
    }
    console.error('Error en POST /api/contribuyentes:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
