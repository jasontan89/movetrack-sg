# MoveTrack SG — Bukit Batok 4-Room Relocation & Equipment Tracker PWA

A mobile-first Progressive Web Application (PWA) designed for Jason and his wife to catalog, manage decisions, and track relocation logistics for equipment, electronics, and personal belongings from their Bukit Batok 4-Room HDB flat in Singapore.

---

## Key Features

- **Live Cloud Sync via Supabase**: Direct PostgreSQL persistence with real-time updates across multiple mobile phones.
  - Isolated database tables: `movetrack_households`, `movetrack_boxes`, `movetrack_items`.
  - Photo storage in `movetrack-photos` bucket.
- **Offline Bomb Shelter Mode**: Powered by IndexedDB (`MoveTrackSG_DB`). Keeps working even inside reinforced concrete bomb shelters / store rooms with dead zones, auto-syncing when reconnected.
- **Client-Side Photo Compression**: Auto-compresses camera snaps down to ~200-300KB WebP for fast uploads.
- **Spouse One-Click Onboarding**: WhatsApp invite link (`?join=BB4RM8&user=wife`) and scannable QR code for wife to join instantly with one tap.
- **Equipment & Logistics Tracking**:
  - Dimensions (L × W × H in cm), Gross Weight (kg), and automated volume calculation in Cubic Meters (CBM).
  - Fragile flags, disassembly required, original box available, and cables intact.
  - 1-Tap Quick Presets for 27" Monitors, 34" Ultrawide displays, 55" OLED TVs, standing desks, PC towers, PS5, microwaves, etc.
- **Moving Boxes & QR Code Labels**:
  - Box packing assignment by room.
  - Printable QR code label sheet (`window.print()`).
  - In-app camera QR scanner to view box contents without opening the tape.
- **Singapore Relocation Hub**:
  - Singapore Mover Lorry Size Estimator (10ft vs 14ft vs 24ft).
  - 1-Click PDF Mover Manifest & CSV export.
  - Jurong-Clementi Town Council 3-item free bulky removal quota tracker.
  - Carousell declutter earnings calculator.
  - ALBA E-Waste drop-off points directory in Bukit Batok.

---

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Create a `.env` file in the project root:
```env
VITE_SUPABASE_URL=https://lekqqpjjqksixzacbtqz.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 3. Run Development Server
```bash
npm run dev
```

### 4. Build for Production / PWA
```bash
npm run build
npm run preview
```

---

## Deployment
Deploy effortlessly to Vercel, Netlify, or Cloudflare Pages with build command `npm run build` and publish directory `dist`.
