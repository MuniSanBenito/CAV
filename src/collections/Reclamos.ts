import type { CollectionConfig } from 'payload'
import { isAdmin, authenticated } from '../access/roles'

export const Reclamos: CollectionConfig = {
  slug: 'reclamos',
  admin: {
    useAsTitle: 'descripcion',
    defaultColumns: ['numero', 'tipo', 'area_derivada', 'estado', 'prioridad', 'createdAt'],
    group: 'Gestión',
  },
  access: {
    create: ({ req: { user } }) => user?.role === 'admin' || user?.role === 'carga' || user?.role === 'ejecutor',
    read: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'admin' || user.role === 'carga' || user.role === 'visualizador') return true
      if (user.role === 'ejecutor' && user.area) {
        return { area_derivada: { equals: typeof user.area === 'string' ? user.area : user.area.id } }
      }
      return false
    },
    update: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'admin' || user.role === 'carga') return true
      if (user.role === 'ejecutor' && user.area) {
        return { area_derivada: { equals: typeof user.area === 'string' ? user.area : user.area.id } }
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
    {
      name: 'calle',
      type: 'text',
      admin: { description: 'Calle y número de la ubicación del reclamo' },
    },
    {
      name: 'coordenadas',
      type: 'group',
      admin: { description: 'Coordenadas geográficas del reclamo' },
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
          const mongoose = (db as unknown as { connection: { db: { collection: (name: string) => unknown } } }).connection.db
          const countersCollection = mongoose.collection('counters') as {
            findOneAndUpdate: (
              filter: Record<string, unknown>,
              update: Record<string, unknown>,
              options: Record<string, unknown>,
            ) => Promise<{ value: { seq: number } | null }>
          }
          const result = await countersCollection.findOneAndUpdate(
            { _id: 'reclamo_numero' },
            { $inc: { seq: 1 } },
            { upsert: true, returnDocument: 'after' },
          )
          if (data) {
            ;(data as Record<string, unknown>).numero = result.value?.seq ?? 1

            // Force area_derivada for ejecutor
            if (req.user?.role === 'ejecutor' && req.user.area) {
              ;(data as Record<string, unknown>).area_derivada =
                typeof req.user.area === 'string' ? req.user.area : req.user.area.id
            }
          }
        }
        if (operation === 'update' && req.user?.role === 'ejecutor' && req.user.area) {
          if (data) {
            ;(data as Record<string, unknown>).area_derivada =
              typeof req.user.area === 'string' ? req.user.area : req.user.area.id
          }
        }
        return data
      },
    ],
    beforeChange: [
      async ({ req, operation, data, originalDoc }) => {
        if (operation === 'create' && req.user) {
          data.creadoPor = req.user.id
          // Auto-set area_receptora from user's area if available
          if (req.user.area && !data.area_receptora) {
            data.area_receptora = typeof req.user.area === 'string' ? req.user.area : req.user.area.id
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
  },
}
