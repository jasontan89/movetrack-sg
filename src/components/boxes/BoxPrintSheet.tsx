import React from 'react';
import { Box, Item } from '../../types';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, X, AlertTriangle } from 'lucide-react';

interface BoxPrintSheetProps {
  boxes: Box[];
  items: Item[];
  householdName?: string;
  onClose: () => void;
}

export const BoxPrintSheet: React.FC<BoxPrintSheetProps> = ({
  boxes,
  items,
  householdName = 'Bukit Batok 4-Room Relocation',
  onClose,
}) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 p-2 sm:p-6 backdrop-blur-sm">
      {/* Control Bar (hidden when printing) */}
      <div className="max-w-3xl mx-auto mb-4 flex items-center justify-between bg-white p-4 rounded-2xl shadow-xl print:hidden">
        <div>
          <h2 className="font-bold text-slate-900 text-sm">Printable Box QR Labels</h2>
          <p className="text-xs text-slate-500">
            Cut along borders and tape onto moving boxes for camera scanning
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-bold hover:bg-teal-700 transition flex items-center gap-1.5 shadow"
          >
            <Printer size={15} />
            <span>Print Labels</span>
          </button>
          <button
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Printable Sheet */}
      <div className="max-w-3xl mx-auto bg-white p-6 rounded-2xl shadow-2xl space-y-6 print:p-0 print:shadow-none print:rounded-none">
        <div className="border-b-2 border-slate-900 pb-3 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">
              MOVETRACK SG — BOX LABELS
            </h1>
            <p className="text-xs text-slate-600 font-medium">
              {householdName} • Total Boxes: {boxes.length}
            </p>
          </div>
          <div className="text-right text-xs text-slate-500">
            Scan QR code with phone camera to view contents
          </div>
        </div>

        {/* Labels Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-2 print:gap-4">
          {boxes.map((box) => {
            const boxItems = items.filter((i) => i.box_id === box.id);
            const hasFragile = box.is_fragile || boxItems.some((i) => i.is_fragile);
            const totalWeight = boxItems.reduce(
              (acc, i) => acc + (Number(i.weight_kg) || 0),
              0
            );

            return (
              <div
                key={box.id}
                className={`border-4 rounded-2xl p-4 flex flex-col justify-between space-y-3 print:break-inside-avoid ${
                  hasFragile ? 'border-red-600 bg-red-50/20' : 'border-slate-800 bg-white'
                }`}
              >
                {/* Top Label Header */}
                <div className="flex items-start justify-between gap-2 border-b-2 border-slate-200 pb-2">
                  <div>
                    <span className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                      MOVETRACK BOX
                    </span>
                    <div className="text-3xl font-black text-slate-900 leading-none mt-0.5">
                      #{box.box_number}
                    </div>
                  </div>

                  {hasFragile && (
                    <div className="bg-red-600 text-white font-black text-xs px-2.5 py-1 rounded-md uppercase tracking-wider flex items-center gap-1 shadow-sm">
                      <AlertTriangle size={13} strokeWidth={3} />
                      <span>FRAGILE</span>
                    </div>
                  )}
                </div>

                {/* Destination & Box Label */}
                <div>
                  <div className="text-[10px] uppercase font-bold text-teal-800 tracking-wider">
                    DESTINATION ROOM
                  </div>
                  <div className="text-lg font-black text-slate-900 uppercase">
                    {box.room_destination || 'GENERAL'}
                  </div>
                  <div className="text-xs font-bold text-slate-700 mt-0.5">
                    {box.label}
                  </div>
                </div>

                {/* QR Code and Quick Contents list */}
                <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-200">
                  <div className="min-w-0 flex-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                      CONTENTS ({boxItems.length} items • ~{totalWeight.toFixed(1)} kg)
                    </span>
                    <ul className="text-[10px] text-slate-700 list-disc list-inside mt-0.5 space-y-0.5 line-clamp-3">
                      {boxItems.slice(0, 4).map((item) => (
                        <li key={item.id} className="truncate">
                          {item.name}
                        </li>
                      ))}
                      {boxItems.length > 4 && (
                        <li className="text-slate-400 italic">
                          +{boxItems.length - 4} more items
                        </li>
                      )}
                      {boxItems.length === 0 && (
                        <li className="text-slate-400 italic">Empty box</li>
                      )}
                    </ul>
                  </div>

                  {/* High Quality QR SVG */}
                  <div className="bg-white p-1.5 border border-slate-300 rounded-lg shrink-0 flex flex-col items-center">
                    <QRCodeSVG
                      value={JSON.stringify({
                        box_id: box.id,
                        box_number: box.box_number,
                        label: box.label,
                        destination: box.room_destination,
                        fragile: hasFragile,
                        app: 'MoveTrackSG',
                      })}
                      size={75}
                      level="H"
                    />
                    <span className="text-[7px] font-mono text-slate-500 mt-0.5">
                      BOX #{box.box_number}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
