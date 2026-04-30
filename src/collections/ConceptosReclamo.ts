import type { CollectionConfig } from 'payload'
import { isAdmin, authenticated } from '../access/roles'

export const ConceptosReclamo: CollectionConfig = {
  slug: 'conceptos-reclamo',
  admin: {
    useAsTitle: 'nombre',
    defaultColumns: ['nombre', 'area', 'activo'],
    group: 'Configuración',
  },
  access: {
    create: isAdmin,
    read: authenticated,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    {
      name: 'nombre',
      type: 'text',
      required: true,
    },
    {
      name: 'area',
      type: 'relationship',
      relationTo: 'areas',
      required: true,
      admin: {
        description: 'Área a la que pertenece este concepto de reclamo',
      },
    },
    {
      name: 'activo',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Indica si el concepto está disponible para nuevos reclamos',
      },
    },
  ],
}
