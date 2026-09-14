import React, { useState } from 'react';
import { useHousehold } from '../../context/HouseholdContext';
import { QRCodeSVG } from 'qrcode.react';
import { X, Copy, Check, Share2, Heart, Smartphone } from 'lucide-react';

interface SpouseInviteModalProps {
  onClose: () => void;
}

export const SpouseInviteModal: React.FC<SpouseInviteModalProps> = ({ onClose }) => {
  const { household } = useHousehold();
  const [copied, setCopied] = useState(false);

  // Generate invite link with ?join=CODE&user=wife&pin=SECURITY_PIN
  const baseUrl = window.location.origin + window.location.pathname;
  const pin = household?.security_pin || '884488';
  const inviteLink = `${baseUrl}?join=${household?.invite_code || 'BB4RM8'}&user=wife&pin=${pin}`;

  const whatsappMessage = encodeURIComponent(
    `Hey dear! Here is our Bukit Batok house moving tracker app: ${inviteLink}\nTap this link on your phone to open and start cataloging your items!`
  );
  const whatsappUrl = `https://wa.me/?text=${whatsappMessage}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-6">
        {/* Top Header */}
        <div className="p-4 border-b border-slate-200 bg-rose-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-sm">
              <Heart size={16} fill="white" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-sm">
                Invite Wife to MoveTrack SG
              </h2>
              <p className="text-[11px] text-slate-500">Bukit Batok 4-Room Household</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Instructions */}
          <div className="bg-rose-50/60 p-3 rounded-2xl border border-rose-100 flex items-start gap-2.5">
            <Smartphone size={20} className="text-rose-600 shrink-0 mt-0.5" />
            <p className="text-slate-700 text-xs leading-relaxed">
              Send this link to your wife or have her scan the QR code with her phone. She will immediately be connected to your shared Bukit Batok move catalog!
            </p>
          </div>

          {/* QR Code */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col items-center justify-center space-y-2">
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
              <QRCodeSVG value={inviteLink} size={160} level="M" />
            </div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Scan with Wife's Camera
            </span>
            <div className="text-[10px] text-slate-400 font-mono">
              Household Code: <strong>{household?.invite_code || 'BB4RM8'}</strong>
            </div>
          </div>

          {/* WhatsApp Direct Share Button */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="w-full py-3 px-4 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition active:scale-95 text-center text-xs"
          >
            <Share2 size={16} />
            <span>Send Invite via WhatsApp</span>
          </a>

          {/* Copy Link Input */}
          <div className="space-y-1.5">
            <span className="font-semibold text-slate-700 block">Or Copy Direct Link:</span>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={inviteLink}
                className="flex-1 px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-[11px] text-slate-600 font-mono select-all focus:outline-none"
              />
              <button
                onClick={handleCopy}
                className="px-3 py-2 bg-slate-900 text-white rounded-xl font-semibold text-xs hover:bg-slate-800 transition flex items-center gap-1 active:scale-95 shrink-0"
              >
                {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 text-center">
          <button
            onClick={onClose}
            className="w-full py-2 bg-white border border-slate-200 rounded-xl text-slate-700 font-semibold hover:bg-slate-100 transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
