import { getAllBoxes, getAllItems, saveItem as dbSaveItem, clearOfflineQueue, getOfflineQueueCount, getDb } from '../db';
import {
  saveItemToSupabase,
  saveBoxToSupabase,
  uploadBase64PhotoToSupabase,
  fetchItemsFromSupabase,
  fetchBoxesFromSupabase,
  fetchHouseholdFromSupabase,
  saveHouseholdToSupabase,
} from '../db/supabaseClient';
import { Item, Box } from '../types';

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
 * Scans phone's local IndexedDB to find any items or boxes not yet in Supabase
 */
export async function scanLocalPhoneData(): Promise<LocalSyncScanResult> {
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
      fetchItemsFromSupabase(),
      fetchBoxesFromSupabase(),
    ]);

    if (cloudItems !== null) {
      const cloudItemIds = new Set(cloudItems.map((i) => i.id));
      unsyncedItems = localItems.filter((i) => !cloudItemIds.has(i.id));
    } else {
      unsyncedItems = [...localItems];
    }

    if (cloudBoxes !== null) {
      const cloudBoxIds = new Set(cloudBoxes.map((b) => b.id));
      unsyncedBoxes = localBoxes.filter((b) => !cloudBoxIds.has(b.id));
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
          // Update locally with remote URL
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
  const [items, boxes] = await Promise.all([getAllItems(), getAllBoxes()]);
  const payload = {
    exported_at: new Date().toISOString(),
    source: 'MoveTrack SG Mobile Phone Storage',
    total_items: items.length,
    total_boxes: boxes.length,
    boxes,
    items,
  };
  return JSON.stringify(payload, null, 2);
}

/**
 * Import a backup JSON string directly into Supabase
 */
export async function importBackupToSupabase(
  jsonText: string,
  onProgress?: SyncProgressCallback
): Promise<{ success: boolean; itemsCount: number; boxesCount: number; error?: string }> {
  try {
    const data = JSON.parse(jsonText);
    const items: Item[] = Array.isArray(data.items) ? data.items : [];
    const boxes: Box[] = Array.isArray(data.boxes) ? data.boxes : [];

    const totalSteps = items.length + boxes.length;
    let currentStep = 0;

    for (const box of boxes) {
      currentStep++;
      if (onProgress) onProgress(currentStep, totalSteps, `Importing box #${box.box_number}...`);
      await saveBoxToSupabase(box);
    }

    for (const item of items) {
      currentStep++;
      if (onProgress) onProgress(currentStep, totalSteps, `Importing "${item.name}"...`);
      let photoUrl = item.photo_url;
      if (photoUrl && photoUrl.startsWith('data:image/')) {
        const cloudUrl = await uploadBase64PhotoToSupabase(photoUrl, item.id);
        if (cloudUrl) photoUrl = cloudUrl;
      }
      await saveItemToSupabase({ ...item, photo_url: photoUrl });
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
