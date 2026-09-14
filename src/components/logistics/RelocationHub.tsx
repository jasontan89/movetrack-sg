import React, { useState } from 'react';
import { MoverSummary } from './MoverSummary';
import { TownCouncilBulky } from './TownCouncilBulky';
import { CarousellTracker } from './CarousellTracker';
import { EwasteGuide } from './EwasteGuide';
import { Truck, Trash2, DollarSign, Recycle } from 'lucide-react';

export const RelocationHub: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'mover' | 'bulky' | 'carousell' | 'ewaste'>('mover');

  return (
    <div className="space-y-4 pb-24">
      {/* Sub-tab Pills */}
      <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 text-xs overflow-x-auto no-scrollbar font-medium">
        <button
          onClick={() => setActiveSubTab('mover')}
          className={`flex-1 py-1.5 px-2 rounded-lg transition text-center whitespace-nowrap flex items-center justify-center gap-1 ${
            activeSubTab === 'mover'
              ? 'bg-white text-slate-900 shadow-sm font-bold'
              : 'text-slate-600'
          }`}
        >
          <Truck size={14} className="text-teal-600" />
          <span>Mover Sizing</span>
        </button>

        <button
          onClick={() => setActiveSubTab('bulky')}
          className={`flex-1 py-1.5 px-2 rounded-lg transition text-center whitespace-nowrap flex items-center justify-center gap-1 ${
            activeSubTab === 'bulky'
              ? 'bg-white text-slate-900 shadow-sm font-bold'
              : 'text-slate-600'
          }`}
        >
          <Trash2 size={14} className="text-sky-600" />
          <span>Town Council Bulky</span>
        </button>

        <button
          onClick={() => setActiveSubTab('carousell')}
          className={`flex-1 py-1.5 px-2 rounded-lg transition text-center whitespace-nowrap flex items-center justify-center gap-1 ${
            activeSubTab === 'carousell'
              ? 'bg-white text-slate-900 shadow-sm font-bold'
              : 'text-slate-600'
          }`}
        >
          <DollarSign size={14} className="text-orange-600" />
          <span>Carousell Sales</span>
        </button>

        <button
          onClick={() => setActiveSubTab('ewaste')}
          className={`flex-1 py-1.5 px-2 rounded-lg transition text-center whitespace-nowrap flex items-center justify-center gap-1 ${
            activeSubTab === 'ewaste'
              ? 'bg-white text-slate-900 shadow-sm font-bold'
              : 'text-slate-600'
          }`}
        >
          <Recycle size={14} className="text-amber-600" />
          <span>ALBA E-Waste</span>
        </button>
      </div>

      {/* Render Active View */}
      {activeSubTab === 'mover' && <MoverSummary />}
      {activeSubTab === 'bulky' && <TownCouncilBulky />}
      {activeSubTab === 'carousell' && <CarousellTracker />}
      {activeSubTab === 'ewaste' && <EwasteGuide />}
    </div>
  );
};
