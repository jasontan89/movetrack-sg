import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Box, Item } from '../types';
import { calculateCbm, calculateTotalLogistics, getLorryRecommendation } from './cbmCalculator';

export function exportPackingListPdf(
  items: Item[],
  boxes: Box[],
  householdName = 'Bukit Batok 4-Room Relocation'
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const movingItems = items.filter((i) => i.decision_status === 'keep_pack');
  const logistics = calculateTotalLogistics(items);
  const lorry = getLorryRecommendation(logistics.totalCbm);

  // Header Banner
  doc.setFillColor(13, 148, 136); // brand teal #0d9488
  doc.rect(0, 0, 210, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('MOVETRACK SG — MOVER PACKING INVENTORY', 14, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`${householdName} • Date Generated: ${new Date().toLocaleDateString('en-SG')}`, 14, 20);

  // Summary Metrics Bar
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Relocation Logistics Summary', 14, 36);

  const summaryData = [
    ['Total Items to Move', `${logistics.movingCount} items`],
    ['Total Estimated Volume', `${logistics.totalCbm} CBM (m³)`],
    ['Total Gross Weight', `~${logistics.totalWeightKg} kg`],
    ['Fragile / Electronics', `${logistics.fragileCount} items`],
    ['Requires Disassembly', `${logistics.disassemblyCount} items`],
    ['Recommended Mover Lorry', `${lorry.lorryType} (${lorry.capacityCbm}) - ${lorry.estimatedTrips} trip(s)`],
  ];

  autoTable(doc, {
    startY: 40,
    head: [['Metric', 'Detail']],
    body: summaryData,
    theme: 'grid',
    headStyles: { fillColor: [241, 245, 249], textColor: [51, 65, 85], fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 70 },
      1: { cellWidth: 110 },
    },
  });

  // Table of Moving Boxes
  const boxesStartY = (doc as any).lastAutoTable.finalY + 8;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Moving Boxes Manifest', 14, boxesStartY);

  const boxesTableData = boxes.map((box) => {
    const boxItems = items.filter((i) => i.box_id === box.id);
    const boxWeight = boxItems.reduce((acc, i) => acc + (i.weight_kg || 0), 0);
    const hasFragile = boxItems.some((i) => i.is_fragile) || box.is_fragile;
    const itemsPreview = boxItems.map((i) => i.name).slice(0, 3).join(', ') + (boxItems.length > 3 ? ` (+${boxItems.length - 3} more)` : '');

    return [
      `Box #${box.box_number}`,
      box.label,
      box.room_destination || 'General',
      `${boxItems.length} items`,
      hasFragile ? 'YES (FRAGILE)' : 'No',
      `~${boxWeight.toFixed(1)} kg`,
      itemsPreview || 'Empty',
    ];
  });

  autoTable(doc, {
    startY: boxesStartY + 4,
    head: [['Box #', 'Label', 'Destination Room', 'Count', 'Fragile', 'Weight', 'Contents Preview']],
    body: boxesTableData.length > 0 ? boxesTableData : [['-', 'No boxes created yet', '-', '-', '-', '-', '-']],
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

    return [
      item.name,
      item.room.replace(/_/g, ' ').toUpperCase(),
      dims,
      `~${item.weight_kg || 0} kg`,
      `${cbm} m³`,
      item.is_fragile ? 'FRAGILE' : 'Normal',
      item.disassembly_required ? 'DISASSEMBLE' : 'As-is',
      item.has_original_box ? 'Yes' : 'No Box',
    ];
  });

  autoTable(doc, {
    startY: standaloneStartY + 4,
    head: [['Item Name', 'Current Room', 'Dimensions (LxWxH)', 'Weight', 'CBM', 'Fragile', 'Disassembly', 'Original Box']],
    body: itemsTableData.length > 0 ? itemsTableData : [['-', 'All items assigned to boxes', '-', '-', '-', '-', '-', '-']],
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

  doc.save(`MoveTrack_Packing_Inventory_${new Date().toISOString().slice(0, 10)}.pdf`);
}

export function exportInventoryCsv(items: Item[], boxes: Box[]) {
  const headers = [
    'ID',
    'Item Name',
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

  const rows = items.map((item) => {
    const box = boxes.find((b) => b.id === item.box_id);
    return [
      `"${item.id}"`,
      `"${(item.name || '').replace(/"/g, '""')}"`,
      `"${item.owner}"`,
      `"${item.room}"`,
      `"${item.category}"`,
      `"${item.decision_status}"`,
      item.dimensions_cm?.length || '',
      item.dimensions_cm?.width || '',
      item.dimensions_cm?.height || '',
      item.weight_kg || '',
      item.cbm || calculateCbm(item.dimensions_cm),
      box ? `"Box #${box.box_number} - ${box.label}"` : '"Unboxed"',
      item.is_fragile ? 'YES' : 'NO',
      item.disassembly_required ? 'YES' : 'NO',
      item.has_original_box ? 'YES' : 'NO',
      item.has_cables_accessories ? 'YES' : 'NO',
      item.carousell_details?.asking_price || '',
      item.carousell_details?.sold_price || '',
      `"${(item.notes || '').replace(/"/g, '""')}"`,
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `MoveTrack_Inventory_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
