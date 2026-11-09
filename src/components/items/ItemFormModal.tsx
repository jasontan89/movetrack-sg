import React, { useState, useRef } from 'react';
import { useItems } from '../../context/ItemContext';
import { useHousehold } from '../../context/HouseholdContext';
import { Category, DecisionStatus, isMovingDecision, Item, Owner, Room } from '../../types';
import { ITEM_PRESETS, ItemPreset } from '../../utils/presetItems';
import { compressPhoto } from '../../utils/imageCompressor';
import { calculateCbm } from '../../utils/cbmCalculator';
import { analyzeEquipmentPhoto } from '../../services/geminiService';
import {
  X,
  Camera,
  Upload,
  AlertTriangle,
  Wrench,
  Package,
  Cable,
  Sparkles,
  Loader2,
  Trash2,
  Plus,
  Check,
} from 'lucide-react';

interface ItemFormModalProps {
  initialItem?: Item | null;
  onClose: () => void;
  onSaved?: (item: Item) => void;
}

export const ItemFormModal: React.FC<ItemFormModalProps> = ({
  initialItem,
  onClose,
  onSaved,
}) => {
  const { boxes, addItem, updateItem, addBox } = useItems();
  const { currentUser, household } = useHousehold();

  // Form State
  const [name, setName] = useState(initialItem?.name || '');
  const [owner, setOwner] = useState<Owner>(
    initialItem?.owner || (currentUser.role === 'wife' ? 'wife' : currentUser.role === 'jason' ? 'jason' : 'shared')
  );
  const [room, setRoom] = useState<Room>(initialItem?.room || 'living_room');
  const [category, setCategory] = useState<Category>(initialItem?.category || 'electronics_av');
  const [decision, setDecision] = useState<DecisionStatus>(initialItem?.decision_status || 'keep_pack');
  const [photoUrl, setPhotoUrl] = useState<string>(initialItem?.photo_url || '');

  // Dimensions & Weight
  const [length, setLength] = useState<string>(
    initialItem?.dimensions_cm?.length ? String(initialItem.dimensions_cm.length) : ''
  );
  const [width, setWidth] = useState<string>(
    initialItem?.dimensions_cm?.width ? String(initialItem.dimensions_cm.width) : ''
  );
  const [height, setHeight] = useState<string>(
    initialItem?.dimensions_cm?.height ? String(initialItem.dimensions_cm.height) : ''
  );
  const [weight, setWeight] = useState<string>(
    initialItem?.weight_kg ? String(initialItem.weight_kg) : ''
  );

  // Flags
  const [isFragile, setIsFragile] = useState<boolean>(initialItem?.is_fragile ?? false);
  const [needsDisassembly, setNeedsDisassembly] = useState<boolean>(
    initialItem?.disassembly_required ?? false
  );
  const [hasOriginalBox, setHasOriginalBox] = useState<boolean>(
    initialItem?.has_original_box ?? false
  );
  const [hasCables, setHasCables] = useState<boolean>(
    initialItem?.has_cables_accessories ?? true
  );

  // Logistics & Carousell
  const [boxId, setBoxId] = useState<string>(initialItem?.box_id || '');
  const [carousellPrice, setCarousellPrice] = useState<string>(
    initialItem?.carousell_details?.asking_price ? String(initialItem.carousell_details.asking_price) : ''
  );
  const [carousellSoldPrice, setCarousellSoldPrice] = useState<string>(
    initialItem?.carousell_details?.sold_price ? String(initialItem.carousell_details.sold_price) : ''
  );
  const [carousellUrl, setCarousellUrl] = useState<string>(
    initialItem?.carousell_details?.listing_url || ''
  );
  const [carousellStatus, setCarousellStatus] = useState<'draft' | 'listed' | 'reserved' | 'sold'>(
    initialItem?.carousell_details?.status || 'draft'
  );
  const [notes, setNotes] = useState<string>(initialItem?.notes || '');

  // AI Auto-Fill State
  const [isAnalyzingAi, setIsAnalyzingAi] = useState(false);
  const [aiError, setAiError] = useState('');
  const [aiSuccessMessage, setAiSuccessMessage] = useState('');
  const [aiFields, setAiFields] = useState<Set<string>>(
    () => new Set(initialItem?.ai_generated_fields || [])
  );

  const markFieldAmended = (fieldKey: string) => {
    setAiFields((prev) => {
      if (!prev.has(fieldKey)) return prev;
      const next = new Set(prev);
      next.delete(fieldKey);
      return next;
    });
  };

  const renderAiBadge = (fieldKey: string) => {
    if (!aiFields.has(fieldKey)) return null;
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full border border-purple-200 animate-in fade-in">
        <Sparkles size={10} className="text-purple-600" />
        AI generated
      </span>
    );
  };

  // Image upload handling
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionInfo, setCompressionInfo] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Quick preset application
  const applyPreset = (preset: ItemPreset) => {
    setName(preset.name);
    setCategory(preset.category);
    setRoom(preset.room);
    setLength(String(preset.dimensions_cm.length));
    setWidth(String(preset.dimensions_cm.width));
    setHeight(String(preset.dimensions_cm.height));
    setWeight(String(preset.weight_kg));
    setIsFragile(preset.is_fragile);
    setNeedsDisassembly(preset.disassembly_required);
    setHasOriginalBox(preset.has_original_box);
    setHasCables(preset.has_cables_accessories);
    if (preset.default_price) {
      setCarousellPrice(String(preset.default_price));
    }
    // Presets are manually applied by user, so clear AI flags
    setAiFields(new Set());
  };

  const handleRunAi = async () => {
    if (!photoUrl) return;
    if (!navigator.onLine) {
      setAiError(
        'You are currently offline (Bomb Shelter mode). Connect to the internet to run Gemini AI analysis.'
      );
      return;
    }

    setIsAnalyzingAi(true);
    setAiError('');
    setAiSuccessMessage('');

    try {
      const result = await analyzeEquipmentPhoto(photoUrl);
      setName(result.name);
      setCategory(result.category);
      setRoom(result.room);
      setLength(String(result.dimensions_cm.length));
      setWidth(String(result.dimensions_cm.width));
      setHeight(String(result.dimensions_cm.height));
      setWeight(String(result.weight_kg));
      setIsFragile(result.is_fragile);
      setNeedsDisassembly(result.disassembly_required);
      setDecision(result.decision_status);
      if (result.carousell_asking_price) {
        setCarousellPrice(String(result.carousell_asking_price));
      }
      if (result.notes) {
        setNotes(result.notes);
      }

      setAiFields(new Set(result.extractedFields));
      setAiSuccessMessage(
        `✨ Auto-filled via ${result.modelUsed}! Look for the "AI generated" badges.`
      );
    } catch (err: any) {
      console.error('AI extraction error:', err);
      setAiError(err.message || 'Failed to auto-fill with Gemini. Please try again.');
    } finally {
      setIsAnalyzingAi(false);
    }
  };

  const handleImageSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressing(true);
    setCompressionInfo('Compressing photo...');

    try {
      const result = await compressPhoto(file);
      setPhotoUrl(result.dataUrl);
      setCompressionInfo(
        `Optimized: ${result.originalSizeKb} KB → ${result.compressedSizeKb} KB`
      );
    } catch (err) {
      console.error(err);
      setCompressionInfo('Failed to compress');
    } finally {
      setIsCompressing(false);
    }
  };

  // Live computed CBM
  const currentCbm = calculateCbm({
    length: Number(length) || 0,
    width: Number(width) || 0,
    height: Number(height) || 0,
  });

  const handleCreateQuickBox = async () => {
    const nextNum = Math.max(0, ...boxes.map((b) => b.box_number || 0)) + 1;
    const housePrefix = decision === 'move_hq' ? "Mom's House (HQ)" : 'Rental Condo';
    const destRoomName =
      room === 'living_room'
        ? `${housePrefix} — Living Room`
        : room === 'master_bedroom'
        ? `${housePrefix} — Master Bedroom`
        : room === 'kitchen'
        ? `${housePrefix} — Kitchen`
        : `${housePrefix} — General`;

    const createdBox = await addBox({
      household_id: household?.id || 'household-bukit-batok-4rm',
      box_number: nextNum,
      label: `${name ? name.slice(0, 15) : 'New'} Box (${decision === 'move_hq' ? "Mom's/HQ" : 'Rental'})`,
      room_destination: destRoomName,
      is_fragile: isFragile,
      qr_code_id: `MOVETRACK-BB-BOX-${String(nextNum).padStart(2, '0')}`,
    });
    setBoxId(createdBox.id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSaving(true);
    try {
      const itemPayload = {
        household_id: household?.id || 'household-bukit-batok-4rm',
        name: name.trim(),
        owner,
        room,
        category,
        photo_url: photoUrl,
        dimensions_cm: {
          length: Number(length) || 0,
          width: Number(width) || 0,
          height: Number(height) || 0,
        },
        weight_kg: Number(weight) || 0,
        cbm: currentCbm,
        is_fragile: isFragile,
        disassembly_required: needsDisassembly,
        has_original_box: hasOriginalBox,
        has_cables_accessories: hasCables,
        decision_status: decision,
        box_id: isMovingDecision(decision) ? (boxId || null) : null,
        carousell_details:
          decision === 'sell_carousell' || carousellPrice
            ? {
                asking_price: Number(carousellPrice) || 0,
                sold_price: carousellStatus === 'sold' && carousellSoldPrice ? Number(carousellSoldPrice) : undefined,
                listing_url: carousellUrl.trim(),
                status: carousellStatus,
              }
            : undefined,
        notes: notes.trim(),
        ai_generated_fields: Array.from(aiFields),
      };

      if (initialItem) {
        await updateItem({
          ...initialItem,
          ...itemPayload,
        });
        if (onSaved) onSaved({ ...initialItem, ...itemPayload });
      } else {
        const created = await addItem(itemPayload);
        if (onSaved) onSaved(created);
      }

      onClose();
    } catch (error) {
      console.error('Error saving item:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50/70">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {initialItem ? 'Edit Item & Specifications' : 'Add Item / Equipment'}
            </h2>
            <p className="text-xs text-slate-500">Bukit Batok 4-Room Relocation</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Quick Presets (Only when adding new item) */}
          {!initialItem && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1 text-xs font-semibold text-slate-700">
                <Sparkles size={13} className="text-teal-600" />
                <span>Quick Presets (1-Tap Auto-fill)</span>
              </div>
              <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
                {ITEM_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className="shrink-0 px-2.5 py-1 rounded-lg bg-teal-50 border border-teal-200 text-teal-800 hover:bg-teal-100 transition active:scale-95 text-[11px] font-medium"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Photo Capture & Upload */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 block">
              Item Photo (Camera / Gallery)
            </label>
            <div className="flex items-center gap-3">
              {photoUrl ? (
                <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-slate-200 shadow-sm shrink-0">
                  <img
                    src={photoUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setPhotoUrl('');
                      setCompressionInfo('');
                    }}
                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 shadow-md hover:bg-red-700"
                    title="Remove Photo"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ) : (
                <div className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 bg-slate-50 shrink-0">
                  <Camera size={24} />
                  <span className="text-[10px] mt-1">No Photo</span>
                </div>
              )}

              <div className="flex-1 space-y-2">
                <div className="flex gap-2">
                  {/* Camera Snap (Mobile) */}
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    disabled={isCompressing}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700 transition shadow-sm active:scale-95"
                  >
                    <Camera size={14} />
                    <span>Snap Camera</span>
                  </button>

                  {/* Upload from Gallery */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isCompressing}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold hover:bg-slate-200 transition active:scale-95"
                  >
                    <Upload size={14} />
                    <span>Gallery</span>
                  </button>
                </div>

                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleImageSelected}
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageSelected}
                />

                {isCompressing && (
                  <div className="flex items-center gap-1.5 text-xs text-teal-600 font-medium">
                    <Loader2 size={13} className="animate-spin" />
                    <span>Compressing photo...</span>
                  </div>
                )}
                {compressionInfo && !isCompressing && (
                  <p className="text-[11px] text-slate-500">{compressionInfo}</p>
                )}
              </div>
            </div>

            {/* Gemini Flash Lite Auto-Fill Action */}
            {photoUrl && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleRunAi}
                  disabled={isAnalyzingAi || isCompressing}
                  className={`w-full py-2.5 px-3.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all ${
                    isAnalyzingAi
                      ? 'bg-purple-100 text-purple-700 border border-purple-300 cursor-wait'
                      : 'bg-gradient-to-r from-purple-600 via-indigo-600 to-teal-600 text-white hover:brightness-110 active:scale-[0.98]'
                  }`}
                >
                  {isAnalyzingAi ? (
                    <>
                      <Loader2 size={16} className="animate-spin text-purple-700" />
                      <span>Analyzing Equipment with Gemini Flash Lite...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} className="text-amber-300 animate-pulse" />
                      <span>✨ Auto-fill with Gemini Flash Lite</span>
                    </>
                  )}
                </button>

                {aiSuccessMessage && (
                  <div className="mt-2 p-2.5 bg-purple-50 border border-purple-200 rounded-xl text-[11px] text-purple-900 font-medium flex items-center gap-2 animate-in fade-in">
                    <Check size={14} className="text-purple-600 shrink-0" />
                    <span>{aiSuccessMessage}</span>
                  </div>
                )}

                {aiError && (
                  <div className="mt-2 p-2.5 bg-red-50 border border-red-200 rounded-xl text-[11px] text-red-700 font-medium flex items-start gap-2 animate-in fade-in">
                    <AlertTriangle size={14} className="text-red-600 shrink-0 mt-0.5" />
                    <span>{aiError}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Name / Title */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 block">
                Item Name / Equipment Title *
              </label>
              {renderAiBadge('name')}
            </div>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                markFieldAmended('name');
              }}
              placeholder="e.g. LG 55 OLED TV, Dell 34 Monitor, Makita Drill..."
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-sm"
            />
          </div>

          {/* Owner Selector (Jason vs Wife vs Shared) */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 block">
              Belongs To (Owner Filter)
            </label>
            <div className="grid grid-cols-3 gap-2 text-xs font-medium">
              <button
                type="button"
                onClick={() => setOwner('jason')}
                className={`py-2 px-3 rounded-xl border text-center transition flex items-center justify-center gap-1.5 ${
                  owner === 'jason'
                    ? 'bg-emerald-600 text-white border-emerald-600 font-bold shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>Jason</span>
              </button>
              <button
                type="button"
                onClick={() => setOwner('wife')}
                className={`py-2 px-3 rounded-xl border text-center transition flex items-center justify-center gap-1.5 ${
                  owner === 'wife'
                    ? 'bg-rose-500 text-white border-rose-500 font-bold shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>Wife</span>
              </button>
              <button
                type="button"
                onClick={() => setOwner('shared')}
                className={`py-2 px-3 rounded-xl border text-center transition flex items-center justify-center gap-1.5 ${
                  owner === 'shared'
                    ? 'bg-teal-600 text-white border-teal-600 font-bold shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>Shared</span>
              </button>
            </div>
          </div>

          {/* Room and Category Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 block">
                  Current Room / Zone
                </label>
                {renderAiBadge('room')}
              </div>
              <select
                value={room}
                onChange={(e) => {
                  setRoom(e.target.value as Room);
                  markFieldAmended('room');
                }}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-sm"
              >
                <option value="living_room">Living Room</option>
                <option value="master_bedroom">Master Bedroom</option>
                <option value="bedroom_2_study">Bed 2 / Study (Tech)</option>
                <option value="bedroom_3">Bedroom 3</option>
                <option value="kitchen">Kitchen</option>
                <option value="bomb_shelter_store">Bomb Shelter / Store</option>
                <option value="service_yard">Service Yard</option>
                <option value="other">Other Area</option>
              </select>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 block">Category</label>
                {renderAiBadge('category')}
              </div>
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value as Category);
                  markFieldAmended('category');
                }}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-sm"
              >
                <option value="electronics_av">Electronics & AV</option>
                <option value="computer_office">Computer & Tech Gear</option>
                <option value="appliances">Home Appliances</option>
                <option value="furniture">Furniture</option>
                <option value="kitchenware">Kitchenware</option>
                <option value="tools_hardware">Tools & Hardware</option>
                <option value="personal_keepsakes">Personal & Keepsakes</option>
                <option value="clothing_bedding">Clothing & Bedding</option>
                <option value="books_documents">Books & Documents</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {/* Decision Status (Singapore Moving Lifecycle) */}
          <div className="space-y-1.5 bg-slate-50 p-3 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 block">
                Moving Decision Status
              </label>
              {renderAiBadge('decision_status')}
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setDecision('keep_pack');
                  markFieldAmended('decision_status');
                }}
                className={`p-2 rounded-xl border text-left flex items-center gap-2 transition ${
                  decision === 'keep_pack'
                    ? 'bg-emerald-600 text-white border-emerald-600 font-bold shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span className="text-base">🏢</span>
                <div>
                  <div className="font-semibold text-xs">Rental House (Condo)</div>
                  <div className={`text-[10px] ${decision === 'keep_pack' ? 'text-emerald-100' : 'text-slate-400'}`}>
                    Move to new Rental
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setDecision('move_hq');
                  markFieldAmended('decision_status');
                }}
                className={`p-2 rounded-xl border text-left flex items-center gap-2 transition ${
                  decision === 'move_hq'
                    ? 'bg-indigo-600 text-white border-indigo-600 font-bold shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span className="text-base">🏡</span>
                <div>
                  <div className="font-semibold text-xs">Mom's House (HQ)</div>
                  <div className={`text-[10px] ${decision === 'move_hq' ? 'text-indigo-100' : 'text-slate-400'}`}>
                    Move to Mom's / HQ
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setDecision('sell_carousell');
                  markFieldAmended('decision_status');
                }}
                className={`p-2 rounded-xl border text-left flex items-center gap-2 transition ${
                  decision === 'sell_carousell'
                    ? 'bg-orange-500 text-white border-orange-500 font-bold shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span className="text-base">🏷️</span>
                <div>
                  <div className="font-semibold text-xs">Sell (Carousell)</div>
                  <div className={`text-[10px] ${decision === 'sell_carousell' ? 'text-orange-100' : 'text-slate-400'}`}>
                    Offset moving fees
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setDecision('donate_bless');
                  markFieldAmended('decision_status');
                }}
                className={`p-2 rounded-xl border text-left flex items-center gap-2 transition ${
                  decision === 'donate_bless'
                    ? 'bg-purple-600 text-white border-purple-600 font-bold shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span className="text-base">🎁</span>
                <div>
                  <div className="font-semibold text-xs">Donate / Bless</div>
                  <div className={`text-[10px] ${decision === 'donate_bless' ? 'text-purple-100' : 'text-slate-400'}`}>
                    Pass-it-on / Olio
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setDecision('hdb_bulky_disposal');
                  markFieldAmended('decision_status');
                }}
                className={`p-2 rounded-xl border text-left flex items-center gap-2 transition ${
                  decision === 'hdb_bulky_disposal'
                    ? 'bg-sky-600 text-white border-sky-600 font-bold shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span className="text-base">🚛</span>
                <div>
                  <div className="font-semibold text-xs">TC Bulky Disposal</div>
                  <div className={`text-[10px] ${decision === 'hdb_bulky_disposal' ? 'text-sky-100' : 'text-slate-400'}`}>
                    Free 3 items/mo
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setDecision('alba_ewaste');
                  markFieldAmended('decision_status');
                }}
                className={`p-2 rounded-xl border text-left flex items-center gap-2 transition ${
                  decision === 'alba_ewaste'
                    ? 'bg-amber-600 text-white border-amber-600 font-bold shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span className="text-base">🔋</span>
                <div>
                  <div className="font-semibold text-xs">ALBA E-Waste</div>
                  <div className={`text-[10px] ${decision === 'alba_ewaste' ? 'text-amber-100' : 'text-slate-400'}`}>
                    Recycle at West Mall
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setDecision('discard_trash');
                  markFieldAmended('decision_status');
                }}
                className={`p-2 rounded-xl border text-left flex items-center gap-2 transition ${
                  decision === 'discard_trash'
                    ? 'bg-slate-700 text-white border-slate-700 font-bold shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span className="text-base">🗑️</span>
                <div>
                  <div className="font-semibold text-xs">General Trash</div>
                  <div className={`text-[10px] ${decision === 'discard_trash' ? 'text-slate-200' : 'text-slate-400'}`}>
                    Chute / Bin centre
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setDecision('undecided_discuss');
                  markFieldAmended('decision_status');
                }}
                className={`p-2 rounded-xl border text-left flex items-center gap-2 transition ${
                  decision === 'undecided_discuss'
                    ? 'bg-yellow-500 text-white border-yellow-500 font-bold shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span className="text-base">🤔</span>
                <div>
                  <div className="font-semibold text-xs">To Discuss</div>
                  <div className={`text-[10px] ${decision === 'undecided_discuss' ? 'text-yellow-100' : 'text-slate-400'}`}>
                    Discuss destination
                  </div>
                </div>
              </button>
            </div>

            {/* Carousell Pricing Inputs */}
            {decision === 'sell_carousell' && (
              <div className="mt-3 pt-3 border-t border-slate-200 space-y-2.5">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-semibold text-slate-600 block">
                        Asking Price (SGD)
                      </label>
                      {renderAiBadge('carousell_price')}
                    </div>
                    <div className="relative mt-1">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                        $
                      </span>
                      <input
                        type="number"
                        value={carousellPrice}
                        onChange={(e) => {
                          setCarousellPrice(e.target.value);
                          markFieldAmended('carousell_price');
                        }}
                        placeholder="e.g. 150"
                        className="w-full pl-6 pr-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block">Status</label>
                    <select
                      value={carousellStatus}
                      onChange={(e) => setCarousellStatus(e.target.value as any)}
                      className="w-full mt-1 px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    >
                      <option value="draft">Draft (Not listed)</option>
                      <option value="listed">Active on Carousell</option>
                      <option value="reserved">Reserved</option>
                      <option value="sold">Sold</option>
                    </select>
                  </div>
                </div>

                {carousellStatus === 'sold' && (
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block">
                      Actual Sold Price (SGD)
                    </label>
                    <div className="relative mt-1">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                        $
                      </span>
                      <input
                        type="number"
                        value={carousellSoldPrice}
                        onChange={(e) => setCarousellSoldPrice(e.target.value)}
                        placeholder="e.g. 130"
                        className="w-full pl-6 pr-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-emerald-700"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block">
                    Carousell Listing URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={carousellUrl}
                    onChange={(e) => setCarousellUrl(e.target.value)}
                    placeholder="https://carousell.app.link/..."
                    className="w-full mt-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Physical Dimensions & Weight */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Dimensions & Weight (For Mover CBM)
                </label>
                {renderAiBadge('dimensions_cm')}
                {renderAiBadge('weight_kg')}
              </div>
              {currentCbm > 0 && (
                <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                  Volume: {currentCbm} CBM (m³)
                </span>
              )}
            </div>

            <div className="grid grid-cols-4 gap-2">
              <div>
                <span className="text-[10px] text-slate-500 block">Length (cm)</span>
                <input
                  type="number"
                  value={length}
                  onChange={(e) => {
                    setLength(e.target.value);
                    markFieldAmended('dimensions_cm');
                  }}
                  placeholder="L"
                  className="w-full px-2 py-2 bg-white border border-slate-200 rounded-xl text-xs text-center font-medium"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Width (cm)</span>
                <input
                  type="number"
                  value={width}
                  onChange={(e) => {
                    setWidth(e.target.value);
                    markFieldAmended('dimensions_cm');
                  }}
                  placeholder="W"
                  className="w-full px-2 py-2 bg-white border border-slate-200 rounded-xl text-xs text-center font-medium"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Height (cm)</span>
                <input
                  type="number"
                  value={height}
                  onChange={(e) => {
                    setHeight(e.target.value);
                    markFieldAmended('dimensions_cm');
                  }}
                  placeholder="H"
                  className="w-full px-2 py-2 bg-white border border-slate-200 rounded-xl text-xs text-center font-medium"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Weight (kg)</span>
                <input
                  type="number"
                  step="0.1"
                  value={weight}
                  onChange={(e) => {
                    setWeight(e.target.value);
                    markFieldAmended('weight_kg');
                  }}
                  placeholder="kg"
                  className="w-full px-2 py-2 bg-white border border-slate-200 rounded-xl text-xs text-center font-medium"
                />
              </div>
            </div>
          </div>

          {/* Equipment Toggles: Fragile, Disassembly, Box, Cables */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => {
                setIsFragile(!isFragile);
                markFieldAmended('is_fragile');
              }}
              className={`p-2.5 rounded-xl border flex items-center justify-between transition text-left ${
                isFragile
                  ? 'bg-red-50 text-red-800 border-red-300 font-semibold'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <AlertTriangle
                  size={16}
                  className={isFragile ? 'text-red-600' : 'text-slate-400'}
                />
                <span>Fragile Electronics</span>
              </div>
              {renderAiBadge('is_fragile')}
            </button>

            <button
              type="button"
              onClick={() => {
                setNeedsDisassembly(!needsDisassembly);
                markFieldAmended('disassembly_required');
              }}
              className={`p-2.5 rounded-xl border flex items-center justify-between transition text-left ${
                needsDisassembly
                  ? 'bg-amber-50 text-amber-800 border-amber-300 font-semibold'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <Wrench
                  size={16}
                  className={needsDisassembly ? 'text-amber-600' : 'text-slate-400'}
                />
                <span>Disassembly Needed</span>
              </div>
              {renderAiBadge('disassembly_required')}
            </button>

            <button
              type="button"
              onClick={() => setHasOriginalBox(!hasOriginalBox)}
              className={`p-2.5 rounded-xl border flex items-center gap-2 transition text-left ${
                hasOriginalBox
                  ? 'bg-teal-50 text-teal-800 border-teal-300 font-semibold'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Package
                size={16}
                className={hasOriginalBox ? 'text-teal-600' : 'text-slate-400'}
              />
              <span>Original Box Ready</span>
            </button>

            <button
              type="button"
              onClick={() => setHasCables(!hasCables)}
              className={`p-2.5 rounded-xl border flex items-center gap-2 transition text-left ${
                hasCables
                  ? 'bg-blue-50 text-blue-800 border-blue-300 font-semibold'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Cable
                size={16}
                className={hasCables ? 'text-blue-600' : 'text-slate-400'}
              />
              <span>All Cables Kept</span>
            </button>
          </div>

          {/* Box Assignment (Only if Moving to Condo or HQ) */}
          {isMovingDecision(decision) && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 block">
                  Assign to Moving Box (Optional)
                </label>
                <button
                  type="button"
                  onClick={handleCreateQuickBox}
                  className="text-[11px] font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1 active:scale-95"
                >
                  <Plus size={12} />
                  <span>New Box</span>
                </button>
              </div>
              <select
                value={boxId}
                onChange={(e) => setBoxId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-sm"
              >
                <option value="">None / Standalone Item (Not in Box)</option>
                {boxes.map((box) => (
                  <option key={box.id} value={box.id}>
                    Box #{box.box_number} — {box.label} ({box.room_destination || 'General'})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 block">
                Notes & Special Instructions
              </label>
              {renderAiBadge('notes')}
            </div>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                markFieldAmended('notes');
              }}
              placeholder="e.g. Wall mount screws attached with tape, do not place under heavy boxes, keep upright..."
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-sm"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || !name.trim()}
              className="flex-1 py-3 px-4 rounded-xl bg-teal-600 text-white text-xs font-bold hover:bg-teal-700 transition shadow-md shadow-teal-600/20 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : null}
              <span>{initialItem ? 'Update Item' : 'Save Item'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
