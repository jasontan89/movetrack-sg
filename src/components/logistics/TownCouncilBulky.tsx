import React from 'react';
import { useItems } from '../../context/ItemContext';
import { JURONG_CLEMENTI_BULKY_RULES } from '../../utils/singaporeHelpers';
import { Trash2, ExternalLink, Phone, AlertCircle } from 'lucide-react';

export const TownCouncilBulky: React.FC = () => {
  const { items } = useItems();
  const bulkyItems = items.filter((i) => i.decision_status === 'hdb_bulky_disposal');
  const quotaUsed = bulkyItems.length;
  const maxQuota = JURONG_CLEMENTI_BULKY_RULES.freeQuotaPerMonth;
  const isOverQuota = quotaUsed > maxQuota;

  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm space-y-4 text-xs">
      <div className="flex items-start justify-between">
        <div>
          <span className="text-[10px] uppercase font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
            HDB Bukit Batok Service
          </span>
          <h3 className="font-bold text-slate-900 text-sm mt-1">
            Jurong-Clementi Town Council Bulky Removal
          </h3>
          <p className="text-slate-500 text-[11px]">
            Every HDB flat gets <strong className="text-slate-800">3 FREE bulky items</strong> per calendar month
          </p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
          <Trash2 size={20} />
        </div>
      </div>

      {/* Quota Progress Meter */}
      <div className="bg-sky-50/60 rounded-2xl p-3 border border-sky-100 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-sky-950">This Month's Bulky Quota:</span>
          <span
            className={`font-black text-sm ${
              isOverQuota ? 'text-red-600' : 'text-sky-800'
            }`}
          >
            {quotaUsed} / {maxQuota} Free Slots
          </span>
        </div>

        <div className="w-full h-2.5 bg-sky-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              isOverQuota ? 'bg-red-500' : 'bg-sky-600'
            }`}
            style={{ width: `${Math.min(100, (quotaUsed / maxQuota) * 100)}%` }}
          />
        </div>

        {isOverQuota && (
          <div className="text-[11px] text-red-700 flex items-center gap-1 font-medium mt-1">
            <AlertCircle size={12} />
            <span>
              You have {quotaUsed - maxQuota} item(s) exceeding the 3-item free quota. Schedule them across 2 calendar months or pay a small excess fee!
            </span>
          </div>
        )}
      </div>

      {/* Items Marked for Bulky Disposal */}
      <div className="space-y-1.5">
        <span className="font-bold text-slate-700 block">
          Items Marked for Town Council Disposal ({bulkyItems.length})
        </span>
        {bulkyItems.length > 0 ? (
          <div className="space-y-1.5">
            {bulkyItems.map((item, idx) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-5 h-5 rounded-full bg-sky-200 text-sky-800 text-[10px] font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <span className="font-medium text-slate-800 truncate">{item.name}</span>
                </div>
                <span className="text-[10px] text-slate-400 shrink-0">
                  ~{item.weight_kg || 0} kg
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-400 italic text-[11px]">
            No items marked for bulky disposal yet. Mark old sofas, broken wardrobes, or worn mattresses.
          </p>
        )}
      </div>

      {/* Booking Portal Link & Hotline */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
        <a
          href={JURONG_CLEMENTI_BULKY_RULES.bookingUrl}
          target="_blank"
          rel="noreferrer"
          className="flex-1 py-2 px-3 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95 text-center"
        >
          <ExternalLink size={13} />
          <span>Book JCTC Bulky Online</span>
        </a>

        <a
          href={`tel:${JURONG_CLEMENTI_BULKY_RULES.hotline.split('/')[0].trim()}`}
          className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl flex items-center gap-1.5 transition"
          title="Call Town Council Hotline"
        >
          <Phone size={13} />
          <span>Hotline: 1800-566-0412</span>
        </a>
      </div>
    </div>
  );
};
