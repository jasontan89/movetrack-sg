import React from 'react';
import { useItems } from '../../context/ItemContext';
import { BUKIT_BATOK_EWASTE_BINS } from '../../utils/singaporeHelpers';
import { Recycle, MapPin, Clock, ExternalLink } from 'lucide-react';

export const EwasteGuide: React.FC = () => {
  const { items } = useItems();
  const ewasteItems = items.filter((i) => i.decision_status === 'alba_ewaste');

  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm space-y-4 text-xs">
      <div className="flex items-start justify-between">
        <div>
          <span className="text-[10px] uppercase font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
            NEA Regulated E-Waste
          </span>
          <h3 className="font-bold text-slate-900 text-sm mt-1">
            ALBA E-Waste Drop-Off Points (Bukit Batok)
          </h3>
          <p className="text-slate-500 text-[11px]">
            Free drop-off for printers, faulty PCs, cables, monitors, and dead electronics
          </p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
          <Recycle size={22} />
        </div>
      </div>

      {/* Items marked for e-waste */}
      {ewasteItems.length > 0 && (
        <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200/70 space-y-1.5">
          <span className="font-bold text-amber-950 block">
            Items Marked for E-Waste ({ewasteItems.length}):
          </span>
          <ul className="list-disc list-inside space-y-1 text-slate-700">
            {ewasteItems.map((item) => (
              <li key={item.id} className="font-medium">
                {item.name} (~{item.weight_kg || 0} kg)
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* List of nearby bins in Bukit Batok */}
      <div className="space-y-2">
        <span className="font-bold text-slate-700 block">Nearest ALBA Bin Locations</span>
        {BUKIT_BATOK_EWASTE_BINS.map((bin, idx) => (
          <div
            key={idx}
            className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1"
          >
            <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
              <MapPin size={13} className="text-amber-600 shrink-0" />
              <span>{bin.name}</span>
            </div>
            <div className="text-[11px] text-slate-600 pl-4">
              {bin.address} (Singapore {bin.postalCode})
            </div>
            <div className="text-[10px] text-slate-400 pl-4 flex items-center gap-1">
              <Clock size={10} />
              <span>{bin.operatingHours}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-2 border-t border-slate-100">
        <a
          href="https://alba-wh.sg/where-to-recycle/"
          target="_blank"
          rel="noreferrer"
          className="w-full py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95 text-center"
        >
          <ExternalLink size={13} />
          <span>View ALBA E-Waste Map</span>
        </a>
      </div>
    </div>
  );
};
