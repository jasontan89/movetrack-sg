import React from 'react';
import { useHousehold } from '../../context/HouseholdContext';
import { WifiOff, Info } from 'lucide-react';

export const OfflineBanner: React.FC = () => {
  const { isOnline, offlineQueueCount } = useHousehold();

  if (isOnline && offlineQueueCount === 0) return null;

  return (
    <div className="bg-amber-500 text-white text-xs px-4 py-1.5 flex items-center justify-between gap-2 shadow-inner">
      <div className="flex items-center gap-1.5 max-w-4xl mx-auto w-full">
        <WifiOff size={14} className="shrink-0" />
        <span className="font-medium">
          {!isOnline
            ? 'Bomb Shelter / Offline Mode: All edits and photos are saved locally to IndexedDB.'
            : `${offlineQueueCount} local item(s) syncing to cloud...`}
        </span>
      </div>
    </div>
  );
};
