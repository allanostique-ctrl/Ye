export type Rounding = 'up' | 'nearest' | 'exact';

export function applyRounding(raw: number, rounding: Rounding): number {
  if (raw <= 0) return 0;
  switch (rounding) {
    case 'up':
      return Math.ceil(raw - 1e-9);
    case 'nearest':
      return Math.round(raw);
    default:
      return raw;
  }
}

export function purchaseQtyFor(qty: number, wastePct: number, coveragePerUnit: number, rounding: Rounding): number {
  if (qty <= 0 || coveragePerUnit <= 0) return 0;
  const raw = (qty * (1 + wastePct / 100)) / coveragePerUnit;
  return applyRounding(raw, rounding);
}
