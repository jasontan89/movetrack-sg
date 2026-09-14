import React, { useState } from 'react';
import { KeyRound, Delete, AlertCircle, Lock } from 'lucide-react';

interface HouseholdPinModalProps {
  correctPin: string;
  onSuccess: () => void;
}

export const HouseholdPinModal: React.FC<HouseholdPinModalProps> = ({
  correctPin = '884488',
  onSuccess,
}) => {
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [shake, setShake] = useState(false);

  const handleDigit = (digit: string) => {
    if (pin.length >= 6) return;
    const newPin = pin + digit;
    setPin(newPin);
    setError('');

    if (newPin.length === 6) {
      if (newPin === correctPin) {
        localStorage.setItem('movetrack_pin_unlocked', 'true');
        onSuccess();
      } else {
        setShake(true);
        setError('Incorrect Household PIN. Try again.');
        setTimeout(() => {
          setPin('');
          setShake(false);
        }, 600);
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setError('');
  };

  const handleClear = () => {
    setPin('');
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xs rounded-3xl p-6 shadow-2xl space-y-5 border border-slate-200 text-center">
        <div className="space-y-1">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center mx-auto shadow-md shadow-amber-500/30">
            <Lock size={24} />
          </div>
          <h2 className="font-bold text-slate-900 text-base mt-2">Household Security PIN</h2>
          <p className="text-xs text-slate-500">
            Enter 6-digit PIN to access Bukit Batok inventory
          </p>
        </div>

        {/* 6 Dots Indicator */}
        <div
          className={`flex items-center justify-center gap-3 py-2 ${
            shake ? 'animate-bounce text-red-500' : ''
          }`}
        >
          {[0, 1, 2, 3, 4, 5].map((idx) => (
            <div
              key={idx}
              className={`w-3.5 h-3.5 rounded-full border-2 transition-all duration-150 ${
                pin.length > idx
                  ? 'bg-teal-600 border-teal-600 scale-110'
                  : 'bg-slate-100 border-slate-300'
              }`}
            />
          ))}
        </div>

        {error && (
          <div className="text-xs text-red-600 font-medium flex items-center justify-center gap-1">
            <AlertCircle size={14} />
            <span>{error}</span>
          </div>
        )}

        {/* Keypad Grid */}
        <div className="grid grid-cols-3 gap-2 pt-1 max-w-[240px] mx-auto">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigit(digit)}
              className="w-16 h-14 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-900 text-lg font-bold transition active:scale-90 flex items-center justify-center shadow-sm"
            >
              {digit}
            </button>
          ))}

          <button
            type="button"
            onClick={handleClear}
            className="w-16 h-14 rounded-2xl text-slate-400 hover:text-slate-600 text-xs font-semibold transition active:scale-90 flex items-center justify-center"
          >
            Clear
          </button>

          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="w-16 h-14 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-900 text-lg font-bold transition active:scale-90 flex items-center justify-center shadow-sm"
          >
            0
          </button>

          <button
            type="button"
            onClick={handleDelete}
            className="w-16 h-14 rounded-2xl text-slate-600 hover:bg-slate-100 transition active:scale-90 flex items-center justify-center"
            title="Delete"
          >
            <Delete size={20} />
          </button>
        </div>

        <p className="text-[10px] text-slate-400">
          Default Household PIN: <strong>884488</strong>
        </p>
      </div>
    </div>
  );
};
