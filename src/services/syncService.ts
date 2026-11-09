import {
  getAllBoxes,
  getAllItems,
  saveItem as dbSaveItem,
  saveBox as dbSaveBox,
  saveHousehold as dbSaveHousehold,
  clearOfflineQueue,
  getOfflineQueueCount,
  getOfflineQueueEntries,
  removeOfflineQueueEntry,
  getHousehold as dbGetHousehold,
} from '../db';
import {
  saveItemToSupabase,
  saveBoxToSupabase,
  deleteItemFromSupabase,
  deleteBoxFromSupabase,
  uploadBase64PhotoToSupabase,
  fetchItemsFromSupabase,
  fetchBoxesFromSupabase,
  saveHouseholdToSupabase,
} from '../db/supabaseClient';
import { Item, Box, Household } from '../types';

export interface LocalSyncScanResult {
  localItems: Item[];
  localBoxes: Box[];
  unsyncedItems: Item[];
  unsyncedBoxes: Box[];
  itemsWithLocalPhotos: Item[];
  offlineQueueCount: number;
  hasUnsyncedData: boolean;
}

export interface SyncProgressCallback {
  (currentStep: number, totalSteps: number, message: string): void;
}

/**
 * Processes queued actions recorded while offline (Bomb Shelter Mode).
 * Executes inserts, updates, and deletes in strict FIFO order.
 */
export async function processOfflineQueue(onProgress?: SyncProgressCallback): Promise<{
  processed: number;
  failed: number;
}> {
  const queue = await getOfflineQueueEntries();
  if (queue.length === 0) return { processed: 0, failed: 0 };

  let processed = 0;
  let failed = 0;
  const total = queue.length;

  for (let idx = 0; idx < queue.length; idx++) {
    const entry = queue[idx];
    const { action, table, data } = entry.value;

    if (onProgress) {
      onProgress(idx + 1, total, `Replaying offline ${action} on ${table}...`);
    }

    try {
      let success = false;

      if (table === 'boxes') {
        if (action === 'delete') {
          success = await deleteBoxFromSupabase(data.id);
        } else {
          success = await saveBoxToSupabase(data as Box);
        }
      } else if (table === 'items') {
        if (action === 'delete') {
          success = await deleteItemFromSupabase(data.id);
        } else {
          const item = { ...(data as Item) };
          if (item.photo_url && item.photo_url.startsWith('data:image/')) {
            const remoteUrl = await uploadBase64PhotoToSupabase(item.photo_url, item.id);
            if (remoteUrl) {
              item.photo_url = remoteUrl;
              await dbSaveItem(item);
            }
          }
          success = await saveItemToSupabase(item);
        }
      }

      if (success) {
        await removeOfflineQueueEntry(entry.key);
        processed++;
      } else {
        failed++;
      }
    } catch (err) {
      console.warn(`Error processing offline queue entry ${entry.key}:`, err);
      failed++;
    }
  }

  return { processed, failed };
}

/**
 * Scans phone's local IndexedDB to find any items or boxes not yet in Supabase
 * or with newer local timestamps.
 */
export async function scanLocalPhoneData(householdId?: string): Promise<LocalSyncScanResult> {
  const [localItems, localBoxes, queueCount] = await Promise.all([
    getAllItems(),
    getAllBoxes(),
    getOfflineQueueCount(),
  ]);

  const itemsWithLocalPhotos = localItems.filter(
    (i) => i.photo_url && i.photo_url.startsWith('data:image/')
  );

  let unsyncedItems: Item[] = [];
  let unsyncedBoxes: Box[] = [];

  try {
    const [cloudItems, cloudBoxes] = await Promise.all([
      fetchItemsFromSupabase(householdId),
      fetchBoxesFromSupabase(householdId),
    ]);

    if (cloudItems !== null) {
      const cloudItemMap = new Map(cloudItems.map((i) => [i.id, i]));
      unsyncedItems = localItems.filter((i) => {
        const cloud = cloudItemMap.get(i.id);
        if (!cloud) return true;
        // Compare updated timestamps
        const localTime = new Date(i.updated_at || i.created_at).getTime();
        const cloudTime = new Date(cloud.updated_at || cloud.created_at).getTime();
        return localTime > cloudTime;
      });
    } else {
      unsyncedItems = [...localItems];
    }

    if (cloudBoxes !== null) {
      const cloudBoxMap = new Map(cloudBoxes.map((b) => [b.id, b]));
      unsyncedBoxes = localBoxes.filter((b) => !cloudBoxMap.has(b.id));
    } else {
      unsyncedBoxes = [...localBoxes];
    }
  } catch (err) {
    console.warn('Could not reach Supabase during scan:', err);
    unsyncedItems = [...localItems];
    unsyncedBoxes = [...localBoxes];
  }

  const hasUnsyncedData =
    unsyncedItems.length > 0 ||
    unsyncedBoxes.length > 0 ||
    itemsWithLocalPhotos.length > 0 ||
    queueCount > 0;

  return {
    localItems,
    localBoxes,
    unsyncedItems,
    unsyncedBoxes,
    itemsWithLocalPhotos,
    offlineQueueCount: queueCount,
    hasUnsyncedData,
  };
}

/**
 * Pushes all phone data (items, boxes, and base64 photos) directly to Supabase cloud.
 */
export async function syncPhoneDataToSupabase(
  onProgress?: SyncProgressCallback
): Promise<{
  success: boolean;
  syncedItemsCount: number;
  syncedBoxesCount: number;
  uploadedPhotosCount: number;
  error?: string;
}> {
  try {
    // 0. Flush any pending offline queue items first
    await processOfflineQueue(onProgress);

    const localItems = await getAllItems();
    const localBoxes = await getAllBoxes();

    const totalSteps = localItems.length + localBoxes.length + 1;
    let currentStep = 0;
    let uploadedPhotosCount = 0;
    let syncedItemsCount = 0;
    let syncedBoxesCount = 0;

    // 1. Sync Boxes First (so item foreign keys / box assignments are valid)
    for (const box of localBoxes) {
      currentStep++;
      if (onProgress) {
        onProgress(currentStep, totalSteps, `Syncing Box #${box.box_number} ("${box.label}")...`);
      }
      const success = await saveBoxToSupabase(box);
      if (success) {
        syncedBoxesCount++;
      }
    }

    // 2. Sync Items & Upload any base64 photos to Supabase Storage
    for (const item of localItems) {
      currentStep++;
      let photoUrl = item.photo_url;

      if (photoUrl && photoUrl.startsWith('data:image/')) {
        if (onProgress) {
          onProgress(
            currentStep,
            totalSteps,
            `Uploading photo for "${item.name}" to Supabase Storage...`
          );
        }
        const cloudPhotoUrl = await uploadBase64PhotoToSupabase(photoUrl, item.id);
        if (cloudPhotoUrl) {
          photoUrl = cloudPhotoUrl;
          uploadedPhotosCount++;
          item.photo_url = cloudPhotoUrl;
          await dbSaveItem(item);
        }
      }

      if (onProgress) {
        onProgress(currentStep, totalSteps, `Saving "${item.name}" to Supabase database...`);
      }

      const itemToSave: Item = {
        ...item,
        photo_url: photoUrl,
      };

      const success = await saveItemToSupabase(itemToSave);
      if (success) {
        syncedItemsCount++;
      }
    }

    // 3. Clear offline queue
    currentStep++;
    if (onProgress) {
      onProgress(currentStep, totalSteps, 'Clearing offline queue...');
    }
    await clearOfflineQueue();

    return {
      success: true,
      syncedItemsCount,
      syncedBoxesCount,
      uploadedPhotosCount,
    };
  } catch (err: any) {
    console.error('Error syncing phone data to Supabase:', err);
    return {
      success: false,
      syncedItemsCount: 0,
      syncedBoxesCount: 0,
      uploadedPhotosCount: 0,
      error: err.message || 'Sync failed. Please check internet connection.',
    };
  }
}

/**
 * Creates a downloadable/exportable JSON string of phone data
 */
export async function exportPhoneBackupJson(): Promise<string> {
  const [items, boxes, household] = await Promise.all([
    getAllItems(),
    getAllBoxes(),
    dbGetHousehold(),
  ]);
  const payload = {
    exported_at: new Date().toISOString(),
    source: 'MoveTrack SG Mobile Phone Storage',
    household,
    total_items: items.length,
    total_boxes: boxes.length,
    boxes,
    items,
  };
  return JSON.stringify(payload, null, 2);
}

/**
 * Import a backup JSON string into local IndexedDB AND Supabase (if online)
 */
export async function importBackupToStorage(
  jsonText: string,
  onProgress?: SyncProgressCallback
): Promise<{ success: boolean; itemsCount: number; boxesCount: number; error?: string }> {
  try {
    const data = JSON.parse(jsonText);
    const items: Item[] = Array.isArray(data.items) ? data.items : [];
    const boxes: Box[] = Array.isArray(data.boxes) ? data.boxes : [];
    const household: Household | undefined = data.household;

    const totalSteps = items.length + boxes.length + (household ? 1 : 0);
    let currentStep = 0;

    // 1. Restore Household if provided
    if (household && household.id) {
      currentStep++;
      if (onProgress) onProgress(currentStep, totalSteps, `Restoring household: ${household.name}...`);
      await dbSaveHousehold(household);
      try {
        await saveHouseholdToSupabase(household);
      } catch {}
    }

    // 2. Restore Boxes
    for (const box of boxes) {
      currentStep++;
      if (onProgress) onProgress(currentStep, totalSteps, `Restoring box #${box.box_number}...`);
      await dbSaveBox(box);
      try {
        await saveBoxToSupabase(box);
      } catch {}
    }

    // 3. Restore Items
    for (const item of items) {
      currentStep++;
      if (onProgress) onProgress(currentStep, totalSteps, `Restoring "${item.name}"...`);
      let photoUrl = item.photo_url;
      if (photoUrl && photoUrl.startsWith('data:image/')) {
        try {
          const cloudUrl = await uploadBase64PhotoToSupabase(photoUrl, item.id);
          if (cloudUrl) photoUrl = cloudUrl;
        } catch {}
      }
      const itemToSave = { ...item, photo_url: photoUrl };
      await dbSaveItem(itemToSave);
      try {
        await saveItemToSupabase(itemToSave);
      } catch {}
    }

    return {
      success: true,
      itemsCount: items.length,
      boxesCount: boxes.length,
    };
  } catch (err: any) {
    return {
      success: false,
      itemsCount: 0,
      boxesCount: 0,
      error: err.message || 'Invalid JSON format',
    };
  }
}

export const importBackupToSupabase = importBackupToStorage;
