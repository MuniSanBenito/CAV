import type { CollectionConfig } from 'payload'
import { isAdmin, authenticated } from '../access/roles'
import { geocodeAddress, extractBarrio, extractLocalidad } from '../lib/geocoding'

export const Reclamos: CollectionConfig = {
  slug: 'reclamos',
  admin: {
    useAsTitle: 'descripcion',
    defaultColumns: ['numero', 'tipo', 'area_derivada', 'estado', 'prioridad', 'createdAt'],
    group: 'Gestión',
  },
  access: {
    create: ({ req: { user } }) =>
      user?.role === 'admin' || user?.role === 'carga' || user?.role === 'ejecutor',
    // Read access: admin, carga, visualizador = todo; ejecutor = solo sus áreas
    read: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'admin' || user.role === 'carga' || user.role === 'visualizador')
        return true
      if (user.role === 'ejecutor' && user.areas && user.areas.length > 0) {
        const areaIds = user.areas.map((a) => (typeof a === 'string' ? a : a.id))
        return {
          area_derivada: { in: areaIds },
        }
      }
      return false
    },
    // Update access: admin, carga = todo; ejecutor = solo sus áreas
    update: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'admin' || user.role === 'carga') return true
      if (user.role === 'ejecutor' && user.areas && user.areas.length > 0) {
        const areaIds = user.areas.map((a) => (typeof a === 'string' ? a : a.id))
        return {
          area_derivada: { in: areaIds },
        }
      }
      return false
    },
    delete: isAdmin,
  },
  fields: [
    {
      name: 'numero',
      type: 'number',
      unique: true,
      index: true,
      admin: {
        readOnly: true,
        description: 'Número de reclamo generado automáticamente',
      },
    },
    {
      name: 'contribuyente',
      type: 'relationship',
      relationTo: 'contribuyentes',
      required: true,
      admin: {
        description: 'Contribuyente que realiza el reclamo',
      },
    },
    {
      name: 'tipo',
      type: 'select',
      required: true,
      defaultValue: 'reclamo',
      options: [
        { label: 'Reclamo', value: 'reclamo' },
        { label: 'Sugerencia', value: 'sugerencia' },
        { label: 'Denuncia', value: 'denuncia' },
        { label: 'Consulta', value: 'consulta' },
      ],
    },
    {
      name: 'descripcion',
      type: 'textarea',
      required: true,
    },
    {
      name: 'medio',
      type: 'select',
      required: true,
      defaultValue: 'presencial',
      options: [
        { label: 'Presencial', value: 'presencial' },
        { label: 'WhatsApp', value: 'whatsapp' },
        { label: 'Correo', value: 'correo' },
        { label: 'Calle', value: 'calle' },
        { label: 'Otro', value: 'otro' },
      ],
    },
    {
      name: 'area_receptora',
      type: 'relationship',
      relationTo: 'areas',
      required: true,
      admin: {
        readOnly: true,
        description: 'Área que recepciona el reclamo (automática del usuario)',
      },
    },
    {
      name: 'area_derivada',
      type: 'relationship',
      relationTo: 'areas',
      required: true,
      admin: {
        description: 'Área a la que se deriva el reclamo',
      },
    },
    {
      name: 'categoria',
      type: 'select',
      required: true,
      defaultValue: 'general',
      options: [
        { label: 'General', value: 'general' },
        { label: 'Alumbrado Público', value: 'alumbrado' },
        { label: 'Pavimento / Calles', value: 'pavimento' },
        { label: 'Higiene / Limpieza', value: 'higiene' },
        { label: 'Pluviales / Drenaje', value: 'pluviales' },
        { label: 'Espacios Verdes', value: 'verdes' },
        { label: 'Tránsito / Señalización', value: 'transito' },
        { label: 'Ruidos Molestos', value: 'ruidos' },
        { label: 'Convivencia / Seguridad', value: 'convivencia' },
        { label: 'Servicios Públicos', value: 'servicios' },
      ],
    },
    {
      name: 'subcategoria',
      type: 'text',
      admin: {
        description: 'Especificación adicional de la categoría',
      },
    },
    {
      name: 'prioridad',
      type: 'select',
      required: true,
      defaultValue: 'media',
      options: [
        { label: 'Baja', value: 'baja' },
        { label: 'Media', value: 'media' },
        { label: 'Alta', value: 'alta' },
        { label: 'Urgente', value: 'urgente' },
      ],
    },
    {
      name: 'fechaCompromiso',
      type: 'date',
      admin: {
        description: 'Fecha estimada de resolución (SLA)',
      },
    },
    {
      name: 'diasResolucionEstimados',
      type: 'number',
      defaultValue: 7,
      admin: {
        description: 'Días estimados para resolver el reclamo',
      },
    },
    {
      name: 'estado',
      type: 'select',
      required: true,
      defaultValue: 'pendiente',
      options: [
        { label: 'Pendiente', value: 'pendiente' },
        { label: 'En Proceso', value: 'en_proceso' },
        { label: 'Resuelto', value: 'resuelto' },
        { label: 'Rechazado', value: 'rechazado' },
      ],
    },
    // NUEVO: Ubicación con geocodificación automática
    {
      name: 'ubicacion',
      type: 'group',
      admin: {
        description: 'Datos de ubicación geocodificada',
      },
      fields: [
        {
          name: 'direccionIngresada',
          type: 'text',
          admin: {
            description: 'Dirección tal como la ingresó el usuario',
          },
        },
        {
          name: 'direccionNormalizada',
          type: 'text',
          index: true,
          admin: {
            description: 'Dirección normalizada por el servicio de geocodificación',
            readOnly: true,
          },
        },
        {
          name: 'barrio',
          type: 'text',
          index: true,
          admin: {
            description: 'Barrio detectado automáticamente',
            readOnly: true,
          },
        },
        {
          name: 'localidad',
          type: 'text',
          admin: {
            readOnly: true,
          },
        },
        {
          name: 'location',
          type: 'point',
          index: true,
          admin: {
            description: 'Coordenadas geoespaciales (lat, lng) - índice 2dsphere',
          },
        },
      ],
    },
    // LEGACY: Mantener calle para compatibilidad, migrar a ubicacion.direccionIngresada
    {
      name: 'calle',
      type: 'text',
      admin: {
        description: '⚠️ Deprecado - usar ubicacion.direccionIngresada',
        position: 'sidebar',
        condition: () => false,
      },
    },
    // LEGACY: Coordenadas legacy
    {
      name: 'coordenadas',
      type: 'group',
      admin: {
        description: '⚠️ Deprecado - usar ubicacion.location',
        position: 'sidebar',
        condition: () => false,
      },
      fields: [
        {
          name: 'lat',
          type: 'number',
          admin: { step: 0.000001 },
        },
        {
          name: 'lng',
          type: 'number',
          admin: { step: 0.000001 },
        },
      ],
    },
    {
      name: 'fotos',
      type: 'upload',
      relationTo: 'media',
      hasMany: true,
      admin: { description: 'Fotos adjuntas del reclamo' },
    },
    {
      name: 'observaciones',
      type: 'textarea',
      admin: { description: 'Notas internas del personal municipal' },
    },
    {
      name: 'creadoPor',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        readOnly: true,
        description: 'Usuario que cargó este reclamo',
      },
    },
    {
      name: 'movimientos',
      type: 'array',
      admin: {
        description: 'Historial de cambios de estado y notas',
      },
      fields: [
        {
          name: 'estado',
          type: 'select',
          required: true,
          options: [
            { label: 'Pendiente', value: 'pendiente' },
            { label: 'En Proceso', value: 'en_proceso' },
            { label: 'Resuelto', value: 'resuelto' },
            { label: 'Rechazado', value: 'rechazado' },
          ],
        },
        {
          name: 'nota',
          type: 'textarea',
          required: true,
        },
        {
          name: 'fecha',
          type: 'date',
          required: true,
        },
        {
          name: 'adjuntos',
          type: 'upload',
          relationTo: 'media',
          hasMany: true,
          admin: {
            description: 'Fotos o videos adjuntos al cambio de estado',
          },
        },
        {
          name: 'usuario',
          type: 'relationship',
          relationTo: 'users',
          required: true,
        },
      ],
    },
  ],
  hooks: {
    beforeValidate: [
      async ({ data, operation, req }) => {
        if (operation === 'create') {
          // FIX #1: Atomic counter — use MongoDB findOneAndUpdate to avoid race conditions
          const db = req.payload.db
          const mongoose = (
            db as unknown as { connection: { db: { collection: (name: string) => unknown } } }
          ).connection.db
          const countersCollection = mongoose.collection('counters') as {
            findOneAndUpdate: (
              filter: Record<string, unknown>,
              update: Record<string, unknown>,
              options: Record<string, unknown>,
            ) => Promise<{ value: { seq: number } | null } | { seq: number } | null>
          }
          const result = await countersCollection.findOneAndUpdate(
            { _id: 'reclamo_numero' },
            { $inc: { seq: 1 } },
            { upsert: true, returnDocument: 'after' },
          )
          // MongoDB driver v6+ returns the document directly; older versions wrap it in { value }
          const counterDoc = (result && 'value' in result ? result.value : result) as {
            seq: number
          } | null
          if (data) {
            ;(data as Record<string, unknown>).numero = counterDoc?.seq ?? 1

            // Force area_derivada for ejecutor - usa la primera area si tiene múltiples
            if (req.user?.role === 'ejecutor' && req.user.areas && req.user.areas.length > 0) {
              const firstArea = req.user.areas[0]
              ;(data as Record<string, unknown>).area_derivada =
                typeof firstArea === 'string' ? firstArea : firstArea.id
            }
          }
        }
        if (
          operation === 'update' &&
          req.user?.role === 'ejecutor' &&
          req.user.areas &&
          req.user.areas.length > 0
        ) {
          if (data) {
            const firstArea = req.user.areas[0]
            ;(data as Record<string, unknown>).area_derivada =
              typeof firstArea === 'string' ? firstArea : firstArea.id
          }
        }
        return data
      },
    ],
    beforeChange: [
      async ({ req, operation, data, originalDoc }) => {
        if (operation === 'create' && req.user) {
          data.creadoPor = req.user.id
          // Auto-set area_receptora from user's first area if available
          if (req.user.areas && req.user.areas.length > 0 && !data.area_receptora) {
            const firstArea = req.user.areas[0]
            data.area_receptora = typeof firstArea === 'string' ? firstArea : firstArea.id
          }
        }

        // FIX #2: Server-side append-only movimientos
        // The client sends `_nuevoMovimiento` with just the new entry.
        // We ignore any client-sent `movimientos` array and append server-side.
        if (operation === 'update') {
          const nuevoMov = (data as Record<string, unknown>)._nuevoMovimiento as
            | { estado: string; nota: string }
            | undefined
          if (nuevoMov && req.user) {
            const existingMovimientos = (originalDoc?.movimientos as unknown[]) || []
            data.movimientos = [
              ...existingMovimientos,
              {
                estado: nuevoMov.estado,
                nota: nuevoMov.nota,
                fecha: new Date().toISOString(),
                usuario: req.user.id,
              },
            ]
            delete (data as Record<string, unknown>)._nuevoMovimiento
          } else if (!nuevoMov) {
            // If no _nuevoMovimiento, preserve existing movimientos (prevent client overwrite)
            data.movimientos = (originalDoc?.movimientos as unknown[]) || []
          }
        }

        return data
      },
    ],
    afterChange: [
      async ({ doc, req, context }) => {
        // Skip si esta misma escritura es la actualización post-geocoding
        if ((context as Record<string, unknown>)?.skipGeocoding) return

        const ubicacion = doc.ubicacion as Record<string, unknown> | undefined
        const direccionIngresada = ubicacion?.direccionIngresada as string | undefined
        const hasLocation = !!ubicacion?.location

        // Solo geocodificar si hay dirección y aún no hay coordenadas
        if (!direccionIngresada || hasLocation) return

        // Fire-and-forget: la respuesta al cliente sale YA, esto corre en background.
        // Usamos setImmediate para asegurar que el cierre de la transacción ocurra primero.
        setImmediate(() => {
          void (async () => {
            try {
              const geoResult = await geocodeAddress(direccionIngresada)
              if (!geoResult) return
              await req.payload.update({
                collection: 'reclamos',
                id: doc.id,
                data: {
                  ubicacion: {
                    ...ubicacion,
                    direccionNormalizada: geoResult.displayName,
                    barrio: extractBarrio(geoResult.address),
                    localidad: extractLocalidad(geoResult.address),
                    location: [geoResult.lng, geoResult.lat],
                  },
                },
                context: { skipGeocoding: true },
                overrideAccess: true,
              })
            } catch (error) {
              console.error('Background geocoding failed:', error)
            }
          })()
        })
      },
    ],
  },
  // Índices para optimizar queries frecuentes
  indexes: [
    { fields: ['estado', 'area_derivada'] },
    { fields: ['ubicacion.location'] },
    { fields: ['estado', 'prioridad', 'createdAt'] },
    { fields: ['createdAt'] }, // sort=-createdAt sin filtros
    { fields: ['tipo'] }, // filtro de tabla y mapa
    { fields: ['contribuyente'] }, // join inverso al buscar reclamos por contribuyente
  ],
}
