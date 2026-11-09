import React, { useState } from 'react';
import { useItems } from '../../context/ItemContext';
import { useHousehold } from '../../context/HouseholdContext';
import { getBoxDestinationHouse, MoveDestinationScope } from '../../types';
import { calculateTotalLogistics, getLorryRecommendation } from '../../utils/cbmCalculator';
import { exportPackingListPdf, exportInventoryCsv } from '../../utils/exportPdf';
import {
  Truck,
  FileDown,
  Table,
  AlertTriangle,
  Wrench,
  Package,
} from 'lucide-react';

export const MoverSummary: React.FC = () => {
  const { items, boxes } = useItems();
  const { household } = useHousehold();
  const [scope, setScope] = useState<MoveDestinationScope>('all');

  const logistics = calculateTotalLogistics(items, boxes);

  const activeCbm =
    scope === 'rental_condo'
      ? logistics.condoCbm
      : scope === 'moms_hq'
      ? logistics.hqCbm
      : logistics.totalCbm;
  const activeWeight =
    scope === 'rental_condo'
      ? logistics.condoWeightKg
      : scope === 'moms_hq'
      ? logistics.hqWeightKg
      : logistics.totalWeightKg;
  const activeCount =
    scope === 'rental_condo'
      ? logistics.condoCount
      : scope === 'moms_hq'
      ? logistics.hqCount
      : logistics.movingCount;
  const activeBoxesCount =
    scope === 'all'
      ? boxes.length
      : boxes.filter(
          (b) =>
            getBoxDestinationHouse(
              b,
              items.filter((i) => i.box_id === b.id)
            ) === scope
        ).length;

  const lorry = getLorryRecommendation(activeCbm);

  const handleExportPdf = (targetScope: MoveDestinationScope = scope) => {
    exportPackingListPdf(items, boxes, household?.name, targetScope);
  };

  const handleExportCsv = (targetScope: MoveDestinationScope = scope) => {
    exportInventoryCsv(items, boxes, targetScope);
  };

  return (
    <div className="space-y-4">
      {/* 0. Destination Scope Selector */}
      <div className="bg-white rounded-2xl p-2 border border-slate-200/90 shadow-sm flex items-center gap-1.5 text-xs">
        <button
          onClick={() => setScope('all')}
          className={`flex-1 py-2 px-2 rounded-xl font-bold transition text-center ${
            scope === 'all'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          🚚 Both Houses (2-Stop)
        </button>
        <button
          onClick={() => setScope('rental_condo')}
          className={`flex-1 py-2 px-2 rounded-xl font-bold transition text-center ${
            scope === 'rental_condo'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-emerald-800 bg-emerald-50/50 hover:bg-emerald-50'
          }`}
        >
          🏢 Rental (Condo)
        </button>
        <button
          onClick={() => setScope('moms_hq')}
          className={`flex-1 py-2 px-2 rounded-xl font-bold transition text-center ${
            scope === 'moms_hq'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-indigo-800 bg-indigo-50/50 hover:bg-indigo-50'
          }`}
        >
          🏡 Mom's House (HQ)
        </button>
      </div>

      {/* 1. Mover Volume & Lorry Sizing Card */}
      <div
        className={`text-white rounded-3xl p-5 shadow-xl space-y-4 ${
          scope === 'rental_condo'
            ? 'bg-gradient-to-br from-emerald-900 to-slate-900'
            : scope === 'moms_hq'
            ? 'bg-gradient-to-br from-indigo-900 to-slate-900'
            : 'bg-gradient-to-br from-slate-900 to-teal-950'
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-teal-300">
              {scope === 'rental_condo'
                ? 'Drop-Off 1: New Rental House (Condo)'
                : scope === 'moms_hq'
                ? "Drop-Off 2: Mom's House (HQ)"
                : 'Combined 2-Stop Mover Quote Sizing'}
            </span>
            <h2 className="text-xl font-black mt-0.5">
              Recommended: {lorry.lorryType} Lorry
            </h2>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-300">
            <Truck size={26} />
          </div>
        </div>

        {/* Progress / Capacity Metric */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300">
              {scope === 'rental_condo'
                ? 'Rental Condo Volume:'
                : scope === 'moms_hq'
                ? "Mom's House Volume:"
                : 'Combined Move Volume:'}
            </span>
            <span className="font-bold text-teal-300 text-sm">
              {activeCbm} CBM (m³)
            </span>
          </div>
          <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
            <div
              className="h-full rounded-full bg-gradient-to-r from-teal-400 to-emerald-400 transition-all duration-500"
              style={{
                width: `${Math.min(100, Math.max(10, (activeCbm / 20) * 100))}%`,
              }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400">
            <span>0 CBM</span>
            <span>10ft (8.5 CBM)</span>
            <span>14ft (18 CBM)</span>
            <span>24ft (34 CBM)</span>
          </div>
        </div>

        {/* Description */}
        <div className="bg-white/10 rounded-2xl p-3 backdrop-blur-sm text-xs space-y-1">
          <div className="font-semibold text-teal-200">{lorry.suitableFor}</div>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            {lorry.description}
          </p>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-3 gap-2 text-center pt-1 border-t border-white/15">
          <div>
            <div className="text-[10px] text-slate-300">Moving Items</div>
            <div className="text-base font-bold text-white">{activeCount}</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-300">Gross Weight</div>
            <div className="text-base font-bold text-white">~{activeWeight} kg</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-300">Boxes Packed</div>
            <div className="text-base font-bold text-teal-300">{activeBoxesCount}</div>
          </div>
        </div>

        {/* Export Buttons for Active Scope */}
        <div className="flex items-center gap-2 pt-2">
          <button
            onClick={() => handleExportPdf(scope)}
            className="flex-1 py-2.5 px-3 bg-teal-400 hover:bg-teal-300 text-slate-950 rounded-xl font-bold text-xs transition active:scale-95 shadow-md flex items-center justify-center gap-1.5"
          >
            <FileDown size={15} />
            <span>
              {scope === 'rental_condo'
                ? 'Export Rental PDF'
                : scope === 'moms_hq'
                ? "Export Mom's PDF"
                : 'Export Combined PDF'}
            </span>
          </button>
          <button
            onClick={() => handleExportCsv(scope)}
            className="flex-1 py-2.5 px-3 bg-white/15 hover:bg-white/25 text-white rounded-xl font-semibold text-xs border border-white/20 transition active:scale-95 flex items-center justify-center gap-1.5"
          >
            <Table size={15} />
            <span>
              {scope === 'rental_condo'
                ? 'Export Rental CSV'
                : scope === 'moms_hq'
                ? "Export Mom's CSV"
                : 'Export All CSV'}
            </span>
          </button>
        </div>
      </div>

      {/* 1b. Rental House (Condo) vs Mom's House (HQ) Split Breakdown Card */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm space-y-3 text-xs">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
            Drop-Off Segregation Breakdown
          </h3>
          <span className="text-[10px] font-semibold text-slate-500">
            1-Tap Separate Manifests
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {/* Drop-Off 1: New Rental House (Condo) */}
          <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 flex flex-col justify-between space-y-2">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-950">🏢 New Rental (Condo)</span>
                <span className="text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                  {logistics.condoCount} items
                </span>
              </div>
              <div className="text-[11px] text-emerald-800 flex items-center justify-between pt-1">
                <span>
                  Vol: <strong>{logistics.condoCbm} m³</strong>
                </span>
                <span>
                  Wt: <strong>~{logistics.condoWeightKg} kg</strong>
                </span>
              </div>
              <div className="text-[10px] text-emerald-700">
                Lorry: <strong>{getLorryRecommendation(logistics.condoCbm).lorryType}</strong>
              </div>
            </div>

            <div className="flex items-center gap-1.5 pt-1 border-t border-emerald-200/80">
              <button
                onClick={() => handleExportPdf('rental_condo')}
                className="flex-1 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[10px] flex items-center justify-center gap-1 transition"
              >
                <FileDown size={12} />
                <span>Rental PDF</span>
              </button>
              <button
                onClick={() => handleExportCsv('rental_condo')}
                className="py-1.5 px-2 bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-lg font-bold text-[10px] transition"
              >
                CSV
              </button>
            </div>
          </div>

          {/* Drop-Off 2: Mom's House (HQ) */}
          <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-200 flex flex-col justify-between space-y-2">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-indigo-950">🏡 Mom's House (HQ)</span>
                <span className="text-[10px] font-bold bg-indigo-600 text-white px-2 py-0.5 rounded-full">
                  {logistics.hqCount} items
                </span>
              </div>
              <div className="text-[11px] text-indigo-800 flex items-center justify-between pt-1">
                <span>
                  Vol: <strong>{logistics.hqCbm} m³</strong>
                </span>
                <span>
                  Wt: <strong>~{logistics.hqWeightKg} kg</strong>
                </span>
              </div>
              <div className="text-[10px] text-indigo-700">
                Lorry: <strong>{getLorryRecommendation(logistics.hqCbm).lorryType}</strong>
              </div>
            </div>

            <div className="flex items-center gap-1.5 pt-1 border-t border-indigo-200/80">
              <button
                onClick={() => handleExportPdf('moms_hq')}
                className="flex-1 py-1.5 px-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-[10px] flex items-center justify-center gap-1 transition"
              >
                <FileDown size={12} />
                <span>Mom's PDF</span>
              </button>
              <button
                onClick={() => handleExportCsv('moms_hq')}
                className="py-1.5 px-2 bg-white hover:bg-indigo-100 text-indigo-900 border border-indigo-300 rounded-lg font-bold text-[10px] transition"
              >
                CSV
              </button>
            </div>
          </div>

          {/* Pending Discussion */}
          <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 flex flex-col justify-between space-y-2">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-950">🤔 To Discuss</span>
                <span className="text-[10px] font-bold bg-amber-500 text-white px-2 py-0.5 rounded-full">
                  {logistics.discussCount} items
                </span>
              </div>
              <div className="text-[11px] text-amber-800 flex items-center justify-between pt-1">
                <span>
                  Pending Vol: <strong>{logistics.discussCbm} m³</strong>
                </span>
              </div>
              <div className="text-[10px] text-amber-700">
                Not yet assigned to Rental or Mom's House
              </div>
            </div>
            <div className="text-[10px] text-amber-800 font-semibold pt-1 border-t border-amber-200/80">
              Triage in <strong>Decisions</strong> tab →
            </div>
          </div>
        </div>
      </div>

      {/* 2. Mover Readiness Checklist */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm space-y-3 text-xs">
        <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
          Equipment Moving Checklist
        </h3>

        <div className="space-y-2">
          <div className="flex items-center justify-between p-2.5 bg-red-50/70 border border-red-200 rounded-xl">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-red-600" />
              <div>
                <span className="font-bold text-red-950">Fragile Equipment & Screens</span>
                <p className="text-[11px] text-red-800">
                  Monitors, OLED TV, PC towers requiring bubble wrap or personal transit
                </p>
              </div>
            </div>
            <span className="text-sm font-black text-red-700">
              {logistics.fragileCount}
            </span>
          </div>

          <div className="flex items-center justify-between p-2.5 bg-amber-50/70 border border-amber-200 rounded-xl">
            <div className="flex items-center gap-2">
              <Wrench size={16} className="text-amber-600" />
              <div>
                <span className="font-bold text-amber-950">Requires Disassembly</span>
                <p className="text-[11px] text-amber-800">
                  Standing desk motors, TV mounts, bed frames needing Allen keys / drill
                </p>
              </div>
            </div>
            <span className="text-sm font-black text-amber-700">
              {logistics.disassemblyCount}
            </span>
          </div>

          <div className="flex items-center justify-between p-2.5 bg-teal-50/70 border border-teal-200 rounded-xl">
            <div className="flex items-center gap-2">
              <Package size={16} className="text-teal-600" />
              <div>
                <span className="font-bold text-teal-950">Original Boxes Available</span>
                <p className="text-[11px] text-teal-800">
                  PS5, monitors, electronics with protective factory styrofoam
                </p>
              </div>
            </div>
            <span className="text-sm font-black text-teal-700">
              {logistics.originalBoxCount}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
