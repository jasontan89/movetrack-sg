import React, { useState } from 'react';
import { Box, getBoxDestinationHouse, Item, MoveDestinationScope } from '../../types';
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
  const [scope, setScope] = useState<MoveDestinationScope>('all');

  const filteredBoxes = boxes.filter((box) => {
    if (scope === 'all') return true;
    const boxItems = items.filter((i) => i.box_id === box.id);
    return getBoxDestinationHouse(box, boxItems) === scope;
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 p-2 sm:p-6 backdrop-blur-sm">
      {/* Control Bar (hidden when printing) */}
      <div className="max-w-3xl mx-auto mb-4 bg-white p-4 rounded-2xl shadow-xl print:hidden space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-slate-900 text-sm">
              Printable Box QR Labels (Segregated by Drop-Off House)
            </h2>
            <p className="text-xs text-slate-500">
              Each label clearly displays New Rental House (Condo) vs Mom's House (HQ) for movers
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-bold hover:bg-teal-700 transition flex items-center gap-1.5 shadow"
            >
              <Printer size={15} />
              <span>Print Labels ({filteredBoxes.length})</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {boxes.length > 1 && (
          <div className="flex items-center gap-2 text-xs pt-1 border-t border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500">Filter Sheet:</span>
            <button
              onClick={() => setScope('all')}
              className={`px-2.5 py-1 rounded-lg border font-semibold ${
                scope === 'all'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              All Boxes ({boxes.length})
            </button>
            <button
              onClick={() => setScope('rental_condo')}
              className={`px-2.5 py-1 rounded-lg border font-semibold ${
                scope === 'rental_condo'
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
              }`}
            >
              🏢 New Rental (Condo) Only
            </button>
            <button
              onClick={() => setScope('moms_hq')}
              className={`px-2.5 py-1 rounded-lg border font-semibold ${
                scope === 'moms_hq'
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-indigo-50 text-indigo-800 border-indigo-200'
              }`}
            >
              🏡 Mom's House (HQ) Only
            </button>
          </div>
        )}
      </div>

      {/* Printable Sheet */}
      <div className="max-w-3xl mx-auto bg-white p-6 rounded-2xl shadow-2xl space-y-6 print:p-0 print:shadow-none print:rounded-none">
        <div className="border-b-2 border-slate-900 pb-3 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">
              MOVETRACK SG — BOX LABELS{' '}
              {scope === 'rental_condo'
                ? '(NEW RENTAL HOUSE / CONDO)'
                : scope === 'moms_hq'
                ? "(MOM'S HOUSE / HQ)"
                : '(ALL DESTINATIONS)'}
            </h1>
            <p className="text-xs text-slate-600 font-medium">
              {householdName} • Showing {filteredBoxes.length} Box(es)
            </p>
          </div>
          <div className="text-right text-xs text-slate-500">
            Scan QR code with phone camera to view contents
          </div>
        </div>

        {/* Labels Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-2 print:gap-4">
          {filteredBoxes.map((box) => {
            const boxItems = items.filter((i) => i.box_id === box.id);
            const hasFragile = box.is_fragile || boxItems.some((i) => i.is_fragile);
            const totalWeight = boxItems.reduce(
              (acc, i) => acc + (Number(i.weight_kg) || 0),
              0
            );
            const targetHouse = getBoxDestinationHouse(box, boxItems);
            const isMomsHouse = targetHouse === 'moms_hq';

            return (
              <div
                key={box.id}
                className={`border-4 rounded-2xl overflow-hidden flex flex-col justify-between print:break-inside-avoid ${
                  hasFragile
                    ? 'border-red-600 bg-red-50/10'
                    : isMomsHouse
                    ? 'border-indigo-700 bg-white'
                    : 'border-emerald-700 bg-white'
                }`}
              >
                {/* High-Visibility Drop-Off House Banner for Movers */}
                <div
                  className={`px-4 py-2 text-white font-black text-xs uppercase tracking-wider flex items-center justify-between ${
                    isMomsHouse ? 'bg-indigo-700' : 'bg-emerald-700'
                  }`}
                >
                  <span>
                    {isMomsHouse
                      ? "🏡 DROP-OFF 2: MOM'S HOUSE (HQ)"
                      : '🏢 DROP-OFF 1: NEW RENTAL HOUSE (CONDO)'}
                  </span>
                  <span className="text-[10px] font-mono opacity-90">
                    BOX #{box.box_number}
                  </span>
                </div>

                <div className="p-4 flex flex-col justify-between space-y-3 flex-1">
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
                          drop_off_house: isMomsHouse
                            ? "Mom's House (HQ)"
                            : 'New Rental House (Condo)',
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
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
