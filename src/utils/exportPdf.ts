import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Box,
  getBoxDestinationHouse,
  isMovingDecision,
  Item,
  MoveDestinationScope,
} from '../types';
import { calculateCbm, calculateTotalLogistics, getLorryRecommendation } from './cbmCalculator';

export function exportPackingListPdf(
  items: Item[],
  boxes: Box[],
  householdName = 'Bukit Batok 4-Room Relocation',
  scope: MoveDestinationScope = 'all'
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const scopedBoxes =
    scope === 'all'
      ? boxes
      : boxes.filter(
          (b) =>
            getBoxDestinationHouse(
              b,
              items.filter((i) => i.box_id === b.id)
            ) === scope
        );

  const movingItems = items.filter((i) => {
    if (scope === 'rental_condo') return i.decision_status === 'keep_pack';
    if (scope === 'moms_hq') return i.decision_status === 'move_hq';
    return isMovingDecision(i.decision_status);
  });

  const logistics = calculateTotalLogistics(items, boxes);
  const activeCbm =
    scope === 'rental_condo'
      ? logistics.condoCbm
      : scope === 'moms_hq'
      ? logistics.hqCbm
      : logistics.totalCbm;
  const activeWeight =
    scope === 'rental_condo'
      ? logistics.condoWeightKg
      : scope === 'moms_hq'
      ? logistics.hqWeightKg
      : logistics.totalWeightKg;
  const lorry = getLorryRecommendation(activeCbm);

  // Header Banner (Color-coded by scope)
  if (scope === 'rental_condo') {
    doc.setFillColor(5, 150, 105); // emerald-600
  } else if (scope === 'moms_hq') {
    doc.setFillColor(79, 70, 229); // indigo-600
  } else {
    doc.setFillColor(13, 148, 136); // brand teal #0d9488
  }
  doc.rect(0, 0, 210, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  const titleText =
    scope === 'rental_condo'
      ? 'MOVETRACK SG — NEW RENTAL HOUSE (CONDO) MANIFEST'
      : scope === 'moms_hq'
      ? "MOVETRACK SG — MOM'S HOUSE (HQ) MANIFEST"
      : 'MOVETRACK SG — 2-STOP MOVER PACKING INVENTORY';
  doc.text(titleText, 14, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(
    `${householdName} • Date Generated: ${new Date().toLocaleDateString('en-SG')}`,
    14,
    20
  );

  // Summary Metrics Bar
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(
    scope === 'rental_condo'
      ? 'Drop-Off 1 Summary: New Rental House (Condo)'
      : scope === 'moms_hq'
      ? "Drop-Off 2 Summary: Mom's House (HQ)"
      : 'Relocation Logistics Summary (Rental Condo & Mom\'s House Split)',
    14,
    36
  );

  const summaryData =
    scope === 'all'
      ? [
          ['Total Items to Move (Both Houses)', `${logistics.movingCount} items`],
          [
            'Drop-Off 1: New Rental House (Condo)',
            `${logistics.condoCount} items • ${logistics.condoCbm} CBM • ~${logistics.condoWeightKg} kg`,
          ],
          [
            "Drop-Off 2: Mom's House (HQ)",
            `${logistics.hqCount} items • ${logistics.hqCbm} CBM • ~${logistics.hqWeightKg} kg`,
          ],
          ['Items Still To Discuss', `${logistics.discussCount} items (${logistics.discussCbm} CBM)`],
          ['Total Combined Volume & Weight', `${logistics.totalCbm} CBM (m³) • ~${logistics.totalWeightKg} kg`],
          ['Fragile / Requires Disassembly', `${logistics.fragileCount} fragile • ${logistics.disassemblyCount} disassembly`],
          ['Recommended Mover Lorry', `${lorry.lorryType} (${lorry.capacityCbm}) - ${lorry.estimatedTrips} trip(s)`],
        ]
      : [
          [
            'Target Drop-Off House',
            scope === 'rental_condo' ? 'New Rental House (Condo)' : "Mom's House (HQ)",
          ],
          ['Items in This Manifest', `${movingItems.length} items (${scopedBoxes.length} boxes)`],
          ['Estimated Volume & Gross Weight', `${activeCbm} CBM (m³) • ~${activeWeight} kg`],
          [
            'Fragile / Requires Disassembly',
            `${movingItems.filter((i) => i.is_fragile).length} fragile • ${
              movingItems.filter((i) => i.disassembly_required).length
            } disassembly`,
          ],
          [
            'Recommended Lorry for This Stop',
            `${lorry.lorryType} (${lorry.capacityCbm}) - ${lorry.estimatedTrips} trip(s)`,
          ],
        ];

  autoTable(doc, {
    startY: 40,
    head: [['Metric', 'Detail']],
    body: summaryData,
    theme: 'grid',
    headStyles: { fillColor: [241, 245, 249], textColor: [51, 65, 85], fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 72 },
      1: { cellWidth: 110 },
    },
  });

  // Table of Moving Boxes
  const boxesStartY = (doc as any).lastAutoTable.finalY + 8;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Moving Boxes Manifest (Segregated by Drop-Off House)', 14, boxesStartY);

  const boxesTableData = scopedBoxes.map((box) => {
    const boxItems = items.filter((i) => i.box_id === box.id);
    const boxWeight = boxItems.reduce((acc, i) => acc + (i.weight_kg || 0), 0);
    const hasFragile = boxItems.some((i) => i.is_fragile) || box.is_fragile;
    const house =
      getBoxDestinationHouse(box, boxItems) === 'moms_hq'
        ? "MOM'S (HQ)"
        : 'RENTAL (CONDO)';
    const itemsPreview =
      boxItems
        .map((i) => i.name)
        .slice(0, 3)
        .join(', ') + (boxItems.length > 3 ? ` (+${boxItems.length - 3} more)` : '');

    return [
      `Box #${box.box_number}`,
      house,
      box.label,
      box.room_destination || 'General',
      hasFragile ? 'YES (FRAGILE)' : 'No',
      `~${boxWeight.toFixed(1)} kg`,
      itemsPreview || 'Empty',
    ];
  });

  autoTable(doc, {
    startY: boxesStartY + 4,
    head: [['Box #', 'Drop-Off House', 'Label', 'Room', 'Fragile', 'Weight', 'Contents Preview']],
    body:
      boxesTableData.length > 0
        ? boxesTableData
        : [['-', '-', 'No boxes assigned to this destination yet', '-', '-', '-', '-']],
    theme: 'striped',
    headStyles: { fillColor: [13, 148, 136], textColor: [255, 255, 255] },
    styles: { fontSize: 8, cellPadding: 2.5 },
  });

  // Table of Standalone Large Equipment & Furniture
  const standaloneStartY = (doc as any).lastAutoTable.finalY + 8;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Standalone Equipment & Large Furniture (Not In Boxes)', 14, standaloneStartY);

  const unboxedItems = movingItems.filter((i) => !i.box_id);
  const itemsTableData = unboxedItems.map((item) => {
    const dims = item.dimensions_cm
      ? `${item.dimensions_cm.length}×${item.dimensions_cm.width}×${item.dimensions_cm.height} cm`
      : '-';
    const cbm = (item.cbm || calculateCbm(item.dimensions_cm)).toFixed(3);
    const dest = item.decision_status === 'move_hq' ? "MOM'S (HQ)" : 'RENTAL (CONDO)';

    return [
      item.name,
      dest,
      item.room.replace(/_/g, ' ').toUpperCase(),
      dims,
      `~${item.weight_kg || 0} kg`,
      `${cbm} m³`,
      item.is_fragile ? 'FRAGILE' : 'Normal',
      item.disassembly_required ? 'DISASSEMBLE' : 'As-is',
    ];
  });

  autoTable(doc, {
    startY: standaloneStartY + 4,
    head: [['Item Name', 'Drop-Off House', 'Current Room', 'Dimensions (LxWxH)', 'Weight', 'CBM', 'Fragile', 'Disassembly']],
    body:
      itemsTableData.length > 0
        ? itemsTableData
        : [['-', '-', 'All items assigned to boxes', '-', '-', '-', '-', '-']],
    theme: 'striped',
    headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255] },
    styles: { fontSize: 7.5, cellPadding: 2 },
  });

  // Footer Sign-off on last page
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Page ${i} of ${pageCount} • MoveTrack SG Bukit Batok Relocation`, 14, 290);
  }

  const fileSuffix =
    scope === 'rental_condo'
      ? 'Rental_Condo_Only'
      : scope === 'moms_hq'
      ? 'Moms_House_HQ_Only'
      : 'All_Destinations';

  doc.save(
    `MoveTrack_Packing_${fileSuffix}_${new Date().toISOString().slice(0, 10)}.pdf`
  );
}

function sanitizeCsvCell(value: any): string {
  if (value === null || value === undefined) return '""';
  let str = String(value);
  // Neutralize CSV formula execution in Excel / Google Sheets
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  return `"${str.replace(/"/g, '""')}"`;
}

export function exportInventoryCsv(
  items: Item[],
  boxes: Box[],
  scope: MoveDestinationScope = 'all'
) {
  const scopedItems = items.filter((i) => {
    if (scope === 'rental_condo') return i.decision_status === 'keep_pack';
    if (scope === 'moms_hq') return i.decision_status === 'move_hq';
    return true;
  });

  const headers = [
    'ID',
    'Item Name',
    'Target Drop-Off House',
    'Owner',
    'Current Room',
    'Category',
    'Decision Status',
    'Length (cm)',
    'Width (cm)',
    'Height (cm)',
    'Weight (kg)',
    'CBM (m3)',
    'Box Number',
    'Fragile',
    'Disassembly Required',
    'Has Original Box',
    'Has Cables/Accessories',
    'Carousell Asking Price (SGD)',
    'Carousell Sold Price (SGD)',
    'Notes',
  ];

  const rows = scopedItems.map((item) => {
    const box = boxes.find((b) => b.id === item.box_id);
    const dropOffLabel =
      item.decision_status === 'keep_pack'
        ? 'New Rental House (Condo)'
        : item.decision_status === 'move_hq'
        ? "Mom's House (HQ)"
        : item.decision_status === 'undecided_discuss'
        ? 'To Discuss'
        : 'Not Moving / Dispose';

    return [
      sanitizeCsvCell(item.id),
      sanitizeCsvCell(item.name || ''),
      sanitizeCsvCell(dropOffLabel),
      sanitizeCsvCell(item.owner),
      sanitizeCsvCell(item.room),
      sanitizeCsvCell(item.category),
      sanitizeCsvCell(item.decision_status),
      item.dimensions_cm?.length ?? '',
      item.dimensions_cm?.width ?? '',
      item.dimensions_cm?.height ?? '',
      item.weight_kg ?? '',
      item.cbm || calculateCbm(item.dimensions_cm),
      box ? sanitizeCsvCell(`Box #${box.box_number} - ${box.label}`) : sanitizeCsvCell('Unboxed'),
      item.is_fragile ? 'YES' : 'NO',
      item.disassembly_required ? 'YES' : 'NO',
      item.has_original_box ? 'YES' : 'NO',
      item.has_cables_accessories ? 'YES' : 'NO',
      item.carousell_details?.asking_price ?? '',
      item.carousell_details?.sold_price ?? '',
      sanitizeCsvCell(item.notes || ''),
    ].join(',');
  });

  const fileSuffix =
    scope === 'rental_condo'
      ? 'Rental_Condo_Only'
      : scope === 'moms_hq'
      ? 'Moms_House_HQ_Only'
      : 'All_Items';

  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute(
    'download',
    `MoveTrack_Inventory_${fileSuffix}_${new Date().toISOString().slice(0, 10)}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
