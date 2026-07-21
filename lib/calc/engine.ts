import {
  CalcRulesConfig,
  CalculatorDraft,
  CalculationResult,
  ComputedLineItem,
  LineItemPick,
  PriceBook,
  PriceBookItem,
  SECTION_DISPLAY_ORDER,
  SectionTotals,
  WorkSectionKey,
} from '../types';
import { brandToCalcRuleKey, isTrimBoardBrand } from '../brands';
import { ACCESSORY_IDS } from '../defaultPriceBook';
import { purchaseQtyFor, Rounding } from './quantity';
import { effectiveMeasurements } from './measurements';

function findItem(priceBook: PriceBook, id: string | null | undefined): PriceBookItem | undefined {
  if (!id) return undefined;
  return priceBook.items.find((i) => i.id === id && i.active);
}

let lineIdCounter = 0;
function nextLineId(): string {
  lineIdCounter += 1;
  return `line-${lineIdCounter}`;
}

function buildLine(
  section: WorkSectionKey,
  item: PriceBookItem,
  qty: number,
  wastePct: number,
  rounding: Rounding,
  laborRateMultiplier: number
): ComputedLineItem {
  const purchaseQty = purchaseQtyFor(qty, wastePct, item.coveragePerUnit, rounding);
  const materialCost = purchaseQty * item.materialPrice;
  const laborCost = qty * item.laborRate * laborRateMultiplier;
  return {
    id: nextLineId(),
    section,
    productId: item.id,
    name: item.name,
    brand: item.brand,
    unit: item.unit,
    qty,
    purchaseQty,
    materialUnitPrice: item.materialPrice,
    laborRate: item.laborRate,
    materialCost,
    laborCost,
    totalCost: materialCost + laborCost,
  };
}

function linesFromPicks(section: WorkSectionKey, picks: LineItemPick[], priceBook: PriceBook): ComputedLineItem[] {
  const lines: ComputedLineItem[] = [];
  for (const pick of picks) {
    const item = findItem(priceBook, pick.productId);
    if (!item || pick.qty <= 0) continue;
    lines.push(buildLine(section, item, pick.qty, item.wastePct, 'up', 1));
  }
  return lines;
}

export function computeCalculation(
  draft: CalculatorDraft,
  priceBook: PriceBook,
  calcRules: CalcRulesConfig
): CalculationResult {
  lineIdCounter = 0;
  const ws = draft.workSections;
  const lines: ComputedLineItem[] = [];
  const em = effectiveMeasurements(draft.measurements);

  // ---------- Siding ----------
  if (ws.siding) {
    for (const row of draft.sidingTypeRows) {
      const item = findItem(priceBook, row.productId);
      if (!item || row.areaSqft <= 0) continue;
      const rules = calcRules[brandToCalcRuleKey(row.brand)];
      lines.push(buildLine('siding', item, row.areaSqft, rules.sidingWastePct, rules.purchaseRounding, rules.laborRateMultiplier));
    }

    // Siding accessories driven by trimConfig — brand-driven switch already decided which
    // productIds are selected; the engine just prices whatever is currently configured.
    const trimBrandRow = draft.sidingTypeRows.find((r) => isTrimBoardBrand(r.brand));
    const trimRules = calcRules[trimBrandRow ? brandToCalcRuleKey(trimBrandRow.brand) : 'vinyl'];
    const tc = draft.trimConfig;

    const openingsItem = findItem(priceBook, tc.openingsTrimProductId.value);
    if (openingsItem && em.openingsPerimeterLnft > 0) {
      lines.push(
        buildLine('siding', openingsItem, em.openingsPerimeterLnft, trimRules.trimWastePct, trimRules.purchaseRounding, trimRules.laborRateMultiplier)
      );
    }

    const outsideItem = findItem(priceBook, tc.outsideCornerProductId.value);
    if (outsideItem && em.outsideCornerLengthLnft > 0) {
      // pieces/ft is expressed as extra coverage density: qty of "linear feet of piece" needed = length * piecesPerFt
      const adjustedQty = em.outsideCornerLengthLnft * trimRules.outsideCornerPiecesPerFt;
      lines.push(
        buildLine('siding', outsideItem, adjustedQty, trimRules.trimWastePct, trimRules.purchaseRounding, trimRules.laborRateMultiplier)
      );
    }

    const insideItem = findItem(priceBook, tc.insideCornerProductId.value);
    if (insideItem && em.insideCornerLengthLnft > 0) {
      const adjustedQty = em.insideCornerLengthLnft * trimRules.insideCornerPiecesPerFt;
      lines.push(
        buildLine('siding', insideItem, adjustedQty, trimRules.trimWastePct, trimRules.purchaseRounding, trimRules.laborRateMultiplier)
      );
    }

    const starterItem = findItem(priceBook, tc.starterProductId.value);
    if (starterItem && em.starterLengthLnft > 0) {
      lines.push(
        buildLine('siding', starterItem, em.starterLengthLnft, trimRules.trimWastePct, trimRules.purchaseRounding, trimRules.laborRateMultiplier)
      );
    }

    // Top-of-siding trim runs the eave line; "eaves + gables" adds an estimated allowance
    // for gable rakes since HOVER's export doesn't report gable length separately.
    const topTrimId = tc.topOfSidingMode.value === 'eaves-gables' ? ACCESSORY_IDS.topTrimEavesGables : ACCESSORY_IDS.topTrimEavesOnly;
    const topTrimItem = findItem(priceBook, topTrimId);
    if (topTrimItem && draft.measurements.fasciaLengthLnft > 0) {
      const gableAllowance = tc.topOfSidingMode.value === 'eaves-gables' ? 1.4 : 1;
      lines.push(
        buildLine(
          'siding',
          topTrimItem,
          draft.measurements.fasciaLengthLnft * gableAllowance,
          topTrimItem.wastePct,
          'up',
          trimRules.laborRateMultiplier
        )
      );
    }

    if (tc.buttJointFlashing.value) {
      const item = findItem(priceBook, ACCESSORY_IDS.buttJointFlashing);
      if (item && em.facadeAreaSqft > 0) {
        lines.push(buildLine('siding', item, em.facadeAreaSqft, item.wastePct, 'up', trimRules.laborRateMultiplier));
      }
    }
    if (tc.touchUpPaint.value) {
      const item = findItem(priceBook, ACCESSORY_IDS.touchUpPaint);
      if (item) lines.push(buildLine('siding', item, em.facadeAreaSqft, item.wastePct, 'up', trimRules.laborRateMultiplier));
    }
    if (tc.caulkSealant.value) {
      const item = findItem(priceBook, ACCESSORY_IDS.caulkSealant);
      if (item) lines.push(buildLine('siding', item, em.facadeAreaSqft, item.wastePct, 'up', trimRules.laborRateMultiplier));
    }

    // Brand labor minimum: top up siding-category labor for each brand bucket represented on the job.
    const bucketsUsed = new Set(draft.sidingTypeRows.map((r) => brandToCalcRuleKey(r.brand)));
    for (const bucket of bucketsUsed) {
      const rules = calcRules[bucket];
      if (rules.laborMinimumDollars <= 0) continue;
      const laborSoFar = lines
        .filter((l) => l.section === 'siding')
        .filter((l) => {
          const row = draft.sidingTypeRows.find((r) => r.productId === l.productId);
          return row ? brandToCalcRuleKey(row.brand) === bucket : false;
        })
        .reduce((sum, l) => sum + l.laborCost, 0);
      if (laborSoFar > 0 && laborSoFar < rules.laborMinimumDollars) {
        lines.push({
          id: nextLineId(),
          section: 'siding',
          productId: null,
          name: 'Labor Minimum Adjustment',
          brand: bucket,
          unit: 'each',
          qty: 1,
          purchaseQty: 1,
          materialUnitPrice: 0,
          laborRate: rules.laborMinimumDollars - laborSoFar,
          materialCost: 0,
          laborCost: rules.laborMinimumDollars - laborSoFar,
          totalCost: rules.laborMinimumDollars - laborSoFar,
        });
      }
    }
  }

  // ---------- Sheathing ----------
  if (ws.sheathing) {
    lines.push(...linesFromPicks('sheathing', draft.quoteDetails.sheathing, priceBook));
  }

  // ---------- Soffit ----------
  if (ws.soffit) {
    const spec = draft.quoteDetails.soffit;
    const item = findItem(priceBook, spec.productId);
    if (item && draft.measurements.soffitAreaSqft > 0) {
      lines.push(buildLine('soffit', item, draft.measurements.soffitAreaSqft, item.wastePct, 'up', 1));
    }
    if (spec.includeRemoval) {
      const removal = findItem(priceBook, 'soffit-removal');
      if (removal && draft.measurements.soffitAreaSqft > 0) {
        lines.push(buildLine('soffit', removal, draft.measurements.soffitAreaSqft, 0, 'exact', 1));
      }
    }
  }

  // ---------- Fascia ----------
  if (ws.fascia) {
    const spec = draft.quoteDetails.fascia;
    const item = findItem(priceBook, spec.productId);
    if (item && draft.measurements.fasciaLengthLnft > 0) {
      lines.push(buildLine('fascia', item, draft.measurements.fasciaLengthLnft, item.wastePct, 'up', 1));
    }
    if (spec.includeRemoval) {
      const removal = findItem(priceBook, 'fascia-removal');
      if (removal && draft.measurements.fasciaLengthLnft > 0) {
        lines.push(buildLine('fascia', removal, draft.measurements.fasciaLengthLnft, 0, 'exact', 1));
      }
    }
  }

  // ---------- Gutters ----------
  if (ws.gutters) {
    const spec = draft.quoteDetails.gutters;
    const item = findItem(priceBook, spec.productId);
    if (item && draft.measurements.gutterLengthLnft > 0) {
      lines.push(buildLine('gutters', item, draft.measurements.gutterLengthLnft, item.wastePct, 'up', 1));
    }
    if (spec.downspoutQty > 0) {
      const downspout = findItem(priceBook, 'gutter-downspout');
      if (downspout) lines.push(buildLine('gutters', downspout, spec.downspoutQty, 0, 'exact', 1));
    }
    if (spec.includeGuards) {
      const guards = findItem(priceBook, 'gutter-guards');
      if (guards && draft.measurements.gutterLengthLnft > 0) {
        lines.push(buildLine('gutters', guards, draft.measurements.gutterLengthLnft, guards.wastePct, 'up', 1));
      }
    }
    if (spec.includeRemoval) {
      const removal = findItem(priceBook, 'gutter-removal');
      if (removal && draft.measurements.gutterLengthLnft > 0) {
        lines.push(buildLine('gutters', removal, draft.measurements.gutterLengthLnft, 0, 'exact', 1));
      }
    }
  }

  // ---------- Demo & Removal (siding tear-off) ----------
  if (ws.demoRemoval) {
    lines.push(...linesFromPicks('demoRemoval', draft.quoteDetails.demolitionMaterials, priceBook));
  }

  // ---------- Fixtures ----------
  if (ws.fixtures) {
    lines.push(...linesFromPicks('fixtures', draft.quoteDetails.fixtures, priceBook));
  }

  // ---------- Furring & Framing ----------
  if (ws.furringFraming) {
    lines.push(...linesFromPicks('furringFraming', draft.quoteDetails.furringFraming, priceBook));
  }

  // ---------- Aluminum Wraps ----------
  if (ws.aluminumWraps) {
    lines.push(...linesFromPicks('aluminumWraps', draft.quoteDetails.aluminumWraps, priceBook));
  }

  // ---------- Door & Window Installs ----------
  if (ws.doorWindowInstalls) {
    lines.push(...linesFromPicks('doorWindowInstalls', draft.quoteDetails.doorWindowInstalls, priceBook));
  }

  // ---------- Painting / Coating ----------
  if (ws.paintingCoating) {
    lines.push(...linesFromPicks('paintingCoating', draft.quoteDetails.paintingCoating, priceBook));
  }

  // ---------- One-Time Charges ----------
  if (ws.oneTimeCharges) {
    const otc = draft.quoteDetails.oneTimeCharges;
    const maybeAdd = (id: string, qty: number) => {
      const item = findItem(priceBook, id);
      if (item && qty > 0) lines.push(buildLine('oneTimeCharges', item, qty, 0, 'exact', 1));
    };
    if (otc.threeStory) maybeAdd('otc-three-story', 1);
    if (otc.osbInsulationBoardSqft > 0) maybeAdd('otc-osb-replacement', otc.osbInsulationBoardSqft);
    if (otc.detachResetLightQty > 0) maybeAdd('otc-detach-reset-light', otc.detachResetLightQty);
    if (otc.tripCharge) maybeAdd('otc-trip-charge', 1);
    if (otc.laborMinimum) maybeAdd('otc-labor-minimum', 1);
    if (otc.portableToilet) maybeAdd('otc-portable-toilet', 1);
    if (otc.dumpsterWasteDisposal) maybeAdd('otc-dumpster', 1);
    if (otc.materialDeliveryFee) maybeAdd('otc-material-delivery', 1);
    if (otc.permitFee) maybeAdd('otc-permit-fee', 1);
    if (otc.scaffoldingLiftRental) maybeAdd('otc-scaffolding-lift', 1);
  }

  // ---------- Group into sections ----------
  const sections: SectionTotals[] = SECTION_DISPLAY_ORDER.filter((key) => ws[key]).map((key) => {
    const items = lines.filter((l) => l.section === key);
    const materialSubtotal = items.reduce((s, l) => s + l.materialCost, 0);
    const laborSubtotal = items.reduce((s, l) => s + l.laborCost, 0);
    return {
      section: key,
      items,
      materialSubtotal,
      laborSubtotal,
      totalSubtotal: materialSubtotal + laborSubtotal,
    };
  });

  const materialTotal = sections.reduce((s, sec) => s + sec.materialSubtotal, 0);
  const laborTotal = sections.reduce((s, sec) => s + sec.laborSubtotal, 0);

  return {
    sections,
    materialTotal,
    laborTotal,
    grandTotal: materialTotal + laborTotal,
  };
}
