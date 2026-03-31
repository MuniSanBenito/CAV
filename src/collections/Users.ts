import type { CollectionConfig } from 'payload'
import { isAdmin, isAdminOrSelf } from '../access/roles'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'nombre', 'apellido', 'role', 'areas'],
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
}
