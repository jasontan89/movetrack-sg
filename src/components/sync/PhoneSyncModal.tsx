import React, { useEffect, useState } from 'react';
import {
  scanLocalPhoneData,
  syncPhoneDataToSupabase,
  exportPhoneBackupJson,
  importBackupToSupabase,
  LocalSyncScanResult,
} from '../../services/syncService';
import { useItems } from '../../context/ItemContext';
import {
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Download,
  Copy,
  Check,
  Smartphone,
  X,
  Package,
  Archive,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

interface PhoneSyncModalProps {
  onClose: () => void;
}

export const PhoneSyncModal: React.FC<PhoneSyncModalProps> = ({ onClose }) => {
  const { reloadAll } = useItems();
  const [scanResult, setScanResult] = useState<LocalSyncScanResult | null>(null);
  const [isScanning, setIsScanning] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<{
    current: number;
    total: number;
    message: string;
  }>({ current: 0, total: 0, message: '' });
  const [syncCompleteResult, setSyncCompleteResult] = useState<{
    success: boolean;
    syncedItemsCount: number;
    syncedBoxesCount: number;
    uploadedPhotosCount: number;
    error?: string;
  } | null>(null);

  const [copiedBackup, setCopiedBackup] = useState(false);
  const [showManualImport, setShowManualImport] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importMessage, setImportMessage] = useState('');

  const runScan = async () => {
    setIsScanning(true);
    const result = await scanLocalPhoneData();
    setScanResult(result);
    setIsScanning(false);
  };

  useEffect(() => {
    runScan();
  }, []);

  const handleStartSync = async () => {
    setIsSyncing(true);
    setSyncCompleteResult(null);

    const result = await syncPhoneDataToSupabase((current, total, message) => {
      setSyncProgress({ current, total, message });
    });

    setSyncCompleteResult(result);
    setIsSyncing(false);

    if (result.success) {
      await reloadAll();
      runScan();
    }
  };

  const handleCopyBackup = async () => {
    const json = await exportPhoneBackupJson();
    await navigator.clipboard.writeText(json);
    setCopiedBackup(true);
    setTimeout(() => setCopiedBackup(false), 2500);
  };

  const handleDownloadBackup = async () => {
    const json = await exportPhoneBackupJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `MoveTrackSG_Phone_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleManualImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importJsonText.trim()) return;

    setIsImporting(true);
    setImportMessage('Importing to Supabase...');

    const result = await importBackupToSupabase(importJsonText, (cur, tot, msg) => {
      setImportMessage(`(${cur}/${tot}) ${msg}`);
    });

    setIsImporting(false);
    if (result.success) {
      setImportMessage(
        `✅ Successfully imported ${result.itemsCount} items and ${result.boxesCount} boxes to Supabase!`
      );
      setImportJsonText('');
      await reloadAll();
      runScan();
    } else {
      setImportMessage(`❌ Import failed: ${result.error}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-6">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-teal-700 to-emerald-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
              <Smartphone size={18} />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Sync Phone Data to Supabase</h3>
              <p className="text-[11px] text-teal-100">
                Push all items, boxes, and photos from this phone to cloud
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-white/70 hover:text-white hover:bg-white/10"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Target Supabase Indicator */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-700">
              <ShieldCheck size={16} className="text-teal-600 shrink-0" />
              <div>
                <span className="font-bold text-slate-900 block text-xs">
                  Target Supabase Cloud
                </span>
                <span className="text-[11px] text-slate-500 font-mono truncate block max-w-[240px]">
                  lekqqpjjqksixzacbtqz.supabase.co
                </span>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              Direct Sync
            </span>
          </div>

          {/* Scanning State */}
          {isScanning && (
            <div className="text-center py-8 space-y-2">
              <Loader2 size={28} className="animate-spin text-teal-600 mx-auto" />
              <p className="text-slate-600 font-medium">Scanning phone's local storage...</p>
            </div>
          )}

          {/* Sync Progress Banner */}
          {isSyncing && (
            <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between font-bold text-teal-900">
                <span className="flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin text-teal-600" />
                  <span>Syncing to Supabase Cloud...</span>
                </span>
                <span>
                  {syncProgress.total > 0
                    ? `${Math.round((syncProgress.current / syncProgress.total) * 100)}%`
                    : ''}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-teal-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-teal-600 h-2 transition-all duration-300 rounded-full"
                  style={{
                    width: `${
                      syncProgress.total > 0
                        ? (syncProgress.current / syncProgress.total) * 100
                        : 5
                    }%`,
                  }}
                />
              </div>

              <p className="text-[11px] text-teal-700 font-medium truncate">
                {syncProgress.message || 'Connecting to Supabase...'}
              </p>
            </div>
          )}

          {/* Success Banner */}
          {syncCompleteResult?.success && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-2 text-emerald-900">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
                <h4 className="font-bold text-sm">Sync Complete!</h4>
              </div>
              <p className="text-xs text-emerald-800 leading-relaxed">
                Successfully uploaded and saved to Supabase:
              </p>
              <div className="grid grid-cols-3 gap-2 text-center pt-1 font-bold">
                <div className="bg-white/80 p-2 rounded-xl border border-emerald-200">
                  <span className="text-base text-emerald-700 block">
                    {syncCompleteResult.syncedItemsCount}
                  </span>
                  <span className="text-[10px] text-emerald-600">Items Synced</span>
                </div>
                <div className="bg-white/80 p-2 rounded-xl border border-emerald-200">
                  <span className="text-base text-emerald-700 block">
                    {syncCompleteResult.syncedBoxesCount}
                  </span>
                  <span className="text-[10px] text-emerald-600">Boxes Synced</span>
                </div>
                <div className="bg-white/80 p-2 rounded-xl border border-emerald-200">
                  <span className="text-base text-emerald-700 block">
                    {syncCompleteResult.uploadedPhotosCount}
                  </span>
                  <span className="text-[10px] text-emerald-600">Photos Uploaded</span>
                </div>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {syncCompleteResult?.error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-900 flex items-start gap-2.5">
              <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-xs">Sync Encountered an Error</h4>
                <p className="text-[11px] text-red-700 mt-0.5">{syncCompleteResult.error}</p>
              </div>
            </div>
          )}

          {/* Scan Overview */}
          {!isScanning && scanResult && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                  <span className="text-slate-500 block text-[11px]">Items on Phone</span>
                  <span className="font-black text-xl text-slate-800">
                    {scanResult.localItems.length}
                  </span>
                  {scanResult.unsyncedItems.length > 0 ? (
                    <span className="text-[10px] text-amber-700 font-semibold block mt-0.5">
                      ⚠️ {scanResult.unsyncedItems.length} not yet in cloud
                    </span>
                  ) : (
                    <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">
                      ✓ In sync with cloud
                    </span>
                  )}
                </div>

                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                  <span className="text-slate-500 block text-[11px]">Boxes on Phone</span>
                  <span className="font-black text-xl text-slate-800">
                    {scanResult.localBoxes.length}
                  </span>
                  {scanResult.unsyncedBoxes.length > 0 ? (
                    <span className="text-[10px] text-amber-700 font-semibold block mt-0.5">
                      ⚠️ {scanResult.unsyncedBoxes.length} not yet in cloud
                    </span>
                  ) : (
                    <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">
                      ✓ In sync with cloud
                    </span>
                  )}
                </div>
              </div>

              {scanResult.itemsWithLocalPhotos.length > 0 && (
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-2.5 text-[11px] text-purple-900 flex items-center justify-between">
                  <span>
                    📸 <strong>{scanResult.itemsWithLocalPhotos.length}</strong> photo(s) stored as
                    base64 on this phone.
                  </span>
                  <span className="text-[10px] bg-purple-200/80 px-2 py-0.5 rounded-full font-semibold">
                    Will auto-upload to Storage
                  </span>
                </div>
              )}

              {/* Items Preview List (if any unsynced) */}
              {scanResult.unsyncedItems.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <span className="font-bold text-slate-700 text-[11px] uppercase tracking-wider block">
                    Un-synced Items Found on Phone ({scanResult.unsyncedItems.length})
                  </span>
                  <div className="max-h-36 overflow-y-auto space-y-1.5 border border-slate-200 rounded-xl p-2 bg-slate-50">
                    {scanResult.unsyncedItems.map((item) => (
                      <div
                        key={item.id}
                        className="bg-white p-2 rounded-lg border border-slate-200 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {item.photo_url ? (
                            <img
                              src={item.photo_url}
                              alt=""
                              className="w-8 h-8 rounded object-cover border border-slate-200 shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                              <Package size={14} />
                            </div>
                          )}
                          <div className="min-w-0">
                            <span className="font-bold text-slate-800 truncate block">
                              {item.name}
                            </span>
                            <span className="text-[10px] text-slate-500 capitalize block">
                              {item.room.replace(/_/g, ' ')} • {item.category.replace(/_/g, ' ')}
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 shrink-0">
                          Pending Cloud
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action: Main Push Button */}
              {scanResult.localItems.length > 0 || scanResult.localBoxes.length > 0 ? (
                <button
                  onClick={handleStartSync}
                  disabled={isSyncing}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition active:scale-[0.98] disabled:opacity-50"
                >
                  {isSyncing ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Syncing in Progress...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud size={16} />
                      <span>⚡ Push All Phone Data & Photos to Supabase</span>
                    </>
                  )}
                </button>
              ) : (
                <div className="text-center py-4 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <p>No local items or boxes detected on this phone.</p>
                </div>
              )}

              {/* Safety Backup Options */}
              <div className="pt-2 border-t border-slate-200 space-y-2">
                <span className="font-bold text-slate-700 text-[11px] block">
                  Safety Backup & Emergency Export
                </span>
                <p className="text-[10px] text-slate-500">
                  Guarantee your phone data is never lost by copying or downloading a JSON backup:
                </p>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleCopyBackup}
                    className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold flex items-center justify-center gap-1.5 transition active:scale-95"
                  >
                    {copiedBackup ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                    <span>{copiedBackup ? 'Copied to Clipboard!' : 'Copy Backup JSON'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadBackup}
                    className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold flex items-center justify-center gap-1.5 transition active:scale-95"
                  >
                    <Download size={14} />
                    <span>Download File</span>
                  </button>
                </div>

                {/* Manual JSON Import Accordion */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setShowManualImport(!showManualImport)}
                    className="text-[11px] text-teal-700 font-semibold hover:underline flex items-center gap-1"
                  >
                    <span>{showManualImport ? '▼ Hide Manual JSON Import' : '▶ Manual JSON Import to Supabase'}</span>
                  </button>

                  {showManualImport && (
                    <form onSubmit={handleManualImport} className="mt-2 space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200 animate-in fade-in">
                      <p className="text-[10px] text-slate-500">
                        Paste any exported MoveTrack backup JSON to force-push it into Supabase:
                      </p>
                      <textarea
                        rows={4}
                        value={importJsonText}
                        onChange={(e) => setImportJsonText(e.target.value)}
                        placeholder='{"items": [...], "boxes": [...]}'
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg font-mono text-[10px]"
                      />
                      <div className="flex items-center justify-between">
                        {importMessage && (
                          <span className="text-[10px] font-semibold text-teal-700 truncate max-w-[200px]">
                            {importMessage}
                          </span>
                        )}
                        <button
                          type="submit"
                          disabled={isImporting || !importJsonText.trim()}
                          className="ml-auto px-3 py-1.5 bg-teal-600 text-white rounded-lg font-bold text-[11px] hover:bg-teal-700 disabled:opacity-50"
                        >
                          {isImporting ? 'Importing...' : 'Upload to Supabase'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 text-center">
          <button
            onClick={onClose}
            className="w-full py-2 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-slate-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
