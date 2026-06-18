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
  upload: {
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    adminThumbnail: 'thumbnail',
    imageSizes: [
      {
        name: 'thumbnail',
        width: 400,
        position: 'centre',
      },
      {
        name: 'card',
        width: 768,
        position: 'centre',
      },
    ],
  },
}
