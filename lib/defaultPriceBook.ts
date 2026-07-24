import { BRANDS, Brand, STYLES, Style, brandSupportsPrimed } from './brands';
import { PriceBookItem, PriceBook } from './types';
import { slugify } from './slug';

/** Stable IDs for accessory/trim items the calc engine looks up directly. */
export const ACCESSORY_IDS = {
  jChannel: 'acc-vinyl-j-channel',
  plasticOutsideCorner: 'acc-vinyl-outside-corner',
  plasticInsideCorner: 'acc-vinyl-inside-corner',
  plasticStarter: 'acc-vinyl-starter',
  trimBoardOpenings: 'acc-trimboard-openings',
  trimBoardOutsideCorner: 'acc-trimboard-outside-corner',
  trimBoardInsideCorner: 'acc-trimboard-inside-corner',
  metalStarter: 'acc-metal-starter',
  topTrimEavesOnly: 'acc-top-trim-eaves-only',
  topTrimEavesGables: 'acc-top-trim-eaves-gables',
  buttJointFlashing: 'acc-butt-joint-flashing',
  touchUpPaint: 'acc-touch-up-paint',
  caulkSealant: 'acc-caulk-sealant',
  vinylNails: 'acc-vinyl-nails',
  fiberCementNails: 'acc-fiber-cement-nails',
  stepFlashing: 'acc-step-flashing',
} as const;

function item(partial: Omit<PriceBookItem, 'isDefault' | 'active'>): PriceBookItem {
  return { ...partial, isDefault: true, active: true };
}

function sidingItems(): PriceBookItem[] {
  const items: PriceBookItem[] = [];
  for (const brand of BRANDS) {
    const primedOptions = brandSupportsPrimed(brand) ? [false, true] : [false];
    for (const style of STYLES) {
      for (const primed of primedOptions) {
        items.push(
          item({
            id: slugify('siding', brand, style, primed ? 'primed' : 'unprimed'),
            category: 'siding',
            brand,
            style,
            primed,
            name: `${brand} ${style}${primed ? ' (Primed)' : ''}`,
            unit: 'sqft',
            coveragePerUnit: 100, // 1 "square" = 100 sqft
            wastePct: 10,
            materialPrice: defaultSidingSquarePrice(brand, style),
            laborRate: defaultSidingLaborRate(brand),
          })
        );
      }
    }
  }
  return items;
}

function defaultSidingSquarePrice(brand: Brand, style: Style): number {
  const base: Record<Brand, number> = {
    Vinyl: 145,
    'James Hardie': 260,
    'LP SmartSide': 220,
    TruCedar: 240,
  };
  const styleAdd: Partial<Record<Style, number>> = {
    'Board & Batten': 15,
    'Vertical Panel': 10,
    'Straight Shingle': 35,
    'Staggered Shingle': 45,
  };
  return base[brand] + (styleAdd[style] ?? 0);
}

function defaultSidingLaborRate(brand: Brand): number {
  const rate: Record<Brand, number> = {
    Vinyl: 1.75,
    'James Hardie': 3.25,
    'LP SmartSide': 2.75,
    TruCedar: 3.0,
  };
  return rate[brand];
}

function accessoryItems(): PriceBookItem[] {
  return [
    item({
      id: ACCESSORY_IDS.jChannel,
      category: 'siding-accessory',
      brand: 'Vinyl',
      style: '',
      primed: false,
      name: 'J-Channel',
      unit: 'lnft',
      coveragePerUnit: 12.5,
      wastePct: 10,
      materialPrice: 9.5,
      laborRate: 0.6,
    }),
    item({
      id: ACCESSORY_IDS.plasticOutsideCorner,
      category: 'siding-accessory',
      brand: 'Vinyl',
      style: '',
      primed: false,
      name: 'Plastic Outside Corner Post',
      unit: 'lnft',
      coveragePerUnit: 10,
      wastePct: 5,
      materialPrice: 14,
      laborRate: 0.85,
    }),
    item({
      id: ACCESSORY_IDS.plasticInsideCorner,
      category: 'siding-accessory',
      brand: 'Vinyl',
      style: '',
      primed: false,
      name: 'Plastic Inside Corner Post',
      unit: 'lnft',
      coveragePerUnit: 10,
      wastePct: 5,
      materialPrice: 12,
      laborRate: 0.85,
    }),
    item({
      id: ACCESSORY_IDS.plasticStarter,
      category: 'siding-accessory',
      brand: 'Vinyl',
      style: '',
      primed: false,
      name: 'Vinyl Starter Strip',
      unit: 'lnft',
      coveragePerUnit: 10,
      wastePct: 5,
      materialPrice: 4.5,
      laborRate: 0.5,
    }),
    item({
      id: ACCESSORY_IDS.trimBoardOpenings,
      category: 'siding-accessory',
      brand: 'Universal',
      style: '',
      primed: false,
      name: '4" Trim Board — Around Openings',
      unit: 'lnft',
      coveragePerUnit: 12,
      wastePct: 10,
      materialPrice: 3.25,
      laborRate: 1.1,
    }),
    item({
      id: ACCESSORY_IDS.trimBoardOutsideCorner,
      category: 'siding-accessory',
      brand: 'Universal',
      style: '',
      primed: false,
      name: '4" Trim Board — Outside Corner',
      unit: 'lnft',
      coveragePerUnit: 12,
      wastePct: 10,
      materialPrice: 3.25,
      laborRate: 1.25,
    }),
    item({
      id: ACCESSORY_IDS.trimBoardInsideCorner,
      category: 'siding-accessory',
      brand: 'Universal',
      style: '',
      primed: false,
      name: '4" Trim Board — Inside Corner',
      unit: 'lnft',
      coveragePerUnit: 12,
      wastePct: 10,
      materialPrice: 3.25,
      laborRate: 1.0,
    }),
    item({
      id: ACCESSORY_IDS.metalStarter,
      category: 'siding-accessory',
      brand: 'Universal',
      style: '',
      primed: false,
      name: 'Metal Starter Strip',
      unit: 'lnft',
      coveragePerUnit: 10,
      wastePct: 5,
      materialPrice: 3.75,
      laborRate: 0.5,
    }),
    item({
      id: ACCESSORY_IDS.topTrimEavesOnly,
      category: 'siding-accessory',
      brand: 'Universal',
      style: '',
      primed: false,
      name: 'Top-of-Siding Trim — Eaves',
      unit: 'lnft',
      coveragePerUnit: 12,
      wastePct: 10,
      materialPrice: 3.25,
      laborRate: 1.1,
    }),
    item({
      id: ACCESSORY_IDS.topTrimEavesGables,
      category: 'siding-accessory',
      brand: 'Universal',
      style: '',
      primed: false,
      name: 'Top-of-Siding Trim — Gables',
      unit: 'lnft',
      coveragePerUnit: 12,
      wastePct: 10,
      materialPrice: 3.25,
      laborRate: 1.1,
    }),
    item({
      id: ACCESSORY_IDS.buttJointFlashing,
      category: 'siding-accessory',
      brand: 'Universal',
      style: '',
      primed: false,
      name: 'Butt Joint Flashing (Hardie/LP)',
      unit: 'sqft',
      coveragePerUnit: 250,
      wastePct: 5,
      materialPrice: 12,
      laborRate: 0.2,
    }),
    item({
      id: ACCESSORY_IDS.touchUpPaint,
      category: 'siding-accessory',
      brand: 'Universal',
      style: '',
      primed: false,
      name: 'Touch-Up Paint (Hardie/LP)',
      unit: 'sqft',
      coveragePerUnit: 1000,
      wastePct: 0,
      materialPrice: 55,
      laborRate: 0.05,
    }),
    item({
      id: ACCESSORY_IDS.caulkSealant,
      category: 'siding-accessory',
      brand: 'Universal',
      style: '',
      primed: false,
      name: 'Caulk / Sealant (Hardie/LP)',
      unit: 'sqft',
      coveragePerUnit: 500,
      wastePct: 0,
      materialPrice: 6.5,
      laborRate: 0.08,
    }),
    item({
      id: ACCESSORY_IDS.vinylNails,
      category: 'siding-accessory',
      brand: 'Vinyl',
      style: '',
      primed: false,
      name: 'Siding Nails (Vinyl)',
      unit: 'sqft',
      coveragePerUnit: 1000,
      wastePct: 5,
      materialPrice: 42,
      laborRate: 0,
    }),
    item({
      id: ACCESSORY_IDS.fiberCementNails,
      category: 'siding-accessory',
      brand: 'Universal',
      style: '',
      primed: false,
      name: 'Siding Nails (Fiber Cement — Hardie/LP)',
      unit: 'sqft',
      coveragePerUnit: 800,
      wastePct: 5,
      materialPrice: 58,
      laborRate: 0,
    }),
    item({
      id: ACCESSORY_IDS.stepFlashing,
      category: 'siding-accessory',
      brand: 'Universal',
      style: '',
      primed: false,
      name: 'Step Flashing',
      unit: 'lnft',
      coveragePerUnit: 10,
      wastePct: 5,
      materialPrice: 14,
      laborRate: 1.1,
    }),
  ];
}

function sheathingItems(): PriceBookItem[] {
  return [
    item({
      id: 'sheathing-osb-7-16',
      category: 'sheathing',
      brand: 'Universal',
      style: '',
      primed: false,
      name: '7/16" OSB Wall Sheathing',
      unit: 'sqft',
      coveragePerUnit: 32,
      wastePct: 10,
      materialPrice: 21,
      laborRate: 0.75,
    }),
  ];
}

/** House wrap, seam tape, Vycor tape, and window head flashing get their own always-on
 *  section (see 'weatherBarrier' in types.ts) instead of living under Sheathing / Door &
 *  Window Installs — they auto-populate from measurements on every job rather than
 *  needing those other sections' Checklist toggles switched on first. */
function weatherBarrierItems(): PriceBookItem[] {
  return [
    item({
      id: 'sheathing-housewrap',
      category: 'weather-barrier',
      brand: 'Universal',
      style: '',
      primed: false,
      name: 'House Wrap / WRB',
      unit: 'sqft',
      coveragePerUnit: 1000,
      wastePct: 10,
      materialPrice: 145,
      laborRate: 0.12,
    }),
    item({
      id: 'sheathing-housewrap-tape',
      category: 'weather-barrier',
      brand: 'Universal',
      style: '',
      primed: false,
      name: 'House Wrap Seam Tape',
      unit: 'lnft',
      coveragePerUnit: 165,
      wastePct: 5,
      materialPrice: 24,
      laborRate: 0.05,
    }),
    item({
      id: 'vycor-tape',
      category: 'weather-barrier',
      brand: 'Universal',
      style: '',
      primed: false,
      name: 'Vycor Tape (Window/Door Flashing)',
      unit: 'lnft',
      coveragePerUnit: 75,
      wastePct: 10,
      materialPrice: 38,
      laborRate: 0.6,
    }),
    item({
      id: 'window-head-flashing',
      category: 'weather-barrier',
      brand: 'Universal',
      style: '',
      primed: false,
      name: 'Window Head Flashing / Drip Cap',
      unit: 'each',
      coveragePerUnit: 1,
      wastePct: 0,
      materialPrice: 14,
      laborRate: 12,
    }),
  ];
}

function soffitItems(): PriceBookItem[] {
  return [
    item({
      id: 'soffit-vented-vinyl',
      category: 'soffit',
      brand: 'Universal',
      style: '',
      primed: false,
      name: 'Vented Vinyl Soffit',
      unit: 'sqft',
      coveragePerUnit: 100,
      wastePct: 10,
      materialPrice: 130,
      laborRate: 2.1,
    }),
    item({
      id: 'soffit-solid-vinyl',
      category: 'soffit',
      brand: 'Universal',
      style: '',
      primed: false,
      name: 'Solid Vinyl Soffit',
      unit: 'sqft',
      coveragePerUnit: 100,
      wastePct: 10,
      materialPrice: 125,
      laborRate: 2.1,
    }),
    item({
      id: 'soffit-aluminum',
      category: 'soffit',
      brand: 'Universal',
      style: '',
      primed: false,
      name: 'Aluminum Soffit (Vented)',
      unit: 'sqft',
      coveragePerUnit: 100,
      wastePct: 10,
      materialPrice: 150,
      laborRate: 2.3,
    }),
    item({
      id: 'soffit-removal',
      category: 'soffit',
      brand: 'Universal',
      style: '',
      primed: false,
      name: 'Soffit Removal / Tear-Off',
      unit: 'sqft',
      coveragePerUnit: 1,
      wastePct: 0,
      materialPrice: 0,
      laborRate: 0.65,
    }),
  ];
}

function fasciaItems(): PriceBookItem[] {
  return [
    item({
      id: 'fascia-aluminum-wrap',
      category: 'fascia',
      brand: 'Universal',
      style: '',
      primed: false,
      name: 'Aluminum Fascia Wrap',
      unit: 'lnft',
      coveragePerUnit: 10,
      wastePct: 10,
      materialPrice: 5.5,
      laborRate: 1.4,
    }),
    item({
      id: 'fascia-board-cedar',
      category: 'fascia',
      brand: 'Universal',
      style: '',
      primed: false,
      name: 'Fascia Board (Cedar/Composite)',
      unit: 'lnft',
      coveragePerUnit: 12,
      wastePct: 10,
      materialPrice: 4.75,
      laborRate: 1.6,
    }),
    item({
      id: 'fascia-removal',
      category: 'fascia',
      brand: 'Universal',
      style: '',
      primed: false,
      name: 'Fascia Removal / Tear-Off',
      unit: 'lnft',
      coveragePerUnit: 1,
      wastePct: 0,
      materialPrice: 0,
      laborRate: 0.55,
    }),
  ];
}

function gutterItems(): PriceBookItem[] {
  return [
    item({
      id: 'gutter-5in-k-style',
      category: 'gutters',
      brand: 'Universal',
      style: '',
      primed: false,
      name: '5" K-Style Gutter',
      unit: 'lnft',
      coveragePerUnit: 10,
      wastePct: 5,
      materialPrice: 6.25,
      laborRate: 1.5,
    }),
    item({
      id: 'gutter-6in-k-style',
      category: 'gutters',
      brand: 'Universal',
      style: '',
      primed: false,
      name: '6" K-Style Gutter',
      unit: 'lnft',
      coveragePerUnit: 10,
      wastePct: 5,
      materialPrice: 8.5,
      laborRate: 1.75,
    }),
    item({
      id: 'gutter-downspout',
      category: 'gutters',
      brand: 'Universal',
      style: '',
      primed: false,
      name: 'Downspout',
      unit: 'each',
      coveragePerUnit: 1,
      wastePct: 0,
      materialPrice: 45,
      laborRate: 18,
    }),
    item({
      id: 'gutter-guards',
      category: 'gutters',
      brand: 'Universal',
      style: '',
      primed: false,
      name: 'Gutter Guards / Leaf Protection',
      unit: 'lnft',
      coveragePerUnit: 10,
      wastePct: 5,
      materialPrice: 7.5,
      laborRate: 1.25,
    }),
    item({
      id: 'gutter-removal',
      category: 'gutters',
      brand: 'Universal',
      style: '',
      primed: false,
      name: 'Gutter Removal / Tear-Off',
      unit: 'lnft',
      coveragePerUnit: 1,
      wastePct: 0,
      materialPrice: 0,
      laborRate: 0.45,
    }),
  ];
}

function fixtureItems(): PriceBookItem[] {
  return [
    item({ id: 'fixture-hose-bib', category: 'fixtures', brand: 'Universal', style: '', primed: false, name: 'Hose Bib Extension', unit: 'each', coveragePerUnit: 1, wastePct: 0, materialPrice: 18, laborRate: 25 }),
    item({ id: 'fixture-dryer-vent', category: 'fixtures', brand: 'Universal', style: '', primed: false, name: 'Dryer Vent Extension', unit: 'each', coveragePerUnit: 1, wastePct: 0, materialPrice: 22, laborRate: 30 }),
    item({ id: 'fixture-electrical-block', category: 'fixtures', brand: 'Universal', style: '', primed: false, name: 'Electrical Mount Block', unit: 'each', coveragePerUnit: 1, wastePct: 0, materialPrice: 15, laborRate: 20 }),
    item({ id: 'fixture-gas-meter-mount', category: 'fixtures', brand: 'Universal', style: '', primed: false, name: 'Gas Meter Mount Block', unit: 'each', coveragePerUnit: 1, wastePct: 0, materialPrice: 20, laborRate: 25 }),
    item({ id: 'fixture-mailbox-mount', category: 'fixtures', brand: 'Universal', style: '', primed: false, name: 'Mailbox / House Number Reset', unit: 'each', coveragePerUnit: 1, wastePct: 0, materialPrice: 10, laborRate: 20 }),
    item({ id: 'fixture-mounting-block', category: 'fixtures', brand: 'Universal', style: '', primed: false, name: 'Siding Mounting Block (Universal)', unit: 'each', coveragePerUnit: 1, wastePct: 0, materialPrice: 12, laborRate: 15 }),
  ];
}

function demoRemovalItems(): PriceBookItem[] {
  const materials = ['Vinyl Siding', 'Wood Siding', 'Aluminum Siding', 'Fiber Cement Siding', 'Stucco', 'Brick Veneer'];
  return materials.map((m) =>
    item({
      id: slugify('demo', m),
      category: 'demo-removal',
      brand: 'Universal',
      style: '',
      primed: false,
      name: `${m} Tear-Off / Disposal`,
      unit: 'sqft',
      coveragePerUnit: 1,
      wastePct: 0,
      materialPrice: 0,
      laborRate: m === 'Stucco' || m === 'Brick Veneer' ? 1.6 : 0.55,
    })
  );
}

function furringFramingItems(): PriceBookItem[] {
  return [
    item({ id: 'furring-1x3-strapping', category: 'furring-framing', brand: 'Universal', style: '', primed: false, name: '1x3 Furring Strips', unit: 'lnft', coveragePerUnit: 8, wastePct: 10, materialPrice: 1.35, laborRate: 0.6 }),
    item({ id: 'framing-lumber-repair', category: 'furring-framing', brand: 'Universal', style: '', primed: false, name: 'Framing Lumber / Repair Stock', unit: 'lnft', coveragePerUnit: 8, wastePct: 10, materialPrice: 2.5, laborRate: 0.9 }),
  ];
}

function aluminumWrapItems(): PriceBookItem[] {
  return [
    item({ id: 'wrap-window-trim', category: 'aluminum-wraps', brand: 'Universal', style: '', primed: false, name: 'Window Trim Aluminum Wrap', unit: 'each', coveragePerUnit: 1, wastePct: 5, materialPrice: 28, laborRate: 22 }),
    item({ id: 'wrap-post', category: 'aluminum-wraps', brand: 'Universal', style: '', primed: false, name: 'Post Aluminum Wrap', unit: 'each', coveragePerUnit: 1, wastePct: 5, materialPrice: 35, laborRate: 28 }),
    item({ id: 'wrap-door-trim', category: 'aluminum-wraps', brand: 'Universal', style: '', primed: false, name: 'Door Trim Aluminum Wrap', unit: 'each', coveragePerUnit: 1, wastePct: 5, materialPrice: 30, laborRate: 24 }),
  ];
}

function doorWindowItems(): PriceBookItem[] {
  return [
    item({ id: 'install-window', category: 'door-window-installs', brand: 'Universal', style: '', primed: false, name: 'Window Install', unit: 'each', coveragePerUnit: 1, wastePct: 0, materialPrice: 375, laborRate: 175 }),
    item({ id: 'install-entry-door', category: 'door-window-installs', brand: 'Universal', style: '', primed: false, name: 'Entry Door Install', unit: 'each', coveragePerUnit: 1, wastePct: 0, materialPrice: 550, laborRate: 250 }),
    item({ id: 'install-storm-door', category: 'door-window-installs', brand: 'Universal', style: '', primed: false, name: 'Storm Door Install', unit: 'each', coveragePerUnit: 1, wastePct: 0, materialPrice: 275, laborRate: 125 }),
  ];
}

function paintingItems(): PriceBookItem[] {
  return [
    item({ id: 'paint-trim', category: 'painting-coating', brand: 'Universal', style: '', primed: false, name: 'Trim Paint / Coating', unit: 'lnft', coveragePerUnit: 40, wastePct: 5, materialPrice: 2.75, laborRate: 0.85 }),
    item({ id: 'paint-siding-touchup', category: 'painting-coating', brand: 'Universal', style: '', primed: false, name: 'Siding Painting / Staining', unit: 'sqft', coveragePerUnit: 400, wastePct: 5, materialPrice: 0.55, laborRate: 0.95 }),
  ];
}

function oneTimeChargeItems(): PriceBookItem[] {
  return [
    item({ id: 'otc-three-story', category: 'one-time-charges', brand: 'Universal', style: '', primed: false, name: '3-Story Charge', unit: 'each', coveragePerUnit: 1, wastePct: 0, materialPrice: 0, laborRate: 850 }),
    item({ id: 'otc-osb-replacement', category: 'one-time-charges', brand: 'Universal', style: '', primed: false, name: 'OSB / Insulation Board Replacement', unit: 'sqft', coveragePerUnit: 32, wastePct: 10, materialPrice: 21, laborRate: 1.1 }),
    item({ id: 'otc-detach-reset-light', category: 'one-time-charges', brand: 'Universal', style: '', primed: false, name: 'Detach & Reset Exterior Light', unit: 'each', coveragePerUnit: 1, wastePct: 0, materialPrice: 0, laborRate: 35 }),
    item({ id: 'otc-trip-charge', category: 'one-time-charges', brand: 'Universal', style: '', primed: false, name: 'Trip Charge', unit: 'each', coveragePerUnit: 1, wastePct: 0, materialPrice: 0, laborRate: 125 }),
    item({ id: 'otc-labor-minimum', category: 'one-time-charges', brand: 'Universal', style: '', primed: false, name: 'Labor Minimum', unit: 'each', coveragePerUnit: 1, wastePct: 0, materialPrice: 0, laborRate: 450 }),
    item({ id: 'otc-material-delivery', category: 'one-time-charges', brand: 'Universal', style: '', primed: false, name: 'Material Delivery Fee', unit: 'each', coveragePerUnit: 1, wastePct: 0, materialPrice: 150, laborRate: 0 }),
    item({ id: 'otc-permit-fee', category: 'one-time-charges', brand: 'Universal', style: '', primed: false, name: 'Permit Fee', unit: 'each', coveragePerUnit: 1, wastePct: 0, materialPrice: 250, laborRate: 0 }),
    item({ id: 'otc-scaffolding-lift', category: 'one-time-charges', brand: 'Universal', style: '', primed: false, name: 'Scaffolding / Lift Rental', unit: 'each', coveragePerUnit: 1, wastePct: 0, materialPrice: 650, laborRate: 0 }),
  ];
}

function equipmentRentalItems(): PriceBookItem[] {
  return [
    item({ id: 'otc-portable-toilet', category: 'equipment-rental', brand: 'Universal', style: '', primed: false, name: 'Portable Toilet Rental', unit: 'each', coveragePerUnit: 1, wastePct: 0, materialPrice: 175, laborRate: 0 }),
    item({ id: 'otc-dumpster', category: 'equipment-rental', brand: 'Universal', style: '', primed: false, name: 'Dumpster / Waste Disposal', unit: 'each', coveragePerUnit: 1, wastePct: 0, materialPrice: 495, laborRate: 0 }),
    item({ id: 'equip-boom-crane', category: 'equipment-rental', brand: 'Universal', style: '', primed: false, name: 'Boom Crane Rental', unit: 'each', coveragePerUnit: 1, wastePct: 0, materialPrice: 850, laborRate: 0 }),
    item({ id: 'equip-crane', category: 'equipment-rental', brand: 'Universal', style: '', primed: false, name: 'Crane Rental', unit: 'each', coveragePerUnit: 1, wastePct: 0, materialPrice: 1200, laborRate: 0 }),
  ];
}

export function buildDefaultPriceBookItems(): PriceBookItem[] {
  return [
    ...sidingItems(),
    ...accessoryItems(),
    ...sheathingItems(),
    ...weatherBarrierItems(),
    ...soffitItems(),
    ...fasciaItems(),
    ...gutterItems(),
    ...fixtureItems(),
    ...demoRemovalItems(),
    ...furringFramingItems(),
    ...aluminumWrapItems(),
    ...doorWindowItems(),
    ...paintingItems(),
    ...equipmentRentalItems(),
    ...oneTimeChargeItems(),
  ];
}

export const PRICE_BOOK_SCHEMA_VERSION = 1;

export function buildDefaultPriceBook(): PriceBook {
  const items = buildDefaultPriceBookItems();
  return {
    schemaVersion: PRICE_BOOK_SCHEMA_VERSION,
    items,
    knownDefaultIds: items.map((i) => i.id),
  };
}
