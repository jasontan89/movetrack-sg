import React from 'react';
import { Package, Archive, Plus, SplitSquareVertical, Truck } from 'lucide-react';

export type NavTab = 'items' | 'boxes' | 'decisions' | 'logistics';

interface BottomNavProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onOpenAddModal: () => void;
  itemsCount: number;
  boxesCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onTabChange,
  onOpenAddModal,
  itemsCount,
  boxesCount,
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 pb-safe shadow-lg">
      <div className="max-w-md mx-auto px-3 py-1 flex items-center justify-around relative">
        {/* Tab: Items */}
        <button
          onClick={() => onTabChange('items')}
          className={`flex flex-col items-center py-1.5 px-3 rounded-xl transition-all relative ${
            currentTab === 'items'
              ? 'text-teal-600 font-semibold scale-105'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <div className="relative">
            <Package size={20} />
            {itemsCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-slate-200 text-slate-700 text-[10px] font-bold px-1 rounded-full">
                {itemsCount}
              </span>
            )}
          </div>
          <span className="text-[11px] mt-1">Catalog</span>
        </button>

        {/* Tab: Boxes */}
        <button
          onClick={() => onTabChange('boxes')}
          className={`flex flex-col items-center py-1.5 px-3 rounded-xl transition-all relative ${
            currentTab === 'boxes'
              ? 'text-teal-600 font-semibold scale-105'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <div className="relative">
            <Archive size={20} />
            {boxesCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-slate-200 text-slate-700 text-[10px] font-bold px-1 rounded-full">
                {boxesCount}
              </span>
            )}
          </div>
          <span className="text-[11px] mt-1">Boxes & QR</span>
        </button>

        {/* Floating Add Item Button */}
        <div className="relative -top-5 flex justify-center">
          <button
            onClick={onOpenAddModal}
            className="w-13 h-13 rounded-full bg-gradient-to-r from-teal-500 to-emerald-600 text-white flex items-center justify-center shadow-lg shadow-teal-500/35 border-4 border-slate-50 transition active:scale-90 hover:brightness-105"
            title="Add Item or Snap Photo"
          >
            <Plus size={28} strokeWidth={2.5} />
          </button>
        </div>

        {/* Tab: Decisions */}
        <button
          onClick={() => onTabChange('decisions')}
          className={`flex flex-col items-center py-1.5 px-3 rounded-xl transition-all relative ${
            currentTab === 'decisions'
              ? 'text-teal-600 font-semibold scale-105'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <SplitSquareVertical size={20} />
          <span className="text-[11px] mt-1">Decisions</span>
        </button>

        {/* Tab: Logistics Hub */}
        <button
          onClick={() => onTabChange('logistics')}
          className={`flex flex-col items-center py-1.5 px-3 rounded-xl transition-all relative ${
            currentTab === 'logistics'
              ? 'text-teal-600 font-semibold scale-105'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Truck size={20} />
          <span className="text-[11px] mt-1">Logistics</span>
        </button>
      </div>
    </nav>
  );
};
