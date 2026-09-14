import React, { useState } from 'react';
import { useItems } from '../../context/ItemContext';
import { Box, Item } from '../../types';
import {
  Archive,
  QrCode,
  Printer,
  Plus,
  AlertTriangle,
  Package,
  ChevronRight,
  ScanLine,
} from 'lucide-react';

interface BoxListProps {
  onSelectBox: (box: Box) => void;
  onOpenScanner: () => void;
  onOpenPrintSheet: () => void;
}

export const BoxList: React.FC<BoxListProps> = ({
  onSelectBox,
  onOpenScanner,
  onOpenPrintSheet,
}) => {
  const { boxes, items, addBox } = useItems();
  const [showAddBoxModal, setShowAddBoxModal] = useState(false);
  const [newBoxNumber, setNewBoxNumber] = useState<number>(boxes.length + 1);
  const [newLabel, setNewLabel] = useState('');
  const [newDestRoom, setNewDestRoom] = useState('Living Room');
  const [isFragile, setIsFragile] = useState(false);
  const [notes, setNotes] = useState('');

  const handleCreateBox = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim()) return;

    await addBox({
      household_id: 'household-bukit-batok-4rm',
      box_number: Number(newBoxNumber) || boxes.length + 1,
      label: newLabel.trim(),
      room_destination: newDestRoom,
      is_fragile: isFragile,
      qr_code_id: `MOVETRACK-BB-BOX-${String(newBoxNumber).padStart(2, '0')}`,
      notes: notes.trim(),
    });

    setNewLabel('');
    setNotes('');
    setNewBoxNumber(boxes.length + 2);
    setShowAddBoxModal(false);
  };

  const totalPackedItems = items.filter((i) => i.box_id).length;
  const totalUnboxedMoving = items.filter(
    (i) => i.decision_status === 'keep_pack' && !i.box_id
  ).length;

  return (
    <div className="space-y-4 pb-24">
      {/* Top Banner & Quick Action Buttons */}
      <div className="bg-gradient-to-r from-teal-700 to-emerald-700 rounded-2xl p-4 text-white shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs uppercase tracking-wider text-teal-200 font-semibold">
              Moving Logistics
            </span>
            <h2 className="text-lg font-bold">Boxes & QR Labeling</h2>
          </div>
          <div className="text-right">
            <div className="text-2xl font-black">{boxes.length}</div>
            <div className="text-[10px] text-teal-200">Total Boxes</div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-teal-600/60">
          <div className="bg-white/10 rounded-xl p-2 backdrop-blur-sm">
            <span className="text-[10px] text-teal-200 block">Items in Boxes</span>
            <span className="font-bold text-sm">{totalPackedItems} items</span>
          </div>
          <div className="bg-white/10 rounded-xl p-2 backdrop-blur-sm">
            <span className="text-[10px] text-teal-200 block">Unboxed Move Items</span>
            <span className="font-bold text-sm">{totalUnboxedMoving} standalone</span>
          </div>
        </div>

        {/* Action Buttons: Scan QR & Print Sheet */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={onOpenScanner}
            className="flex-1 py-2 px-3 bg-white text-teal-900 rounded-xl font-bold text-xs hover:bg-teal-50 transition active:scale-95 shadow flex items-center justify-center gap-1.5"
          >
            <ScanLine size={15} />
            <span>Scan Box QR</span>
          </button>

          <button
            onClick={onOpenPrintSheet}
            className="flex-1 py-2 px-3 bg-teal-800/80 hover:bg-teal-800 text-white rounded-xl font-semibold text-xs border border-teal-500/40 transition active:scale-95 flex items-center justify-center gap-1.5"
          >
            <Printer size={15} />
            <span>Print All Labels</span>
          </button>
        </div>
      </div>

      {/* Box Creation Trigger */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          All Moving Boxes ({boxes.length})
        </h3>
        <button
          onClick={() => {
            setNewBoxNumber(boxes.length + 1);
            setShowAddBoxModal(true);
          }}
          className="text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-xl border border-teal-200 transition flex items-center gap-1 active:scale-95"
        >
          <Plus size={14} />
          <span>New Box</span>
        </button>
      </div>

      {/* Boxes Grid */}
      <div className="space-y-2.5">
        {boxes.map((box) => {
          const boxItems = items.filter((i) => i.box_id === box.id);
          const totalBoxWeight = boxItems.reduce(
            (acc, i) => acc + (Number(i.weight_kg) || 0),
            0
          );
          const hasFragile = box.is_fragile || boxItems.some((i) => i.is_fragile);

          return (
            <div
              key={box.id}
              onClick={() => onSelectBox(box)}
              className="bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-sm hover:shadow-md hover:border-teal-300 transition-all cursor-pointer flex items-center justify-between gap-3 active:scale-[0.99]"
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* Box Number Icon */}
                <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex flex-col items-center justify-center shrink-0 text-slate-800">
                  <span className="text-[9px] font-bold text-slate-400 uppercase leading-none">
                    BOX
                  </span>
                  <span className="text-base font-black leading-tight text-teal-700">
                    #{box.box_number}
                  </span>
                </div>

                {/* Box Label & Details */}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-slate-900 text-sm truncate">
                      {box.label}
                    </span>
                    {hasFragile && (
                      <span className="text-[9px] font-bold text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.2 rounded flex items-center gap-0.5 shrink-0">
                        <AlertTriangle size={9} />
                        FRAGILE
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                    <span className="font-medium text-slate-700">
                      Destination: {box.room_destination || 'General'}
                    </span>
                    <span>•</span>
                    <span>{boxItems.length} items</span>
                    <span>•</span>
                    <span>~{totalBoxWeight.toFixed(1)} kg</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 text-slate-400">
                <QrCode size={20} className="text-teal-600/70" />
                <ChevronRight size={18} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Box Modal */}
      {showAddBoxModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl space-y-4 animate-in fade-in slide-in-from-bottom-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Create Moving Box</h3>
              <button
                onClick={() => setShowAddBoxModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateBox} className="space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">Box #</label>
                  <input
                    type="number"
                    required
                    value={newBoxNumber}
                    onChange={(e) => setNewBoxNumber(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-center font-bold"
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="font-semibold text-slate-700 block">
                    Destination Room in New Flat
                  </label>
                  <select
                    value={newDestRoom}
                    onChange={(e) => setNewDestRoom(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="Living Room">Living Room</option>
                    <option value="Master Bedroom">Master Bedroom</option>
                    <option value="Study / Bed 2">Study / Bed 2</option>
                    <option value="Bedroom 3">Bedroom 3</option>
                    <option value="Kitchen">Kitchen</option>
                    <option value="Store / Bomb Shelter">Store / Bomb Shelter</option>
                    <option value="General">General</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block">Box Label / Summary *</label>
                <input
                  type="text"
                  required
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="e.g. Master Bedroom Fragile Cosmetics & Tech"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="fragileBox"
                  checked={isFragile}
                  onChange={(e) => setIsFragile(e.target.checked)}
                  className="w-4 h-4 text-teal-600 rounded"
                />
                <label htmlFor="fragileBox" className="font-medium text-slate-700">
                  Mark as FRAGILE (High-visibility warning on label)
                </label>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block">Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional packing notes..."
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddBoxModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-teal-600 text-white font-bold hover:bg-teal-700 transition"
                >
                  Create Box
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
