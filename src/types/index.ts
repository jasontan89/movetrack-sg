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
  | 'keep_pack'          // Move to New Rental House (Condo)
  | 'move_hq'            // Move to Mom's House (HQ)
  | 'sell_carousell'
  | 'donate_bless'
  | 'hdb_bulky_disposal'
  | 'alba_ewaste'
  | 'discard_trash'
  | 'undecided_discuss';

export type MoveDestinationScope = 'all' | 'rental_condo' | 'moms_hq';

export function isMovingDecision(status: DecisionStatus): boolean {
  return status === 'keep_pack' || status === 'move_hq';
}

export function getBoxDestinationHouse(
  box: { room_destination?: string; label?: string; notes?: string },
  boxItems: { decision_status: DecisionStatus }[] = []
): 'rental_condo' | 'moms_hq' {
  const combinedText = `${box.room_destination || ''} ${box.label || ''} ${box.notes || ''}`.toLowerCase();
  if (combinedText.includes('mom') || combinedText.includes('hq')) {
    return 'moms_hq';
  }
  if (combinedText.includes('condo') || combinedText.includes('rental')) {
    return 'rental_condo';
  }
  if (boxItems.length > 0 && boxItems.every((i) => i.decision_status === 'move_hq')) {
    return 'moms_hq';
  }
  return 'rental_condo';
}

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

export type BoxStatus = 'packing' | 'sealed' | 'loaded' | 'delivered' | 'unpacked';

export interface Box {
  id: string;
  household_id: string;
  box_number: number;
  label: string;
  room_destination: string;
  is_fragile: boolean;
  status?: BoxStatus;
  qr_code_id: string;
  notes?: string;
  created_at: string;
}

export interface Household {
  id: string;
  name: string;
  address: string;
  destination_address?: string;
  move_date?: string;
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

export type SortOption = 'date_desc' | 'date_asc' | 'name_asc' | 'weight_desc' | 'cbm_desc' | 'price_desc';

export interface FilterOptions {
  owner: 'all' | Owner;
  room: 'all' | Room;
  category: 'all' | Category;
  decision: 'all' | DecisionStatus;
  searchQuery: string;
  boxId?: 'all' | 'unboxed' | string;
  onlyFragile?: boolean;
  needsDisassembly?: boolean;
  sortBy?: SortOption;
}

export interface LorryRecommendation {
  lorryType: '10ft' | '14ft' | '24ft' | 'Multiple Trips';
  capacityCbm: string;
  description: string;
  suitableFor: string;
  estimatedTrips: number;
}
