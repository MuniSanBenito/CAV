import { type NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { dni, password } = body

    if (!dni || !password) {
      return NextResponse.json(
        { errors: [{ message: 'DNI y contraseña son requeridos' }] },
        { status: 400 },
      )
    }

    const payload = await getPayload({ config })

    // Find user by DNI
    const { docs } = await payload.find({
      collection: 'users',
      where: { dni: { equals: String(dni) } },
      limit: 1,
    })

    if (!docs.length) {
      return NextResponse.json(
        { errors: [{ message: 'DNI o contraseña incorrectos' }] },
        { status: 401 },
      )
    }

    const user = docs[0]

    // Login with email+password (Payload handles password verification)
    const result = await payload.login({
      collection: 'users',
      data: { email: user.email, password: String(password) },
    })

    if (!result.token) {
      return NextResponse.json(
        { errors: [{ message: 'Error al generar el token de autenticación' }] },
        { status: 500 },
      )
    }

    const cookiePrefix = payload.config.cookiePrefix || 'payload'
    const authConfig = payload.collections['users']?.config?.auth

    const tokenExpiration =
      typeof authConfig === 'object' && authConfig?.tokenExpiration
        ? authConfig.tokenExpiration
        : 7200

    const response = NextResponse.json(result)
    response.cookies.set(`${cookiePrefix}-token`, result.token, {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: tokenExpiration,
    })

    return response
  } catch (err) {
    // Payload throws AuthenticationError for wrong password
    const message =
      err instanceof Error && err.message ? err.message : 'DNI o contraseña incorrectos'

    // Don't leak internal errors
    const isAuthError =
      message.toLowerCase().includes('email') ||
      message.toLowerCase().includes('password') ||
      message.toLowerCase().includes('authentication') ||
      message.toLowerCase().includes('credencial')

    return NextResponse.json(
      { errors: [{ message: isAuthError ? 'DNI o contraseña incorrectos' : message }] },
      { status: 401 },
    )
  }
}
