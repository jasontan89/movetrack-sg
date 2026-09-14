import React, { useState, useEffect } from 'react';
import { useItems } from '../../context/ItemContext';
import { useHousehold } from '../../context/HouseholdContext';
import { ItemCard, formatRoomName } from './ItemCard';
import { Room, Owner, Item } from '../../types';
import {
  Search,
  X,
  Filter,
  PackagePlus,
  AlertTriangle,
  Wrench,
  PackageOpen,
  Sparkles,
  UploadCloud,
  Smartphone,
} from 'lucide-react';
import { scanLocalPhoneData } from '../../services/syncService';
import { PhoneSyncModal } from '../sync/PhoneSyncModal';

interface ItemListProps {
  onSelectItem: (item: Item) => void;
  onOpenAddModal: () => void;
}

const ROOMS: { id: Room | 'all'; label: string }[] = [
  { id: 'all', label: 'All Rooms' },
  { id: 'living_room', label: 'Living Room' },
  { id: 'master_bedroom', label: 'Master Bedroom' },
  { id: 'bedroom_2_study', label: 'Study / Bed 2' },
  { id: 'bedroom_3', label: 'Bedroom 3' },
  { id: 'kitchen', label: 'Kitchen' },
  { id: 'bomb_shelter_store', label: 'Bomb Shelter / Store' },
  { id: 'service_yard', label: 'Service Yard' },
];

export const ItemList: React.FC<ItemListProps> = ({ onSelectItem, onOpenAddModal }) => {
  const { items, boxes, filters, filteredItems, setFilter, resetFilters } = useItems();
  const { currentUser } = useHousehold();
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [unsyncedCount, setUnsyncedCount] = useState(0);

  useEffect(() => {
    const checkUnsynced = async () => {
      const scan = await scanLocalPhoneData();
      if (scan.hasUnsyncedData) {
        setUnsyncedCount(
          scan.unsyncedItems.length +
            scan.unsyncedBoxes.length +
            scan.itemsWithLocalPhotos.length +
            scan.offlineQueueCount
        );
      } else {
        setUnsyncedCount(0);
      }
    };
    checkUnsynced();
  }, [items, boxes]);

  const jasonCount = items.filter((i) => i.owner === 'jason').length;
  const wifeCount = items.filter((i) => i.owner === 'wife').length;
  const sharedCount = items.filter((i) => i.owner === 'shared').length;

  return (
    <div className="space-y-3 pb-24">
      {/* Un-synced Phone Data Alert Banner */}
      {unsyncedCount > 0 && (
        <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl p-3.5 text-white shadow-md flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <UploadCloud size={18} />
            </div>
            <div className="min-w-0">
              <h4 className="font-bold text-xs leading-tight">
                Phone Data Ready to Sync!
              </h4>
              <p className="text-[11px] text-amber-100 mt-0.5 truncate">
                Found {unsyncedCount} un-synced item(s)/box(es) or photo(s) on this phone.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowSyncModal(true)}
            className="px-3 py-1.5 bg-white text-orange-900 rounded-xl font-bold text-xs hover:bg-amber-50 transition active:scale-95 shrink-0 shadow flex items-center gap-1"
          >
            <Smartphone size={13} />
            <span>Sync Now</span>
          </button>
        </div>
      )}

      {showSyncModal && <PhoneSyncModal onClose={() => setShowSyncModal(false)} />}
      {/* 1. Owner Quick Filter Tabs */}
      <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 text-xs font-medium">
        <button
          onClick={() => setFilter('owner', 'all')}
          className={`flex-1 py-1.5 rounded-lg transition text-center ${
            filters.owner === 'all'
              ? 'bg-white text-slate-900 shadow-sm font-semibold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          All Items ({items.length})
        </button>
        <button
          onClick={() => setFilter('owner', 'jason')}
          className={`flex-1 py-1.5 rounded-lg transition text-center flex items-center justify-center gap-1 ${
            filters.owner === 'jason'
              ? 'bg-emerald-600 text-white shadow-sm font-semibold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>Jason's</span>
          <span className={`text-[10px] px-1 rounded-full ${filters.owner === 'jason' ? 'bg-emerald-700' : 'bg-slate-200'}`}>
            {jasonCount}
          </span>
        </button>
        <button
          onClick={() => setFilter('owner', 'wife')}
          className={`flex-1 py-1.5 rounded-lg transition text-center flex items-center justify-center gap-1 ${
            filters.owner === 'wife'
              ? 'bg-rose-500 text-white shadow-sm font-semibold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>Wife's</span>
          <span className={`text-[10px] px-1 rounded-full ${filters.owner === 'wife' ? 'bg-rose-600' : 'bg-slate-200'}`}>
            {wifeCount}
          </span>
        </button>
        <button
          onClick={() => setFilter('owner', 'shared')}
          className={`flex-1 py-1.5 rounded-lg transition text-center flex items-center justify-center gap-1 ${
            filters.owner === 'shared'
              ? 'bg-teal-600 text-white shadow-sm font-semibold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>Shared</span>
          <span className={`text-[10px] px-1 rounded-full ${filters.owner === 'shared' ? 'bg-teal-700' : 'bg-slate-200'}`}>
            {sharedCount}
          </span>
        </button>
      </div>

      {/* 2. Search Bar */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={filters.searchQuery}
          onChange={(e) => setFilter('searchQuery', e.target.value)}
          placeholder="Search electronics, monitors, boxes, notes..."
          className="w-full pl-9 pr-9 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-sm"
        />
        {filters.searchQuery && (
          <button
            onClick={() => setFilter('searchQuery', '')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* 3. Horizontal Room Filter Scroll */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
        {ROOMS.map((room) => {
          const isSelected = filters.room === room.id;
          const count =
            room.id === 'all'
              ? items.length
              : items.filter((i) => i.room === room.id).length;

          return (
            <button
              key={room.id}
              onClick={() => setFilter('room', room.id)}
              className={`shrink-0 px-3 py-1.5 rounded-full border transition flex items-center gap-1 ${
                isSelected
                  ? 'bg-slate-900 text-white border-slate-900 font-semibold shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span>{room.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isSelected ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 4. Quick Toggles: Fragile, Disassembly, Unboxed */}
      <div className="flex items-center gap-1.5 overflow-x-auto text-[11px]">
        <button
          onClick={() => setFilter('onlyFragile', !filters.onlyFragile)}
          className={`px-2.5 py-1 rounded-lg border flex items-center gap-1 transition ${
            filters.onlyFragile
              ? 'bg-red-50 text-red-700 border-red-200 font-semibold'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <AlertTriangle size={12} className="text-red-500" />
          <span>Fragile Electronics</span>
        </button>

        <button
          onClick={() => setFilter('needsDisassembly', !filters.needsDisassembly)}
          className={`px-2.5 py-1 rounded-lg border flex items-center gap-1 transition ${
            filters.needsDisassembly
              ? 'bg-amber-50 text-amber-800 border-amber-200 font-semibold'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Wrench size={12} className="text-amber-600" />
          <span>Needs Disassembly</span>
        </button>

        <button
          onClick={() =>
            setFilter('boxId', filters.boxId === 'unboxed' ? 'all' : 'unboxed')
          }
          className={`px-2.5 py-1 rounded-lg border flex items-center gap-1 transition ${
            filters.boxId === 'unboxed'
              ? 'bg-teal-50 text-teal-800 border-teal-200 font-semibold'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <PackageOpen size={12} className="text-teal-600" />
          <span>Unboxed Move Items</span>
        </button>

        {(filters.onlyFragile ||
          filters.needsDisassembly ||
          filters.boxId !== 'all' ||
          filters.room !== 'all' ||
          filters.owner !== 'all' ||
          filters.searchQuery) && (
          <button
            onClick={resetFilters}
            className="px-2 py-1 text-slate-500 hover:text-slate-800 text-[10px] underline"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* 5. Results Counter */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-0.5">
        <span>
          Showing <strong className="text-slate-800">{filteredItems.length}</strong> of{' '}
          {items.length} items
        </span>
        {filters.owner !== 'all' && (
          <span className="text-[11px] text-teal-700 font-medium">
            Filtered by {filters.owner === 'jason' ? 'Jason' : filters.owner === 'wife' ? 'Wife' : 'Household'}
          </span>
        )}
      </div>

      {/* 6. Items Grid */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredItems.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              boxes={boxes}
              onClick={() => onSelectItem(item)}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <PackagePlus size={24} />
          </div>
          <div>
            <h4 className="font-bold text-slate-800 text-sm">No items found</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              No equipment or belongings match the current filter or search criteria.
            </p>
          </div>
          <button
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700 transition active:scale-95 shadow-sm"
          >
            <PackagePlus size={14} />
            <span>Add New Item</span>
          </button>
        </div>
      )}
    </div>
  );
};
