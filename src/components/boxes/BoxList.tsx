import React, { useState } from 'react';
import { useItems } from '../../context/ItemContext';
import { useHousehold } from '../../context/HouseholdContext';
import { Box, getBoxDestinationHouse, isMovingDecision, MoveDestinationScope } from '../../types';
import {
  Archive,
  QrCode,
  Printer,
  Plus,
  AlertTriangle,
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
  const { household } = useHousehold();

  const getNextBoxNumber = () =>
    Math.max(0, ...boxes.map((b) => b.box_number || 0)) + 1;

  const [destFilter, setDestFilter] = useState<MoveDestinationScope>('all');
  const [showAddBoxModal, setShowAddBoxModal] = useState(false);
  const [newBoxNumber, setNewBoxNumber] = useState<number>(() => getNextBoxNumber());
  const [newTargetHouse, setNewTargetHouse] = useState<'rental_condo' | 'moms_hq'>('rental_condo');
  const [newLabel, setNewLabel] = useState('');
  const [newDestRoom, setNewDestRoom] = useState('Living Room');
  const [isFragile, setIsFragile] = useState(false);
  const [notes, setNotes] = useState('');

  const handleCreateBox = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim()) return;

    const num = Number(newBoxNumber) || getNextBoxNumber();
    const housePrefix =
      newTargetHouse === 'moms_hq' ? "Mom's House (HQ)" : 'Rental Condo';
    const cleanRoom = newDestRoom
      .replace(/^(Rental Condo|Condo|Mom's House \(HQ\)|Mom's House|HQ)\s*[—:-]?\s*/i, '')
      .trim();
    const formattedDest = `${housePrefix} — ${cleanRoom || 'General'}`;

    await addBox({
      household_id: household?.id || 'household-bukit-batok-4rm',
      box_number: num,
      label: newLabel.trim(),
      room_destination: formattedDest,
      is_fragile: isFragile,
      status: 'packing',
      qr_code_id: `MOVETRACK-BB-BOX-${String(num).padStart(2, '0')}`,
      notes: notes.trim(),
    });

    setNewLabel('');
    setNotes('');
    setNewBoxNumber(num + 1);
    setShowAddBoxModal(false);
  };

  const totalPackedItems = items.filter((i) => i.box_id).length;
  const totalUnboxedMoving = items.filter(
    (i) => isMovingDecision(i.decision_status) && !i.box_id
  ).length;

  const rentalBoxesCount = boxes.filter(
    (b) =>
      getBoxDestinationHouse(
        b,
        items.filter((i) => i.box_id === b.id)
      ) === 'rental_condo'
  ).length;

  const momsBoxesCount = boxes.filter(
    (b) =>
      getBoxDestinationHouse(
        b,
        items.filter((i) => i.box_id === b.id)
      ) === 'moms_hq'
  ).length;

  const filteredBoxes = boxes.filter((box) => {
    if (destFilter === 'all') return true;
    const boxItems = items.filter((i) => i.box_id === box.id);
    return getBoxDestinationHouse(box, boxItems) === destFilter;
  });

  return (
    <div className="space-y-4 pb-24">
      {/* Top Banner & Quick Action Buttons */}
      <div className="bg-gradient-to-r from-teal-700 to-emerald-700 rounded-2xl p-4 text-white shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs uppercase tracking-wider text-teal-200 font-semibold">
              Moving Logistics • 2-House Segregation
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

      {/* Destination House Filter Tabs + New Box Button */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
          <button
            onClick={() => setDestFilter('all')}
            className={`shrink-0 px-3 py-1.5 rounded-xl border font-semibold transition flex items-center gap-1.5 ${
              destFilter === 'all'
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span>All Boxes</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                destFilter === 'all' ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {boxes.length}
            </span>
          </button>

          <button
            onClick={() =>
              setDestFilter(destFilter === 'rental_condo' ? 'all' : 'rental_condo')
            }
            className={`shrink-0 px-3 py-1.5 rounded-xl border font-semibold transition flex items-center gap-1.5 ${
              destFilter === 'rental_condo'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                : 'bg-emerald-50/70 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            <span>🏢 Rental (Condo)</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                destFilter === 'rental_condo'
                  ? 'bg-emerald-700 text-white'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {rentalBoxesCount}
            </span>
          </button>

          <button
            onClick={() => setDestFilter(destFilter === 'moms_hq' ? 'all' : 'moms_hq')}
            className={`shrink-0 px-3 py-1.5 rounded-xl border font-semibold transition flex items-center gap-1.5 ${
              destFilter === 'moms_hq'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                : 'bg-indigo-50/70 text-indigo-800 border-indigo-200 hover:bg-indigo-100'
            }`}
          >
            <span>🏡 Mom's (HQ)</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                destFilter === 'moms_hq'
                  ? 'bg-indigo-700 text-white'
                  : 'bg-indigo-100 text-indigo-800'
              }`}
            >
              {momsBoxesCount}
            </span>
          </button>
        </div>

        <button
          onClick={() => {
            setNewBoxNumber(getNextBoxNumber());
            if (destFilter === 'moms_hq') setNewTargetHouse('moms_hq');
            else setNewTargetHouse('rental_condo');
            setShowAddBoxModal(true);
          }}
          className="shrink-0 text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-xl border border-teal-200 transition flex items-center gap-1 active:scale-95"
        >
          <Plus size={14} />
          <span>New Box</span>
        </button>
      </div>

      {/* Boxes Grid */}
      {filteredBoxes.length > 0 ? (
        <div className="space-y-2.5">
          {filteredBoxes.map((box) => {
            const boxItems = items.filter((i) => i.box_id === box.id);
            const totalBoxWeight = boxItems.reduce(
              (acc, i) => acc + (Number(i.weight_kg) || 0),
              0
            );
            const hasFragile = box.is_fragile || boxItems.some((i) => i.is_fragile);
            const boxStatus = box.status || 'packing';
            const targetHouse = getBoxDestinationHouse(box, boxItems);
            const isMomsHouse = targetHouse === 'moms_hq';

            return (
              <div
                key={box.id}
                onClick={() => onSelectBox(box)}
                className="bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-sm hover:shadow-md hover:border-teal-300 transition-all cursor-pointer flex items-center justify-between gap-3 active:scale-[0.99]"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Box Number Icon color-coded by target house */}
                  <div
                    className={`w-12 h-12 rounded-xl border flex flex-col items-center justify-center shrink-0 ${
                      isMomsHouse
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-900'
                        : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    }`}
                  >
                    <span className="text-[9px] font-bold opacity-60 uppercase leading-none">
                      BOX
                    </span>
                    <span className="text-base font-black leading-tight">
                      #{box.box_number}
                    </span>
                  </div>

                  {/* Box Label & Details */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                          isMomsHouse
                            ? 'bg-indigo-100 text-indigo-800 border-indigo-200'
                            : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                        }`}
                      >
                        {isMomsHouse ? "🏡 Mom's House (HQ)" : '🏢 Rental (Condo)'}
                      </span>
                      <span className="font-bold text-slate-900 text-sm truncate">
                        {box.label}
                      </span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded capitalize ${
                          boxStatus === 'sealed'
                            ? 'bg-blue-100 text-blue-800'
                            : boxStatus === 'loaded'
                            ? 'bg-purple-100 text-purple-800'
                            : boxStatus === 'delivered'
                            ? 'bg-amber-100 text-amber-800'
                            : boxStatus === 'unpacked'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {boxStatus}
                      </span>
                      {hasFragile && (
                        <span className="text-[9px] font-bold text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded flex items-center gap-0.5 shrink-0">
                          <AlertTriangle size={9} />
                          FRAGILE
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1 flex-wrap">
                      <span className="font-medium text-slate-700">
                        Room: {box.room_destination || 'General'}
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
      ) : (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <Archive size={24} />
          </div>
          <div>
            <h4 className="font-bold text-slate-800 text-sm">No moving boxes found</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              Create numbered boxes segregated for your New Rental Condo or Mom's House (HQ).
            </p>
          </div>
          <button
            onClick={() => {
              setNewBoxNumber(getNextBoxNumber());
              setShowAddBoxModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700 transition active:scale-95 shadow-sm"
          >
            <Plus size={14} />
            <span>Create Moving Box</span>
          </button>
        </div>
      )}

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

            <form onSubmit={handleCreateBox} className="space-y-3.5 text-xs">
              {/* Target Drop-off House Selector */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 block">
                  1. Target Drop-Off House (For Mover Segregation)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewTargetHouse('rental_condo')}
                    className={`p-2.5 rounded-xl border text-left transition ${
                      newTargetHouse === 'rental_condo'
                        ? 'bg-emerald-600 text-white border-emerald-600 font-bold shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="text-xs font-bold">🏢 New Rental (Condo)</div>
                    <div
                      className={`text-[10px] ${
                        newTargetHouse === 'rental_condo' ? 'text-emerald-100' : 'text-slate-400'
                      }`}
                    >
                      Condo drop-off
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewTargetHouse('moms_hq')}
                    className={`p-2.5 rounded-xl border text-left transition ${
                      newTargetHouse === 'moms_hq'
                        ? 'bg-indigo-600 text-white border-indigo-600 font-bold shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="text-xs font-bold">🏡 Mom's House (HQ)</div>
                    <div
                      className={`text-[10px] ${
                        newTargetHouse === 'moms_hq' ? 'text-indigo-100' : 'text-slate-400'
                      }`}
                    >
                      Mom's / HQ drop-off
                    </div>
                  </button>
                </div>
              </div>

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
                    Target Room at Destination
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
                  placeholder="e.g. Kitchen Glassware & Plates, Study Tech Cables"
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
