import React from 'react';
import { Box, DecisionStatus, Item } from '../../types';
import {
  AlertTriangle,
  Wrench,
  Package,
  CheckCircle2,
  DollarSign,
  HeartHandshake,
  Trash2,
  HelpCircle,
  Recycle,
  Sparkles,
} from 'lucide-react';

interface ItemCardProps {
  item: Item;
  boxes: Box[];
  onClick: () => void;
}

export const getDecisionBadge = (status: DecisionStatus, price?: number) => {
  switch (status) {
    case 'keep_pack':
      return {
        label: 'Keep & Move',
        bg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        icon: <CheckCircle2 size={12} />,
      };
    case 'sell_carousell':
      return {
        label: price ? `Sell: $${price}` : 'Sell Carousell',
        bg: 'bg-orange-100 text-orange-800 border-orange-200',
        icon: <DollarSign size={12} />,
      };
    case 'donate_bless':
      return {
        label: 'Donate / Bless',
        bg: 'bg-purple-100 text-purple-800 border-purple-200',
        icon: <HeartHandshake size={12} />,
      };
    case 'hdb_bulky_disposal':
      return {
        label: 'TC Bulky Disposal',
        bg: 'bg-sky-100 text-sky-800 border-sky-200',
        icon: <Trash2 size={12} />,
      };
    case 'alba_ewaste':
      return {
        label: 'ALBA E-Waste',
        bg: 'bg-amber-100 text-amber-800 border-amber-200',
        icon: <Recycle size={12} />,
      };
    case 'discard_trash':
      return {
        label: 'General Discard',
        bg: 'bg-slate-100 text-slate-700 border-slate-200',
        icon: <Trash2 size={12} />,
      };
    case 'undecided_discuss':
    default:
      return {
        label: 'Undecided / Review',
        bg: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: <HelpCircle size={12} />,
      };
  }
};

export const formatRoomName = (room: string) => {
  switch (room) {
    case 'living_room':
      return 'Living Room';
    case 'master_bedroom':
      return 'Master Bedroom';
    case 'bedroom_2_study':
      return 'Bed 2 / Study';
    case 'bedroom_3':
      return 'Bedroom 3';
    case 'kitchen':
      return 'Kitchen';
    case 'bomb_shelter_store':
      return 'Bomb Shelter / Store';
    case 'service_yard':
      return 'Service Yard';
    default:
      return 'Other Area';
  }
};

export const ItemCard: React.FC<ItemCardProps> = ({ item, boxes, onClick }) => {
  const decision = getDecisionBadge(item.decision_status, item.carousell_details?.asking_price);
  const assignedBox = boxes.find((b) => b.id === item.box_id);

  const ownerColor =
    item.owner === 'jason'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : item.owner === 'wife'
      ? 'bg-rose-50 text-rose-700 border-rose-200'
      : 'bg-teal-50 text-teal-700 border-teal-200';

  const ownerName =
    item.owner === 'jason' ? 'Jason' : item.owner === 'wife' ? 'Wife' : 'Household';

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md hover:border-slate-300 transition-all cursor-pointer overflow-hidden flex flex-col active:scale-[0.99]"
    >
      <div className="flex gap-3.5 p-3.5">
        {/* Photo Thumbnail or Placeholder */}
        <div className="w-20 h-20 rounded-xl bg-slate-100 overflow-hidden shrink-0 relative border border-slate-200/60 flex items-center justify-center">
          {item.photo_url ? (
            <img
              src={item.photo_url}
              alt={item.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="text-slate-400 flex flex-col items-center justify-center p-1 text-center">
              <Package size={26} className="text-slate-300" />
              <span className="text-[9px] mt-0.5 text-slate-400">No Photo</span>
            </div>
          )}

          {/* Fragile warning dot on image */}
          {item.is_fragile && (
            <span
              className="absolute top-1 left-1 bg-red-600 text-white rounded-full p-0.5 shadow-sm"
              title="Fragile / Electronics"
            >
              <AlertTriangle size={11} strokeWidth={2.5} />
            </span>
          )}

          {/* Original box icon */}
          {item.has_original_box && (
            <span
              className="absolute bottom-1 right-1 bg-teal-700 text-white rounded px-1 py-0.2 text-[9px] font-bold shadow-sm"
              title="Original Box Available"
            >
              BOX
            </span>
          )}
        </div>

        {/* Info Column */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 flex-wrap mb-1">
              {/* Owner pill */}
              <span
                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${ownerColor}`}
              >
                {ownerName}
              </span>

              {/* Room pill */}
              <span className="text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded font-medium">
                {formatRoomName(item.room)}
              </span>

              {/* Box assignment */}
              {assignedBox ? (
                <span className="text-[10px] font-medium text-teal-700 bg-teal-50 border border-teal-200 px-1.5 py-0.5 rounded">
                  Box #{assignedBox.box_number}
                </span>
              ) : item.decision_status === 'keep_pack' ? (
                <span className="text-[10px] text-slate-400 italic">Unboxed</span>
              ) : null}
            </div>

            {/* Title */}
            <h3 className="font-semibold text-slate-900 text-sm leading-snug line-clamp-2">
              {item.name}
            </h3>
          </div>

          {/* Decision Status Pill */}
          <div className="mt-2 flex items-center justify-between gap-1">
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${decision.bg}`}
            >
              {decision.icon}
              <span>{decision.label}</span>
            </span>

            {/* Disassembly badge if needed */}
            {item.disassembly_required && (
              <span
                className="text-[10px] flex items-center gap-0.5 text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded font-medium"
                title="Needs disassembly"
              >
                <Wrench size={10} />
                <span>Disassemble</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Specifications Sub-bar (Dimensions, Weight, CBM) */}
      <div className="bg-slate-50/90 border-t border-slate-100 px-3.5 py-1.5 flex items-center justify-between text-[11px] text-slate-500">
        <div className="flex items-center gap-2">
          {item.dimensions_cm && (item.dimensions_cm.length > 0 || item.dimensions_cm.width > 0) ? (
            <span>
              {item.dimensions_cm.length}×{item.dimensions_cm.width}×{item.dimensions_cm.height} cm
            </span>
          ) : (
            <span className="text-slate-400">Dimensions unrecorded</span>
          )}
          {item.cbm > 0 && <span className="text-slate-400">({item.cbm} m³)</span>}
        </div>
        <div>
          {item.weight_kg ? (
            <span className="font-medium text-slate-700">~{item.weight_kg} kg</span>
          ) : (
            <span className="text-slate-400">-- kg</span>
          )}
        </div>
      </div>
    </div>
  );
};
