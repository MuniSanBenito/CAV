import type { CollectionConfig } from 'payload'
import { isAdmin, authenticated } from '../access/roles'

export const Contribuyentes: CollectionConfig = {
  slug: 'contribuyentes',
  admin: {
    useAsTitle: 'nombre',
    defaultColumns: ['dni', 'nombre', 'apellido', 'telefono'],
    group: 'Gestión',
  },
  access: {
    create: authenticated,
    read: authenticated,
    update: authenticated,
    delete: isAdmin,
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
      unique: true,
      index: true,
    },
    {
      name: 'telefono',
      type: 'text',
    },
    {
      name: 'email',
      type: 'text',
    },
    {
      name: 'direccion',
      type: 'text',
    },
  ],
}
