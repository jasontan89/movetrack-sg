import React from 'react';
import { useItems } from '../../context/ItemContext';
import { DollarSign, ExternalLink, CheckCircle, Clock } from 'lucide-react';

export const CarousellTracker: React.FC = () => {
  const { items } = useItems();
  const carousellItems = items.filter((i) => i.decision_status === 'sell_carousell');

  const totalAsking = carousellItems.reduce(
    (acc, i) => acc + (Number(i.carousell_details?.asking_price) || 0),
    0
  );

  const totalSold = carousellItems.reduce(
    (acc, i) =>
      acc +
      (i.carousell_details?.status === 'sold'
        ? Number(i.carousell_details?.sold_price || i.carousell_details?.asking_price) || 0
        : 0),
    0
  );

  const activeCount = carousellItems.filter(
    (i) => i.carousell_details?.status === 'listed'
  ).length;
  const soldCount = carousellItems.filter((i) => i.carousell_details?.status === 'sold').length;
  const draftCount = carousellItems.filter(
    (i) => !i.carousell_details?.status || i.carousell_details?.status === 'draft'
  ).length;

  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm space-y-4 text-xs">
      <div className="flex items-start justify-between">
        <div>
          <span className="text-[10px] uppercase font-bold text-orange-700 bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
            Declutter Revenue
          </span>
          <h3 className="font-bold text-slate-900 text-sm mt-1">
            Carousell Sales & Moving Fund
          </h3>
          <p className="text-slate-500 text-[11px]">
            Offset moving lorry costs and new flat furniture with unwanted tech/gear
          </p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
          <DollarSign size={22} />
        </div>
      </div>

      {/* Revenue Metrics */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-orange-50/70 p-3 rounded-xl border border-orange-100">
          <span className="text-[10px] text-orange-800 font-semibold uppercase tracking-wider block">
            Target Asking Value
          </span>
          <div className="text-xl font-black text-orange-950 mt-0.5">
            ${totalAsking} <span className="text-xs font-normal">SGD</span>
          </div>
          <span className="text-[10px] text-orange-700">across {carousellItems.length} items</span>
        </div>

        <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-100">
          <span className="text-[10px] text-emerald-800 font-semibold uppercase tracking-wider block">
            Cash Realized (Sold)
          </span>
          <div className="text-xl font-black text-emerald-950 mt-0.5">
            ${totalSold} <span className="text-xs font-normal">SGD</span>
          </div>
          <span className="text-[10px] text-emerald-700">{soldCount} items sold</span>
        </div>
      </div>

      {/* Status Breakdown Pills */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
          <div className="text-xs font-bold text-slate-800">{activeCount}</div>
          <span className="text-[10px] text-slate-400">Active Listings</span>
        </div>
        <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
          <div className="text-xs font-bold text-slate-800">{draftCount}</div>
          <span className="text-[10px] text-slate-400">Drafts to Post</span>
        </div>
        <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
          <div className="text-xs font-bold text-emerald-700">{soldCount}</div>
          <span className="text-[10px] text-slate-400">Completed Sales</span>
        </div>
      </div>

      {/* Items Preview */}
      {carousellItems.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <span className="font-bold text-slate-700 block">Items for Sale</span>
          <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
            {carousellItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200"
              >
                <div className="truncate pr-2">
                  <span className="font-medium text-slate-800 truncate block">
                    {item.name}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Status: {item.carousell_details?.status || 'draft'}
                  </span>
                </div>
                <div className="font-bold text-orange-700 shrink-0">
                  ${item.carousell_details?.asking_price || 0}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Open Carousell Link */}
      <div className="pt-2 border-t border-slate-100">
        <a
          href="https://www.carousell.sg"
          target="_blank"
          rel="noreferrer"
          className="w-full py-2 px-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95 text-center"
        >
          <ExternalLink size={13} />
          <span>Open Carousell Singapore</span>
        </a>
      </div>
    </div>
  );
};
