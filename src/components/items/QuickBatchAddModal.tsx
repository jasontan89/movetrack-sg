import React, { useState } from 'react';
import { useItems } from '../../context/ItemContext';
import { useHousehold } from '../../context/HouseholdContext';
import { Category, DecisionStatus, Owner, Room } from '../../types';
import { calculateCbm } from '../../utils/cbmCalculator';
import { X, Zap, CheckCircle2, Loader2, Sparkles } from 'lucide-react';

interface QuickBatchAddModalProps {
  onClose: () => void;
}

function inferSpecsFromName(
  rawLine: string,
  fallbackRoom: Room
): {
  name: string;
  category: Category;
  room: Room;
  dimensions_cm: { length: number; width: number; height: number };
  weight_kg: number;
  is_fragile: boolean;
  disassembly_required: boolean;
  notes: string;
} {
  // Strip leading bullet/numbering like "1) ", "i. ", "- ", "• "
  let cleaned = rawLine
    .trim()
    .replace(/^(?:\d+[).:-]|\([a-z0-9]+\)|[ivx]+\.|[-*•])\s+/i, '')
    .trim();

  const isQuestionOrTbc = cleaned.endsWith('?') || /\bTBC\b/i.test(cleaned);
  if (cleaned.endsWith('?')) {
    cleaned = `${cleaned.slice(0, -1).trim()} (TBC)`;
  }

  const lower = cleaned.toLowerCase();

  let category: Category = 'other';
  let room: Room = fallbackRoom;
  let dimensions_cm = { length: 45, width: 35, height: 35 };
  let weight_kg = 5;
  let is_fragile = false;
  let disassembly_required = false;

  if (/tv|television|oled|monitor|screen|soundbar|speaker|keyboard|doorbell|ps5|router|amplifier/.test(lower)) {
    category = /monitor|printer|pc|laptop|computer/.test(lower) ? 'computer_office' : 'electronics_av';
    is_fragile = true;
    if (/tv|television|oled/.test(lower)) {
      dimensions_cm = { length: 122, width: 24, height: 76 };
      weight_kg = 18;
      disassembly_required = true;
      room = 'living_room';
    } else if (/monitor/.test(lower)) {
      dimensions_cm = { length: 62, width: 20, height: 45 };
      weight_kg = 5.5;
      room = 'bedroom_2_study';
    } else if (/soundbar/.test(lower)) {
      dimensions_cm = { length: 75, width: 12, height: 8 };
      weight_kg = 3.5;
      room = 'living_room';
    } else {
      dimensions_cm = { length: 45, width: 35, height: 25 };
      weight_kg = 4.5;
    }
  } else if (
    /fridge|refrigerator|washing machine|washer|dryer|dishwasher|microwave|cooker|air\s*fryer|toaster|vacuum|roborock|thermo|kettle|fan|aircon|purifier/.test(
      lower
    )
  ) {
    category = 'appliances';
    if (/fridge|refrigerator/.test(lower)) {
      dimensions_cm = { length: 70, width: 75, height: 178 };
      weight_kg = 80;
      is_fragile = true;
      room = 'kitchen';
    } else if (/washing machine|washer|dryer/.test(lower)) {
      dimensions_cm = { length: 60, width: 65, height: 85 };
      weight_kg = 68;
      disassembly_required = true;
      room = 'service_yard';
    } else if (/dishwasher/.test(lower)) {
      dimensions_cm = { length: 55, width: 50, height: 60 };
      weight_kg = 24;
      is_fragile = true;
      disassembly_required = true;
      room = 'kitchen';
    } else if (/microwave/.test(lower)) {
      dimensions_cm = { length: 49, width: 38, height: 29 };
      weight_kg = 13.5;
      is_fragile = true;
      room = 'kitchen';
    } else {
      dimensions_cm = { length: 34, width: 30, height: 32 };
      weight_kg = 4.5;
      room = 'kitchen';
    }
  } else if (
    /sofa|chair|table|desk|bed|mattress|console|bookshelf|bookshelves|shelf|rack|shoerack|cabinet|wardrobe|stool/.test(
      lower
    )
  ) {
    category = 'furniture';
    if (/king.*bed|platform bed/.test(lower)) {
      dimensions_cm = { length: 200, width: 185, height: 60 };
      weight_kg = 60;
      disassembly_required = !/mattress/.test(lower);
      room = 'master_bedroom';
    } else if (/mattress/.test(lower)) {
      dimensions_cm = { length: 190, width: 107, height: 25 };
      weight_kg = 26;
      room = 'bedroom_3';
    } else if (/sofa/.test(lower)) {
      dimensions_cm = { length: 200, width: 92, height: 85 };
      weight_kg = 52;
      disassembly_required = true;
      room = 'living_room';
    } else if (/dining|dinning/.test(lower)) {
      dimensions_cm = { length: 150, width: 90, height: 75 };
      weight_kg = 55;
      disassembly_required = true;
      room = 'living_room';
    } else if (/chair/.test(lower)) {
      dimensions_cm = { length: 68, width: 68, height: 115 };
      weight_kg = 18;
      room = 'bedroom_2_study';
    } else if (/bookshelf|bookshelves|table|desk/.test(lower)) {
      dimensions_cm = { length: 120, width: 60, height: 120 };
      weight_kg = 35;
      disassembly_required = true;
      room = 'bedroom_2_study';
    } else if (/console/.test(lower)) {
      dimensions_cm = { length: 180, width: 42, height: 50 };
      weight_kg = 38;
      room = 'living_room';
    } else {
      dimensions_cm = { length: 80, width: 35, height: 90 };
      weight_kg = 15;
    }
  } else if (/glassware|dish|plate|bowl|cup|mug|spice|pot|pan|cutlery/.test(lower)) {
    category = 'kitchenware';
    room = 'kitchen';
    is_fragile = /glass|dish|plate|bowl|ceramic/.test(lower);
    dimensions_cm = { length: 45, width: 35, height: 35 };
    weight_kg = 8;
  } else if (/weight|barbell|dumbbell|bike|bicycle|gym|treadmill/.test(lower)) {
    category = 'other';
    dimensions_cm = { length: 95, width: 55, height: 75 };
    weight_kg = 28;
  }

  const notes = isQuestionOrTbc
    ? '[TBC] Added via Quick Batch Add — confirm final move decision.'
    : 'Added via Quick Batch Add.';

  return {
    name: cleaned,
    category,
    room,
    dimensions_cm,
    weight_kg,
    is_fragile,
    disassembly_required,
    notes,
  };
}

export const QuickBatchAddModal: React.FC<QuickBatchAddModalProps> = ({ onClose }) => {
  const { addItem } = useItems();
  const { household } = useHousehold();

  const [targetDecision, setTargetDecision] = useState<DecisionStatus>('keep_pack');
  const [defaultRoom, setDefaultRoom] = useState<Room>('living_room');
  const [owner, setOwner] = useState<Owner>('shared');
  const [rawText, setRawText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addedCount, setAddedCount] = useState<number | null>(null);

  const parsedLines = rawText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const handleBatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedLines.length === 0) return;

    setIsSubmitting(true);
    try {
      for (const line of parsedLines) {
        const inferred = inferSpecsFromName(line, defaultRoom);
        const cbm = calculateCbm(inferred.dimensions_cm);
        await addItem({
          household_id: household?.id || 'household-bukit-batok-4rm',
          name: inferred.name,
          owner,
          room: inferred.room,
          category: inferred.category,
          dimensions_cm: inferred.dimensions_cm,
          weight_kg: inferred.weight_kg,
          cbm,
          is_fragile: inferred.is_fragile,
          disassembly_required: inferred.disassembly_required,
          has_original_box: false,
          has_cables_accessories: true,
          decision_status: targetDecision,
          box_id: null,
          notes: inferred.notes,
        });
      }
      setAddedCount(parsedLines.length);
      setTimeout(() => {
        onClose();
      }, 900);
    } catch (err) {
      console.error('Batch add failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-sm">
              <Zap size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Quick Batch Add Equipment & Furniture
              </h2>
              <p className="text-xs text-slate-500">
                Paste or type multiple items (one per line) to add to Condo, HQ, or Discuss list
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleBatchSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Destination List Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 block">
              1. Assign Batch to Destination List
            </label>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setTargetDecision('keep_pack')}
                className={`p-2.5 rounded-xl border text-left transition ${
                  targetDecision === 'keep_pack'
                    ? 'bg-emerald-600 text-white border-emerald-600 font-bold shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="text-sm">🏢 Rental (Condo)</div>
                <div
                  className={`text-[10px] ${
                    targetDecision === 'keep_pack' ? 'text-emerald-100' : 'text-slate-400'
                  }`}
                >
                  New Rental House
                </div>
              </button>

              <button
                type="button"
                onClick={() => setTargetDecision('move_hq')}
                className={`p-2.5 rounded-xl border text-left transition ${
                  targetDecision === 'move_hq'
                    ? 'bg-indigo-600 text-white border-indigo-600 font-bold shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="text-sm">🏡 Mom's (HQ)</div>
                <div
                  className={`text-[10px] ${
                    targetDecision === 'move_hq' ? 'text-indigo-100' : 'text-slate-400'
                  }`}
                >
                  Mom's House / HQ
                </div>
              </button>

              <button
                type="button"
                onClick={() => setTargetDecision('undecided_discuss')}
                className={`p-2.5 rounded-xl border text-left transition ${
                  targetDecision === 'undecided_discuss'
                    ? 'bg-yellow-500 text-white border-yellow-500 font-bold shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="text-sm">🤔 To Discuss</div>
                <div
                  className={`text-[10px] ${
                    targetDecision === 'undecided_discuss' ? 'text-yellow-100' : 'text-slate-400'
                  }`}
                >
                  Decide later
                </div>
              </button>
            </div>
          </div>

          {/* Default Room & Owner */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Default Room (if not auto-detected)
              </label>
              <select
                value={defaultRoom}
                onChange={(e) => setDefaultRoom(e.target.value as Room)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
              >
                <option value="living_room">Living Room</option>
                <option value="master_bedroom">Master Bedroom</option>
                <option value="bedroom_2_study">Study / Bed 2</option>
                <option value="bedroom_3">Bedroom 3</option>
                <option value="kitchen">Kitchen</option>
                <option value="bomb_shelter_store">Bomb Shelter / Store</option>
                <option value="service_yard">Service Yard</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Owner
              </label>
              <select
                value={owner}
                onChange={(e) => setOwner(e.target.value as Owner)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
              >
                <option value="shared">Shared Household</option>
                <option value="jason">Jason</option>
                <option value="wife">Wife</option>
              </select>
            </div>
          </div>

          {/* Multi-line Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 block">
                2. Enter Items (One per line)
              </label>
              <span className="text-[11px] font-semibold text-teal-700 flex items-center gap-1">
                <Sparkles size={11} />
                Auto-detects CBM & TBC (?)
              </span>
            </div>
            <textarea
              rows={6}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder={`Example:\nDyson Vacuum Cleaner\n Standing Fan?\nGuest Room Curtain Rods\nNespresso Coffee Machine`}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 leading-relaxed"
            />
            <p className="text-[11px] text-slate-500">
              Tip: Add a <code className="bg-slate-100 px-1 rounded">?</code> or{' '}
              <code className="bg-slate-100 px-1 rounded">(TBC)</code> to any line to automatically mark it with an amber <strong>TBC</strong> badge.
            </p>
          </div>

          {addedCount !== null && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-bold flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600" />
              <span>Added {addedCount} item(s) to your inventory!</span>
            </div>
          )}

          {/* Actions */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || parsedLines.length === 0}
              className="flex-1 py-2.5 px-4 rounded-xl bg-teal-600 text-white text-xs font-bold hover:bg-teal-700 transition shadow-md disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {isSubmitting ? <Loader2 size={15} className="animate-spin" /> : <Zap size={15} />}
              <span>
                Add {parsedLines.length > 0 ? `${parsedLines.length} Item(s)` : 'Items'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
