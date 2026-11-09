import React, { useState } from 'react';
import { useHousehold } from '../../context/HouseholdContext';
import {
  WifiOff,
  CloudCheck,
  Cloud,
  UserPlus,
  Settings,
  ChevronDown,
  Lock,
  LogOut,
  ShieldCheck,
} from 'lucide-react';

interface HeaderProps {
  onOpenInvite: () => void;
  onOpenSettings: () => void;
  onSelectOwnerFilter?: (owner: 'all' | 'jason' | 'wife' | 'shared') => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenInvite,
  onOpenSettings,
  onSelectOwnerFilter,
}) => {
  const {
    household,
    currentUser,
    session,
    isOnline,
    isCloudConfigured,
    offlineQueueCount,
    switchUser,
    lockHousehold,
    signOut,
  } = useHousehold();

  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const users: { role: 'jason' | 'wife' | 'family'; label: string; bg: string }[] = [
    { role: 'jason', label: 'Jason', bg: 'bg-emerald-600' },
    { role: 'wife', label: 'Wife', bg: 'bg-rose-500' },
    { role: 'family', label: 'Shared / Family', bg: 'bg-teal-600' },
  ];

  const handleSwitchProfile = (role: 'jason' | 'wife' | 'family') => {
    switchUser(role);
    setShowUserDropdown(false);
    // Also auto-switch the active catalog filter so it immediately does something visible!
    if (onSelectOwnerFilter) {
      if (role === 'jason') onSelectOwnerFilter('jason');
      else if (role === 'wife') onSelectOwnerFilter('wife');
      else onSelectOwnerFilter('all');
    }
  };

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
                  <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
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
              <span className="inline-flex items-center gap-1">
                {session ? (
                  <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                    <ShieldCheck size={13} />
                    <span className="hidden sm:inline">Secure Session</span>
                  </span>
                ) : isCloudConfigured ? (
                  <span className="inline-flex items-center gap-1 text-teal-600 font-medium">
                    <CloudCheck size={13} />
                    <span className="hidden sm:inline">Cloud Connected</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-slate-500">
                    <Cloud size={13} />
                    <span>Local Mode</span>
                  </span>
                )}
              </span>

              {offlineQueueCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500 text-white font-bold">
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
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-medium text-slate-700 transition active:scale-95 border border-slate-200"
            >
              <div
                className={`w-5 h-5 rounded-full ${currentUser.avatar_color} text-white flex items-center justify-center font-bold text-[11px]`}
              >
                {currentUser.display_name.charAt(0)}
              </div>
              <span className="max-w-[70px] truncate font-semibold">{currentUser.display_name}</span>
              <ChevronDown size={12} className="text-slate-400" />
            </button>

            {showUserDropdown && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowUserDropdown(false)}
                />
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-2xl border border-slate-200 p-1.5 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-2.5 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    Switch Active Profile
                  </div>

                  {session?.user?.email && (
                    <div className="px-2.5 py-1 text-[11px] text-teal-700 font-medium truncate">
                      👤 {session.user.email}
                    </div>
                  )}

                  <div className="py-1 space-y-0.5">
                    {users.map((u) => (
                      <button
                        key={u.role}
                        onClick={() => handleSwitchProfile(u.role)}
                        className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium transition text-left ${
                          currentUser.role === u.role
                            ? 'bg-teal-50 text-teal-900 font-bold'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div
                          className={`w-6 h-6 rounded-full ${u.bg} text-white flex items-center justify-center font-bold text-xs shrink-0`}
                        >
                          {u.label.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="truncate">{u.label}</div>
                          <div className="text-[10px] text-slate-400">
                            {u.role === 'jason'
                              ? "Show Jason's items"
                              : u.role === 'wife'
                              ? "Show Wife's items"
                              : 'Show whole house'}
                          </div>
                        </div>
                        {currentUser.role === u.role && (
                          <div className="w-2 h-2 rounded-full bg-teal-600 shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Security Actions: Lock & Sign Out */}
                  <div className="pt-1 border-t border-slate-100 space-y-0.5">
                    <button
                      onClick={() => {
                        lockHousehold();
                        setShowUserDropdown(false);
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-amber-700 hover:bg-amber-50 transition text-left"
                    >
                      <Lock size={13} />
                      <span>Lock Household (PIN)</span>
                    </button>

                    {session && (
                      <button
                        onClick={() => {
                          signOut();
                          setShowUserDropdown(false);
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 transition text-left"
                      >
                        <LogOut size={13} />
                        <span>Sign Out</span>
                      </button>
                    )}
                  </div>
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
