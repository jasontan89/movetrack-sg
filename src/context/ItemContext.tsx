import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Box, FilterOptions, Item } from '../types';
import {
  getAllBoxes,
  getAllItems,
  saveBox as dbSaveBox,
  saveItem as dbSaveItem,
  deleteBox as dbDeleteBox,
  deleteItem as dbDeleteItem,
  resetToSampleData,
  enqueueOfflineAction,
} from '../db';
import {
  fetchItemsFromSupabase,
  fetchBoxesFromSupabase,
  saveItemToSupabase,
  deleteItemFromSupabase,
  saveBoxToSupabase,
  deleteBoxFromSupabase,
  subscribeToSupabaseChanges,
  getSupabaseCredentials,
} from '../db/supabaseClient';
import { calculateCbm } from '../utils/cbmCalculator';
import { useHousehold } from './HouseholdContext';

interface ItemContextType {
  items: Item[];
  boxes: Box[];
  filters: FilterOptions;
  filteredItems: Item[];
  isLoading: boolean;
  setFilter: <K extends keyof FilterOptions>(key: K, value: FilterOptions[K]) => void;
  resetFilters: () => void;
  addItem: (item: Omit<Item, 'id' | 'created_at' | 'updated_at'>) => Promise<Item>;
  updateItem: (item: Item) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  addBox: (box: Omit<Box, 'id' | 'created_at'>) => Promise<Box>;
  updateBox: (box: Box) => Promise<void>;
  removeBox: (id: string) => Promise<void>;
  resetAllData: () => Promise<void>;
  reloadAll: () => Promise<void>;
}

const DEFAULT_FILTERS: FilterOptions = {
  owner: 'all',
  room: 'all',
  category: 'all',
  decision: 'all',
  searchQuery: '',
  boxId: 'all',
  onlyFragile: false,
  needsDisassembly: false,
};

const ItemContext = createContext<ItemContextType | undefined>(undefined);

export const ItemProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isOnline, refreshOfflineCount } = useHousehold();
  const [items, setItems] = useState<Item[]>([]);
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [filters, setFilters] = useState<FilterOptions>(DEFAULT_FILTERS);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const reloadAll = async () => {
    setIsLoading(true);
    try {
      const creds = getSupabaseCredentials();

      if (creds.isConfigured && isOnline) {
        // Fetch authoritative data directly from Supabase
        const [cloudItems, cloudBoxes] = await Promise.all([
          fetchItemsFromSupabase(),
          fetchBoxesFromSupabase(),
        ]);

        if (cloudItems && cloudItems.length > 0) {
          setItems(cloudItems);
          // Cache to IndexedDB in background
          for (const item of cloudItems) {
            await dbSaveItem(item);
          }
        } else {
          const localItems = await getAllItems();
          setItems(localItems);
        }

        if (cloudBoxes && cloudBoxes.length > 0) {
          setBoxes(cloudBoxes.sort((a, b) => a.box_number - b.box_number));
          for (const box of cloudBoxes) {
            await dbSaveBox(box);
          }
        } else {
          const localBoxes = await getAllBoxes();
          setBoxes(localBoxes.sort((a, b) => a.box_number - b.box_number));
        }
      } else {
        // Local IndexedDB fallback
        const [allItems, allBoxes] = await Promise.all([getAllItems(), getAllBoxes()]);
        setItems(allItems);
        setBoxes(allBoxes.sort((a, b) => a.box_number - b.box_number));
      }
    } catch (err) {
      console.error('Error in reloadAll:', err);
      const [allItems, allBoxes] = await Promise.all([getAllItems(), getAllBoxes()]);
      setItems(allItems);
      setBoxes(allBoxes.sort((a, b) => a.box_number - b.box_number));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    reloadAll();

    // Subscribe to real-time changes across spouses' devices
    const unsubscribe = subscribeToSupabaseChanges(
      (payload) => {
        if (payload.eventType === 'INSERT') {
          const newItem = payload.new as Item;
          setItems((prev) => [newItem, ...prev.filter((i) => i.id !== newItem.id)]);
          dbSaveItem(newItem);
        } else if (payload.eventType === 'UPDATE') {
          const updated = payload.new as Item;
          setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
          dbSaveItem(updated);
        } else if (payload.eventType === 'DELETE') {
          const deletedId = payload.old.id;
          setItems((prev) => prev.filter((i) => i.id !== deletedId));
          dbDeleteItem(deletedId);
        }
      },
      (payload) => {
        if (payload.eventType === 'INSERT') {
          const newBox = payload.new as Box;
          setBoxes((prev) =>
            [...prev.filter((b) => b.id !== newBox.id), newBox].sort(
              (a, b) => a.box_number - b.box_number
            )
          );
          dbSaveBox(newBox);
        } else if (payload.eventType === 'UPDATE') {
          const updated = payload.new as Box;
          setBoxes((prev) =>
            prev
              .map((b) => (b.id === updated.id ? updated : b))
              .sort((a, b) => a.box_number - b.box_number)
          );
          dbSaveBox(updated);
        } else if (payload.eventType === 'DELETE') {
          const deletedId = payload.old.id;
          setBoxes((prev) => prev.filter((b) => b.id !== deletedId));
          dbDeleteBox(deletedId);
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  const setFilter = <K extends keyof FilterOptions>(key: K, value: FilterOptions[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  // Add Item
  const addItem = async (
    itemData: Omit<Item, 'id' | 'created_at' | 'updated_at'>
  ): Promise<Item> => {
    const id = `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const cbm = itemData.cbm || calculateCbm(itemData.dimensions_cm);

    const newItem: Item = {
      ...itemData,
      id,
      cbm,
      created_at: now,
      updated_at: now,
    };

    // Optimistic local state update
    setItems((prev) => [newItem, ...prev]);
    await dbSaveItem(newItem);

    // Save directly to Supabase
    if (isOnline) {
      const savedToCloud = await saveItemToSupabase(newItem);
      if (!savedToCloud) {
        await enqueueOfflineAction('insert', 'items', newItem);
        await refreshOfflineCount();
      }
    } else {
      await enqueueOfflineAction('insert', 'items', newItem);
      await refreshOfflineCount();
    }

    return newItem;
  };

  // Update Item
  const updateItem = async (updated: Item) => {
    const cbm = calculateCbm(updated.dimensions_cm);
    const itemToSave = { ...updated, cbm, updated_at: new Date().toISOString() };

    setItems((prev) => prev.map((i) => (i.id === itemToSave.id ? itemToSave : i)));
    await dbSaveItem(itemToSave);

    if (isOnline) {
      const savedToCloud = await saveItemToSupabase(itemToSave);
      if (!savedToCloud) {
        await enqueueOfflineAction('update', 'items', itemToSave);
        await refreshOfflineCount();
      }
    } else {
      await enqueueOfflineAction('update', 'items', itemToSave);
      await refreshOfflineCount();
    }
  };

  // Remove Item
  const removeItem = async (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    await dbDeleteItem(id);

    if (isOnline) {
      await deleteItemFromSupabase(id);
    } else {
      await enqueueOfflineAction('delete', 'items', { id });
      await refreshOfflineCount();
    }
  };

  // Add Box
  const addBox = async (boxData: Omit<Box, 'id' | 'created_at'>): Promise<Box> => {
    const id = `box-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newBox: Box = {
      ...boxData,
      id,
      created_at: new Date().toISOString(),
    };

    setBoxes((prev) => [...prev, newBox].sort((a, b) => a.box_number - b.box_number));
    await dbSaveBox(newBox);

    if (isOnline) {
      const savedToCloud = await saveBoxToSupabase(newBox);
      if (!savedToCloud) {
        await enqueueOfflineAction('insert', 'boxes', newBox);
        await refreshOfflineCount();
      }
    } else {
      await enqueueOfflineAction('insert', 'boxes', newBox);
      await refreshOfflineCount();
    }

    return newBox;
  };

  // Update Box
  const updateBox = async (updated: Box) => {
    setBoxes((prev) =>
      prev.map((b) => (b.id === updated.id ? updated : b)).sort((a, b) => a.box_number - b.box_number)
    );
    await dbSaveBox(updated);

    if (isOnline) {
      const savedToCloud = await saveBoxToSupabase(updated);
      if (!savedToCloud) {
        await enqueueOfflineAction('update', 'boxes', updated);
        await refreshOfflineCount();
      }
    } else {
      await enqueueOfflineAction('update', 'boxes', updated);
      await refreshOfflineCount();
    }
  };

  // Remove Box
  const removeBox = async (id: string) => {
    setBoxes((prev) => prev.filter((b) => b.id !== id));
    setItems((prev) => prev.map((i) => (i.box_id === id ? { ...i, box_id: null } : i)));
    await dbDeleteBox(id);

    if (isOnline) {
      await deleteBoxFromSupabase(id);
    } else {
      await enqueueOfflineAction('delete', 'boxes', { id });
      await refreshOfflineCount();
    }
  };

  // Reset to sample data
  const resetAllData = async () => {
    await resetToSampleData();
    await reloadAll();
  };

  // Filtered items computation
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Search query
      if (filters.searchQuery.trim()) {
        const query = filters.searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(query);
        const matchesNotes = (item.notes || '').toLowerCase().includes(query);
        if (!matchesName && !matchesNotes) return false;
      }

      // Owner filter
      if (filters.owner !== 'all') {
        if (filters.owner === 'shared') {
          if (item.owner !== 'shared') return false;
        } else {
          if (item.owner !== filters.owner) return false;
        }
      }

      // Room filter
      if (filters.room !== 'all' && item.room !== filters.room) {
        return false;
      }

      // Category filter
      if (filters.category !== 'all' && item.category !== filters.category) {
        return false;
      }

      // Decision status filter
      if (filters.decision !== 'all' && item.decision_status !== filters.decision) {
        return false;
      }

      // Box filter
      if (filters.boxId && filters.boxId !== 'all') {
        if (filters.boxId === 'unboxed') {
          if (item.box_id) return false;
        } else if (item.box_id !== filters.boxId) {
          return false;
        }
      }

      // Fragile filter
      if (filters.onlyFragile && !item.is_fragile) {
        return false;
      }

      // Disassembly filter
      if (filters.needsDisassembly && !item.disassembly_required) {
        return false;
      }

      return true;
    });
  }, [items, filters]);

  return (
    <ItemContext.Provider
      value={{
        items,
        boxes,
        filters,
        filteredItems,
        isLoading,
        setFilter,
        resetFilters,
        addItem,
        updateItem,
        removeItem,
        addBox,
        updateBox,
        removeBox,
        resetAllData,
        reloadAll,
      }}
    >
      {children}
    </ItemContext.Provider>
  );
};

export function useItems() {
  const context = useContext(ItemContext);
  if (!context) throw new Error('useItems must be used within an ItemProvider');
  return context;
}
