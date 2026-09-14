import React, { useState } from 'react';
import { Box, DecisionStatus, Item } from '../../types';
import { useItems } from '../../context/ItemContext';
import { formatRoomName, getDecisionBadge } from './ItemCard';
import {
  X,
  Edit,
  Trash2,
  AlertTriangle,
  Wrench,
  Package,
  Cable,
  DollarSign,
  ExternalLink,
  CheckCircle2,
  Calendar,
  Sparkles,
} from 'lucide-react';

interface ItemDetailModalProps {
  item: Item;
  boxes: Box[];
  onClose: () => void;
  onEdit: () => void;
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  item,
  boxes,
  onClose,
  onEdit,
}) => {
  const { updateItem, removeItem } = useItems();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const assignedBox = boxes.find((b) => b.id === item.box_id);
  const decision = getDecisionBadge(item.decision_status, item.carousell_details?.asking_price);

  const hasAiField = (field: string) => Boolean(item.ai_generated_fields?.includes(field));

  const renderAiPill = (field: string) => {
    if (!hasAiField(field)) return null;
    return (
      <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full border border-purple-200">
        <Sparkles size={9} className="text-purple-600" />
        AI generated
      </span>
    );
  };

  const ownerColor =
    item.owner === 'jason'
      ? 'bg-emerald-100 text-emerald-800'
      : item.owner === 'wife'
      ? 'bg-rose-100 text-rose-800'
      : 'bg-teal-100 text-teal-800';

  const handleQuickDecisionChange = async (newStatus: DecisionStatus) => {
    await updateItem({ ...item, decision_status: newStatus });
  };

  const handleQuickBoxChange = async (newBoxId: string) => {
    await updateItem({ ...item, box_id: newBoxId || null });
  };

  const handleDelete = async () => {
    await removeItem(item.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-200">
        {/* Top Header with Image or Banner */}
        <div className="relative bg-slate-900 text-white">
          {item.photo_url ? (
            <div className="w-full h-56 relative overflow-hidden bg-slate-950">
              <img
                src={item.photo_url}
                alt={item.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
            </div>
          ) : (
            <div className="w-full h-24 bg-gradient-to-r from-teal-800 to-slate-800 flex items-center justify-center">
              <Package size={36} className="text-white/40" />
            </div>
          )}

          {/* Close & Edit buttons overlay */}
          <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
            <button
              onClick={onEdit}
              className="p-2 rounded-full bg-white/80 hover:bg-white text-slate-800 backdrop-blur-sm transition shadow-md"
              title="Edit Item"
            >
              <Edit size={16} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-black/50 hover:bg-black/70 text-white backdrop-blur-sm transition"
              title="Close"
            >
              <X size={16} />
            </button>
          </div>

          {/* Title and badges over image */}
          <div className="p-4 relative">
            <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ownerColor}`}>
                {item.owner === 'jason' ? "Jason's Item" : item.owner === 'wife' ? "Wife's Item" : 'Shared Household'}
              </span>
              <span className="text-[10px] font-semibold bg-white/20 text-white backdrop-blur-md px-2 py-0.5 rounded-full">
                {formatRoomName(item.room)}
              </span>
              {hasAiField('name') && (
                <span className="text-[10px] font-semibold bg-purple-600/90 text-white backdrop-blur-md px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles size={10} />
                  AI title
                </span>
              )}
              {item.is_fragile && (
                <span className="text-[10px] font-bold bg-red-600 text-white px-2 py-0.5 rounded-full flex items-center gap-1">
                  <AlertTriangle size={10} />
                  Fragile
                </span>
              )}
            </div>

            <h2 className="text-lg font-bold text-white leading-tight drop-shadow-sm">
              {item.name}
            </h2>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-slate-800">
          {/* AI Banner Notice if any field is still AI generated */}
          {item.ai_generated_fields && item.ai_generated_fields.length > 0 && (
            <div className="bg-purple-50 border border-purple-200 rounded-2xl p-3 flex items-start gap-2.5 text-xs text-purple-900 animate-in fade-in">
              <Sparkles size={16} className="text-purple-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold block">Contains Gemini Flash Lite AI Estimates</span>
                <span className="text-[11px] text-purple-700">
                  Fields marked with <span className="font-semibold text-purple-900">"AI generated"</span> were auto-filled by AI. Tap the Edit button above to review or amend them anytime.
                </span>
              </div>
            </div>
          )}

          {/* Current Decision Status Banner */}
          <div className={`p-3.5 rounded-2xl border flex items-center justify-between ${decision.bg}`}>
            <div className="flex items-center gap-2">
              <span className="text-lg">{decision.icon}</span>
              <div>
                <div className="font-bold text-xs flex items-center gap-1.5">
                  <span>Decision: {decision.label}</span>
                  {renderAiPill('decision_status')}
                </div>
                <div className="text-[11px] opacity-80">
                  {item.decision_status === 'keep_pack' && 'Will be transported to new flat'}
                  {item.decision_status === 'sell_carousell' &&
                    `Listed on Carousell (Asking: $${item.carousell_details?.asking_price || 0} SGD)`}
                  {item.decision_status === 'donate_bless' && 'Bless on Olio or Pass-It-On'}
                  {item.decision_status === 'hdb_bulky_disposal' && 'Jurong-Clementi Town Council 3-item free slot'}
                  {item.decision_status === 'alba_ewaste' && 'ALBA e-waste recycling at West Mall / CC'}
                  {item.decision_status === 'undecided_discuss' && 'Pending discussion between Jason & Wife'}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Decision Switcher Bar */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Quick Change Decision
            </span>
            <div className="grid grid-cols-3 gap-1.5 text-xs">
              <button
                onClick={() => handleQuickDecisionChange('keep_pack')}
                className={`py-1.5 px-2 rounded-lg border text-center transition text-[11px] font-medium ${
                  item.decision_status === 'keep_pack'
                    ? 'bg-emerald-600 text-white border-emerald-600 font-bold'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Keep & Move
              </button>
              <button
                onClick={() => handleQuickDecisionChange('sell_carousell')}
                className={`py-1.5 px-2 rounded-lg border text-center transition text-[11px] font-medium ${
                  item.decision_status === 'sell_carousell'
                    ? 'bg-orange-500 text-white border-orange-500 font-bold'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Sell Carousell
              </button>
              <button
                onClick={() => handleQuickDecisionChange('hdb_bulky_disposal')}
                className={`py-1.5 px-2 rounded-lg border text-center transition text-[11px] font-medium ${
                  item.decision_status === 'hdb_bulky_disposal'
                    ? 'bg-sky-600 text-white border-sky-600 font-bold'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                TC Bulky
              </button>
            </div>
          </div>

          {/* Physical Specifications Grid */}
          <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 space-y-3">
            <span className="text-xs font-bold text-slate-800 block">
              Dimensions & Logistics Specs
            </span>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-white p-2 rounded-xl border border-slate-200/80">
                <div className="flex items-center justify-center gap-1">
                  <span className="text-[10px] text-slate-400 block font-medium">Dimensions</span>
                  {renderAiPill('dimensions_cm')}
                </div>
                <span className="text-xs font-bold text-slate-800">
                  {item.dimensions_cm?.length || 0}×{item.dimensions_cm?.width || 0}×
                  {item.dimensions_cm?.height || 0} cm
                </span>
              </div>
              <div className="bg-white p-2 rounded-xl border border-slate-200/80">
                <div className="flex items-center justify-center gap-1">
                  <span className="text-[10px] text-slate-400 block font-medium">Gross Weight</span>
                  {renderAiPill('weight_kg')}
                </div>
                <span className="text-xs font-bold text-slate-800">
                  ~{item.weight_kg || 0} kg
                </span>
              </div>
              <div className="bg-white p-2 rounded-xl border border-slate-200/80">
                <span className="text-[10px] text-slate-400 block font-medium">Volume (CBM)</span>
                <span className="text-xs font-bold text-teal-700">
                  {item.cbm ? `${item.cbm} m³` : '0 m³'}
                </span>
              </div>
            </div>

            {/* Checklist tags */}
            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div className="flex items-center justify-between bg-white p-2 rounded-xl border border-slate-200/80">
                <div className="flex items-center gap-2">
                  <AlertTriangle
                    size={14}
                    className={item.is_fragile ? 'text-red-600' : 'text-slate-300'}
                  />
                  <span className={item.is_fragile ? 'font-semibold text-slate-800' : 'text-slate-400'}>
                    {item.is_fragile ? 'Fragile Item' : 'Not Fragile'}
                  </span>
                </div>
                {renderAiPill('is_fragile')}
              </div>

              <div className="flex items-center justify-between bg-white p-2 rounded-xl border border-slate-200/80">
                <div className="flex items-center gap-2">
                  <Wrench
                    size={14}
                    className={item.disassembly_required ? 'text-amber-600' : 'text-slate-300'}
                  />
                  <span
                    className={
                      item.disassembly_required ? 'font-semibold text-slate-800' : 'text-slate-400'
                    }
                  >
                    {item.disassembly_required ? 'Needs Disassembly' : 'No Disassembly'}
                  </span>
                </div>
                {renderAiPill('disassembly_required')}
              </div>

              <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200/80">
                <Package
                  size={14}
                  className={item.has_original_box ? 'text-teal-600' : 'text-slate-300'}
                />
                <span
                  className={
                    item.has_original_box ? 'font-semibold text-slate-800' : 'text-slate-400'
                  }
                >
                  {item.has_original_box ? 'Original Box Available' : 'No Original Box'}
                </span>
              </div>

              <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200/80">
                <Cable
                  size={14}
                  className={item.has_cables_accessories ? 'text-blue-600' : 'text-slate-300'}
                />
                <span
                  className={
                    item.has_cables_accessories
                      ? 'font-semibold text-slate-800'
                      : 'text-slate-400'
                  }
                >
                  {item.has_cables_accessories ? 'Cables/Accessories Intact' : 'No Cables'}
                </span>
              </div>
            </div>
          </div>

          {/* Box Assignment */}
          <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 space-y-2">
            <span className="text-xs font-bold text-slate-800 block">
              Moving Box Assignment
            </span>
            <div className="flex items-center gap-2">
              <select
                value={item.box_id || ''}
                onChange={(e) => handleQuickBoxChange(e.target.value)}
                className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 font-medium"
              >
                <option value="">Unassigned / Large Standalone Item</option>
                {boxes.map((b) => (
                  <option key={b.id} value={b.id}>
                    Box #{b.box_number}: {b.label} ({b.room_destination || 'General'})
                  </option>
                ))}
              </select>
            </div>
            {assignedBox && (
              <p className="text-[11px] text-teal-700">
                ✓ Packed in <strong>Box #{assignedBox.box_number}</strong> with destination to{' '}
                <strong>{assignedBox.room_destination}</strong>
              </p>
            )}
          </div>

          {/* Carousell Details (If Selling) */}
          {item.decision_status === 'sell_carousell' && item.carousell_details && (
            <div className="bg-orange-50 rounded-2xl p-3.5 border border-orange-200 space-y-2">
              <span className="text-xs font-bold text-orange-900 block">
                Carousell Listing Details
              </span>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1">
                  <span>Asking Price:</span>
                  {renderAiPill('carousell_price')}
                </div>
                <strong className="text-orange-900 text-sm">
                  ${item.carousell_details.asking_price || 0} SGD
                </strong>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span>Listing Status:</span>
                <span className="font-semibold uppercase tracking-wider text-[10px] bg-orange-200 text-orange-900 px-2 py-0.5 rounded-full">
                  {item.carousell_details.status || 'draft'}
                </span>
              </div>
              {item.carousell_details.listing_url && (
                <a
                  href={item.carousell_details.listing_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-orange-700 underline flex items-center gap-1 font-medium mt-1"
                >
                  <ExternalLink size={12} />
                  <span>Open Carousell Listing</span>
                </a>
              )}
            </div>
          )}

          {/* Notes */}
          {item.notes && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 block">Notes & Handling</span>
                {renderAiPill('notes')}
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed">
                {item.notes}
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-200">
            {confirmDelete ? (
              <div className="flex items-center gap-2 w-full">
                <button
                  onClick={handleDelete}
                  className="flex-1 py-2 px-3 bg-red-600 text-white text-xs font-bold rounded-xl hover:bg-red-700 transition"
                >
                  Confirm Delete Item
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="py-2 px-3 bg-slate-100 text-slate-700 text-xs font-medium rounded-xl hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="p-2.5 text-red-600 hover:bg-red-50 rounded-xl transition flex items-center gap-1.5 text-xs font-medium"
                >
                  <Trash2 size={15} />
                  <span>Delete</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={onClose}
                    className="py-2 px-4 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition"
                  >
                    Close
                  </button>
                  <button
                    onClick={onEdit}
                    className="py-2 px-4 rounded-xl bg-teal-600 text-white text-xs font-bold hover:bg-teal-700 transition shadow-sm flex items-center gap-1.5"
                  >
                    <Edit size={14} />
                    <span>Edit Specs</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
