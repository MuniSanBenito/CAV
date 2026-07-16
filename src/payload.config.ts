import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { Areas } from './collections/Areas'
import { ConceptosReclamo } from './collections/ConceptosReclamo'
import { Media } from './collections/Media'
import { Reclamos } from './collections/Reclamos'
import { Users } from './collections/Users'
import { storagePlugin } from './plugins/storage'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const isProduction = process.env.NODE_ENV === 'production'

export default buildConfig({
  serverURL: process.env.NEXT_PUBLIC_SERVER_URL || '',
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      titleSuffix: '— CAV San Benito',
      icons: {
        icon: [
          { url: '/favicon.ico', sizes: '48x48', type: 'image/x-icon' },
          { url: '/icon.svg', type: 'image/svg+xml' },
          { url: '/icon1.png', sizes: '96x96', type: 'image/png' },
        ],
        apple: [{ url: '/apple-icon.png', sizes: '180x180', type: 'image/png' }],
      },
      openGraph: {
        images: [
          {
            url: '/og-image.png',
            width: 1536,
            height: 672,
            alt: 'Municipalidad de San Benito',
          },
        ],
      },
    },
  },
  collections: [Users, Areas, ConceptosReclamo, Media, Reclamos],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: mongooseAdapter({
    url: process.env.DATABASE_URL || '',
  }),
  upload: {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10 MB máximo por archivo
    },
  },
  sharp,
  plugins: [storagePlugin],
})
