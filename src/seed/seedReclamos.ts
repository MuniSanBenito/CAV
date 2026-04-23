/**
 * Seed script — genera datos ficticios de reclamos para testing.
 *
 * Uso:
 *   pnpm seed                    # 1500 reclamos (default)
 *   SEED_COUNT=5000 pnpm seed    # cantidad custom
 *   SEED_CLEAN=1 pnpm seed       # borra reclamos + contribuyentes seed antes
 *
 * Importante:
 *   - Usa Local API de Payload (respeta el contador atómico de `numero`).
 *   - NO dispara el geocoder remoto: setea `ubicacion.location` y `coordenadas` directamente.
 *   - Crea un admin de seed si no hay ninguno, para usarlo como `creadoPor`.
 */
import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../payload.config'

// ──────────────────────────────────────────────────────────────────────────────
// Configuración
// ──────────────────────────────────────────────────────────────────────────────
const SEED_COUNT = Number(process.env.SEED_COUNT || 1500)
const SEED_CLEAN = process.env.SEED_CLEAN === '1'
const CONTRIBUYENTES_COUNT = 60
const BATCH_SIZE = 25 // Paralelismo por lote (no saturar Mongo ni el counter)

// Centro aprox. de San Benito, Entre Ríos
const SAN_BENITO_CENTER = { lat: -31.7795, lng: -60.4414 }
const MAX_OFFSET = 0.03 // ~3km

const AREAS_DEFAULT = [
  { nombre: 'Obras Públicas', descripcion: 'Mantenimiento de calles, alumbrado y obra pública' },
  { nombre: 'Higiene Urbana', descripcion: 'Recolección, barrido y limpieza' },
  { nombre: 'Espacios Verdes', descripcion: 'Plazas, parques y arbolado' },
  { nombre: 'Tránsito', descripcion: 'Señalización y control vehicular' },
  { nombre: 'Seguridad Ciudadana', descripcion: 'Convivencia, denuncias y patrullaje' },
  { nombre: 'Servicios Públicos', descripcion: 'Agua, cloacas y pluviales' },
  { nombre: 'Atención al Vecino', descripcion: 'Mesa de entradas y derivaciones' },
]

const BARRIOS = [
  'Centro',
  'Villa Libertad',
  'Las Flores',
  'San José',
  'Norte',
  'Sur',
  'Este',
  'Oeste',
  'Barrio Belgrano',
  'Barrio Sarmiento',
]

const CALLES = [
  '25 de Mayo',
  'San Martín',
  'Belgrano',
  'Mitre',
  'Rivadavia',
  'Sarmiento',
  'Urquiza',
  'Alem',
  '9 de Julio',
  'Perón',
  'Los Constituyentes',
  'Libertad',
  'España',
  'Italia',
  'Francia',
]

const NOMBRES = [
  'María',
  'José',
  'Juan',
  'Carlos',
  'Ana',
  'Luis',
  'Lucía',
  'Martín',
  'Sofía',
  'Diego',
  'Laura',
  'Jorge',
  'Patricia',
  'Roberto',
  'Silvia',
  'Gabriel',
  'Florencia',
  'Matías',
  'Verónica',
  'Ricardo',
  'Claudia',
  'Miguel',
  'Alejandra',
  'Fernando',
  'Graciela',
  'Hernán',
  'Romina',
  'Pablo',
  'Natalia',
  'Sebastián',
  'Valeria',
  'Gustavo',
  'Andrea',
  'Emiliano',
  'Cecilia',
  'Nicolás',
  'Mariana',
]

const APELLIDOS = [
  'González',
  'Rodríguez',
  'Fernández',
  'López',
  'Martínez',
  'García',
  'Pérez',
  'Gómez',
  'Sánchez',
  'Romero',
  'Sosa',
  'Díaz',
  'Álvarez',
  'Torres',
  'Ruiz',
  'Ramírez',
  'Flores',
  'Acosta',
  'Benítez',
  'Medina',
  'Suárez',
  'Herrera',
  'Aguirre',
  'Castro',
  'Silva',
  'Molina',
  'Ortiz',
  'Morales',
  'Rojas',
  'Luna',
]

const DESCRIPCIONES_POR_CATEGORIA: Record<string, string[]> = {
  alumbrado: [
    'Luminaria quemada hace más de una semana',
    'Poste de luz sin funcionar en toda la cuadra',
    'Luz intermitente molesta a los vecinos',
    'Falta luminaria en esquina peligrosa',
  ],
  pavimento: [
    'Pozo enorme en la calzada, peligro para motos',
    'Bache profundo frente al domicilio',
    'Empedrado hundido y suelto',
    'Calle en mal estado después de las lluvias',
  ],
  higiene: [
    'Acumulación de basura en esquina',
    'No pasó el camión recolector esta semana',
    'Contenedor roto y desbordado',
    'Microbasural en terreno baldío',
  ],
  pluviales: [
    'Desagüe tapado, se inunda con cada lluvia',
    'Zanja sin limpiar hace meses',
    'Agua estancada foco de mosquitos',
    'Alcantarilla hundida y peligrosa',
  ],
  verdes: [
    'Árbol caído sobre la vereda',
    'Rama a punto de caerse sobre cables',
    'Plaza sin mantenimiento',
    'Pasto crecido en espacio público',
  ],
  transito: [
    'Semáforo descompuesto en intersección clave',
    'Falta señalización de stop en esquina',
    'Cartel de calle ilegible o faltante',
    'Lomada gastada, casi imperceptible',
  ],
  ruidos: [
    'Vecinos con música alta hasta tarde',
    'Obra en construcción trabajando en horarios no permitidos',
    'Escape libre de moto reiterado',
    'Fiesta clandestina reiterada',
  ],
  convivencia: [
    'Casa abandonada usada como aguantadero',
    'Problema de convivencia vecinal recurrente',
    'Animal suelto agresivo en la vía pública',
    'Consumo de sustancias en la vía pública',
  ],
  servicios: [
    'Sin agua desde hace dos días',
    'Pérdida de agua en la vereda',
    'Olor a cloaca en la cuadra',
    'Corte de luz reiterado en el barrio',
  ],
  general: [
    'Consulta sobre trámite municipal',
    'Sugerencia para mejorar servicio',
    'Reclamo administrativo general',
    'Pedido de información pública',
  ],
}

const TIPOS = ['reclamo', 'sugerencia', 'denuncia', 'consulta'] as const
const MEDIOS = ['presencial', 'whatsapp', 'correo', 'calle', 'otro'] as const
const CATEGORIAS = [
  'general',
  'alumbrado',
  'pavimento',
  'higiene',
  'pluviales',
  'verdes',
  'transito',
  'ruidos',
  'convivencia',
  'servicios',
] as const
const PRIORIDADES = ['baja', 'media', 'alta', 'urgente'] as const
const ESTADOS = ['pendiente', 'en_proceso', 'resuelto', 'rechazado'] as const

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────
function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)] as T
}

function pickWeighted<T>(pairs: Array<[T, number]>): T {
  const total = pairs.reduce((s, [, w]) => s + w, 0)
  let r = Math.random() * total
  for (const [v, w] of pairs) {
    r -= w
    if (r <= 0) return v
  }
  return pairs[0]![0]
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomDateWithinDays(days: number): Date {
  const now = Date.now()
  return new Date(now - Math.random() * days * 24 * 60 * 60 * 1000)
}

function randomCoordsNearSanBenito(): { lat: number; lng: number } {
  return {
    lat: SAN_BENITO_CENTER.lat + (Math.random() - 0.5) * 2 * MAX_OFFSET,
    lng: SAN_BENITO_CENTER.lng + (Math.random() - 0.5) * 2 * MAX_OFFSET,
  }
}

function randomDNI(existing: Set<string>): string {
  let dni: string
  do {
    dni = String(randomInt(15_000_000, 55_000_000))
  } while (existing.has(dni))
  existing.add(dni)
  return dni
}

function randomDireccion(): string {
  const calle = pick(CALLES)
  const numero = randomInt(50, 2500)
  return `${calle} ${numero}`
}

function randomTelefono(): string {
  return `343${randomInt(4000000, 5999999)}`
}

// ──────────────────────────────────────────────────────────────────────────────
// Seed
// ──────────────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🌱 Iniciando seed...\n')
  const payload = await getPayload({ config })

  // 1. Limpiar si fue solicitado
  if (SEED_CLEAN) {
    console.log('🧹 Limpiando reclamos y contribuyentes existentes...')
    await payload.delete({ collection: 'reclamos', where: {}, overrideAccess: true })
    await payload.delete({ collection: 'contribuyentes', where: {}, overrideAccess: true })
    // Reset contador
    const db = (
      payload.db as unknown as {
        connection: {
          db: { collection: (n: string) => { deleteOne: (f: object) => Promise<unknown> } }
        }
      }
    ).connection.db
    await db.collection('counters').deleteOne({ _id: 'reclamo_numero' })
    console.log('✅ Limpieza completa\n')
  }

  // 2. Áreas — asegurar mínimas
  const existingAreas = await payload.find({
    collection: 'areas',
    limit: 100,
    overrideAccess: true,
  })
  let areas = existingAreas.docs
  if (areas.length === 0) {
    console.log('📁 Creando áreas por defecto...')
    const created = await Promise.all(
      AREAS_DEFAULT.map((a) =>
        payload.create({ collection: 'areas', data: { ...a, activa: true }, overrideAccess: true }),
      ),
    )
    areas = created
    console.log(`✅ ${areas.length} áreas creadas\n`)
  } else {
    console.log(`📁 Usando ${areas.length} áreas existentes\n`)
  }

  // 3. Usuario admin — usar uno existente o crear uno de seed
  const admins = await payload.find({
    collection: 'users',
    where: { role: { equals: 'admin' } },
    limit: 1,
    overrideAccess: true,
  })
  let adminUser = admins.docs[0]
  if (!adminUser) {
    console.log('👤 Creando admin de seed...')
    adminUser = await payload.create({
      collection: 'users',
      data: {
        email: 'seed-admin@cav.local',
        password: 'SeedAdmin2026!',
        nombre: 'Seed',
        apellido: 'Admin',
        role: 'admin',
        areas: areas.map((a) => a.id),
      } as any,
      overrideAccess: true,
    })
    console.log(`✅ Admin creado: ${adminUser.email}\n`)
  } else {
    console.log(`👤 Usando admin existente: ${adminUser.email}\n`)
  }

  // 4. Contribuyentes
  console.log(`👥 Creando ${CONTRIBUYENTES_COUNT} contribuyentes...`)
  const existingDnis = new Set<string>(
    (
      await payload.find({
        collection: 'contribuyentes',
        limit: 10000,
        overrideAccess: true,
      })
    ).docs.map((c) => c.dni || ''),
  )

  const contribuyentesToCreate = Array.from({ length: CONTRIBUYENTES_COUNT }, () => ({
    nombre: pick(NOMBRES),
    apellido: pick(APELLIDOS),
    dni: randomDNI(existingDnis),
    telefono: randomTelefono(),
    email: `${pick(NOMBRES).toLowerCase()}.${pick(APELLIDOS).toLowerCase()}@example.com`,
    direccion: randomDireccion(),
  }))

  const contribuyentes: Array<{ id: string | number }> = []
  for (let i = 0; i < contribuyentesToCreate.length; i += BATCH_SIZE) {
    const batch = contribuyentesToCreate.slice(i, i + BATCH_SIZE)
    const created = await Promise.all(
      batch.map((data) =>
        payload.create({ collection: 'contribuyentes', data, overrideAccess: true }),
      ),
    )
    contribuyentes.push(...created)
    process.stdout.write(`  ${contribuyentes.length}/${CONTRIBUYENTES_COUNT}\r`)
  }
  console.log(`\n✅ ${contribuyentes.length} contribuyentes creados\n`)

  // 5. Reclamos
  console.log(`📝 Creando ${SEED_COUNT} reclamos...`)
  const started = Date.now()
  let done = 0
  let errors = 0

  for (let i = 0; i < SEED_COUNT; i += BATCH_SIZE) {
    const batchSize = Math.min(BATCH_SIZE, SEED_COUNT - i)
    const batch = Array.from({ length: batchSize }).map(() =>
      buildReclamoData(areas, contribuyentes, adminUser.id),
    )

    const results = await Promise.allSettled(
      batch.map((data) =>
        payload.create({ collection: 'reclamos', data, overrideAccess: true, user: adminUser }),
      ),
    )

    for (const r of results) {
      if (r.status === 'fulfilled') done++
      else {
        errors++
        if (errors <= 5) console.error('   ✖', r.reason?.message || r.reason)
      }
    }

    const pct = Math.floor(((i + batchSize) / SEED_COUNT) * 100)
    const elapsed = ((Date.now() - started) / 1000).toFixed(1)
    process.stdout.write(`  ${done}/${SEED_COUNT} (${pct}%) — ${elapsed}s\r`)
  }

  const totalElapsed = ((Date.now() - started) / 1000).toFixed(1)
  console.log(
    `\n✅ ${done} reclamos creados en ${totalElapsed}s${errors > 0 ? ` (${errors} errores)` : ''}\n`,
  )

  // 6. Backdate createdAt/updatedAt aleatoriamente en los últimos 60 días.
  //    Payload asigna createdAt=now al crear; para ver distribución temporal realista
  //    reescribimos directo en Mongo.
  console.log('📅 Reescribiendo fechas para distribución en últimos 60 días...')
  const db = (
    payload.db as unknown as {
      connection: {
        db: {
          collection: (n: string) => {
            find: (
              f: object,
              o?: object,
            ) => {
              toArray: () => Promise<Array<{ _id: unknown }>>
            }
            bulkWrite: (ops: unknown[]) => Promise<{ modifiedCount?: number }>
          }
        }
      }
    }
  ).connection.db
  const reclamosCol = db.collection('reclamos')
  const allSeeded = await reclamosCol.find({}, { projection: { _id: 1 } }).toArray()
  const ops = allSeeded.map((doc) => {
    const d = randomDateWithinDays(60)
    return {
      updateOne: {
        filter: { _id: doc._id },
        update: { $set: { createdAt: d, updatedAt: d } },
      },
    }
  })
  if (ops.length > 0) {
    const result = await reclamosCol.bulkWrite(ops)
    console.log(`✅ ${result.modifiedCount ?? ops.length} fechas actualizadas\n`)
  }

  console.log('🎉 Seed completo. Ingresá al dashboard para ver los datos.\n')
  process.exit(0)
}

// ──────────────────────────────────────────────────────────────────────────────
// Constructor de un reclamo ficticio
// ──────────────────────────────────────────────────────────────────────────────
function buildReclamoData(
  areas: Array<{ id: string | number; nombre?: string }>,
  contribuyentes: Array<{ id: string | number }>,
  adminId: string | number,
) {
  const tipo = pickWeighted<(typeof TIPOS)[number]>([
    ['reclamo', 60],
    ['denuncia', 15],
    ['consulta', 15],
    ['sugerencia', 10],
  ])
  const estado = pickWeighted<(typeof ESTADOS)[number]>([
    ['pendiente', 40],
    ['en_proceso', 30],
    ['resuelto', 25],
    ['rechazado', 5],
  ])
  const prioridad = pickWeighted<(typeof PRIORIDADES)[number]>([
    ['baja', 20],
    ['media', 50],
    ['alta', 25],
    ['urgente', 5],
  ])
  const categoria = pick(CATEGORIAS)
  const medio = pick(MEDIOS)
  const area = pick(areas)
  const areaReceptora = pick(areas)
  const contribuyente = pick(contribuyentes)
  const coords = randomCoordsNearSanBenito()
  const createdAt = randomDateWithinDays(60)
  const descripcion = pick(
    DESCRIPCIONES_POR_CATEGORIA[categoria] || DESCRIPCIONES_POR_CATEGORIA.general!,
  )
  const barrio = pick(BARRIOS)
  const direccion = randomDireccion()

  // Movimientos coherentes con el estado
  const movimientos: Array<{
    estado: string
    nota: string
    fecha: string
    usuario: string | number
  }> = []
  if (estado !== 'pendiente') {
    movimientos.push({
      estado: 'en_proceso',
      nota: 'Tomamos el reclamo, asignamos cuadrilla para revisar.',
      fecha: new Date(createdAt.getTime() + randomInt(1, 48) * 3600_000).toISOString(),
      usuario: adminId,
    })
  }
  if (estado === 'resuelto') {
    movimientos.push({
      estado: 'resuelto',
      nota: 'Trabajo finalizado. Se verificó en el lugar.',
      fecha: new Date(createdAt.getTime() + randomInt(48, 240) * 3600_000).toISOString(),
      usuario: adminId,
    })
  }
  if (estado === 'rechazado') {
    movimientos.push({
      estado: 'rechazado',
      nota: 'Reclamo fuera de competencia municipal.',
      fecha: new Date(createdAt.getTime() + randomInt(12, 72) * 3600_000).toISOString(),
      usuario: adminId,
    })
  }

  return {
    contribuyente: contribuyente.id,
    tipo,
    descripcion,
    medio,
    area_receptora: areaReceptora.id,
    area_derivada: area.id,
    categoria,
    prioridad,
    estado,
    // Ubicación: seteamos directo para evitar el geocoder remoto
    ubicacion: {
      direccionNormalizada: `${direccion}, San Benito, Entre Ríos`,
      barrio,
      localidad: 'San Benito',
      location: {
        type: 'Point',
        coordinates: [coords.lng, coords.lat],
      },
    },
    // Legacy (el mapa actual lee de acá)
    calle: direccion,
    coordenadas: { lat: coords.lat, lng: coords.lng },
    observaciones: Math.random() < 0.2 ? 'Observación interna de prueba (seed).' : undefined,
    creadoPor: adminId,
    movimientos,
    diasResolucionEstimados: randomInt(3, 15),
    createdAt: createdAt.toISOString(),
    updatedAt: createdAt.toISOString(),
  } as any
}

main().catch((err) => {
  console.error('❌ Seed falló:', err)
  process.exit(1)
})
