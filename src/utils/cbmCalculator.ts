import { Dimensions, isMovingDecision, Item, Box, LorryRecommendation } from '../types';

export function calculateCbm(dims: Dimensions): number {
  if (!dims || dims.length <= 0 || dims.width <= 0 || dims.height <= 0) return 0;
  // Length (cm) * Width (cm) * Height (cm) / 1,000,000 = CBM
  const rawCbm = (dims.length * dims.width * dims.height) / 1000000;
  return Math.round(rawCbm * 1000) / 1000;
}

export function calculateTotalLogistics(items: Item[], boxes: Box[] = []) {
  // Count items moving to either Condo ('keep_pack') or HQ ('move_hq')
  const movingItems = items.filter((item) => isMovingDecision(item.decision_status));
  const condoItems = items.filter((item) => item.decision_status === 'keep_pack');
  const hqItems = items.filter((item) => item.decision_status === 'move_hq');
  const discussItems = items.filter((item) => item.decision_status === 'undecided_discuss');

  let totalCbm = movingItems.reduce((acc, item) => {
    const itemCbm = item.cbm || calculateCbm(item.dimensions_cm);
    return acc + itemCbm;
  }, 0);

  const condoCbm = condoItems.reduce(
    (acc, item) => acc + (item.cbm || calculateCbm(item.dimensions_cm)),
    0
  );
  const hqCbm = hqItems.reduce(
    (acc, item) => acc + (item.cbm || calculateCbm(item.dimensions_cm)),
    0
  );
  const discussCbm = discussItems.reduce(
    (acc, item) => acc + (item.cbm || calculateCbm(item.dimensions_cm)),
    0
  );

  // Minimum standard box volume for packed boxes where items may lack dimensions (~50x40x30cm = 0.06 CBM)
  const STANDARD_BOX_CBM = 0.06;
  for (const box of boxes) {
    const boxItems = movingItems.filter((i) => i.box_id === box.id);
    if (boxItems.length > 0) {
      const measuredCbm = boxItems.reduce(
        (sum, i) => sum + (i.cbm || calculateCbm(i.dimensions_cm)),
        0
      );
      if (measuredCbm < STANDARD_BOX_CBM) {
        totalCbm += (STANDARD_BOX_CBM - measuredCbm);
      }
    }
  }

  const totalWeightKg = movingItems.reduce((acc, item) => acc + (Number(item.weight_kg) || 0), 0);
  const condoWeightKg = condoItems.reduce((acc, item) => acc + (Number(item.weight_kg) || 0), 0);
  const hqWeightKg = hqItems.reduce((acc, item) => acc + (Number(item.weight_kg) || 0), 0);
  const fragileCount = movingItems.filter((i) => i.is_fragile).length;
  const disassemblyCount = movingItems.filter((i) => i.disassembly_required).length;
  const originalBoxCount = movingItems.filter((i) => i.has_original_box).length;

  return {
    movingCount: movingItems.length,
    totalCbm: Math.round(totalCbm * 100) / 100,
    totalWeightKg: Math.round(totalWeightKg * 10) / 10,
    condoCount: condoItems.length,
    condoCbm: Math.round(condoCbm * 100) / 100,
    condoWeightKg: Math.round(condoWeightKg * 10) / 10,
    hqCount: hqItems.length,
    hqCbm: Math.round(hqCbm * 100) / 100,
    hqWeightKg: Math.round(hqWeightKg * 10) / 10,
    discussCount: discussItems.length,
    discussCbm: Math.round(discussCbm * 100) / 100,
    fragileCount,
    disassemblyCount,
    originalBoxCount,
  };
}

export function getLorryRecommendation(totalCbm: number): LorryRecommendation {
  if (totalCbm <= 8.5) {
    return {
      lorryType: '10ft',
      capacityCbm: '7 - 10 CBM',
      description: 'Compact 10ft lorry with tail-lift. Great for partial moves, electronics & small apartments.',
      suitableFor: 'Studio / Partial loads / Low clutter',
      estimatedTrips: 1,
    };
  } else if (totalCbm <= 18) {
    return {
      lorryType: '14ft',
      capacityCbm: '14 - 18 CBM',
      description: 'Standard Singapore 14ft moving lorry with box canopy. Ideal for 3-Room or 4-Room HDB moves.',
      suitableFor: 'Bukit Batok 4-Room HDB typical complete move',
      estimatedTrips: 1,
    };
  } else if (totalCbm <= 34) {
    return {
      lorryType: '24ft',
      capacityCbm: '28 - 34 CBM',
      description: 'Heavy duty 24ft lorry. Suitable for fully furnished 4-room/5-room flats with high equipment volume.',
      suitableFor: 'Large flats with extensive furniture, server racks & equipment',
      estimatedTrips: 1,
    };
  } else {
    const trips = Math.ceil(totalCbm / 16);
    return {
      lorryType: 'Multiple Trips',
      capacityCbm: `${totalCbm.toFixed(1)} CBM total`,
      description: `Large volume load exceeding single standard lorry. Consider ${trips} trips with a 14ft lorry or multiple 24ft lorries.`,
      suitableFor: 'Massive household move',
      estimatedTrips: trips,
    };
  }
}
