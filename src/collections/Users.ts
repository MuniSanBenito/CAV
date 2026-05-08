import type { CollectionConfig } from 'payload'
import { isAdmin, isAdminOrSelf } from '../access/roles'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'nombre', 'apellido', 'dni', 'role', 'areas'],
    group: 'Configuración',
  },
  access: {
    create: isAdmin,
    read: isAdminOrSelf,
    update: isAdminOrSelf,
    delete: isAdmin,
    admin: ({ req: { user } }) => user?.role === 'admin',
  },
  fields: [
    {
      name: 'nombre',
      type: 'text',
      required: true,
    },
    {
      name: 'apellido',
      type: 'text',
      required: true,
    },
    {
      name: 'dni',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'DNI del usuario (usado para login en la web, no en el admin)',
      },
    },
    {
      name: 'role',
      type: 'select',
      required: true,
      saveToJWT: true,
      options: [
        { label: 'Administrador', value: 'admin' },
        { label: 'Carga', value: 'carga' },
        { label: 'Ejecutor', value: 'ejecutor' },
        { label: 'Visualizador', value: 'visualizador' },
      ],
      defaultValue: 'visualizador',
      access: {
        update: ({ req: { user } }) => user?.role === 'admin',
      },
    },
    {
      name: 'areas',
      type: 'relationship',
      relationTo: 'areas',
      hasMany: true,
      saveToJWT: true,
      admin: {
        description: 'Áreas asignadas al usuario (puede tener varias)',
      },
    },
    // DEPRECATED: campo area legacy para compatibilidad, migrar a areas
    {
      name: 'area',
      type: 'relationship',
      relationTo: 'areas',
      admin: {
        description: '⚠️ Deprecado - usar "areas" en su lugar',
        position: 'sidebar',
        condition: () => false, // Oculto en UI
      },
    },
  ],
  endpoints: [
    {
      path: '/login-with-dni',
      method: 'post',
      handler: async (req) => {
        const body = req.json ? await req.json() : {}
        const { dni, password } = body

        if (!dni || !password) {
          return Response.json(
            { errors: [{ message: 'DNI y contraseña son requeridos' }] },
            { status: 400 },
          )
        }

        const { docs } = await req.payload.find({
          collection: 'users',
          where: { dni: { equals: dni } },
          limit: 1,
        })

        if (!docs.length) {
          return Response.json(
            { errors: [{ message: 'DNI o contraseña incorrectos' }] },
            { status: 401 },
          )
        }

        const user = docs[0]

        try {
          const result = await req.payload.login({
            collection: 'users',
            data: { email: user.email, password },
          })

          if (!result.token) {
            return Response.json(
              { errors: [{ message: 'Error al generar el token de autenticación' }] },
              { status: 500 },
            )
          }

          // Build the Set-Cookie header manually.
          // Payload's handleEndpoints() reconstructs the Response and merges
          // req.responseHeaders into the final response headers.
          // Using cookies() from next/headers does NOT work here because
          // Payload creates a new Response() discarding the Next.js cookie context.
          const cookiePrefix = req.payload.config.cookiePrefix || 'payload'
          const cookieName = `${cookiePrefix}-token`

          const usersCollection = req.payload.config.collections.find((c) => c.slug === 'users')
          const authConfig =
            typeof usersCollection?.auth === 'object' ? usersCollection.auth : null
          const maxAge = authConfig?.tokenExpiration ?? 7200

          const cookieParts = [
            `${cookieName}=${result.token}`,
            `Path=/`,
            `HttpOnly`,
            `SameSite=Lax`,
            `Max-Age=${maxAge}`,
          ]

          if (process.env.NODE_ENV === 'production') {
            cookieParts.push('Secure')
          }

          // Domain from auth config if set
          if (authConfig?.cookies?.domain) {
            cookieParts.push(`Domain=${authConfig.cookies.domain}`)
          }

          const setCookieHeader = cookieParts.join('; ')

          // Attach to req.responseHeaders so Payload merges it into the final response
          if (!req.responseHeaders) {
            req.responseHeaders = new Headers()
          }
          req.responseHeaders.append('Set-Cookie', setCookieHeader)

          return Response.json(result)
        } catch {
          return Response.json(
            { errors: [{ message: 'DNI o contraseña incorrectos' }] },
            { status: 401 },
          )
        }
      },
    },
  ],
}
