import React, { useState } from 'react';
import { Box, BoxStatus, getBoxDestinationHouse, isMovingDecision, Item } from '../../types';
import { useItems } from '../../context/ItemContext';
import { QRCodeSVG } from 'qrcode.react';
import {
  X,
  Printer,
  Trash2,
  AlertTriangle,
  Package,
  Plus,
  MinusCircle,
  Edit2,
  Check,
} from 'lucide-react';

interface BoxDetailModalProps {
  box: Box;
  onClose: () => void;
  onSelectItem: (item: Item) => void;
  onPrint?: (box: Box) => void;
}

export const BoxDetailModal: React.FC<BoxDetailModalProps> = ({
  box,
  onClose,
  onSelectItem,
  onPrint,
}) => {
  const { items, updateItem, updateBox, removeBox } = useItems();
  const [showItemPicker, setShowItemPicker] = useState(false);
  const [showCrossHouseItems, setShowCrossHouseItems] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const boxItems = items.filter((i) => i.box_id === box.id);
  const detectedHouse = getBoxDestinationHouse(box, boxItems);

  // Edit fields
  const [label, setLabel] = useState(box.label);
  const [targetHouse, setTargetHouse] = useState<'rental_condo' | 'moms_hq'>(detectedHouse);
  const [roomDestination, setRoomDestination] = useState(
    box.room_destination
      .replace(/^(Rental Condo|Condo|Mom's House \(HQ\)|Mom's House|HQ)\s*[—:-]?\s*/i, '')
      .trim() || box.room_destination
  );
  const [notes, setNotes] = useState(box.notes || '');
  const [isFragile, setIsFragile] = useState(box.is_fragile);

  const isMomsHouse = detectedHouse === 'moms_hq';
  const expectedDecisionStatus = isMomsHouse ? 'move_hq' : 'keep_pack';

  const unassignedItems = items.filter((i) => {
    if (!isMovingDecision(i.decision_status) || i.box_id === box.id) return false;
    if (showCrossHouseItems) return true;
    return i.decision_status === expectedDecisionStatus;
  });

  const totalWeight = boxItems.reduce((acc, i) => acc + (Number(i.weight_kg) || 0), 0);
  const hasFragile = box.is_fragile || boxItems.some((i) => i.is_fragile);
  const currentStatus: BoxStatus = box.status || 'packing';

  const handleUnassignItem = async (item: Item) => {
    await updateItem({ ...item, box_id: null });
  };

  const handleAssignItem = async (item: Item) => {
    await updateItem({
      ...item,
      decision_status: expectedDecisionStatus,
      box_id: box.id,
    });
  };

  const handleDeleteBox = async () => {
    await removeBox(box.id);
    onClose();
  };

  const handleSaveBoxEdits = async () => {
    if (!label.trim()) return;
    const housePrefix =
      targetHouse === 'moms_hq' ? "Mom's House (HQ)" : 'Rental Condo';
    const cleanRoom = roomDestination
      .replace(/^(Rental Condo|Condo|Mom's House \(HQ\)|Mom's House|HQ)\s*[—:-]?\s*/i, '')
      .trim();
    const formattedDest = `${housePrefix} — ${cleanRoom || 'General'}`;

    await updateBox({
      ...box,
      label: label.trim(),
      room_destination: formattedDest,
      notes: notes.trim(),
      is_fragile: isFragile,
    });
    setIsEditing(false);
  };

  const handleSetStatus = async (newStatus: BoxStatus) => {
    await updateBox({
      ...box,
      status: newStatus,
    });
  };

  const BOX_STATUSES: { id: BoxStatus; label: string; activeColor: string }[] = [
    { id: 'packing', label: '1. Packing', activeColor: 'bg-slate-700 text-white' },
    { id: 'sealed', label: '2. Sealed', activeColor: 'bg-blue-600 text-white' },
    { id: 'loaded', label: '3. Loaded', activeColor: 'bg-purple-600 text-white' },
    { id: 'delivered', label: '4. Delivered', activeColor: 'bg-amber-600 text-white' },
    { id: 'unpacked', label: '5. Unpacked', activeColor: 'bg-emerald-600 text-white' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-6">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`w-10 h-10 rounded-xl text-white font-bold flex items-center justify-center text-sm shadow-sm shrink-0 ${
                isMomsHouse ? 'bg-indigo-600' : 'bg-emerald-600'
              }`}
            >
              #{box.box_number}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span
                  className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                    isMomsHouse
                      ? 'bg-indigo-100 text-indigo-800 border-indigo-200'
                      : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                  }`}
                >
                  {isMomsHouse ? "🏡 Mom's House (HQ)" : '🏢 Rental House (Condo)'}
                </span>
                <h2 className="font-bold text-slate-900 text-base leading-tight truncate">
                  {box.label}
                </h2>
              </div>
              <p className="text-xs text-slate-500 truncate mt-0.5">
                Destination: <strong className="text-slate-800">{box.room_destination}</strong>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {onPrint && (
              <button
                onClick={() => onPrint(box)}
                className="p-2 rounded-xl text-slate-600 hover:text-teal-700 hover:bg-teal-50 transition"
                title="Print Box QR Label"
              >
                <Printer size={18} />
              </button>
            )}
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`p-2 rounded-xl transition ${
                isEditing
                  ? 'bg-teal-600 text-white'
                  : 'text-slate-600 hover:text-teal-700 hover:bg-slate-200'
              }`}
              title="Edit Box Details"
            >
              <Edit2 size={18} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {/* Status Progression Lifecycle */}
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Moving Box Status
            </span>
            <div className="grid grid-cols-5 gap-1 text-[10px]">
              {BOX_STATUSES.map((st) => {
                const isActive = currentStatus === st.id;
                return (
                  <button
                    key={st.id}
                    onClick={() => handleSetStatus(st.id)}
                    className={`py-1.5 px-1 rounded-lg border text-center transition font-semibold truncate ${
                      isActive
                        ? `${st.activeColor} border-transparent shadow-sm`
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {st.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Edit Box Form (collapsible) */}
          {isEditing && (
            <div className="bg-teal-50/70 p-4 rounded-2xl border border-teal-200 space-y-3 animate-in fade-in">
              <span className="font-bold text-teal-900 block text-xs">Edit Box Information</span>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Target Drop-Off House
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTargetHouse('rental_condo')}
                    className={`p-2 rounded-xl border text-left transition ${
                      targetHouse === 'rental_condo'
                        ? 'bg-emerald-600 text-white border-emerald-600 font-bold'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    🏢 Rental House (Condo)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetHouse('moms_hq')}
                    className={`p-2 rounded-xl border text-left transition ${
                      targetHouse === 'moms_hq'
                        ? 'bg-indigo-600 text-white border-indigo-600 font-bold'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    🏡 Mom's House (HQ)
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Box Label / Title
                </label>
                <input
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Destination Room
                </label>
                <input
                  type="text"
                  value={roomDestination}
                  onChange={(e) => setRoomDestination(e.target.value)}
                  placeholder="e.g. Living Room, Kitchen, Master Bedroom"
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Box Notes
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Keep upright, fragile glassware"
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFragile}
                    onChange={(e) => setIsFragile(e.target.checked)}
                    className="rounded text-teal-600"
                  />
                  <span className="font-semibold text-slate-700 text-xs">Fragile Box</span>
                </label>

                <button
                  type="button"
                  onClick={handleSaveBoxEdits}
                  className="py-1.5 px-3 bg-teal-600 text-white rounded-xl font-bold text-xs flex items-center gap-1 shadow-sm"
                >
                  <Check size={14} />
                  <span>Save Edits</span>
                </button>
              </div>
            </div>
          )}

          {/* QR Code & Box Specs Card */}
          <div className="bg-gradient-to-br from-slate-50 to-teal-50/40 rounded-2xl p-4 border border-teal-200/70 flex items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                    isMomsHouse
                      ? 'bg-indigo-600 text-white'
                      : 'bg-emerald-600 text-white'
                  }`}
                >
                  {isMomsHouse ? "DROP-OFF: MOM'S HOUSE (HQ)" : 'DROP-OFF: RENTAL (CONDO)'}
                </span>
                {hasFragile && (
                  <span className="text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-md flex items-center gap-0.5">
                    <AlertTriangle size={10} />
                    FRAGILE
                  </span>
                )}
              </div>
              <div className="text-sm font-bold text-slate-900">{box.label}</div>
              <div className="text-slate-500 text-[11px]">
                {boxItems.length} items packed • Gross: ~{totalWeight.toFixed(1)} kg
              </div>
              <div className="text-[10px] font-mono text-slate-400">{box.qr_code_id}</div>
            </div>

            {/* Rendered QR Code */}
            <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm shrink-0 flex flex-col items-center">
              <QRCodeSVG
                value={JSON.stringify({
                  box_id: box.id,
                  box_number: box.box_number,
                  label: box.label,
                  drop_off_house: isMomsHouse ? "Mom's House (HQ)" : 'New Rental House (Condo)',
                  destination: box.room_destination,
                  fragile: hasFragile,
                  app: 'MoveTrackSG',
                })}
                size={85}
                level="M"
              />
              <span className="text-[8px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">
                Scan with phone
              </span>
            </div>
          </div>

          {/* Items Packed in this Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                Packed Items ({boxItems.length})
              </h3>
              <button
                onClick={() => setShowItemPicker(!showItemPicker)}
                className="text-[11px] font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 px-2.5 py-1 rounded-lg border border-teal-200 flex items-center gap-1"
              >
                <Plus size={12} />
                <span>Pack More Items</span>
              </button>
            </div>

            {/* Quick Item Picker Dropdown */}
            {showItemPicker && (
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2 animate-in fade-in">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold text-slate-600">
                    Select {isMomsHouse ? "Mom's House (HQ)" : 'Rental (Condo)'} items to pack:
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowCrossHouseItems(!showCrossHouseItems)}
                    className="text-[10px] text-teal-700 underline font-medium"
                  >
                    {showCrossHouseItems ? 'Show matching house only' : 'Show all moving items'}
                  </button>
                </div>
                <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                  {unassignedItems.length > 0 ? (
                    unassignedItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200 text-xs"
                      >
                        <div className="truncate max-w-[210px]">
                          <span className="font-medium text-slate-800">{item.name}</span>
                          <span className="ml-1.5 text-[9px] text-slate-400">
                            ({item.decision_status === 'move_hq' ? "Mom's/HQ" : 'Rental'})
                          </span>
                        </div>
                        <button
                          onClick={() => handleAssignItem(item)}
                          className="px-2 py-0.5 rounded bg-teal-600 text-white font-bold text-[10px] hover:bg-teal-700"
                        >
                          + Pack Here
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-slate-400 text-center py-2 text-[11px]">
                      No unboxed items available for this destination.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* List of currently packed items */}
            {boxItems.length > 0 ? (
              <div className="space-y-2">
                {boxItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition"
                  >
                    <div
                      onClick={() => onSelectItem(item)}
                      className="flex items-center gap-2.5 cursor-pointer min-w-0 flex-1"
                    >
                      <div className="w-10 h-10 rounded-lg bg-white overflow-hidden border border-slate-200 shrink-0 flex items-center justify-center">
                        {item.photo_url ? (
                          <img
                            src={item.photo_url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package size={16} className="text-slate-300" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 truncate">
                          {item.name}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {item.owner === 'jason'
                            ? 'Jason'
                            : item.owner === 'wife'
                            ? 'Wife'
                            : 'Shared'}{' '}
                          • ~{item.weight_kg || 0} kg
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleUnassignItem(item)}
                      className="p-1 text-slate-400 hover:text-red-600 transition ml-2"
                      title="Remove from this box"
                    >
                      <MinusCircle size={16} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-2xl text-slate-400">
                <Package size={24} className="mx-auto mb-1 text-slate-300" />
                <span>Box is empty. Assign items above or when editing an item.</span>
              </div>
            )}
          </div>

          {/* Notes */}
          {box.notes && (
            <div className="space-y-1">
              <span className="font-bold text-slate-700 block">Box Notes</span>
              <p className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-slate-600">
                {box.notes}
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 flex items-center justify-between gap-2">
          {confirmDelete ? (
            <div className="flex items-center gap-2 w-full">
              <button
                onClick={handleDeleteBox}
                className="flex-1 py-2 rounded-xl bg-red-600 text-white font-bold text-xs"
              >
                Confirm Delete Box
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="py-2 px-3 rounded-xl bg-slate-100 text-slate-700 font-medium text-xs"
              >
                Cancel
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={() => setConfirmDelete(true)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition flex items-center gap-1 text-xs"
              >
                <Trash2 size={15} />
                <span>Delete</span>
              </button>

              <div className="flex items-center gap-2">
                {onPrint && (
                  <button
                    onClick={() => onPrint(box)}
                    className="py-2 px-3 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-100 transition flex items-center gap-1"
                  >
                    <Printer size={14} />
                    <span>Print Label</span>
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="py-2 px-4 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition"
                >
                  Done
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
