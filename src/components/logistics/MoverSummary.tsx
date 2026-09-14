import React from 'react';
import { useItems } from '../../context/ItemContext';
import { useHousehold } from '../../context/HouseholdContext';
import { calculateTotalLogistics, getLorryRecommendation } from '../../utils/cbmCalculator';
import { exportPackingListPdf, exportInventoryCsv } from '../../utils/exportPdf';
import {
  Truck,
  FileDown,
  Table,
  AlertTriangle,
  Wrench,
  CheckCircle2,
  Package,
  Info,
} from 'lucide-react';

export const MoverSummary: React.FC = () => {
  const { items, boxes } = useItems();
  const { household } = useHousehold();

  const logistics = calculateTotalLogistics(items);
  const lorry = getLorryRecommendation(logistics.totalCbm);

  const handleExportPdf = () => {
    exportPackingListPdf(items, boxes, household?.name);
  };

  const handleExportCsv = () => {
    exportInventoryCsv(items, boxes);
  };

  return (
    <div className="space-y-4">
      {/* 1. Mover Volume & Lorry Sizing Card */}
      <div className="bg-gradient-to-br from-slate-900 to-teal-950 text-white rounded-3xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-teal-400">
              Singapore Mover Quote Sizing
            </span>
            <h2 className="text-xl font-black mt-0.5">
              Recommended: {lorry.lorryType} Lorry
            </h2>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400">
            <Truck size={26} />
          </div>
        </div>

        {/* Progress / Capacity Metric */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300">Total Move Volume:</span>
            <span className="font-bold text-teal-300 text-sm">
              {logistics.totalCbm} CBM (m³)
            </span>
          </div>
          <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
            <div
              className="h-full rounded-full bg-gradient-to-r from-teal-400 to-emerald-400 transition-all duration-500"
              style={{
                width: `${Math.min(100, Math.max(10, (logistics.totalCbm / 20) * 100))}%`,
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
        <div className="grid grid-cols-3 gap-2 text-center pt-1 border-t border-slate-800">
          <div>
            <div className="text-[10px] text-slate-400">Moving Items</div>
            <div className="text-base font-bold text-white">{logistics.movingCount}</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400">Total Gross Weight</div>
            <div className="text-base font-bold text-white">~{logistics.totalWeightKg} kg</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400">Boxes Packed</div>
            <div className="text-base font-bold text-teal-300">{boxes.length}</div>
          </div>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2 pt-2">
          <button
            onClick={handleExportPdf}
            className="flex-1 py-2.5 px-3 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-xl font-bold text-xs transition active:scale-95 shadow-md flex items-center justify-center gap-1.5"
          >
            <FileDown size={15} />
            <span>Export Mover PDF</span>
          </button>
          <button
            onClick={handleExportCsv}
            className="flex-1 py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-semibold text-xs border border-slate-700 transition active:scale-95 flex items-center justify-center gap-1.5"
          >
            <Table size={15} />
            <span>Export CSV</span>
          </button>
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
