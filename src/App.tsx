import React, { useState } from 'react';
import { HouseholdProvider, useHousehold } from './context/HouseholdContext';
import { ItemProvider, useItems } from './context/ItemContext';
import { Header } from './components/layout/Header';
import { BottomNav, NavTab } from './components/layout/BottomNav';
import { OfflineBanner } from './components/layout/OfflineBanner';
import { ItemList } from './components/items/ItemList';
import { ItemFormModal } from './components/items/ItemFormModal';
import { ItemDetailModal } from './components/items/ItemDetailModal';
import { BoxList } from './components/boxes/BoxList';
import { BoxDetailModal } from './components/boxes/BoxDetailModal';
import { BoxQrScannerModal } from './components/boxes/BoxQrScannerModal';
import { BoxPrintSheet } from './components/boxes/BoxPrintSheet';
import { DecisionMatrix } from './components/decisions/DecisionMatrix';
import { RelocationHub } from './components/logistics/RelocationHub';
import { SpouseInviteModal } from './components/onboarding/SpouseInviteModal';
import { SettingsModal } from './components/settings/SettingsModal';
import { AuthModal } from './components/auth/AuthModal';
import { HouseholdPinModal } from './components/auth/HouseholdPinModal';
import { Box, Item } from './types';

const AppContent: React.FC = () => {
  const { items, boxes, setFilter } = useItems();
  const { session, isPinUnlocked, unlockPin, household, isCloudConfigured } = useHousehold();

  // Navigation tab
  const [currentTab, setCurrentTab] = useState<NavTab>('items');
  const [bypassAuth, setBypassAuth] = useState<boolean>(false);

  // Modals state by ID to prevent stale state snapshots
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  const [selectedBoxId, setSelectedBoxId] = useState<string | null>(null);
  const [printingBox, setPrintingBox] = useState<Box | null>(null);
  const [showScanner, setShowScanner] = useState<boolean>(false);
  const [showPrintSheet, setShowPrintSheet] = useState<boolean>(false);

  const [showInviteModal, setShowInviteModal] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);

  // Derived current models
  const selectedItem = items.find((i) => i.id === selectedItemId) || null;
  const editingItem = items.find((i) => i.id === editingItemId) || null;
  const selectedBox = boxes.find((b) => b.id === selectedBoxId) || null;

  // Security gate checks
  const isAuthLocked = isCloudConfigured && !session && !bypassAuth;
  const isPinLocked = (!isCloudConfigured || session || bypassAuth) && !isPinUnlocked;
  const isLocked = isAuthLocked || isPinLocked;

  // When an item is selected from inside a box modal
  const handleSelectItemFromBox = (item: Item) => {
    setSelectedBoxId(null);
    setSelectedItemId(item.id);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans antialiased text-slate-900 pb-16">
      {/* 1. Header */}
      <Header
        onOpenInvite={() => setShowInviteModal(true)}
        onOpenSettings={() => setShowSettings(true)}
        onSelectOwnerFilter={(owner) => setFilter('owner', owner)}
      />

      {/* 2. Offline / Bomb Shelter banner */}
      <OfflineBanner />

      {/* 3. Main Body - Gated when locked */}
      {!isLocked && (
        <>
          <main className="flex-1 max-w-4xl w-full mx-auto p-3.5 sm:p-4">
            {currentTab === 'items' && (
              <ItemList
                onSelectItem={(item) => setSelectedItemId(item.id)}
                onOpenAddModal={() => setShowAddModal(true)}
              />
            )}

            {currentTab === 'boxes' && (
              <BoxList
                onSelectBox={(box) => setSelectedBoxId(box.id)}
                onOpenScanner={() => setShowScanner(true)}
                onOpenPrintSheet={() => {
                  setPrintingBox(null);
                  setShowPrintSheet(true);
                }}
              />
            )}

            {currentTab === 'decisions' && (
              <DecisionMatrix onSelectItem={(item) => setSelectedItemId(item.id)} />
            )}

            {currentTab === 'logistics' && <RelocationHub />}
          </main>

          {/* 4. Bottom Navigation Bar */}
          <BottomNav
            currentTab={currentTab}
            onTabChange={(tab) => setCurrentTab(tab)}
            onOpenAddModal={() => setShowAddModal(true)}
            itemsCount={items.length}
            boxesCount={boxes.length}
          />
        </>
      )}

      {/* 5. Modals & Sheets */}
      {showAddModal && (
        <ItemFormModal
          onClose={() => setShowAddModal(false)}
          onSaved={(newItem) => setSelectedItemId(newItem.id)}
        />
      )}

      {selectedItem && (
        <ItemDetailModal
          item={selectedItem}
          boxes={boxes}
          onClose={() => setSelectedItemId(null)}
          onEdit={() => {
            setEditingItemId(selectedItem.id);
            setSelectedItemId(null);
          }}
        />
      )}

      {editingItem && (
        <ItemFormModal
          initialItem={editingItem}
          onClose={() => setEditingItemId(null)}
          onSaved={(updated) => setSelectedItemId(updated.id)}
        />
      )}

      {selectedBox && (
        <BoxDetailModal
          box={selectedBox}
          onClose={() => setSelectedBoxId(null)}
          onSelectItem={handleSelectItemFromBox}
          onPrint={(b) => {
            setPrintingBox(b);
            setShowPrintSheet(true);
          }}
        />
      )}

      {showScanner && (
        <BoxQrScannerModal
          boxes={boxes}
          onClose={() => setShowScanner(false)}
          onBoxFound={(foundBox) => {
            setShowScanner(false);
            setSelectedBoxId(foundBox.id);
          }}
        />
      )}

      {showPrintSheet && (
        <BoxPrintSheet
          boxes={printingBox ? [printingBox] : boxes}
          items={items}
          householdName={household?.name}
          onClose={() => {
            setShowPrintSheet(false);
            setPrintingBox(null);
          }}
        />
      )}

      {showInviteModal && (
        <SpouseInviteModal onClose={() => setShowInviteModal(false)} />
      )}

      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}

      {/* 6. Security Gates: Supabase Auth Modal & Household PIN Gate */}
      {isAuthLocked && (
        <AuthModal onBypass={() => setBypassAuth(true)} />
      )}

      {isPinLocked && (
        <HouseholdPinModal
          correctPin={household?.security_pin || '884488'}
          onSuccess={unlockPin}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <HouseholdProvider>
      <ItemProvider>
        <AppContent />
      </ItemProvider>
    </HouseholdProvider>
  );
}
