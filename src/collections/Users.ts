import type { CollectionConfig } from 'payload'
import { isAdmin, isAdminOrSelf } from '../access/roles'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'nombre', 'apellido', 'role', 'area'],
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
      name: 'area',
      type: 'relationship',
      relationTo: 'areas',
      required: true,
      saveToJWT: true,
      admin: {
        description: 'Área a la que pertenece el usuario',
      },
    },
  ],
}
