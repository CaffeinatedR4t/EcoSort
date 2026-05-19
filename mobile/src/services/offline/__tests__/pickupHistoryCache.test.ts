import {
  cacheCollectorPickupHistory,
  getCachedCollectorPickupHistory,
} from '../pickupHistoryCache';
import * as SQLite from 'expo-sqlite';

const db = {
  execAsync: jest.fn(),
  runAsync: jest.fn(),
  getAllAsync: jest.fn(),
};

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(),
}));

describe('pickupHistoryCache', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (SQLite.openDatabaseAsync as jest.Mock).mockResolvedValue(db);
    db.execAsync.mockResolvedValue(undefined);
    db.runAsync.mockResolvedValue(undefined);
    db.getAllAsync.mockResolvedValue([]);
  });

  it('creates the pickup history cache table before reading or writing', async () => {
    await cacheCollectorPickupHistory('collector-1', []);

    expect(SQLite.openDatabaseAsync).toHaveBeenCalledWith('ecosort_offline.db');
    expect(db.execAsync).toHaveBeenCalledWith(expect.stringContaining('collector_pickup_history'));
  });

  it('replaces cached rows for a collector with serialized pickup history', async () => {
    await cacheCollectorPickupHistory('collector-1', [
      {
        id: 'pickup-1',
        created_at: '2026-05-19T01:00:00.000Z',
        location: { address: 'Jakarta', lat: -6.2, lng: 106.8 },
        waste_classifications: [{ waste_type: 'plastic', collector_weight_kg: 2 }],
      },
    ]);

    expect(db.runAsync).toHaveBeenCalledWith(
      'DELETE FROM collector_pickup_history WHERE collector_id = ?',
      'collector-1'
    );
    expect(db.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT OR REPLACE INTO collector_pickup_history'),
      expect.objectContaining({
        $id: 'pickup-1',
        $collectorId: 'collector-1',
        $createdAt: '2026-05-19T01:00:00.000Z',
      })
    );
  });

  it('returns cached pickup history rows in newest-first order', async () => {
    db.getAllAsync.mockResolvedValue([
      {
        payload_json: JSON.stringify({
          id: 'pickup-1',
          created_at: '2026-05-19T01:00:00.000Z',
          location: { address: 'Jakarta' },
          waste_classifications: [],
        }),
      },
    ]);

    const result = await getCachedCollectorPickupHistory('collector-1');

    expect(db.getAllAsync).toHaveBeenCalledWith(
      expect.stringContaining('ORDER BY created_at DESC'),
      'collector-1'
    );
    expect(result).toEqual([
      {
        id: 'pickup-1',
        created_at: '2026-05-19T01:00:00.000Z',
        location: { address: 'Jakarta' },
        waste_classifications: [],
      },
    ]);
  });
});
