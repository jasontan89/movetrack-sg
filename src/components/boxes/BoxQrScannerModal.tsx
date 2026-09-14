import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Box } from '../../types';
import { X, Camera, AlertCircle } from 'lucide-react';

interface BoxQrScannerModalProps {
  boxes: Box[];
  onClose: () => void;
  onBoxFound: (box: Box) => void;
}

export const BoxQrScannerModal: React.FC<BoxQrScannerModalProps> = ({
  boxes,
  onClose,
  onBoxFound,
}) => {
  const [scanError, setScanError] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(true);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    const scannerId = 'qr-reader-viewport';

    const startScanner = async () => {
      try {
        const scanner = new Html5Qrcode(scannerId);
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            // Handle detected QR
            handleDecodedQr(decodedText);
          },
          (errorMessage) => {
            // Frame parse error (ignore routine non-matches)
          }
        );
      } catch (err: any) {
        console.error('Camera QR start error:', err);
        setScanError('Unable to access mobile camera. Please ensure camera permissions are granted.');
        setIsScanning(false);
      }
    };

    startScanner();

    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch((e) => console.warn('Error stopping scanner:', e));
      }
    };
  }, []);

  const handleDecodedQr = (decodedText: string) => {
    try {
      // Try JSON parsing first
      let matchedBox: Box | undefined;
      try {
        const parsed = JSON.parse(decodedText);
        if (parsed.box_id) {
          matchedBox = boxes.find((b) => b.id === parsed.box_id);
        } else if (parsed.box_number) {
          matchedBox = boxes.find((b) => b.box_number === Number(parsed.box_number));
        }
      } catch {
        // Raw text search e.g. MOVETRACK-BB-BOX-01 or Box #1
        matchedBox = boxes.find(
          (b) =>
            b.qr_code_id === decodedText.trim() ||
            decodedText.includes(String(b.box_number)) ||
            decodedText.includes(b.id)
        );
      }

      if (matchedBox) {
        if (scannerRef.current && scannerRef.current.isScanning) {
          scannerRef.current.stop().catch(() => {});
        }
        onBoxFound(matchedBox);
      } else {
        setScanError(`Scanned code "${decodedText}", but no matching box was found in this household.`);
      }
    } catch (e) {
      console.error('QR decode error:', e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="bg-slate-900 text-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl flex flex-col relative border border-slate-700 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Camera size={18} className="text-teal-400" />
            <span className="font-bold text-sm">Scan Moving Box QR</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scanner Viewport */}
        <div className="p-4 flex flex-col items-center justify-center">
          <div
            id="qr-reader-viewport"
            className="w-full h-72 rounded-2xl overflow-hidden bg-black relative border-2 border-teal-500/50"
          />

          <p className="text-xs text-slate-400 text-center mt-3 max-w-xs">
            Point your camera at the QR code printed on the moving box to view its full contents instantly.
          </p>

          {scanError && (
            <div className="mt-3 p-3 bg-red-950/80 border border-red-800 rounded-xl text-xs text-red-200 flex items-start gap-2">
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-400" />
              <span>{scanError}</span>
            </div>
          )}
        </div>

        {/* Quick select fallback */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/50">
          <span className="text-[11px] text-slate-400 block mb-1.5 font-medium">
            Or pick a box manually:
          </span>
          <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {boxes.map((b) => (
              <button
                key={b.id}
                onClick={() => onBoxFound(b)}
                className="shrink-0 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs font-semibold border border-slate-700 transition"
              >
                Box #{b.box_number}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
