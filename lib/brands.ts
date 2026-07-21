export const BRANDS = ['Vinyl', 'James Hardie', 'LP SmartSide', 'TruCedar'] as const;
export type Brand = (typeof BRANDS)[number];

export const STYLES = [
  'Lap',
  'Board & Batten',
  'Vertical Panel',
  'Straight Shingle',
  'Staggered Shingle',
] as const;
export type Style = (typeof STYLES)[number];

export function brandSupportsPrimed(brand: Brand): boolean {
  return brand === 'James Hardie' || brand === 'LP SmartSide' || brand === 'TruCedar';
}

/** Brands whose selection swaps the job's shared trim package to 4" trim board + metal starter. */
export function isTrimBoardBrand(brand: Brand): boolean {
  return brand === 'James Hardie' || brand === 'LP SmartSide';
}

export type CalcRuleBrandKey = 'vinyl' | 'jamesHardie' | 'lpSmartSide' | 'other';

export function brandToCalcRuleKey(brand: Brand): CalcRuleBrandKey {
  switch (brand) {
    case 'Vinyl':
      return 'vinyl';
    case 'James Hardie':
      return 'jamesHardie';
    case 'LP SmartSide':
      return 'lpSmartSide';
    default:
      return 'other';
  }
}

export const CALC_RULE_BRAND_LABELS: Record<CalcRuleBrandKey, string> = {
  vinyl: 'Vinyl',
  jamesHardie: 'James Hardie',
  lpSmartSide: 'LP SmartSide',
  other: 'Other (TruCedar & future brands)',
};
