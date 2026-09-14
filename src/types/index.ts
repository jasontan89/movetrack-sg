export type Owner = 'jason' | 'wife' | 'shared';

export type Room =
  | 'living_room'
  | 'master_bedroom'
  | 'bedroom_2_study'
  | 'bedroom_3'
  | 'kitchen'
  | 'bomb_shelter_store'
  | 'service_yard'
  | 'other';

export type Category =
  | 'electronics_av'
  | 'computer_office'
  | 'appliances'
  | 'furniture'
  | 'kitchenware'
  | 'tools_hardware'
  | 'personal_keepsakes'
  | 'clothing_bedding'
  | 'books_documents'
  | 'other';

export type DecisionStatus =
  | 'keep_pack'
  | 'sell_carousell'
  | 'donate_bless'
  | 'hdb_bulky_disposal'
  | 'alba_ewaste'
  | 'discard_trash'
  | 'undecided_discuss';

export type CarousellStatus = 'draft' | 'listed' | 'reserved' | 'sold';

export interface Dimensions {
  length: number; // in cm
  width: number;  // in cm
  height: number; // in cm
}

export interface CarousellDetails {
  asking_price?: number;
  sold_price?: number;
  listing_url?: string;
  status?: CarousellStatus;
}

export interface Item {
  id: string;
  household_id: string;
  name: string;
  owner: Owner;
  room: Room;
  category: Category;
  photo_url?: string;
  dimensions_cm: Dimensions;
  weight_kg: number;
  cbm: number; // Calculated volume (L x W x H / 1,000,000)
  is_fragile: boolean;
  disassembly_required: boolean;
  has_original_box: boolean;
  has_cables_accessories: boolean;
  decision_status: DecisionStatus;
  box_id?: string | null;
  carousell_details?: CarousellDetails;
  notes?: string;
  ai_generated_fields?: string[];
  created_at: string;
  updated_at: string;
  synced?: boolean;
}

export interface Box {
  id: string;
  household_id: string;
  box_number: number;
  label: string;
  room_destination: string;
  is_fragile: boolean;
  qr_code_id: string;
  notes?: string;
  created_at: string;
}

export interface Household {
  id: string;
  name: string;
  address: string;
  invite_code: string;
  security_pin?: string;
  created_at: string;
}

export interface UserProfile {
  id: string;
  display_name: string;
  role: 'jason' | 'wife' | 'family';
  avatar_color: string;
}

export interface FilterOptions {
  owner: 'all' | Owner;
  room: 'all' | Room;
  category: 'all' | Category;
  decision: 'all' | DecisionStatus;
  searchQuery: string;
  boxId?: 'all' | 'unboxed' | string;
  onlyFragile?: boolean;
  needsDisassembly?: boolean;
}

export interface LorryRecommendation {
  lorryType: '10ft' | '14ft' | '24ft' | 'Multiple Trips';
  capacityCbm: string;
  description: string;
  suitableFor: string;
  estimatedTrips: number;
}
