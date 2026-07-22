import { Category, PriceBook, CalcRulesConfig, BrandCalcRules } from './types';
import { buildDefaultPriceBook, buildDefaultPriceBookItems, PRICE_BOOK_SCHEMA_VERSION } from './defaultPriceBook';
import { buildDefaultCalcRules, CALC_RULES_SCHEMA_VERSION } from './defaultCalcRules';

/**
 * A default item that moves to a new category after it may already have been merged
 * into someone's saved price book can't be fixed by the additive merge below — the id
 * already exists, so it's never touched. This is a one-time, id-keyed patch for exactly
 * that case: it only overwrites the `category` field (never name/price/active, so any
 * user edits to those survive) whenever a known id's stored category is stale.
 */
const CATEGORY_CORRECTIONS: Record<string, Category> = {
  'otc-dumpster': 'equipment-rental',
  'otc-portable-toilet': 'equipment-rental',
};

/**
 * Merge newly-introduced default catalog items into a user's saved price book
 * without touching anything they've already saved or deleted.
 *
 * Rule: a default item is appended only if its id has never been seen before
 * (not in knownDefaultIds). If the user deliberately deleted a default item,
 * its id stays in knownDefaultIds forever, so it will not silently come back.
 */
export function migratePriceBook(stored: unknown): PriceBook {
  if (!stored || typeof stored !== 'object') {
    return buildDefaultPriceBook();
  }
  const s = stored as Partial<PriceBook>;
  if (!Array.isArray(s.items)) {
    return buildDefaultPriceBook();
  }

  const knownDefaultIds = new Set(Array.isArray(s.knownDefaultIds) ? s.knownDefaultIds : []);
  const existingIds = new Set(s.items.map((i) => i.id));
  let items = [...s.items];

  for (const defaultItem of buildDefaultPriceBookItems()) {
    if (!knownDefaultIds.has(defaultItem.id)) {
      knownDefaultIds.add(defaultItem.id);
      if (!existingIds.has(defaultItem.id)) {
        items.push(defaultItem);
        existingIds.add(defaultItem.id);
      }
    }
  }

  items = items.map((item) => {
    const correctedCategory = CATEGORY_CORRECTIONS[item.id];
    return correctedCategory && item.category !== correctedCategory ? { ...item, category: correctedCategory } : item;
  });

  return {
    schemaVersion: PRICE_BOOK_SCHEMA_VERSION,
    items,
    knownDefaultIds: Array.from(knownDefaultIds),
  };
}

function fillBrandRules(stored: Partial<BrandCalcRules> | undefined, fallback: BrandCalcRules): BrandCalcRules {
  return { ...fallback, ...(stored ?? {}) };
}

/** Fill in any new calc-rule fields/brand buckets added in later versions, preserving user edits. */
export function migrateCalcRules(stored: unknown): CalcRulesConfig {
  const fallback = buildDefaultCalcRules();
  if (!stored || typeof stored !== 'object') {
    return fallback;
  }
  const s = stored as Partial<CalcRulesConfig>;
  return {
    schemaVersion: CALC_RULES_SCHEMA_VERSION,
    vinyl: fillBrandRules(s.vinyl, fallback.vinyl),
    jamesHardie: fillBrandRules(s.jamesHardie, fallback.jamesHardie),
    lpSmartSide: fillBrandRules(s.lpSmartSide, fallback.lpSmartSide),
    other: fillBrandRules(s.other, fallback.other),
  };
}
