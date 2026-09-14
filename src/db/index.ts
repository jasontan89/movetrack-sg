import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Box, Household, Item } from '../types';
import { INITIAL_BOXES, INITIAL_HOUSEHOLD, INITIAL_ITEMS } from './mockData';

interface MoveTrackDB extends DBSchema {
  household: {
    key: string;
    value: Household;
  };
  items: {
    key: string;
    value: Item;
    indexes: {
      'by-household': string;
      'by-owner': string;
      'by-room': string;
      'by-decision': string;
      'by-box': string;
    };
  };
  boxes: {
    key: string;
    value: Box;
    indexes: {
      'by-household': string;
      'by-box-number': number;
    };
  };
  offline_queue: {
    key: number;
    value: {
      action: 'insert' | 'update' | 'delete';
      table: 'items' | 'boxes';
      data: any;
      timestamp: string;
    };
  };
}

const DB_NAME = 'MoveTrackSG_DB';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<MoveTrackDB>> | null = null;

export function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<MoveTrackDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('household')) {
          db.createObjectStore('household', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('items')) {
          const itemStore = db.createObjectStore('items', { keyPath: 'id' });
          itemStore.createIndex('by-household', 'household_id');
          itemStore.createIndex('by-owner', 'owner');
          itemStore.createIndex('by-room', 'room');
          itemStore.createIndex('by-decision', 'decision_status');
          itemStore.createIndex('by-box', 'box_id');
        }
        if (!db.objectStoreNames.contains('boxes')) {
          const boxStore = db.createObjectStore('boxes', { keyPath: 'id' });
          boxStore.createIndex('by-household', 'household_id');
          boxStore.createIndex('by-box-number', 'box_number');
        }
        if (!db.objectStoreNames.contains('offline_queue')) {
          db.createObjectStore('offline_queue', { autoIncrement: true });
        }
      },
    });
  }
  return dbPromise;
}

let isInitialized = false;
let initPromise: Promise<void> | null = null;

// Initialize database structure and household profile
export async function initializeDatabase(): Promise<void> {
  if (isInitialized) return;
  if (!initPromise) {
    initPromise = (async () => {
      const db = await getDb();
      const existingHousehold = await db.getAll('household');
      if (existingHousehold.length === 0) {
        await db.put('household', INITIAL_HOUSEHOLD);
      }
      isInitialized = true;
    })();
  }
  return initPromise;
}

// Household Operations
export async function getHousehold(): Promise<Household> {
  await initializeDatabase();
  const db = await getDb();
  const all = await db.getAll('household');
  if (all.length > 0) return all[0];
  return INITIAL_HOUSEHOLD;
}

export async function saveHousehold(household: Household): Promise<void> {
  const db = await getDb();
  await db.put('household', household);
}

// Item Operations
export async function getAllItems(): Promise<Item[]> {
  await initializeDatabase();
  const db = await getDb();
  return db.getAll('items');
}

export async function saveItem(item: Item): Promise<void> {
  const db = await getDb();
  item.updated_at = new Date().toISOString();
  await db.put('items', item);
}

export async function deleteItem(id: string): Promise<void> {
  const db = await getDb();
  await db.delete('items', id);
}

// Box Operations
export async function getAllBoxes(): Promise<Box[]> {
  await initializeDatabase();
  const db = await getDb();
  return db.getAll('boxes');
}

export async function saveBox(box: Box): Promise<void> {
  const db = await getDb();
  await db.put('boxes', box);
}

export async function deleteBox(id: string): Promise<void> {
  const db = await getDb();
  // Unassign items belonging to this box
  const allItems = await db.getAll('items');
  const tx = db.transaction(['items', 'boxes'], 'readwrite');
  for (const item of allItems) {
    if (item.box_id === id) {
      item.box_id = null;
      await tx.objectStore('items').put(item);
    }
  }
  await tx.objectStore('boxes').delete(id);
  await tx.done;
}

// Offline Queue Operations
export async function enqueueOfflineAction(action: 'insert' | 'update' | 'delete', table: 'items' | 'boxes', data: any) {
  const db = await getDb();
  await db.add('offline_queue', {
    action,
    table,
    data,
    timestamp: new Date().toISOString(),
  });
}

export async function getOfflineQueueCount(): Promise<number> {
  const db = await getDb();
  return db.count('offline_queue');
}

export async function clearOfflineQueue(): Promise<void> {
  const db = await getDb();
  await db.clear('offline_queue');
}

export async function purgeAllData(): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(['boxes', 'items', 'offline_queue'], 'readwrite');
  await tx.objectStore('boxes').clear();
  await tx.objectStore('items').clear();
  await tx.objectStore('offline_queue').clear();
  await tx.done;
}

export const resetToSampleData = purgeAllData;
