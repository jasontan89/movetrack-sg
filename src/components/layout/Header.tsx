import React, { useState } from 'react';
import { useHousehold } from '../../context/HouseholdContext';
import { UserProfile } from '../../types';
import {
  Wifi,
  WifiOff,
  CloudCheck,
  Cloud,
  UserPlus,
  Settings,
  Sparkles,
  ChevronDown,
} from 'lucide-react';

interface HeaderProps {
  onOpenInvite: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenInvite, onOpenSettings }) => {
  const { household, currentUser, isOnline, isCloudConfigured, offlineQueueCount, switchUser } =
    useHousehold();
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const users: { role: 'jason' | 'wife' | 'family'; label: string; bg: string }[] = [
    { role: 'jason', label: 'Jason', bg: 'bg-emerald-600' },
    { role: 'wife', label: 'Wife', bg: 'bg-rose-500' },
    { role: 'family', label: 'Shared / Family', bg: 'bg-teal-600' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-2.5 shadow-sm pt-safe">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
        {/* Logo & Household Title */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white font-bold shadow-sm shadow-teal-500/20 shrink-0">
            <span className="text-lg">📦</span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="font-bold text-slate-900 text-base leading-tight truncate">
                {household?.name || 'MoveTrack SG'}
              </h1>
              <span className="hidden xs:inline-flex items-center text-[10px] font-semibold tracking-wide uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 shrink-0">
                Bukit Batok 4-Room
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              {/* Online / Offline Status */}
              <span className="inline-flex items-center gap-1">
                {isOnline ? (
                  <span className="inline-flex items-center gap-1 text-emerald-600">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Online</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-amber-600 font-medium">
                    <WifiOff size={12} />
                    <span>Bomb Shelter (Offline)</span>
                  </span>
                )}
              </span>

              <span>•</span>

              {/* Cloud / Local status */}
              <span className="inline-flex items-center gap-1 text-slate-400">
                {isCloudConfigured ? (
                  <span className="inline-flex items-center gap-1 text-teal-600">
                    <CloudCheck size={13} />
                    <span className="hidden sm:inline">Cloud Synced</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-slate-500">
                    <Cloud size={13} />
                    <span>Local Mode</span>
                  </span>
                )}
              </span>

              {offlineQueueCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500 text-white font-bold">
                  {offlineQueueCount} queued
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Actions: Invite Wife, Active User Switcher, Settings */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Invite Wife button */}
          <button
            onClick={onOpenInvite}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200/80 text-xs font-semibold transition active:scale-95 shadow-sm"
            title="Invite Wife via WhatsApp / QR"
          >
            <UserPlus size={14} />
            <span className="hidden sm:inline">Invite Wife</span>
          </button>

          {/* User Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-medium text-slate-700 transition active:scale-95"
            >
              <div
                className={`w-5 h-5 rounded-full ${currentUser.avatar_color} text-white flex items-center justify-center font-bold text-[11px]`}
              >
                {currentUser.display_name.charAt(0)}
              </div>
              <span className="max-w-[70px] truncate">{currentUser.display_name}</span>
              <ChevronDown size={12} className="text-slate-400" />
            </button>

            {showUserDropdown && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowUserDropdown(false)}
                />
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-200 p-1.5 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-2.5 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Switch Tracking Profile
                  </div>
                  {users.map((u) => (
                    <button
                      key={u.role}
                      onClick={() => {
                        switchUser(u.role);
                        setShowUserDropdown(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition text-left ${
                        currentUser.role === u.role
                          ? 'bg-teal-50 text-teal-800 font-semibold'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-full ${u.bg} text-white flex items-center justify-center font-bold text-xs`}
                      >
                        {u.label.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <div>{u.label}</div>
                        <div className="text-[10px] text-slate-400">
                          {u.role === 'jason'
                            ? "Jason's catalog"
                            : u.role === 'wife'
                            ? "Wife's catalog"
                            : 'Shared household'}
                        </div>
                      </div>
                      {currentUser.role === u.role && (
                        <div className="w-1.5 h-1.5 rounded-full bg-teal-600" />
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Settings button */}
          <button
            onClick={onOpenSettings}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition active:scale-95"
            title="Settings & Cloud Sync"
          >
            <Settings size={18} />
          </button>
        </div>
      </div>
    </header>
  );
};
