---
name: Metadata Marca San Benito
overview: 'Completar la metadata del CAV (titles, favicons, Open Graph, Twitter, PWA manifest y robots) alineada a Marca San Benito y al patrón del portal oficial, usando los assets ya copiados y las decisiones: URL cav.sanbenito.gob.ar, noindex, manifest completo, OG del portal.'
todos:
  - id: rename-icon
    content: Renombrar src/app/icon0.svg → icon.svg
    status: completed
  - id: frontend-metadata
    content: Completar metadata + viewport en (frontend)/layout.tsx
    status: completed
  - id: unify-titles
    content: Unificar titles de páginas con template %s | CAV San Benito
    status: completed
  - id: manifest
    content: Crear public/manifest.json PWA completo del CAV
    status: completed
  - id: payload-meta
    content: Alinear admin.meta de Payload con favicon/icons de marca
    status: completed
isProject: false
---

# Metadata CAV — Marca San Benito

## Decisiones fijadas

- **URL:** `https://cav.sanbenito.gob.ar`
- **Robots:** `noindex, nofollow` (app interna)
- **PWA:** manifest completo (nombre CAV, icons 192/512, theme `#b6c544`)
- **OG image:** reutilizar [`public/og-image.png`](public/og-image.png) del portal

## Assets ya presentes

| Archivo                                                                      | Uso                                         |
| ---------------------------------------------------------------------------- | ------------------------------------------- |
| [`src/app/favicon.ico`](src/app/favicon.ico)                                 | Favicon tab                                 |
| [`src/app/apple-icon.png`](src/app/apple-icon.png)                           | iOS 180×180                                 |
| [`src/app/icon0.svg`](src/app/icon0.svg)                                     | Icon SVG (renombrar)                        |
| [`src/app/icon1.png`](src/app/icon1.png)                                     | Icon PNG 96×96 (válido como `icon1`)        |
| [`public/web-app-manifest-192x192.png`](public/web-app-manifest-192x192.png) | PWA                                         |
| [`public/web-app-manifest-512x512.png`](public/web-app-manifest-512x512.png) | PWA                                         |
| [`public/og-image.png`](public/og-image.png)                                 | Open Graph / Twitter                        |
| Logos en `public/`                                                           | Fuera de scope metadata (UI); quedan listos |

## Cambios

### 1. Convenciones de íconos Next.js

Renombrar `src/app/icon0.svg` → `src/app/icon.svg` para que el App Router lo detecte automáticamente junto a `favicon.ico`, `apple-icon.png` e `icon1.png`.

### 2. Metadata raíz del frontend

Ampliar [`src/app/(frontend)/layout.tsx`](<src/app/(frontend)/layout.tsx>) con el Metadata API de Next:

```ts
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SERVER_URL || 'https://cav.sanbenito.gob.ar'),
  title: {
    default: 'CAV — San Benito',
    template: '%s | CAV San Benito',
  },
  description:
    'Centro de Atención al Vecino — Municipalidad de San Benito. Gestión interna de reclamos vecinales.',
  applicationName: 'CAV San Benito',
  authors: [{ name: 'Municipalidad de San Benito' }],
  creator: 'Municipalidad de San Benito',
  publisher: 'Municipalidad de San Benito',
  robots: { index: false, follow: false },
  manifest: '/manifest.json',
  appleWebApp: {
    title: 'CAV San Benito',
    capable: true,
    statusBarStyle: 'default',
  },
  openGraph: {
    type: 'website',
    locale: 'es_AR',
    url: '/',
    siteName: 'CAV — Municipalidad de San Benito',
    title: 'CAV — San Benito',
    description: 'Centro de Atención al Vecino — Municipalidad de San Benito',
    images: [
      {
        url: '/og-image.png',
        width: 1536,
        height: 672,
        alt: 'Municipalidad de San Benito',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CAV — San Benito',
    description: 'Centro de Atención al Vecino — Municipalidad de San Benito',
    images: ['/og-image.png'],
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#b6c544' },
    { media: '(prefers-color-scheme: dark)', color: '#076633' },
  ],
  width: 'device-width',
  initialScale: 1,
}
```

`metadataBase` usa `NEXT_PUBLIC_SERVER_URL` si existe (ya documentado en el README) y cae a la URL de producción.

### 3. Unificar titles de páginas

Quitar el sufijo duplicado de cada page y dejar solo el segmento, para que el `template` lo complete:

| Archivo                                                                                       | Title nuevo          |
| --------------------------------------------------------------------------------------------- | -------------------- |
| [`login/page.tsx`](<src/app/(frontend)/login/page.tsx>)                                       | `Iniciar Sesión`     |
| [`dashboard/layout.tsx`](<src/app/(frontend)/dashboard/layout.tsx>)                           | `Dashboard`          |
| [`dashboard/reclamos/page.tsx`](<src/app/(frontend)/dashboard/reclamos/page.tsx>)             | `Reclamos`           |
| [`dashboard/reclamos/nuevo/page.tsx`](<src/app/(frontend)/dashboard/reclamos/nuevo/page.tsx>) | `Nuevo Reclamo`      |
| [`dashboard/reclamos/[id]/page.tsx`](<src/app/(frontend)/dashboard/reclamos/[id]/page.tsx>)   | `Detalle de Reclamo` |
| [`mis-reclamos/page.tsx`](<src/app/(frontend)/mis-reclamos/page.tsx>)                         | `Mis Reclamos`       |
| [`mis-reclamos/nuevo/page.tsx`](<src/app/(frontend)/mis-reclamos/nuevo/page.tsx>)             | `Nuevo Reclamo`      |

Resultado en tab: `Reclamos | CAV San Benito`.

### 4. Manifest PWA completo

Crear [`public/manifest.json`](public/manifest.json):

```json
{
  "name": "Centro de Atención al Vecino",
  "short_name": "CAV San Benito",
  "description": "Gestión interna de reclamos vecinales — Municipalidad de San Benito",
  "start_url": "/",
  "display": "standalone",
  "orientation": "portrait-primary",
  "theme_color": "#b6c544",
  "background_color": "#ffffff",
  "categories": ["government", "public-services"],
  "lang": "es",
  "icons": [
    {
      "src": "/web-app-manifest-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/web-app-manifest-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable any"
    }
  ]
}
```

Sin screenshots: no hay capturas del CAV; el resto del manifest queda completo y funcional.

### 5. Payload admin

En [`src/payload.config.ts`](src/payload.config.ts) ampliar `admin.meta` para alinear el panel:

- `titleSuffix: '— CAV San Benito'` (ya existe)
- `icons` / favicon apuntando a los mismos assets de marca (`/favicon.ico` o paths relativos que Payload soporte)

### 6. Fuera de alcance (explícito)

- No reemplazar logos en UI (sidebar/login) en este PR; los webp ya están en `public/` para un paso posterior
- No generar OG específica del CAV
- No agregar screenshots al manifest

## Verificación

- Abrir `/` y `/login` → favicon + title con template
- View source / DevTools → `robots`, `og:*`, `twitter:*`, `theme-color`, link a `/manifest.json`
- Abrir `/manifest.json` → name/icons/theme correctos
- Confirmar que `icon.svg` responde (renombre)
