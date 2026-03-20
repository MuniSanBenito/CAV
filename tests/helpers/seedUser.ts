import { getPayload } from 'payload'
import config from '../../src/payload.config.js'

export const testUser = {
  email: 'admin@sanbenito.gob.ar',
  password: 'test',
  nombre: 'Admin',
  apellido: 'Test',
  role: 'admin' as const,
}

/**
 * Seeds a test user for e2e admin tests.
 */
export async function seedTestUser(): Promise<void> {
  const payload = await getPayload({ config })

  // Ensure test area exists
  let testArea
  const existingAreas = await payload.find({
    collection: 'areas',
    where: { nombre: { equals: 'Área de Prueba' } },
    depth: 0,
  })

  if (existingAreas.docs.length > 0) {
    testArea = existingAreas.docs[0]
  } else {
    testArea = await payload.create({
      collection: 'areas',
      data: {
        nombre: 'Área de Prueba',
        descripcion: 'Área generada para pruebas',
        activa: true,
      },
    })
  }

  // Delete existing test user if any
  await payload.delete({
    collection: 'users',
    where: {
      email: {
        equals: testUser.email,
      },
    },
  })

  // Create fresh test user with the test area
  await payload.create({
    collection: 'users',
    data: {
      ...testUser,
      area: testArea.id,
    },
  })
}

/**
 * Cleans up test user after tests
 */
export async function cleanupTestUser(): Promise<void> {
  const payload = await getPayload({ config })

  await payload.delete({
    collection: 'users',
    where: {
      email: {
        equals: testUser.email,
      },
    },
  })
}
