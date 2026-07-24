import type { Brand, Style, CalcRuleBrandKey } from './brands';

export type ID = string;

// ---------- Work sections ----------

export type WorkSectionKey =
  | 'siding'
  | 'sheathing'
  | 'weatherBarrier'
  | 'soffit'
  | 'fascia'
  | 'gutters'
  | 'fixtures'
  | 'demoRemoval'
  | 'furringFraming'
  | 'aluminumWraps'
  | 'doorWindowInstalls'
  | 'paintingCoating'
  | 'requirements'
  | 'customItems';

export const WORK_SECTIONS: { key: WorkSectionKey; label: string }[] = [
  { key: 'siding', label: 'Siding' },
  { key: 'sheathing', label: 'Sheathing' },
  { key: 'soffit', label: 'Soffit' },
  { key: 'fascia', label: 'Fascia' },
  { key: 'gutters', label: 'Gutters' },
  { key: 'fixtures', label: 'Fixtures' },
  { key: 'demoRemoval', label: 'Demo & Removal' },
  { key: 'furringFraming', label: 'Furring & Framing' },
  { key: 'aluminumWraps', label: 'Wraps' },
  { key: 'paintingCoating', label: 'Painting/Coating' },
];

export const SECTION_DISPLAY_ORDER: WorkSectionKey[] = [
  'siding',
  'weatherBarrier',
  'soffit',
  'fascia',
  'gutters',
  'sheathing',
  'demoRemoval',
  'fixtures',
  'furringFraming',
  'aluminumWraps',
  'doorWindowInstalls',
  'paintingCoating',
  'requirements',
  'customItems',
];

/** 'customItems', 'weatherBarrier', 'requirements', and 'doorWindowInstalls' aren't in
 *  WORK_SECTIONS — the first three are always on with no Checklist toggle (see
 *  defaultWorkSections), and doorWindowInstalls no longer has a toggle at all — so they
 *  need their own label entries here. */
export const SECTION_LABELS: Record<WorkSectionKey, string> = {
  ...(Object.fromEntries(WORK_SECTIONS.map((s) => [s.key, s.label])) as Record<WorkSectionKey, string>),
  weatherBarrier: 'House Wrap & Flashing',
  requirements: 'Requirements',
  doorWindowInstalls: 'Door & Window Installs',
  customItems: 'Custom Items',
};

export function defaultWorkSections(): Record<WorkSectionKey, boolean> {
  return {
    siding: true,
    sheathing: false,
    soffit: false,
    fascia: false,
    gutters: false,
    fixtures: false,
    // Default on for a new job, alongside Siding.
    demoRemoval: true,
    furringFraming: false,
    aluminumWraps: false,
    // No Checklist toggle anymore — stays off for every new job.
    doorWindowInstalls: false,
    paintingCoating: false,
    // Always on — house wrap, seam tape, Vycor tape, and window head flashing auto-populate
    // from measurements on every job, no Checklist toggle to remember; delete the ones a
    // job doesn't need straight from the Material and Labor List.
    weatherBarrier: true,
    // Always on — Dumpster/Toilet/Boom Crane/Permitting/etc. are common enough to just
    // always offer, no Checklist toggle to remember.
    requirements: true,
    // Always on — manually added custom line items aren't gated behind a Checklist
    // toggle, there's nothing to switch off.
    customItems: true,
  };
}

// ---------- Measurements ----------

export type MeasurementFieldKey =
  | 'facadeAreaSqft'
  | 'openingsPerimeterLnft'
  | 'outsideCornerLengthLnft'
  | 'insideCornerLengthLnft'
  | 'starterLengthLnft'
  | 'eavesLengthLnft'
  | 'gablesLengthLnft'
  | 'soffitAreaSqft'
  | 'gutterLengthLnft';

export const MEASUREMENT_FIELDS: { key: MeasurementFieldKey; label: string; unit: string }[] = [
  { key: 'facadeAreaSqft', label: 'Facade Area', unit: 'sqft' },
  { key: 'openingsPerimeterLnft', label: 'Openings Perimeter', unit: 'lnft' },
  { key: 'outsideCornerLengthLnft', label: 'Outside Corner Length', unit: 'lnft' },
  { key: 'insideCornerLengthLnft', label: 'Inside Corner Length', unit: 'lnft' },
  { key: 'starterLengthLnft', label: 'Starter Length', unit: 'lnft' },
  { key: 'eavesLengthLnft', label: 'Eaves Length', unit: 'lnft' },
  { key: 'gablesLengthLnft', label: 'Gables (Rake) Length', unit: 'lnft' },
  { key: 'soffitAreaSqft', label: 'Soffit Area', unit: 'sqft' },
  { key: 'gutterLengthLnft', label: 'Gutter Length', unit: 'lnft' },
];

export interface MeasurementSection {
  id: ID;
  name: string;
  facadeAreaSqft: number;
  openingsPerimeterLnft: number;
  outsideCornerLengthLnft: number;
  insideCornerLengthLnft: number;
  starterLengthLnft: number;
  /** Siding material×style picked for this section, as `${Brand}|${Style}` — drives the
   *  Checklist checkbox and the linked Siding Type row in Quote Details automatically. */
  sidingKey: string | null;
}

export function emptyMeasurementSection(name = ''): MeasurementSection {
  return {
    id: (globalThis.crypto?.randomUUID?.() ?? String(Math.random())) as ID,
    name,
    facadeAreaSqft: 0,
    openingsPerimeterLnft: 0,
    outsideCornerLengthLnft: 0,
    insideCornerLengthLnft: 0,
    starterLengthLnft: 0,
    sidingKey: null,
  };
}

export interface Measurements {
  facadeAreaSqft: number;
  openingsPerimeterLnft: number;
  outsideCornerLengthLnft: number;
  insideCornerLengthLnft: number;
  starterLengthLnft: number;
  eavesLengthLnft: number;
  gablesLengthLnft: number;
  soffitAreaSqft: number;
  gutterLengthLnft: number;
  /** Raw values as extracted from the HOVER PDF, kept for reference — never fed into calculations directly. */
  raw: Partial<Record<MeasurementFieldKey, number>>;
  /** Which fields the user has hand-edited away from the parsed/raw value. */
  overridden: Partial<Record<MeasurementFieldKey, boolean>>;
  /** When true, a per-section manual measurement table drives every downstream total instead of the single fields above. */
  multiSection: boolean;
  sections: MeasurementSection[];
  pdfFileName?: string;
  parsedAt?: string;
}

export function emptyMeasurements(): Measurements {
  return {
    facadeAreaSqft: 0,
    openingsPerimeterLnft: 0,
    outsideCornerLengthLnft: 0,
    insideCornerLengthLnft: 0,
    starterLengthLnft: 0,
    eavesLengthLnft: 0,
    gablesLengthLnft: 0,
    soffitAreaSqft: 0,
    gutterLengthLnft: 0,
    raw: {},
    overridden: {},
    multiSection: false,
    sections: [],
  };
}

// ---------- Customer profile (internal) ----------

export interface CustomerProfile {
  projectType: string;
  customerType: string;
  timeline: string;
  hotLead: boolean;
  notes: string;
}

export function defaultCustomerProfile(): CustomerProfile {
  return {
    projectType: '',
    customerType: '',
    timeline: '',
    hotLead: false,
    notes: '',
  };
}

// ---------- Siding material/style selections (checklist) ----------

/** key = `${brand}|${style}` */
export type SidingMaterialSelections = Record<string, boolean>;

export function sidingKey(brand: Brand, style: Style): string {
  return `${brand}|${style}`;
}

// ---------- Siding type rows (Quote Details) ----------

export interface SidingTypeRow {
  id: ID;
  brand: Brand;
  style: Style;
  primed: boolean;
  productId: ID | null;
  /** Manual area — used directly unless linked measurement sections override it (see sectionIds). */
  areaSqft: number;
  /** Measurement-tab section ids feeding this row's area when multi-section is on. */
  sectionIds: ID[];
  autoGenerated: boolean;
  /** This row's own accessory/trim package — every brand gets its own, since a mixed-brand
   *  job (e.g. Vinyl + Hardie) needs Vinyl J-channel for one row and Hardie trim board for another. */
  trimConfig: TrimConfig;
}

// ---------- Trim configuration ----------

export interface TrimField<T> {
  value: T;
  overridden: boolean;
}

function tf<T>(value: T): TrimField<T> {
  return { value, overridden: false };
}

export interface TrimConfig {
  openingsTrimProductId: TrimField<ID | null>;
  outsideCornerProductId: TrimField<ID | null>;
  insideCornerProductId: TrimField<ID | null>;
  starterProductId: TrimField<ID | null>;
  fastenerProductId: TrimField<ID | null>;
  /** Both independently selectable — a job can run top-of-siding trim along the eaves, the
   *  gables (rakes), or both, and each generates its own calculated line item. */
  eavesTrim: TrimField<boolean>;
  gablesTrim: TrimField<boolean>;
  buttJointFlashing: TrimField<boolean>;
  touchUpPaint: TrimField<boolean>;
  caulkSealant: TrimField<boolean>;
  /** Not brand-driven — situational (roof/wall intersections), so it isn't reset on a material change. */
  stepFlashing: TrimField<boolean>;
}

export function defaultTrimConfig(): TrimConfig {
  return {
    openingsTrimProductId: tf<ID | null>(null),
    outsideCornerProductId: tf<ID | null>(null),
    insideCornerProductId: tf<ID | null>(null),
    starterProductId: tf<ID | null>(null),
    fastenerProductId: tf<ID | null>(null),
    eavesTrim: tf(true),
    gablesTrim: tf(false),
    buttJointFlashing: tf(false),
    touchUpPaint: tf(false),
    caulkSealant: tf(false),
    stepFlashing: tf(false),
  };
}

// ---------- Generic manual line-item picks (Fixtures, Furring & Framing, etc.) ----------

export interface LineItemPick {
  id: ID;
  productId: ID | null;
  qty: number;
}

// ---------- Custom (ad-hoc) line items ----------

/** A free-form line item the user typed in directly — not tied to any Price Book
 *  product, for anything the structured Quote Details inputs don't cover. Tagged with
 *  the section it belongs to so it shows up right alongside that section's own
 *  computed lines (e.g. one added from the Sheathing card lives in the Sheathing group),
 *  rather than in one generic catch-all bucket. */
export interface CustomLineItem {
  id: ID;
  section: WorkSectionKey;
  name: string;
  qty: number;
  unit: Unit;
  materialCost: number;
  laborCost: number;
}

export function emptyCustomLineItem(section: WorkSectionKey): CustomLineItem {
  return {
    id: (globalThis.crypto?.randomUUID?.() ?? String(Math.random())) as ID,
    section,
    name: '',
    qty: 1,
    unit: 'each',
    materialCost: 0,
    laborCost: 0,
  };
}

// ---------- Section specs ----------

export interface SoffitSpec {
  productId: ID | null;
  includeRemoval: boolean;
}

export interface FasciaSpec {
  productId: ID | null;
  includeRemoval: boolean;
}

export interface GuttersSpec {
  productId: ID | null;
  downspoutQty: number;
  includeGuards: boolean;
  includeRemoval: boolean;
}

export interface OneTimeCharges {
  threeStory: boolean;
  osbInsulationBoardSqft: number;
  detachResetLightQty: number;
  tripCharge: boolean;
  laborMinimum: boolean;
  materialDeliveryFee: boolean;
  permitFee: boolean;
  scaffoldingLiftRental: boolean;
}

export function defaultOneTimeCharges(): OneTimeCharges {
  return {
    threeStory: false,
    osbInsulationBoardSqft: 0,
    detachResetLightQty: 0,
    tripCharge: false,
    laborMinimum: false,
    materialDeliveryFee: false,
    permitFee: false,
    scaffoldingLiftRental: false,
  };
}

export const FURRING_WOOD_TYPES = ['2x4', '4x4', '4x6'] as const;
export type FurringWoodType = (typeof FURRING_WOOD_TYPES)[number];

export const WRAPS_MATERIAL_TYPES = ['Aluminum', 'James Hardie', 'LP SmartSide'] as const;
export type WrapsMaterialType = (typeof WRAPS_MATERIAL_TYPES)[number];

export const PAINTING_SURFACE_TYPES = ['Siding', 'Brick', 'Hardie / Fiber Cement', 'Wood', 'Stucco', 'Trim Only', 'Other'] as const;
export type PaintingSurfaceType = (typeof PAINTING_SURFACE_TYPES)[number];

export interface PaintingPrep {
  heavyPrep: boolean;
  powerWash: boolean;
}

export function defaultPaintingPrep(): PaintingPrep {
  return { heavyPrep: false, powerWash: false };
}

export interface QuoteDetails {
  /** Selected demo-removal price-book line items (siding tear-off materials). */
  demolitionMaterials: LineItemPick[];
  sidingSelections: SidingMaterialSelections;
  colors: {
    siding: string;
    trim: string;
    soffit: string;
    fascia: string;
    gutter: string;
  };
  sheathing: LineItemPick[];
  soffit: SoffitSpec;
  fascia: FasciaSpec;
  gutters: GuttersSpec;
  fixtures: LineItemPick[];
  furringFraming: LineItemPick[];
  /** Purely descriptive — doesn't filter or gate the Furring & Framing pick list. */
  furringFramingWoodType: FurringWoodType | '';
  aluminumWraps: LineItemPick[];
  /** Purely descriptive — doesn't filter or gate the Wraps pick list. */
  wrapsMaterialType: WrapsMaterialType | '';
  doorWindowInstalls: LineItemPick[];
  paintingCoating: LineItemPick[];
  paintingSurfaceType: PaintingSurfaceType | '';
  paintingPrep: PaintingPrep;
  equipmentRental: LineItemPick[];
  oneTimeCharges: OneTimeCharges;
}

export function defaultQuoteDetails(): QuoteDetails {
  return {
    demolitionMaterials: [],
    sidingSelections: {},
    colors: { siding: '', trim: '', soffit: '', fascia: '', gutter: '' },
    sheathing: [],
    soffit: { productId: null, includeRemoval: false },
    fascia: { productId: null, includeRemoval: false },
    gutters: { productId: null, downspoutQty: 0, includeGuards: false, includeRemoval: false },
    fixtures: [],
    furringFraming: [],
    furringFramingWoodType: '',
    aluminumWraps: [],
    wrapsMaterialType: '',
    doorWindowInstalls: [],
    paintingCoating: [],
    paintingSurfaceType: '',
    paintingPrep: defaultPaintingPrep(),
    equipmentRental: [],
    oneTimeCharges: defaultOneTimeCharges(),
  };
}

// ---------- Price book ----------

export type Unit = 'sqft' | 'lnft' | 'each';

export type Category =
  | 'siding'
  | 'siding-accessory'
  | 'sheathing'
  | 'weather-barrier'
  | 'soffit'
  | 'fascia'
  | 'gutters'
  | 'fixtures'
  | 'demo-removal'
  | 'furring-framing'
  | 'aluminum-wraps'
  | 'door-window-installs'
  | 'painting-coating'
  | 'equipment-rental'
  | 'one-time-charges';

export const CATEGORY_TO_SECTION: Record<Category, WorkSectionKey> = {
  siding: 'siding',
  'siding-accessory': 'siding',
  sheathing: 'sheathing',
  'weather-barrier': 'weatherBarrier',
  soffit: 'soffit',
  fascia: 'fascia',
  gutters: 'gutters',
  fixtures: 'fixtures',
  'demo-removal': 'demoRemoval',
  'furring-framing': 'furringFraming',
  'aluminum-wraps': 'aluminumWraps',
  'door-window-installs': 'doorWindowInstalls',
  'painting-coating': 'paintingCoating',
  'equipment-rental': 'requirements',
  'one-time-charges': 'requirements',
};

export interface PriceBookItem {
  id: ID;
  category: Category;
  brand: Brand | 'Universal';
  style: Style | '';
  primed: boolean;
  name: string;
  unit: Unit;
  coveragePerUnit: number;
  wastePct: number;
  materialPrice: number;
  laborRate: number;
  isDefault: boolean;
  active: boolean;
}

export interface PriceBook {
  schemaVersion: number;
  items: PriceBookItem[];
  /** IDs of every default catalog item ever merged in — lets migrations distinguish
   *  "brand-new default the user hasn't seen yet" (auto-append) from
   *  "default item the user deliberately deleted" (leave deleted). */
  knownDefaultIds: string[];
}

// ---------- Calculation rules (per brand) ----------

export interface BrandCalcRules {
  sidingWastePct: number;
  purchaseRounding: 'up' | 'nearest' | 'exact';
  outsideCornerPiecesPerFt: number;
  insideCornerPiecesPerFt: number;
  trimWastePct: number;
  starterCoverageLnftPerPiece: number;
  laborMinimumDollars: number;
  laborRateMultiplier: number;
}

export interface CalcRulesConfig {
  schemaVersion: number;
  vinyl: BrandCalcRules;
  jamesHardie: BrandCalcRules;
  lpSmartSide: BrandCalcRules;
  other: BrandCalcRules;
}

export function calcRulesFor(config: CalcRulesConfig, key: CalcRuleBrandKey): BrandCalcRules {
  return config[key];
}

// ---------- Calculator draft (per job) ----------

/** A one-off manual correction to a single computed line's quantity and/or Material $ /
 *  Labor $, keyed by that line's stable origin key (see engine.ts) so it survives
 *  recalculation. Overriding `qty` recomputes purchase qty and both costs from it (unless
 *  materialCost/laborCost are ALSO overridden, which win). `suppressed` removes the line
 *  from the quote entirely (a manual "delete"). */
export interface LineItemOverride {
  qty?: number;
  materialCost?: number;
  laborCost?: number;
  suppressed?: boolean;
}

export interface CalculatorDraft {
  jobId: ID;
  measurements: Measurements;
  customerProfile: CustomerProfile;
  workSections: Record<WorkSectionKey, boolean>;
  quoteDetails: QuoteDetails;
  sidingTypeRows: SidingTypeRow[];
  lineItemOverrides: Record<string, LineItemOverride>;
  customLineItems: CustomLineItem[];
  updatedAt: string;
}

export function defaultDraft(jobId: ID): CalculatorDraft {
  return {
    jobId,
    measurements: emptyMeasurements(),
    customerProfile: defaultCustomerProfile(),
    workSections: defaultWorkSections(),
    quoteDetails: defaultQuoteDetails(),
    sidingTypeRows: [],
    lineItemOverrides: {},
    customLineItems: [],
    updatedAt: new Date().toISOString(),
  };
}

/** Backfills fields introduced after a draft may have been saved, so older
 *  localStorage data doesn't crash the app — not a full migration system,
 *  just defensive defaults for an in-progress schema. */
export function normalizeDraft(draft: CalculatorDraft): CalculatorDraft {
  // Pre-split measurements had a single combined "Fascia Length" (eaves + rakes summed).
  // Fold it into the eaves bucket so old jobs' Fascia section totals are unaffected;
  // the user can check Gables and split the length out by hand if a job needs it.
  const legacyMeasurements = draft.measurements as unknown as { fasciaLengthLnft?: number } | undefined;

  const normalizedRows: SidingTypeRow[] = (draft.sidingTypeRows ?? []).map((row) => {
    const legacyTrim = row.trimConfig as unknown as { topOfSidingMode?: { value: string } } | undefined;
    const trimConfig: TrimConfig = { ...defaultTrimConfig(), ...row.trimConfig };
    if (legacyTrim?.topOfSidingMode && !row.trimConfig?.eavesTrim && !row.trimConfig?.gablesTrim) {
      trimConfig.eavesTrim = tf(true);
      trimConfig.gablesTrim = tf(legacyTrim.topOfSidingMode.value === 'eaves-gables');
    }
    delete (trimConfig as any).topOfSidingMode;
    return {
      ...row,
      sectionIds: row.sectionIds ?? [],
      trimConfig,
    };
  });

  // Two rows of the same brand+style+primed always end up with the same trims/starter/
  // fasteners (brand-driven), so they should never be priced as separate line items —
  // fold any that slipped through (e.g. from before this rule existed) into one.
  const dedupedRows: SidingTypeRow[] = [];
  const rowIndexByKey = new Map<string, number>();
  for (const row of normalizedRows) {
    const key = `${row.brand}|${row.style}|${row.primed}`;
    const existingIndex = rowIndexByKey.get(key);
    if (existingIndex === undefined) {
      rowIndexByKey.set(key, dedupedRows.length);
      dedupedRows.push(row);
    } else {
      const existing = dedupedRows[existingIndex];
      dedupedRows[existingIndex] = {
        ...existing,
        areaSqft: existing.areaSqft + row.areaSqft,
        sectionIds: Array.from(new Set([...existing.sectionIds, ...row.sectionIds])),
        autoGenerated: existing.autoGenerated && row.autoGenerated,
      };
    }
  }

  return {
    ...draft,
    measurements: {
      ...draft.measurements,
      eavesLengthLnft: draft.measurements?.eavesLengthLnft ?? legacyMeasurements?.fasciaLengthLnft ?? 0,
      gablesLengthLnft: draft.measurements?.gablesLengthLnft ?? 0,
      sections: (draft.measurements?.sections ?? []).map((s) => ({
        ...s,
        sidingKey: s.sidingKey ?? null,
      })),
    },
    quoteDetails: {
      ...draft.quoteDetails,
      equipmentRental: draft.quoteDetails?.equipmentRental ?? [],
      furringFramingWoodType: draft.quoteDetails?.furringFramingWoodType ?? '',
      wrapsMaterialType: draft.quoteDetails?.wrapsMaterialType ?? '',
      paintingSurfaceType: draft.quoteDetails?.paintingSurfaceType ?? '',
      paintingPrep: { ...defaultPaintingPrep(), ...draft.quoteDetails?.paintingPrep },
    },
    // Always on — no Checklist toggle for custom items, house wrap/flashing, or
    // requirements (which folded in the old Equipment Rental / One-Time Charges
    // toggles), so old saved drafts (missing these keys entirely) must still get them,
    // not silently default to off.
    workSections: { ...draft.workSections, customItems: true, weatherBarrier: true, requirements: true },
    sidingTypeRows: dedupedRows,
    lineItemOverrides: draft.lineItemOverrides ?? {},
    // Custom items didn't used to carry a section — old ones fall back to the generic
    // catch-all bucket rather than any specific work scope.
    customLineItems: (draft.customLineItems ?? []).map((c) => ({ ...c, section: c.section ?? 'customItems' })),
  };
}

// ---------- Job ----------

export interface Job {
  id: ID;
  name: string;
  customerName: string;
  salesRep: string;
  address: string;
  createdAt: string;
  updatedAt: string;
  draft: CalculatorDraft;
}

// ---------- Computed line items / totals ----------

export interface ComputedLineItem {
  id: ID;
  section: WorkSectionKey;
  productId: ID | null;
  name: string;
  brand: string;
  unit: Unit;
  qty: number;
  purchaseQty: number;
  /** How many `unit`s one purchase unit covers (e.g. 100 sqft per "square") — needed to
   *  turn materialUnitPrice (priced per purchase unit) into a true $/unit figure. */
  coveragePerUnit: number;
  /** Waste %, purchase rounding mode, and labor rate multiplier this line was built
   *  with — kept around so a manual qty override can recompute purchase qty and both
   *  costs the same way buildLine originally did. */
  wastePct: number;
  rounding: 'up' | 'nearest' | 'exact';
  laborRateMultiplier: number;
  materialUnitPrice: number;
  laborRate: number;
  materialCost: number;
  laborCost: number;
  totalCost: number;
  /** Stable key identifying this line's origin across recalculations — used to attach a manual override. */
  overrideKey: string;
  overridden: { qty: boolean; material: boolean; labor: boolean };
  /** True for a line synthesized directly from a CustomLineItem — the origin id is
   *  everything after "custom-" in overrideKey. Rendered as editable name/qty/unit
   *  fields rather than a read-only computed row. */
  isCustom: boolean;
}

export interface SectionTotals {
  section: WorkSectionKey;
  items: ComputedLineItem[];
  materialSubtotal: number;
  laborSubtotal: number;
  totalSubtotal: number;
}

export interface CalculationResult {
  sections: SectionTotals[];
  materialTotal: number;
  laborTotal: number;
  grandTotal: number;
}
