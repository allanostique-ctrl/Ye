import { PriceBookItem, Category, Unit, CalculationResult, SECTION_LABELS } from './types';

const COLUMNS: (keyof PriceBookItem)[] = [
  'id',
  'category',
  'brand',
  'style',
  'primed',
  'name',
  'unit',
  'coveragePerUnit',
  'wastePct',
  'materialPrice',
  'laborRate',
  'isDefault',
  'active',
];

function csvEscape(value: unknown): string {
  const s = String(value ?? '');
  if (/[",\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function priceBookToCSV(items: PriceBookItem[]): string {
  const header = COLUMNS.join(',');
  const rows = items.map((item) => COLUMNS.map((c) => csvEscape((item as any)[c])).join(','));
  return [header, ...rows].join('\n');
}

function parseCSVLine(line: string): string[] {
  const cells: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      cells.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  cells.push(cur);
  return cells;
}

/** Splits raw CSV text into logical rows, respecting newlines embedded inside quoted fields. */
function splitCSVRows(text: string): string[] {
  const rows: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === '"') inQuotes = !inQuotes;
    if (ch === '\n' && !inQuotes) {
      rows.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  if (cur.trim().length > 0) rows.push(cur);
  return rows;
}

export function csvToPriceBookItems(text: string): PriceBookItem[] {
  const lines = splitCSVRows(text.replace(/\r\n/g, '\n')).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];
  const header = parseCSVLine(lines[0]).map((h) => h.trim());
  const items: PriceBookItem[] = [];

  for (const line of lines.slice(1)) {
    const cells = parseCSVLine(line);
    const row: Record<string, string> = {};
    header.forEach((col, i) => {
      row[col] = cells[i] ?? '';
    });

    items.push({
      id: row.id || crypto.randomUUID(),
      category: (row.category || 'fixtures') as Category,
      brand: (row.brand || 'Universal') as any,
      style: (row.style || '') as any,
      primed: row.primed === 'true' || row.primed === '1',
      name: row.name || 'Imported Item',
      unit: (row.unit || 'each') as Unit,
      coveragePerUnit: parseFloat(row.coveragePerUnit) || 1,
      wastePct: parseFloat(row.wastePct) || 0,
      materialPrice: parseFloat(row.materialPrice) || 0,
      laborRate: parseFloat(row.laborRate) || 0,
      isDefault: row.isDefault === 'true' || row.isDefault === '1',
      active: row.active === '' ? true : row.active === 'true' || row.active === '1',
    });
  }

  return items;
}

/**
 * Exports the computed Material and Labor List with the full calculation trail per line —
 * calculated qty, purchase qty (after waste/rounding), unit rates, and extended totals —
 * so every number on the job can be traced back to how it was derived, not just the total.
 */
export function calculationResultToCSV(result: CalculationResult): string {
  const header = [
    'Section',
    'Item',
    'Brand',
    'Unit',
    'Calculated Qty',
    'Purchase Qty',
    'Coverage Per Purchase Unit',
    'Material $ Per Purchase Unit',
    'Effective Material $ Per Unit',
    'Material $',
    'Labor $ Per Unit',
    'Labor $',
    'Total $',
    'Material Overridden',
    'Labor Overridden',
  ].join(',');
  const blankRow = (label: string, materialSubtotal: number, laborSubtotal: number, totalSubtotal: number, section = ''): string =>
    [
      csvEscape(section),
      csvEscape(label),
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      csvEscape(materialSubtotal.toFixed(2)),
      '',
      csvEscape(laborSubtotal.toFixed(2)),
      csvEscape(totalSubtotal.toFixed(2)),
      '',
      '',
    ].join(',');
  const rows: string[] = [];
  for (const section of result.sections) {
    for (const item of section.items) {
      const effectiveMaterialUnitPrice = item.materialUnitPrice / (item.coveragePerUnit || 1);
      rows.push(
        [
          csvEscape(SECTION_LABELS[section.section]),
          csvEscape(item.name),
          csvEscape(item.brand),
          csvEscape(item.unit),
          csvEscape(item.qty.toFixed(2)),
          csvEscape(item.purchaseQty.toFixed(2)),
          csvEscape(item.coveragePerUnit),
          csvEscape(item.materialUnitPrice.toFixed(2)),
          csvEscape(effectiveMaterialUnitPrice.toFixed(2)),
          csvEscape(item.materialCost.toFixed(2)),
          csvEscape(item.laborRate.toFixed(2)),
          csvEscape(item.laborCost.toFixed(2)),
          csvEscape(item.totalCost.toFixed(2)),
          csvEscape(item.overridden.material ? 'yes' : 'no'),
          csvEscape(item.overridden.labor ? 'yes' : 'no'),
        ].join(',')
      );
    }
    rows.push(blankRow('Subtotal', section.materialSubtotal, section.laborSubtotal, section.totalSubtotal, SECTION_LABELS[section.section]));
  }
  rows.push(blankRow('GRAND TOTAL', result.materialTotal, result.laborTotal, result.grandTotal));
  return [header, ...rows].join('\n');
}

export function downloadTextFile(filename: string, contents: string, mimeType = 'text/csv'): void {
  const blob = new Blob([contents], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
