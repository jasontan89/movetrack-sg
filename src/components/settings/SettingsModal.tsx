import React, { useState } from 'react';
import { useHousehold } from '../../context/HouseholdContext';
import { useItems } from '../../context/ItemContext';
import {
  getSupabaseCredentials,
  saveSupabaseCredentials,
  SUPABASE_SQL_SCHEMA,
} from '../../db/supabaseClient';
import {
  X,
  Cloud,
  Database,
  Download,
  Upload,
  RefreshCw,
  Copy,
  Check,
  AlertTriangle,
  Home,
  Sparkles,
  Trash2,
} from 'lucide-react';

interface SettingsModalProps {
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const { household, updateHouseholdName } = useHousehold();
  const { items, boxes, resetAllData, reloadAll } = useItems();

  const creds = getSupabaseCredentials();
  const [supabaseUrl, setSupabaseUrl] = useState(creds.url);
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(creds.anonKey);
  const [geminiApiKey, setGeminiApiKey] = useState<string>(
    () => localStorage.getItem('movetrack_gemini_api_key') || ''
  );
  const [saveStatus, setSaveStatus] = useState<string>('');
  const [copiedSchema, setCopiedSchema] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  // Household state
  const [householdName, setHouseholdName] = useState(household?.name || '');
  const [address, setAddress] = useState(household?.address || '');
  const [securityPin, setSecurityPin] = useState(household?.security_pin || '884488');
  const { updateSecurityPin } = useHousehold();

  const handleSaveSupabase = (e: React.FormEvent) => {
    e.preventDefault();
    saveSupabaseCredentials(supabaseUrl, supabaseAnonKey);
    setSaveStatus('Supabase credentials saved successfully!');
    setTimeout(() => setSaveStatus(''), 3000);
  };

  const handleCopySchema = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSchema(true);
    setTimeout(() => setCopiedSchema(false), 2500);
  };

  const handleSaveHouseholdInfo = async () => {
    if (householdName.trim()) {
      await updateHouseholdName(householdName.trim(), address.trim());
      if (securityPin.trim() && securityPin.length === 6) {
        await updateSecurityPin(securityPin.trim());
      }
      setSaveStatus('Household details & PIN updated!');
      setTimeout(() => setSaveStatus(''), 2500);
    }
  };

  const handleSaveGeminiKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (geminiApiKey.trim()) {
      localStorage.setItem('movetrack_gemini_api_key', geminiApiKey.trim());
      setSaveStatus('Gemini API key saved!');
    } else {
      localStorage.removeItem('movetrack_gemini_api_key');
      setSaveStatus('Gemini API key cleared.');
    }
    setTimeout(() => setSaveStatus(''), 2500);
  };

  const handleExportJson = () => {
    const backup = {
      household,
      items,
      boxes,
      exported_at: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `MoveTrackSG_Backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleResetSample = async () => {
    await resetAllData();
    setConfirmReset(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-6">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center">
              <Database size={16} />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-sm">App Settings & Cloud Sync</h2>
              <p className="text-[11px] text-slate-500">MoveTrack SG Configuration</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs">
          {/* Household Info */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <Home size={14} className="text-teal-600" />
                <span>Household Details</span>
              </span>
              <button
                onClick={handleSaveHouseholdInfo}
                className="text-teal-700 font-bold text-[11px] hover:underline"
              >
                Save Changes
              </button>
            </div>

            <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div>
                <label className="text-[10px] text-slate-500 block mb-0.5">Move Project Name</label>
                <input
                  type="text"
                  value={householdName}
                  onChange={(e) => setHouseholdName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 block mb-0.5">Current Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 block mb-0.5">
                  Household Security PIN (6 Digits)
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={securityPin}
                  onChange={(e) => setSecurityPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="884488"
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold tracking-widest text-teal-700"
                />
                <span className="text-[9px] text-slate-400 mt-0.5 block">
                  Required to unlock household data on new devices.
                </span>
              </div>
            </div>
          </div>

          {/* Cloud Sync with Supabase */}
          <form onSubmit={handleSaveSupabase} className="space-y-2.5">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <Cloud size={14} className="text-teal-600" />
              <span>Supabase Cloud Sync (Optional)</span>
            </span>
            <p className="text-[11px] text-slate-500">
              The PWA runs 100% offline via local IndexedDB. To enable real-time cross-device sync between your phone and your wife's phone, connect a Supabase project:
            </p>

            <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div>
                <label className="text-[10px] text-slate-500 block mb-0.5">
                  Project URL (e.g. https://xyz.supabase.co)
                </label>
                <input
                  type="text"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  placeholder="https://your-project.supabase.co"
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-500 block mb-0.5">
                  Anon Public Key
                </label>
                <input
                  type="password"
                  value={supabaseAnonKey}
                  onChange={(e) => setSupabaseAnonKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={handleCopySchema}
                  className="text-teal-700 font-semibold text-[11px] flex items-center gap-1 hover:underline"
                >
                  {copiedSchema ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copiedSchema ? 'SQL Copied!' : 'Copy SQL Schema'}</span>
                </button>

                <button
                  type="submit"
                  className="px-3 py-1.5 bg-teal-600 text-white rounded-lg font-bold hover:bg-teal-700 transition"
                >
                  Save Keys
                </button>
              </div>
            </div>

            {saveStatus && (
              <p className="text-emerald-700 font-semibold text-[11px]">{saveStatus}</p>
            )}
          </form>

          {/* Google Gemini AI Configuration */}
          <form onSubmit={handleSaveGeminiKey} className="space-y-2.5">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <Sparkles size={14} className="text-purple-600" />
              <span>Google Gemini AI (Photo Auto-Fill)</span>
            </span>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Uses <strong>gemini-3.5-flash-lite</strong> (with fallback to <strong>gemini-3.1-flash-lite</strong>) to automatically detect dimensions, weight, fragility, and moving decisions when photos are captured.
            </p>

            <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div>
                <label className="text-[10px] text-slate-500 block mb-0.5">
                  Gemini API Key (Optionally baked in .env as VITE_GEMINI_API_KEY)
                </label>
                <input
                  type="password"
                  value={geminiApiKey}
                  onChange={(e) => setGeminiApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                />
              </div>

              <div className="flex items-center justify-end pt-1">
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 transition text-xs shadow-sm"
                >
                  Save Gemini Key
                </button>
              </div>
            </div>
          </form>

          {/* Data Backup & Clear */}
          <div className="space-y-2 pt-2 border-t border-slate-200">
            <span className="font-bold text-slate-800 block">Backup & Clear</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleExportJson}
                className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition flex items-center justify-center gap-1.5 font-semibold text-slate-700 text-xs"
              >
                <Download size={14} />
                <span>Export JSON</span>
              </button>

              {confirmReset ? (
                <button
                  onClick={handleResetSample}
                  className="p-2.5 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition text-[11px]"
                >
                  Confirm Purge All
                </button>
              ) : (
                <button
                  onClick={() => setConfirmReset(true)}
                  className="p-2.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 transition flex items-center justify-center gap-1.5 font-semibold text-[11px]"
                >
                  <Trash2 size={13} />
                  <span>Purge All Records</span>
                </button>
              )}
            </div>
            <p className="text-[10px] text-slate-400">
              Permanently purges all items and boxes from local storage and connected Supabase cloud database.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 text-center">
          <button
            onClick={onClose}
            className="w-full py-2 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-slate-800"
          >
            Close Settings
          </button>
        </div>
      </div>
    </div>
  );
};
