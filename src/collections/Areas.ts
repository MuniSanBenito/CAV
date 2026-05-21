import type { CollectionConfig } from 'payload'
import { isAdmin, anyone } from '../access/roles'

export const Areas: CollectionConfig = {
  slug: 'areas',
  admin: {
    useAsTitle: 'nombre',
    defaultColumns: ['nombre', 'descripcion', 'activa'],
    group: 'Configuración',
  },
  access: {
    create: isAdmin,
    read: anyone,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    {
      name: 'nombre',
      type: 'text',
      required: true,
      unique: true,
    },
    {
      name: 'descripcion',
      type: 'textarea',
    },
    {
      name: 'activa',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Indica si el área está activa para recibir reclamos',
      },
    },
  ],
}
