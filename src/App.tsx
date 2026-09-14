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

  // Modals state
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  const [selectedBox, setSelectedBox] = useState<Box | null>(null);
  const [showScanner, setShowScanner] = useState<boolean>(false);
  const [showPrintSheet, setShowPrintSheet] = useState<boolean>(false);

  const [showInviteModal, setShowInviteModal] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);

  // When an item is selected from inside a box modal
  const handleSelectItemFromBox = (item: Item) => {
    setSelectedBox(null);
    setSelectedItem(item);
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

      {/* 3. Main Body */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-3.5 sm:p-4">
        {currentTab === 'items' && (
          <ItemList
            onSelectItem={(item) => setSelectedItem(item)}
            onOpenAddModal={() => setShowAddModal(true)}
          />
        )}

        {currentTab === 'boxes' && (
          <BoxList
            onSelectBox={(box) => setSelectedBox(box)}
            onOpenScanner={() => setShowScanner(true)}
            onOpenPrintSheet={() => setShowPrintSheet(true)}
          />
        )}

        {currentTab === 'decisions' && (
          <DecisionMatrix onSelectItem={(item) => setSelectedItem(item)} />
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

      {/* 5. Modals & Sheets */}
      {showAddModal && (
        <ItemFormModal
          onClose={() => setShowAddModal(false)}
          onSaved={(newItem) => setSelectedItem(newItem)}
        />
      )}

      {selectedItem && (
        <ItemDetailModal
          item={selectedItem}
          boxes={boxes}
          onClose={() => setSelectedItem(null)}
          onEdit={() => {
            setEditingItem(selectedItem);
            setSelectedItem(null);
          }}
        />
      )}

      {editingItem && (
        <ItemFormModal
          initialItem={editingItem}
          onClose={() => setEditingItem(null)}
          onSaved={(updated) => setSelectedItem(updated)}
        />
      )}

      {selectedBox && (
        <BoxDetailModal
          box={selectedBox}
          onClose={() => setSelectedBox(null)}
          onSelectItem={handleSelectItemFromBox}
        />
      )}

      {showScanner && (
        <BoxQrScannerModal
          boxes={boxes}
          onClose={() => setShowScanner(false)}
          onBoxFound={(foundBox) => {
            setShowScanner(false);
            setSelectedBox(foundBox);
          }}
        />
      )}

      {showPrintSheet && (
        <BoxPrintSheet
          boxes={boxes}
          items={items}
          onClose={() => setShowPrintSheet(false)}
        />
      )}

      {showInviteModal && (
        <SpouseInviteModal onClose={() => setShowInviteModal(false)} />
      )}

      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}

      {/* 6. Security Gates: Supabase Auth Modal & Household PIN Gate */}
      {isCloudConfigured && !session && (
        <AuthModal />
      )}

      {(!isCloudConfigured || session) && !isPinUnlocked && (
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
