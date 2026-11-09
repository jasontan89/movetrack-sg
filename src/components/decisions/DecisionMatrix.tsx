import React, { useState } from 'react';
import { useItems } from '../../context/ItemContext';
import { DecisionStatus, isMovingDecision, Item, Owner } from '../../types';
import { formatRoomName } from '../items/ItemCard';
import { Package } from 'lucide-react';

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
    id: 'undecided_discuss',
    title: 'To Discuss',
    subtitle: "Items pending Rental Condo vs Mom's House (HQ) vs Sell/Dispose",
    color: 'border-yellow-400 bg-yellow-50/40 text-yellow-800',
    badgeBg: 'bg-yellow-500 text-white',
    icon: '🤔',
  },
  {
    id: 'keep_pack',
    title: 'Rental House (Condo)',
    subtitle: 'Confirmed equipment, furniture & boxes for New Rental Condo',
    color: 'border-emerald-500 bg-emerald-50/30 text-emerald-800',
    badgeBg: 'bg-emerald-600 text-white',
    icon: '🏢',
  },
  {
    id: 'move_hq',
    title: "Mom's House (HQ)",
    subtitle: "Confirmed appliances, furniture & gear for Mom's House (HQ)",
    color: 'border-indigo-500 bg-indigo-50/30 text-indigo-800',
    badgeBg: 'bg-indigo-600 text-white',
    icon: '🏡',
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
];

export const DecisionMatrix: React.FC<DecisionMatrixProps> = ({ onSelectItem }) => {
  const { items, boxes, updateItem } = useItems();
  const [selectedOwner, setSelectedOwner] = useState<'all' | Owner>('all');
  const [activeStatusTab, setActiveStatusTab] = useState<DecisionStatus>('undecided_discuss');

  const filteredItems = items.filter((item) => {
    if (selectedOwner === 'all') return true;
    return item.owner === selectedOwner;
  });

  const condoItems = filteredItems.filter((i) => i.decision_status === 'keep_pack');
  const hqItems = filteredItems.filter((i) => i.decision_status === 'move_hq');
  const discussItems = filteredItems.filter((i) => i.decision_status === 'undecided_discuss');
  const tbcItems = filteredItems.filter(
    (i) => i.name.toUpperCase().includes('TBC') || i.notes?.toUpperCase().includes('[TBC]')
  );

  const handleQuickMove = async (item: Item, newStatus: DecisionStatus, e: React.MouseEvent) => {
    e.stopPropagation();
    await updateItem({
      ...item,
      decision_status: newStatus,
      box_id: isMovingDecision(newStatus) ? item.box_id : null,
    });
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Top Description, Split Summary & Owner Filter */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="font-bold text-slate-900 text-base">
              Rental House (Condo) vs Mom's House (HQ) Split
            </h2>
            <p className="text-xs text-slate-500">
              Assign equipment & furniture to New Rental Condo, Mom's House (HQ), or Discuss list
            </p>
          </div>
          {tbcItems.length > 0 && (
            <span className="shrink-0 text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 px-2 py-1 rounded-full">
              {tbcItems.length} TBC Item{tbcItems.length > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* 3-Card Destination Split Summary */}
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setActiveStatusTab('keep_pack')}
            className={`p-2.5 rounded-xl border text-left transition ${
              activeStatusTab === 'keep_pack'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                : 'bg-emerald-50/70 text-emerald-900 border-emerald-200 hover:bg-emerald-100/70'
            }`}
          >
            <div className="text-[10px] font-bold uppercase tracking-wider opacity-80">
              🏢 Rental (Condo)
            </div>
            <div className="text-lg font-extrabold leading-tight mt-0.5">{condoItems.length}</div>
            <div className="text-[10px] opacity-80">
              {condoItems.reduce((s, i) => s + (i.cbm || 0), 0).toFixed(2)} m³
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveStatusTab('move_hq')}
            className={`p-2.5 rounded-xl border text-left transition ${
              activeStatusTab === 'move_hq'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                : 'bg-indigo-50/70 text-indigo-900 border-indigo-200 hover:bg-indigo-100/70'
            }`}
          >
            <div className="text-[10px] font-bold uppercase tracking-wider opacity-80">
              🏡 Mom's (HQ)
            </div>
            <div className="text-lg font-extrabold leading-tight mt-0.5">{hqItems.length}</div>
            <div className="text-[10px] opacity-80">
              {hqItems.reduce((s, i) => s + (i.cbm || 0), 0).toFixed(2)} m³
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveStatusTab('undecided_discuss')}
            className={`p-2.5 rounded-xl border text-left transition ${
              activeStatusTab === 'undecided_discuss'
                ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                : 'bg-amber-50/70 text-amber-900 border-amber-200 hover:bg-amber-100/70'
            }`}
          >
            <div className="text-[10px] font-bold uppercase tracking-wider opacity-80">
              🤔 To Discuss
            </div>
            <div className="text-lg font-extrabold leading-tight mt-0.5">{discussItems.length}</div>
            <div className="text-[10px] opacity-80">
              {discussItems.reduce((s, i) => s + (i.cbm || 0), 0).toFixed(2)} m³
            </div>
          </button>
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
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
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
                {groupItems.map((item) => {
                  const isTbc =
                    item.name.toUpperCase().includes('TBC') ||
                    Boolean(item.notes?.toUpperCase().includes('[TBC]'));
                  const assignedBox = boxes.find((b) => b.id === item.box_id);

                  return (
                    <div
                      key={item.id}
                      onClick={() => onSelectItem(item)}
                      className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm hover:shadow transition flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 cursor-pointer"
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
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold text-slate-900 text-xs truncate">
                              {item.name}
                            </span>
                            {isTbc && (
                              <span className="text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-300 px-1.5 py-0.5 rounded-full">
                                TBC
                              </span>
                            )}
                            {assignedBox && (
                              <span className="text-[9px] font-semibold bg-teal-50 text-teal-700 border border-teal-200 px-1.5 py-0.5 rounded">
                                Box #{assignedBox.box_number}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5 flex-wrap">
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
                            {item.cbm ? <span>• {item.cbm} m³</span> : null}
                          </div>
                        </div>
                      </div>

                      {/* 1-Tap Quick Destination Triage Buttons */}
                      <div className="shrink-0 flex items-center gap-1 flex-wrap justify-end pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                        {item.decision_status !== 'keep_pack' && (
                          <button
                            onClick={(e) => handleQuickMove(item, 'keep_pack', e)}
                            className="px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 rounded-lg text-[10px] font-bold transition active:scale-95"
                            title="Move to New Rental House (Condo)"
                          >
                            → Rental
                          </button>
                        )}
                        {item.decision_status !== 'move_hq' && (
                          <button
                            onClick={(e) => handleQuickMove(item, 'move_hq', e)}
                            className="px-2 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 rounded-lg text-[10px] font-bold transition active:scale-95"
                            title="Move to Mom's House (HQ)"
                          >
                            → Mom's/HQ
                          </button>
                        )}
                        {item.decision_status !== 'undecided_discuss' && (
                          <button
                            onClick={(e) => handleQuickMove(item, 'undecided_discuss', e)}
                            className="px-2 py-1 bg-yellow-50 text-yellow-800 border border-yellow-200 hover:bg-yellow-100 rounded-lg text-[10px] font-bold transition active:scale-95"
                            title="Move to To Discuss List"
                          >
                            → Discuss
                          </button>
                        )}
                        {item.decision_status === 'undecided_discuss' && (
                          <>
                            <button
                              onClick={(e) => handleQuickMove(item, 'sell_carousell', e)}
                              className="px-2 py-1 bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100 rounded-lg text-[10px] font-bold transition active:scale-95"
                              title="Mark Sell on Carousell"
                            >
                              → Sell
                            </button>
                            <button
                              onClick={(e) => handleQuickMove(item, 'hdb_bulky_disposal', e)}
                              className="px-2 py-1 bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 rounded-lg text-[10px] font-bold transition active:scale-95"
                              title="Mark Town Council Bulky Disposal"
                            >
                              → Bulky
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
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
