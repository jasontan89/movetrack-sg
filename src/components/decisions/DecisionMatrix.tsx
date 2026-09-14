import React, { useState } from 'react';
import { useItems } from '../../context/ItemContext';
import { DecisionStatus, Item, Owner } from '../../types';
import { getDecisionBadge, formatRoomName } from '../items/ItemCard';
import {
  CheckCircle2,
  DollarSign,
  HeartHandshake,
  Trash2,
  Recycle,
  HelpCircle,
  Package,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';

interface DecisionMatrixProps {
  onSelectItem: (item: Item) => void;
}

const STATUS_GROUPS: {
  id: DecisionStatus;
  title: string;
  subtitle: string;
  color: string;
  badgeBg: string;
  icon: string;
}[] = [
  {
    id: 'keep_pack',
    title: 'Keep & Move',
    subtitle: 'Transport to new flat',
    color: 'border-emerald-500 bg-emerald-50/30 text-emerald-800',
    badgeBg: 'bg-emerald-600 text-white',
    icon: '📦',
  },
  {
    id: 'sell_carousell',
    title: 'Sell (Carousell)',
    subtitle: 'Cash to offset moving',
    color: 'border-orange-500 bg-orange-50/30 text-orange-800',
    badgeBg: 'bg-orange-600 text-white',
    icon: '🏷️',
  },
  {
    id: 'donate_bless',
    title: 'Donate / Bless',
    subtitle: 'Olio / Pass It On',
    color: 'border-purple-500 bg-purple-50/30 text-purple-800',
    badgeBg: 'bg-purple-600 text-white',
    icon: '🎁',
  },
  {
    id: 'hdb_bulky_disposal',
    title: 'TC Bulky Disposal',
    subtitle: 'Jurong-Clementi Town Council (Free 3/mo)',
    color: 'border-sky-500 bg-sky-50/30 text-sky-800',
    badgeBg: 'bg-sky-600 text-white',
    icon: '🚛',
  },
  {
    id: 'alba_ewaste',
    title: 'ALBA E-Waste',
    subtitle: 'West Mall / CC bins',
    color: 'border-amber-500 bg-amber-50/30 text-amber-800',
    badgeBg: 'bg-amber-600 text-white',
    icon: '🔋',
  },
  {
    id: 'discard_trash',
    title: 'General Trash',
    subtitle: 'HDB bin centre / chute',
    color: 'border-slate-400 bg-slate-50/50 text-slate-700',
    badgeBg: 'bg-slate-600 text-white',
    icon: '🗑️',
  },
  {
    id: 'undecided_discuss',
    title: 'Undecided / Review',
    subtitle: 'Requires spousal discussion',
    color: 'border-yellow-400 bg-yellow-50/40 text-yellow-800',
    badgeBg: 'bg-yellow-500 text-white',
    icon: '🤔',
  },
];

export const DecisionMatrix: React.FC<DecisionMatrixProps> = ({ onSelectItem }) => {
  const { items, updateItem } = useItems();
  const [selectedOwner, setSelectedOwner] = useState<'all' | Owner>('all');
  const [activeStatusTab, setActiveStatusTab] = useState<DecisionStatus>('undecided_discuss');

  const filteredItems = items.filter((item) => {
    if (selectedOwner === 'all') return true;
    return item.owner === selectedOwner;
  });

  const handleQuickMove = async (item: Item, newStatus: DecisionStatus, e: React.MouseEvent) => {
    e.stopPropagation();
    await updateItem({ ...item, decision_status: newStatus });
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Top Description & Owner Filter */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm space-y-3">
        <div>
          <h2 className="font-bold text-slate-900 text-base">Moving Decision Matrix</h2>
          <p className="text-xs text-slate-500">
            Categorize and agree on equipment and belongings before move day
          </p>
        </div>

        {/* Owner filter tabs */}
        <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 text-xs">
          <button
            onClick={() => setSelectedOwner('all')}
            className={`flex-1 py-1.5 rounded-lg transition font-medium text-center ${
              selectedOwner === 'all'
                ? 'bg-white text-slate-900 shadow-sm font-semibold'
                : 'text-slate-600'
            }`}
          >
            All ({items.length})
          </button>
          <button
            onClick={() => setSelectedOwner('jason')}
            className={`flex-1 py-1.5 rounded-lg transition font-medium text-center ${
              selectedOwner === 'jason'
                ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                : 'text-slate-600'
            }`}
          >
            Jason ({items.filter((i) => i.owner === 'jason').length})
          </button>
          <button
            onClick={() => setSelectedOwner('wife')}
            className={`flex-1 py-1.5 rounded-lg transition font-medium text-center ${
              selectedOwner === 'wife'
                ? 'bg-rose-500 text-white shadow-sm font-semibold'
                : 'text-slate-600'
            }`}
          >
            Wife ({items.filter((i) => i.owner === 'wife').length})
          </button>
          <button
            onClick={() => setSelectedOwner('shared')}
            className={`flex-1 py-1.5 rounded-lg transition font-medium text-center ${
              selectedOwner === 'shared'
                ? 'bg-teal-600 text-white shadow-sm font-semibold'
                : 'text-slate-600'
            }`}
          >
            Shared ({items.filter((i) => i.owner === 'shared').length})
          </button>
        </div>
      </div>

      {/* Horizontal Category Tab Pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
        {STATUS_GROUPS.map((group) => {
          const count = filteredItems.filter((i) => i.decision_status === group.id).length;
          const isActive = activeStatusTab === group.id;

          return (
            <button
              key={group.id}
              onClick={() => setActiveStatusTab(group.id)}
              className={`shrink-0 px-3 py-2 rounded-xl border flex items-center gap-2 transition ${
                isActive
                  ? 'bg-slate-900 text-white border-slate-900 shadow-md font-semibold'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span>{group.icon}</span>
              <span>{group.title}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isActive ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Category Group View */}
      {(() => {
        const group = STATUS_GROUPS.find((g) => g.id === activeStatusTab)!;
        const groupItems = filteredItems.filter((i) => i.decision_status === group.id);

        return (
          <div className="space-y-3">
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{group.icon}</span>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{group.title}</h3>
                  <p className="text-xs text-slate-500">{group.subtitle}</p>
                </div>
              </div>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${group.badgeBg}`}>
                {groupItems.length} items
              </span>
            </div>

            {groupItems.length > 0 ? (
              <div className="space-y-2">
                {groupItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => onSelectItem(item)}
                    className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm hover:shadow transition flex items-center justify-between gap-3 cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-200 flex items-center justify-center">
                        {item.photo_url ? (
                          <img
                            src={item.photo_url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package size={18} className="text-slate-300" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 text-xs truncate">
                          {item.name}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <span>{formatRoomName(item.room)}</span>
                          <span>•</span>
                          <span
                            className={
                              item.owner === 'jason'
                                ? 'text-emerald-700 font-semibold'
                                : item.owner === 'wife'
                                ? 'text-rose-600 font-semibold'
                                : 'text-teal-700 font-semibold'
                            }
                          >
                            {item.owner === 'jason'
                              ? 'Jason'
                              : item.owner === 'wife'
                              ? 'Wife'
                              : 'Shared'}
                          </span>
                          {item.weight_kg ? <span>• ~{item.weight_kg}kg</span> : null}
                        </div>
                      </div>
                    </div>

                    {/* Quick Move Action */}
                    <div className="shrink-0 flex items-center gap-1">
                      {group.id === 'undecided_discuss' ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => handleQuickMove(item, 'keep_pack', e)}
                            className="px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 rounded text-[10px] font-bold"
                            title="Mark Keep"
                          >
                            Keep
                          </button>
                          <button
                            onClick={(e) => handleQuickMove(item, 'sell_carousell', e)}
                            className="px-2 py-1 bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100 rounded text-[10px] font-bold"
                            title="Mark Sell"
                          >
                            Sell
                          </button>
                        </div>
                      ) : (
                        <ChevronRight size={18} className="text-slate-400" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-white text-slate-400">
                <span className="text-2xl block mb-1">{group.icon}</span>
                <span className="text-xs">No items currently marked as {group.title}.</span>
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
};
