import type { CollectionConfig } from 'payload'
import { isAdmin, authenticated } from '../access/roles'

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: () => true,
    create: authenticated,
    update: authenticated,
    delete: isAdmin,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
  ],
  upload: true,
}
