import React, { useState } from 'react';
import { Box, Item } from '../../types';
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
  ExternalLink,
} from 'lucide-react';

interface BoxDetailModalProps {
  box: Box;
  onClose: () => void;
  onSelectItem: (item: Item) => void;
}

export const BoxDetailModal: React.FC<BoxDetailModalProps> = ({
  box,
  onClose,
  onSelectItem,
}) => {
  const { items, updateItem, removeBox } = useItems();
  const [showItemPicker, setShowItemPicker] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const boxItems = items.filter((i) => i.box_id === box.id);
  const unassignedItems = items.filter(
    (i) => i.decision_status === 'keep_pack' && i.box_id !== box.id
  );

  const totalWeight = boxItems.reduce((acc, i) => acc + (Number(i.weight_kg) || 0), 0);
  const hasFragile = box.is_fragile || boxItems.some((i) => i.is_fragile);

  const handleUnassignItem = async (item: Item) => {
    await updateItem({ ...item, box_id: null });
  };

  const handleAssignItem = async (item: Item) => {
    await updateItem({ ...item, box_id: box.id });
  };

  const handleDeleteBox = async () => {
    await removeBox(box.id);
    onClose();
  };

  const handlePrintSingleLabel = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-6">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-teal-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
              #{box.box_number}
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-base leading-tight">
                {box.label}
              </h2>
              <p className="text-xs text-slate-500">
                Destination: <strong className="text-slate-800">{box.room_destination}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {/* QR Code & Box Specs Card */}
          <div className="bg-gradient-to-br from-slate-50 to-teal-50/40 rounded-2xl p-4 border border-teal-200/70 flex items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 bg-teal-100 px-2 py-0.5 rounded-md">
                  QR Box Tag
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
                <span className="text-[11px] font-semibold text-slate-600 block">
                  Select an item to place into Box #{box.box_number}:
                </span>
                <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                  {unassignedItems.length > 0 ? (
                    unassignedItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200 text-xs"
                      >
                        <span className="truncate font-medium text-slate-800 max-w-[200px]">
                          {item.name}
                        </span>
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
                      No unboxed items available.
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

              <button
                onClick={onClose}
                className="py-2 px-4 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition"
              >
                Done
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
