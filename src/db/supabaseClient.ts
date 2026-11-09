import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Item, Box, Household } from '../types';

const SUPABASE_URL_KEY = 'movetrack_supabase_url';
const SUPABASE_ANON_KEY = 'movetrack_supabase_anon_key';

let cachedClient: SupabaseClient | null = null;

const DEFAULT_SUPABASE_URL = 'https://lekqqpjjqksixzacbtqz.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxla3FxcGpqcWtzaXh6YWNidHF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIxNTg3OTIsImV4cCI6MjA5NzczNDc5Mn0.lm3RSzROrUXSf7PebicPrXHPErQldVBxxcDzUGHme5Y';

export function getSupabaseCredentials() {
  const url =
    localStorage.getItem(SUPABASE_URL_KEY) ||
    import.meta.env.VITE_SUPABASE_URL ||
    DEFAULT_SUPABASE_URL;
  const anonKey =
    localStorage.getItem(SUPABASE_ANON_KEY) ||
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    DEFAULT_SUPABASE_ANON_KEY;
  return { url, anonKey, isConfigured: Boolean(url && anonKey) };
}

export function saveSupabaseCredentials(url: string, anonKey: string) {
  if (url && anonKey) {
    localStorage.setItem(SUPABASE_URL_KEY, url.trim());
    localStorage.setItem(SUPABASE_ANON_KEY, anonKey.trim());
  } else {
    localStorage.removeItem(SUPABASE_URL_KEY);
    localStorage.removeItem(SUPABASE_ANON_KEY);
  }
  cachedClient = null;
}

export function getSupabaseClient(): SupabaseClient | null {
  const { url, anonKey, isConfigured } = getSupabaseCredentials();
  if (!isConfigured) return null;

  if (!cachedClient) {
    cachedClient = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
  return cachedClient;
}

// Upload photo to Supabase Storage bucket 'movetrack-photos'
export async function uploadPhotoToSupabase(file: File, itemId: string): Promise<string | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const fileExt = file.name.split('.').pop() || 'webp';
    const filePath = `items/${itemId}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await client.storage
      .from('movetrack-photos')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      console.error('Supabase storage upload error:', uploadError);
      return null;
    }

    const { data } = client.storage.from('movetrack-photos').getPublicUrl(filePath);
    return data?.publicUrl || null;
  } catch (err) {
    console.error('Failed to upload image to Supabase:', err);
    return null;
  }
}

// Upload base64 photo data URL directly to Supabase Storage
export async function uploadBase64PhotoToSupabase(
  dataUrl: string,
  itemId: string
): Promise<string | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    if (dataUrl.startsWith('http://') || dataUrl.startsWith('https://')) {
      return dataUrl;
    }

    const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) return null;

    const mimeType = match[1];
    const base64Data = match[2];

    const binaryStr = atob(base64Data);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    const ext = mimeType.split('/')[1] || 'webp';
    const filePath = `items/${itemId}-${Date.now()}.${ext}`;

    const { error: uploadError } = await client.storage
      .from('movetrack-photos')
      .upload(filePath, bytes.buffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (uploadError) {
      console.error('Supabase storage base64 upload error:', uploadError);
      return null;
    }

    const { data } = client.storage.from('movetrack-photos').getPublicUrl(filePath);
    return data?.publicUrl || null;
  } catch (err) {
    console.error('Failed to upload base64 photo to Supabase:', err);
    return null;
  }
}


// Delete a photo from Supabase Storage bucket 'movetrack-photos'
export async function deletePhotoFromSupabase(photoUrl: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client || !photoUrl) return false;

  try {
    const bucketMarker = '/movetrack-photos/';
    const idx = photoUrl.indexOf(bucketMarker);
    if (idx === -1) return false;
    const path = photoUrl.substring(idx + bucketMarker.length);
    const { error } = await client.storage.from('movetrack-photos').remove([path]);
    return !error;
  } catch (err) {
    console.warn('Failed to delete photo from Supabase storage:', err);
    return false;
  }
}

// Fetch all items from Supabase movetrack_items
export async function fetchItemsFromSupabase(householdId?: string): Promise<Item[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    let query = client
      .from('movetrack_items')
      .select('*')
      .order('created_at', { ascending: false });

    if (householdId) {
      query = query.eq('household_id', householdId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching items from Supabase:', error);
      return null;
    }
    return data as Item[];
  } catch (e) {
    console.error('Supabase items fetch exception:', e);
    return null;
  }
}

// Fetch all boxes from Supabase movetrack_boxes
export async function fetchBoxesFromSupabase(householdId?: string): Promise<Box[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    let query = client
      .from('movetrack_boxes')
      .select('*')
      .order('box_number', { ascending: true });

    if (householdId) {
      query = query.eq('household_id', householdId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching boxes from Supabase:', error);
      return null;
    }
    return data as Box[];
  } catch (e) {
    console.error('Supabase boxes fetch exception:', e);
    return null;
  }
}

// Fetch household from Supabase movetrack_households
export async function fetchHouseholdFromSupabase(householdId?: string): Promise<Household | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    let query = client.from('movetrack_households').select('*');
    if (householdId) {
      query = query.eq('id', householdId);
    }
    const { data, error } = await query.limit(1).maybeSingle();

    if (error) {
      console.error('Error fetching household from Supabase:', error);
      return null;
    }
    return data as Household | null;
  } catch (e) {
    console.error('Supabase household fetch exception:', e);
    return null;
  }
}

// Save or update item directly in Supabase
export async function saveItemToSupabase(item: Item): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.from('movetrack_items').upsert({
      id: item.id,
      household_id: item.household_id,
      name: item.name,
      owner: item.owner,
      room: item.room,
      category: item.category,
      photo_url: item.photo_url,
      dimensions_cm: item.dimensions_cm,
      weight_kg: item.weight_kg,
      cbm: item.cbm,
      is_fragile: item.is_fragile,
      disassembly_required: item.disassembly_required,
      has_original_box: item.has_original_box,
      has_cables_accessories: item.has_cables_accessories,
      decision_status: item.decision_status,
      box_id: item.box_id,
      carousell_details: item.carousell_details,
      notes: item.notes,
      ai_generated_fields: item.ai_generated_fields || [],
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.error('Error saving item to Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Exception saving item to Supabase:', err);
    return false;
  }
}

// Delete item from Supabase
export async function deleteItemFromSupabase(id: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.from('movetrack_items').delete().eq('id', id);
    return !error;
  } catch {
    return false;
  }
}

// Save box directly to Supabase
export async function saveBoxToSupabase(box: Box): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.from('movetrack_boxes').upsert(box);
    return !error;
  } catch {
    return false;
  }
}

// Delete box from Supabase
export async function deleteBoxFromSupabase(id: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.from('movetrack_boxes').delete().eq('id', id);
    return !error;
  } catch {
    return false;
  }
}

// Save household to Supabase
export async function saveHouseholdToSupabase(household: Household): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.from('movetrack_households').upsert(household);
    return !error;
  } catch {
    return false;
  }
}

// Purge all items and boxes for a given household from Supabase tables
export async function purgeAllFromSupabase(householdId?: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    let itemsQuery = client.from('movetrack_items').delete();
    let boxesQuery = client.from('movetrack_boxes').delete();

    if (householdId) {
      itemsQuery = itemsQuery.eq('household_id', householdId);
      boxesQuery = boxesQuery.eq('household_id', householdId);
    } else {
      itemsQuery = itemsQuery.neq('id', '0');
      boxesQuery = boxesQuery.neq('id', '0');
    }

    const [resItems, resBoxes] = await Promise.all([itemsQuery, boxesQuery]);
    return !resItems.error && !resBoxes.error;
  } catch (err) {
    console.error('Exception purging Supabase items/boxes:', err);
    return false;
  }
}

// Real-time listener subscription with household scoping
export function subscribeToSupabaseChanges(
  onItemChange: (payload: any) => void,
  onBoxChange: (payload: any) => void,
  householdId?: string
) {
  const client = getSupabaseClient();
  if (!client) return () => {};

  const channelName = householdId
    ? `movetrack-realtime-${householdId}`
    : 'movetrack-realtime-channel';

  const itemsFilter = householdId ? `household_id=eq.${householdId}` : undefined;
  const boxesFilter = householdId ? `household_id=eq.${householdId}` : undefined;

  const channel = client
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'movetrack_items',
        filter: itemsFilter,
      },
      onItemChange
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'movetrack_boxes',
        filter: boxesFilter,
      },
      onBoxChange
    )
    .subscribe();

  return () => {
    client.removeChannel(channel);
  };
}

// Supabase Auth RPC to join household by invite code & optional PIN
export async function joinHouseholdRpc(
  inviteCode: string,
  securityPin?: string
): Promise<{ data: string | null; error: any }> {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: new Error('Supabase client not configured') };
  const { data, error } = await client.rpc('join_movetrack_household', {
    p_invite_code: inviteCode,
    p_security_pin: securityPin || null,
  });
  return { data, error };
}

// Supabase Auth Methods
export async function signInWithMagicLink(email: string): Promise<{ error: any }> {
  const client = getSupabaseClient();
  if (!client) return { error: new Error('Supabase client not configured') };
  const redirectUrl = window.location.origin + window.location.pathname;
  return client.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirectUrl,
    },
  });
}

export async function signInWithPassword(
  email: string,
  password: string
): Promise<{ data: any; error: any }> {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: new Error('Supabase client not configured') };
  return client.auth.signInWithPassword({ email, password });
}

export async function signUpWithPassword(
  email: string,
  password: string
): Promise<{ data: any; error: any }> {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: new Error('Supabase client not configured') };
  return client.auth.signUp({ email, password });
}

export async function signOutSupabase(): Promise<{ error: any }> {
  const client = getSupabaseClient();
  if (!client) return { error: null };
  return client.auth.signOut();
}

export async function getSupabaseSession(): Promise<any> {
  const client = getSupabaseClient();
  if (!client) return null;
  const { data } = await client.auth.getSession();
  return data?.session || null;
}

export function onSupabaseAuthChange(callback: (session: any) => void) {
  const client = getSupabaseClient();
  if (!client) return () => {};
  const {
    data: { subscription },
  } = client.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });
  return () => {
    subscription.unsubscribe();
  };
}

export const SUPABASE_SQL_SCHEMA = `-- MoveTrack SG Complete Database Schema (PostgreSQL / Supabase)

CREATE TABLE IF NOT EXISTS public.movetrack_households (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  destination_address TEXT,
  move_date DATE,
  invite_code TEXT NOT NULL,
  security_pin TEXT DEFAULT '123456',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.movetrack_household_members (
  household_id TEXT NOT NULL REFERENCES public.movetrack_households(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (household_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.movetrack_boxes (
  id TEXT PRIMARY KEY,
  household_id TEXT NOT NULL REFERENCES public.movetrack_households(id) ON DELETE CASCADE,
  box_number INT NOT NULL,
  label TEXT NOT NULL,
  room_destination TEXT,
  is_fragile BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'packing',
  qr_code_id TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.movetrack_items (
  id TEXT PRIMARY KEY,
  household_id TEXT NOT NULL REFERENCES public.movetrack_households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  owner TEXT NOT NULL,
  room TEXT NOT NULL,
  category TEXT NOT NULL,
  photo_url TEXT,
  dimensions_cm JSONB DEFAULT '{"length": 0, "width": 0, "height": 0}'::jsonb,
  weight_kg NUMERIC DEFAULT 0,
  cbm NUMERIC DEFAULT 0,
  is_fragile BOOLEAN DEFAULT false,
  disassembly_required BOOLEAN DEFAULT false,
  has_original_box BOOLEAN DEFAULT false,
  has_cables_accessories BOOLEAN DEFAULT false,
  decision_status TEXT NOT NULL,
  box_id TEXT REFERENCES public.movetrack_boxes(id) ON DELETE SET NULL,
  carousell_details JSONB DEFAULT '{}'::jsonb,
  notes TEXT,
  ai_generated_fields JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance covering indexes
CREATE INDEX IF NOT EXISTS idx_movetrack_boxes_household ON public.movetrack_boxes(household_id);
CREATE INDEX IF NOT EXISTS idx_movetrack_items_household ON public.movetrack_items(household_id);
CREATE INDEX IF NOT EXISTS idx_movetrack_items_box ON public.movetrack_items(box_id);
CREATE INDEX IF NOT EXISTS idx_movetrack_members_user ON public.movetrack_household_members(user_id);

ALTER TABLE public.movetrack_households ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movetrack_household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movetrack_boxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movetrack_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow members and anon household access" ON public.movetrack_households FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow members and anon boxes access" ON public.movetrack_boxes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow members and anon items access" ON public.movetrack_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Members view own memberships" ON public.movetrack_household_members FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
`;
