import * as SQLite from 'expo-sqlite';

export type CachedPickupHistoryItem = {
  id: string;
  created_at: string;
  location?: {
    address?: string;
    lat?: number;
    lng?: number;
  } | null;
  waste_hint?: string | null;
  waste_classifications?: Array<{
    waste_type?: string | null;
    collector_weight_kg?: number | null;
  }>;
};

const DB_NAME = 'ecosort_offline.db';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

const getDb = async () => {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync(DB_NAME);
  }
  const db = await dbPromise;
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS collector_pickup_history (
      id TEXT PRIMARY KEY NOT NULL,
      collector_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      cached_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_collector_pickup_history_collector_created
      ON collector_pickup_history (collector_id, created_at DESC);
  `);
  return db;
};

export const cacheCollectorPickupHistory = async (
  collectorId: string,
  items: CachedPickupHistoryItem[]
) => {
  const db = await getDb();
  await db.runAsync('DELETE FROM collector_pickup_history WHERE collector_id = ?', collectorId);

  const cachedAt = new Date().toISOString();
  for (const item of items) {
    await db.runAsync(
      `INSERT OR REPLACE INTO collector_pickup_history
        (id, collector_id, created_at, payload_json, cached_at)
       VALUES ($id, $collectorId, $createdAt, $payloadJson, $cachedAt)`,
      {
        $id: item.id,
        $collectorId: collectorId,
        $createdAt: item.created_at,
        $payloadJson: JSON.stringify(item),
        $cachedAt: cachedAt,
      }
    );
  }
};

export const getCachedCollectorPickupHistory = async (collectorId: string) => {
  const db = await getDb();
  const rows = await db.getAllAsync<{ payload_json: string }>(
    `SELECT payload_json
     FROM collector_pickup_history
     WHERE collector_id = ?
     ORDER BY created_at DESC`,
    collectorId
  );

  return rows
    .map((row) => {
      try {
        return JSON.parse(row.payload_json) as CachedPickupHistoryItem;
      } catch {
        return null;
      }
    })
    .filter((item): item is CachedPickupHistoryItem => Boolean(item));
};
