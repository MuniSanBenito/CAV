# Centro de Atención al Vecino (CAV) — Municipalidad de San Benito

Sistema web de gestión de reclamos ciudadanos para la Municipalidad de San Benito. Permite a los vecinos reportar problemas y realizar seguimiento de sus reclamos, mientras que los municipales pueden gestionar y resolverlos eficientemente.

## 🚀 Stack Tecnológico

- **Payload CMS 3.85** — Headless CMS para gestión de contenido y autenticación
- **Next.js 16** — Framework React para el frontend
- **MongoDB** — Base de datos NoSQL
- **TypeScript** — Tipado estático
- **Tailwind CSS 4 + DaisyUI** — Estilos y componentes UI
- **Leaflet + React-Leaflet** — Mapas interactivos
- **Playwright** — Tests E2E
- **Vitest** — Tests unitarios/integración

## 👥 Roles de Usuario

El sistema cuenta con cuatro roles con diferentes permisos:

- **admin** — Acceso completo al panel de administración de Payload
- **carga** — Carga reclamos mediante el formulario ciudadano
- **ejecutor** — Asignado a un área municipal, gestiona y resuelve reclamos
- **visualizador** — Solo lectura de estadísticas y reclamos

## 📁 Colecciones

- **users** — Colección de autenticación con roles y área asignada (para ejecutores)
- **areas** — Áreas municipales (nombre, descripción, estado activo/inactivo)
- **media** — Gestión de archivos e imágenes
- **contribuyentes** — Información de los ciudadanos que realizan reclamos
- **conceptosReclamo** — Categorías/tipos de reclamos disponibles
- **reclamos** — Core del sistema: reclamos con estado, ubicación, asignación y seguimiento

## 🔐 Control de Acceso

Las funciones de control de acceso están centralizadas en `src/access/roles.ts`:

- `anyone` — Acceso público
- `authenticated` — Solo usuarios autenticados
- `isAdmin` — Solo administradores
- `isAdminOrSelf` — Admin o el propio usuario

## 🛠️ Scripts Disponibles

```bash
# Desarrollo
bun dev              # Iniciar servidor de desarrollo
bun devsafe          # Limpiar .next y iniciar dev server

# Build
bun build            # Build de producción
bun start            # Iniciar servidor de producción

# Payload
bun generate:types   # Generar tipos TypeScript después de cambios en schema
bun generate:importmap # Generar import map para componentes
bun payload          # CLI de Payload

# Tests
bun test             # Ejecutar todos los tests
bun test:int         # Tests de integración (Vitest)
bun test:e2e         # Tests E2E (Playwright)

# Utilidades
bun lint             # Linting con ESLint
bun seed             # Seed de datos de prueba
bun update           # Actualizar dependencias
```

## 📋 Requisitos Previos

- **Node.js**: 18.20.2 o >=20.9.0
- **bun**: 9 o 10
- **MongoDB**: Instancia local o en la nube

## 🚀 Instalación y Configuración

1. **Clonar el repositorio**

   ```bash
   git clone <repo-url>
   cd CAV
   ```

2. **Instalar dependencias**

   ```bash
   bun install
   ```

3. **Configurar variables de entorno**

   ```bash
   cp .env.example .env
   ```

   Editar `.env` con tus credenciales:

   ```
   DATABASE_URL=mongodb://localhost:27017/cav-san-benito
   PAYLOAD_SECRET=tu-secret-key-aqui
   NEXT_PUBLIC_SERVER_URL=http://localhost:3000
   ```

4. **Iniciar servidor de desarrollo**

   ```bash
   bun dev
   ```

5. **Abrir en el navegador**
   ```
   http://localhost:3000
   ```

## 🐳 Docker (Opcional)

Si prefieres usar Docker para la base de datos local:

1. Configurar `MONGODB_URL` en `.env`:

   ```
   MONGODB_URL=mongodb://127.0.0.1/cav-san-benito
   ```

2. Modificar `docker-compose.yml` con el mismo nombre de base de datos

3. Iniciar contenedor:
   ```bash
   docker-compose up -d
   ```

## 📂 Estructura del Proyecto

```
src/
├── access/              # Funciones de control de acceso
│   └── roles.ts
├── app/                 # Rutas de Next.js
│   ├── (frontend)/      # Rutas públicas del frontend
│   ├── (payload)/       # Panel de administración de Payload
│   └── api/             # API routes
├── collections/         # Configuraciones de colecciones de Payload
│   ├── Users.ts
│   ├── Areas.ts
│   ├── Media.ts
│   ├── Reclamos.ts
│   ├── ConceptosReclamo.ts
│   └── Contribuyentes.ts
├── components/          # Componentes React reutilizables
├── hooks/               # Hooks personalizados
├── payload.config.ts    # Configuración principal de Payload
└── payload-types.ts     # Tipos generados automáticamente
```

## 🔧 Desarrollo

### Después de modificar colecciones

Si modificas el schema de cualquier colección, regenera los tipos:

```bash
bun generate:types
```

### Crear componentes personalizados

Los componentes del panel de Payload se definen usando rutas de archivo en `payload.config.ts`. Después de crear/modificar componentes:

```bash
bun generate:importmap
```

### Validar TypeScript

```bash
tsc --noEmit
```

## 🧪 Testing

```bash
# Tests de integración
bun test:int

# Tests E2E
bun test:e2e

# Todos los tests
bun test
```

## 📦 Build para Producción

```bash
bun build
bun start
```

## 🔒 Seguridad

- El sistema usa control de acceso basado en roles (RBAC)
- Las operaciones del Local API requieren `overrideAccess: false` cuando se pasa un usuario
- Los hooks siempre deben pasar `req` para mantener atomicidad en transacciones
- Los roles se incluyen en el JWT para acceso rápido

## 📞 Soporte

Para preguntas sobre Payload CMS:

- [Discord oficial](https://discord.com/invite/payload)
- [GitHub Discussions](https://github.com/payloadcms/payload/discussions)
- [Documentación oficial](https://payloadcms.com/docs)

## 📄 Licencia

MIT
