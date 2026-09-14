import React, { createContext, useContext, useEffect, useState } from 'react';
import { Household, UserProfile } from '../types';
import { getHousehold, saveHousehold, getOfflineQueueCount, initializeDatabase } from '../db';
import {
  getSupabaseCredentials,
  fetchHouseholdFromSupabase,
  saveHouseholdToSupabase,
} from '../db/supabaseClient';

interface HouseholdContextType {
  household: Household | null;
  currentUser: UserProfile;
  isOnline: boolean;
  offlineQueueCount: number;
  isCloudConfigured: boolean;
  switchUser: (role: 'jason' | 'wife' | 'family') => void;
  updateHouseholdName: (name: string, address: string) => Promise<void>;
  refreshOfflineCount: () => Promise<void>;
}

const DEFAULT_USERS: Record<'jason' | 'wife' | 'family', UserProfile> = {
  jason: {
    id: 'user-jason',
    display_name: 'Jason',
    role: 'jason',
    avatar_color: 'bg-emerald-600',
  },
  wife: {
    id: 'user-wife',
    display_name: 'Wife',
    role: 'wife',
    avatar_color: 'bg-rose-500',
  },
  family: {
    id: 'user-family',
    display_name: 'Shared / Family',
    role: 'family',
    avatar_color: 'bg-teal-600',
  },
};

const HouseholdContext = createContext<HouseholdContextType | undefined>(undefined);

export const HouseholdProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [household, setHousehold] = useState<Household | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    const params = new URLSearchParams(window.location.search);
    const urlUser = params.get('user');
    if (urlUser === 'wife') return DEFAULT_USERS.wife;
    const saved = localStorage.getItem('movetrack_active_user');
    return saved && (DEFAULT_USERS as any)[saved]
      ? (DEFAULT_USERS as any)[saved]
      : DEFAULT_USERS.jason;
  });

  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [offlineQueueCount, setOfflineQueueCount] = useState<number>(0);
  const [isCloudConfigured, setIsCloudConfigured] = useState<boolean>(false);

  useEffect(() => {
    async function load() {
      await initializeDatabase();

      const creds = getSupabaseCredentials();
      setIsCloudConfigured(creds.isConfigured);

      if (creds.isConfigured && navigator.onLine) {
        const cloudHousehold = await fetchHouseholdFromSupabase();
        if (cloudHousehold) {
          setHousehold(cloudHousehold);
          await saveHousehold(cloudHousehold);
        } else {
          const h = await getHousehold();
          setHousehold(h);
        }
      } else {
        const h = await getHousehold();
        setHousehold(h);
      }

      const count = await getOfflineQueueCount();
      setOfflineQueueCount(count);
    }
    load();

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const switchUser = (role: 'jason' | 'wife' | 'family') => {
    const user = DEFAULT_USERS[role];
    setCurrentUser(user);
    localStorage.setItem('movetrack_active_user', role);
  };

  const updateHouseholdName = async (name: string, address: string) => {
    if (!household) return;
    const updated = { ...household, name, address };
    setHousehold(updated);
    await saveHousehold(updated);

    if (isOnline) {
      await saveHouseholdToSupabase(updated);
    }
  };

  const refreshOfflineCount = async () => {
    const count = await getOfflineQueueCount();
    setOfflineQueueCount(count);
  };

  return (
    <HouseholdContext.Provider
      value={{
        household,
        currentUser,
        isOnline,
        offlineQueueCount,
        isCloudConfigured,
        switchUser,
        updateHouseholdName,
        refreshOfflineCount,
      }}
    >
      {children}
    </HouseholdContext.Provider>
  );
};

export function useHousehold() {
  const context = useContext(HouseholdContext);
  if (!context) throw new Error('useHousehold must be used within a HouseholdProvider');
  return context;
}
