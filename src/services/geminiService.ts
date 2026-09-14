import { Category, DecisionStatus, Dimensions, Room } from '../types';

export interface AiItemExtraction {
  name: string;
  category: Category;
  room: Room;
  dimensions_cm: Dimensions;
  weight_kg: number;
  is_fragile: boolean;
  disassembly_required: boolean;
  decision_status: DecisionStatus;
  carousell_asking_price?: number;
  notes?: string;
  extractedFields: string[]; // List of fields successfully extracted by AI
  modelUsed: string;
}

const VALID_CATEGORIES: Category[] = [
  'electronics_av',
  'computer_office',
  'appliances',
  'furniture',
  'kitchenware',
  'tools_hardware',
  'personal_keepsakes',
  'clothing_bedding',
  'books_documents',
  'other',
];

const VALID_ROOMS: Room[] = [
  'living_room',
  'master_bedroom',
  'bedroom_2_study',
  'bedroom_3',
  'kitchen',
  'bomb_shelter_store',
  'service_yard',
  'other',
];

const VALID_DECISIONS: DecisionStatus[] = [
  'keep_pack',
  'sell_carousell',
  'donate_bless',
  'hdb_bulky_disposal',
  'alba_ewaste',
  'discard_trash',
  'undecided_discuss',
];

/**
 * Converts a data URL or external image URL to base64 and mime type.
 */
async function getImageBase64(imageUrl: string): Promise<{ mimeType: string; data: string }> {
  if (imageUrl.startsWith('data:')) {
    const match = imageUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (match) {
      return {
        mimeType: match[1],
        data: match[2],
      };
    }
  }

  // If it's a remote URL (e.g. Supabase storage), fetch and convert to base64
  const response = await fetch(imageUrl);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const match = result.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        resolve({ mimeType: match[1], data: match[2] });
      } else {
        reject(new Error('Failed to parse converted base64 image'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Call Gemini API with a specific model
 */
async function callGeminiApi(
  model: string,
  apiKey: string,
  imageData: { mimeType: string; data: string }
): Promise<any> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  const prompt = `You are MoveTrack SG's AI Relocation Assistant for a Bukit Batok HDB 4-room flat move in Singapore.
Analyze this photo of household equipment/item and extract detailed physical, logistical, and relocation fields.

Return ONLY a valid, raw JSON object (no markdown code blocks, no backticks, just valid JSON) matching this schema:
{
  "name": "Specific brand, model, and item name (e.g., 'Prism+ 34-inch Curved Ultrawide Monitor', 'Dyson V12 Detect Slim', 'Omnidesk Pro Standing Desk', 'Sony WH-1000XM5 Headphones')",
  "category": "One of: 'electronics_av' | 'computer_office' | 'appliances' | 'furniture' | 'kitchenware' | 'tools_hardware' | 'personal_keepsakes' | 'clothing_bedding' | 'books_documents' | 'other'",
  "room": "Suggested HDB destination room, one of: 'living_room' | 'master_bedroom' | 'bedroom_2_study' | 'bedroom_3' | 'kitchen' | 'bomb_shelter_store' | 'service_yard' | 'other'",
  "dimensions_cm": {
    "length": number (estimated in centimeters, realistic for this object),
    "width": number (estimated in centimeters),
    "height": number (estimated in centimeters)
  },
  "weight_kg": number (estimated gross weight in kg, e.g. 5.5),
  "is_fragile": boolean (true for monitors, TVs, glass, sensitive electronics, audio components, porcelain),
  "disassembly_required": boolean (true for large desks, bed frames, multi-segment shelves, wall mounts),
  "decision_status": "Recommended Singapore move action, one of: 'keep_pack' | 'sell_carousell' | 'donate_bless' | 'hdb_bulky_disposal' | 'alba_ewaste' | 'discard_trash' | 'undecided_discuss'",
  "carousell_asking_price": number (estimated secondhand price in SGD if sellable on Carousell, or 0 if not suitable),
  "notes": "Short condition note or packing advice (e.g. 'Condition: Good. Protect screen with bubble wrap before packing.')"
}`;

  const payload = {
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inline_data: {
              mime_type: imageData.mimeType,
              data: imageData.data,
            },
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: 'application/json',
    },
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Gemini API error [${response.status}]: ${errBody}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Empty response received from Gemini API');
  }

  // Clean any markdown formatting if present
  const cleanedJson = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleanedJson);
}

/**
 * Analyzes an equipment photo using Gemini Flash Lite with primary model and secondary fallback.
 */
export async function analyzeEquipmentPhoto(imageUrl: string): Promise<AiItemExtraction> {
  const apiKey =
    (import.meta as any).env.VITE_GEMINI_API_KEY?.trim() ||
    (typeof window !== 'undefined' && localStorage.getItem('movetrack_gemini_api_key')) ||
    (typeof window !== 'undefined' && (window as any).__MOCK_GEMINI_API_KEY__);

  if (!apiKey) {
    throw new Error(
      'Gemini API key is not configured. Please set VITE_GEMINI_API_KEY in your .env file.'
    );
  }

  const primaryModel =
    (import.meta as any).env.VITE_GEMINI_MODEL?.trim() || 'gemini-3.5-flash-lite';
  const fallbackModel =
    (import.meta as any).env.VITE_GEMINI_FALLBACK_MODEL?.trim() || 'gemini-3.1-flash-lite';

  const imageData = await getImageBase64(imageUrl);

  let rawResult: any = null;
  let modelUsed = primaryModel;

  try {
    rawResult = await callGeminiApi(primaryModel, apiKey, imageData);
  } catch (primaryError: any) {
    console.warn(
      `Primary model '${primaryModel}' failed. Falling back to '${fallbackModel}'...`,
      primaryError
    );
    try {
      modelUsed = fallbackModel;
      rawResult = await callGeminiApi(fallbackModel, apiKey, imageData);
    } catch (fallbackError: any) {
      console.error(`Fallback model '${fallbackModel}' also failed.`, fallbackError);
      throw new Error(
        `Gemini AI analysis failed: ${fallbackError.message || 'Unable to analyze photo'}`
      );
    }
  }

  // Validate and sanitize response
  const name =
    typeof rawResult.name === 'string' && rawResult.name.trim()
      ? rawResult.name.trim()
      : 'Unidentified Equipment';

  const category = VALID_CATEGORIES.includes(rawResult.category)
    ? rawResult.category
    : 'electronics_av';

  const room = VALID_ROOMS.includes(rawResult.room) ? rawResult.room : 'living_room';

  const decision_status = VALID_DECISIONS.includes(rawResult.decision_status)
    ? rawResult.decision_status
    : 'keep_pack';

  const dimensions_cm: Dimensions = {
    length: Math.max(0, Number(rawResult.dimensions_cm?.length) || 0),
    width: Math.max(0, Number(rawResult.dimensions_cm?.width) || 0),
    height: Math.max(0, Number(rawResult.dimensions_cm?.height) || 0),
  };

  const weight_kg = Math.max(0, Number(rawResult.weight_kg) || 0);
  const is_fragile = Boolean(rawResult.is_fragile);
  const disassembly_required = Boolean(rawResult.disassembly_required);
  const carousell_asking_price = Math.max(0, Number(rawResult.carousell_asking_price) || 0);
  const notes = typeof rawResult.notes === 'string' ? rawResult.notes.trim() : '';

  // Collect the fields populated by AI
  const extractedFields: string[] = [
    'name',
    'category',
    'room',
    'dimensions_cm',
    'weight_kg',
    'is_fragile',
    'disassembly_required',
    'decision_status',
  ];
  if (carousell_asking_price > 0) extractedFields.push('carousell_price');
  if (notes) extractedFields.push('notes');

  return {
    name,
    category,
    room,
    dimensions_cm,
    weight_kg,
    is_fragile,
    disassembly_required,
    decision_status,
    carousell_asking_price: carousell_asking_price > 0 ? carousell_asking_price : undefined,
    notes,
    extractedFields,
    modelUsed,
  };
}
