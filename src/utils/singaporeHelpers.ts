// Singapore Relocation & Town Council Helpers for Bukit Batok (Jurong-Clementi Town Council)

export interface BulkyItemRules {
  townCouncilName: string;
  freeQuotaPerMonth: number;
  eligibleExamples: string[];
  ineligibleExamples: string[];
  bookingUrl: string;
  hotline: string;
}

export const JURONG_CLEMENTI_BULKY_RULES: BulkyItemRules = {
  townCouncilName: 'Jurong-Clementi Town Council (Bukit Batok)',
  freeQuotaPerMonth: 3,
  eligibleExamples: [
    'Sofas & armchairs',
    'Wardrobes & cabinets (freestanding)',
    'Bed frames & mattresses',
    'Dining tables & chairs',
    'Desks & bookcases',
    'Large standard appliances (washing machine, fridge)',
  ],
  ineligibleExamples: [
    'Renovation debris / cement / tiles',
    'Built-in kitchen / wardrobe fixtures',
    'Pianos / organs / heavy safes',
    'Commercial, shop or industrial items',
    'Hazardous chemicals or flammables',
  ],
  bookingUrl: 'https://www.jctc.org.sg/services/bulky-item-removal/',
  hotline: '1800-566-0412 / 6561-9924',
};

export interface EwasteDropoff {
  name: string;
  address: string;
  postalCode: string;
  acceptedTypes: string[];
  operatingHours: string;
}

export const BUKIT_BATOK_EWASTE_BINS: EwasteDropoff[] = [
  {
    name: 'Bukit Batok Community Club (ALBA E-Waste Bin)',
    address: '21 Bukit Batok Central',
    postalCode: '659959',
    acceptedTypes: ['ICT Equipment (laptops, PCs, tablets, phones)', 'Batteries', 'Small Appliances', 'Light Bulbs'],
    operatingHours: 'Daily 9:00 AM - 10:00 PM',
  },
  {
    name: 'West Mall (ALBA E-Waste Bin)',
    address: '1 Bukit Batok Central Link (Level 1 Customer Service / Carpark)',
    postalCode: '658713',
    acceptedTypes: ['ICT Equipment', 'Power banks, chargers, cables', 'Batteries'],
    operatingHours: 'Daily 10:00 AM - 10:00 PM',
  },
  {
    name: 'Bukit Batok East Community Club',
    address: '23 Bukit Batok East Ave 4',
    postalCode: '659841',
    acceptedTypes: ['ICT Equipment', 'Laptops, keyboards, modems', 'Batteries'],
    operatingHours: 'Daily 9:00 AM - 10:00 PM',
  },
  {
    name: 'Bukit Gombak Community Centre',
    address: '35 Bukit Batok St 31',
    postalCode: '659441',
    acceptedTypes: ['ICT Equipment', 'Small household appliances', 'Batteries'],
    operatingHours: 'Daily 9:00 AM - 10:00 PM',
  },
];
