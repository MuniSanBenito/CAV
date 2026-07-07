import { MongoClient } from 'mongodb'

async function main() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL no configurada')

  const client = new MongoClient(url)
  await client.connect()
  const col = client.db().collection('reclamos')

  const legacy = await col.find({ contribuyente: { $type: 'objectId' } }).toArray()
  for (const doc of legacy) {
    await col.updateOne(
      { _id: doc._id },
      {
        $set: {
          contribuyente: {
            externoId: String(doc.contribuyente),
          },
        },
      },
    )
    console.log(`Migrado reclamo #${doc.numero} (ObjectId → externoId)`)
  }

  const sinExternoId = await col
    .find({
      contribuyente: { $type: 'object' },
      'contribuyente.externoId': { $exists: false },
    })
    .toArray()

  for (const doc of sinExternoId) {
    const c = doc.contribuyente as Record<string, unknown>
    const externoId = c.id != null ? String(c.id) : 'desconocido'
    await col.updateOne(
      { _id: doc._id },
      {
        $set: { 'contribuyente.externoId': externoId },
        ...(c.id != null ? { $unset: { 'contribuyente.id': '' } } : {}),
      },
    )
    console.log(`Agregado externoId en reclamo #${doc.numero}`)
  }

  const conSnapshot = await col
    .find({
      contribuyente: { $type: 'object' },
      'contribuyente.externoId': { $exists: true },
      $or: [
        { 'contribuyente.nombre': { $exists: true } },
        { 'contribuyente.numero_documento': { $exists: true } },
        { 'contribuyente.telefono_web': { $exists: true } },
        { 'contribuyente.email': { $exists: true } },
        { 'contribuyente.domicilio': { $exists: true } },
        { 'contribuyente.numero_contribuyente': { $exists: true } },
      ],
    })
    .toArray()

  for (const doc of conSnapshot) {
    const c = doc.contribuyente as Record<string, unknown>
    const externoId = c.externoId != null ? String(c.externoId) : 'desconocido'
    await col.updateOne(
      { _id: doc._id },
      {
        $set: { contribuyente: { externoId } },
      },
    )
    console.log(`Limpiado snapshot en reclamo #${doc.numero}`)
  }

  console.log(
    `Listo: ${legacy.length} legacy, ${sinExternoId.length} sin externoId, ${conSnapshot.length} snapshots limpiados`,
  )
  await client.close()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
