type MongoDb = { collection: (name: string) => unknown }
type PayloadInstance = { db: unknown }

/**
 * Returns a typed MongoDB collection from a Payload instance.
 * Centralizes the raw MongoDB adapter cast in one place.
 * Use only for operations not supported by Payload Local API
 * (e.g. $near geospatial queries, complex aggregation pipelines).
 */
export function getMongoCollection<T = Record<string, unknown>>(
  payloadInstance: PayloadInstance,
  name: string,
): T {
  const db = (payloadInstance.db as unknown as { connection: { db: MongoDb } }).connection.db
  return db.collection(name) as T
}
