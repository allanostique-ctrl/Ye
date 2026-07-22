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
import { brandToCalcRuleKey } from '../brands';
import { ACCESSORY_IDS } from '../defaultPriceBook';
import { purchaseQtyFor, Rounding } from './quantity';
import { effectiveRowArea, measurementsForRow } from './measurements';

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
  laborRateMultiplier: number,
  overrideKey: string
): ComputedLineItem {
  const purchaseQty = purchaseQtyFor(qty, wastePct, item.coveragePerUnit, rounding);
  // Round to cents at the source (not just at display time) so ordinary floating-point
  // noise (e.g. 180 * 1.1 === 198.00000000000003 in JS) never leaks into an editable
  // field, the override system, or the CSV export.
  const materialCost = Math.round(purchaseQty * item.materialPrice * 100) / 100;
  const laborCost = Math.round(qty * item.laborRate * laborRateMultiplier * 100) / 100;
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
    overrideKey,
    overridden: { material: false, labor: false },
  };
}

function linesFromPicks(section: WorkSectionKey, picks: LineItemPick[], priceBook: PriceBook): ComputedLineItem[] {
  const lines: ComputedLineItem[] = [];
  for (const pick of picks) {
    const item = findItem(priceBook, pick.productId);
    if (!item || pick.qty <= 0) continue;
    lines.push(buildLine(section, item, pick.qty, item.wastePct, 'up', 1, `pick-${pick.id}`));
  }
  return lines;
}

/** Applies any manual Material $/Labor $ corrections on top of the computed values, keyed
 *  by each line's stable overrideKey so they survive recalculation. */
function applyOverrides(lines: ComputedLineItem[], overrides: Record<string, { materialCost?: number; laborCost?: number }>): void {
  for (const line of lines) {
    const override = overrides[line.overrideKey];
    if (!override) continue;
    if (override.materialCost !== undefined) {
      line.materialCost = override.materialCost;
      line.overridden.material = true;
    }
    if (override.laborCost !== undefined) {
      line.laborCost = override.laborCost;
      line.overridden.labor = true;
    }
    line.totalCost = line.materialCost + line.laborCost;
  }
}

export function computeCalculation(
  draft: CalculatorDraft,
  priceBook: PriceBook,
  calcRules: CalcRulesConfig
): CalculationResult {
  lineIdCounter = 0;
  const ws = draft.workSections;
  const lines: ComputedLineItem[] = [];

  // ---------- Siding ----------
  if (ws.siding) {
    const totalSidingArea = draft.sidingTypeRows.reduce((sum, r) => sum + effectiveRowArea(r, draft.measurements), 0);

    for (const row of draft.sidingTypeRows) {
      const rowArea = effectiveRowArea(row, draft.measurements);
      const rules = calcRules[brandToCalcRuleKey(row.brand)];

      const item = findItem(priceBook, row.productId);
      if (item && rowArea > 0) {
        lines.push(
          buildLine('siding', item, rowArea, rules.sidingWastePct, rules.purchaseRounding, rules.laborRateMultiplier, `siding-material-${row.id}`)
        );
      }

      // Each row carries its OWN accessory/trim package — a mixed-brand job (e.g. Vinyl +
      // Hardie) prices Vinyl J-channel for the Vinyl row and Hardie trim board for the
      // Hardie row independently, using that row's own share of the job's measurements.
      const tc = row.trimConfig;
      const rm = measurementsForRow(row, draft.measurements, draft.sidingTypeRows);
      const roofLineShare = totalSidingArea > 0 ? rowArea / totalSidingArea : 0;

      const openingsItem = findItem(priceBook, tc.openingsTrimProductId.value);
      if (openingsItem && rm.openingsPerimeterLnft > 0) {
        lines.push(
          buildLine(
            'siding',
            openingsItem,
            rm.openingsPerimeterLnft,
            rules.trimWastePct,
            rules.purchaseRounding,
            rules.laborRateMultiplier,
            `siding-${row.id}-openings`
          )
        );
      }

      const outsideItem = findItem(priceBook, tc.outsideCornerProductId.value);
      if (outsideItem && rm.outsideCornerLengthLnft > 0) {
        // pieces/ft is expressed as extra coverage density: qty of "linear feet of piece" needed = length * piecesPerFt
        const adjustedQty = rm.outsideCornerLengthLnft * rules.outsideCornerPiecesPerFt;
        lines.push(
          buildLine(
            'siding',
            outsideItem,
            adjustedQty,
            rules.trimWastePct,
            rules.purchaseRounding,
            rules.laborRateMultiplier,
            `siding-${row.id}-outsideCorner`
          )
        );
      }

      const insideItem = findItem(priceBook, tc.insideCornerProductId.value);
      if (insideItem && rm.insideCornerLengthLnft > 0) {
        const adjustedQty = rm.insideCornerLengthLnft * rules.insideCornerPiecesPerFt;
        lines.push(
          buildLine(
            'siding',
            insideItem,
            adjustedQty,
            rules.trimWastePct,
            rules.purchaseRounding,
            rules.laborRateMultiplier,
            `siding-${row.id}-insideCorner`
          )
        );
      }

      const starterItem = findItem(priceBook, tc.starterProductId.value);
      if (starterItem && rm.starterLengthLnft > 0) {
        lines.push(
          buildLine(
            'siding',
            starterItem,
            rm.starterLengthLnft,
            rules.trimWastePct,
            rules.purchaseRounding,
            rules.laborRateMultiplier,
            `siding-${row.id}-starter`
          )
        );
      }

      const fastenerItem = findItem(priceBook, tc.fastenerProductId.value);
      if (fastenerItem && rowArea > 0) {
        lines.push(
          buildLine('siding', fastenerItem, rowArea, fastenerItem.wastePct, 'up', rules.laborRateMultiplier, `siding-${row.id}-fastener`)
        );
      }

      // Top-of-siding trim runs along the eaves and/or gable rakes, each allocated by this
      // row's share of total siding area (HOVER's export doesn't report roofline length per
      // siding material). Eaves and gables are independently selectable and each produces
      // its own line item when both are checked.
      const rowEavesShare = draft.measurements.eavesLengthLnft * roofLineShare;
      const rowGablesShare = draft.measurements.gablesLengthLnft * roofLineShare;

      if (tc.eavesTrim.value) {
        const eavesTrimItem = findItem(priceBook, ACCESSORY_IDS.topTrimEavesOnly);
        if (eavesTrimItem && rowEavesShare > 0) {
          lines.push(
            buildLine(
              'siding',
              eavesTrimItem,
              rowEavesShare,
              eavesTrimItem.wastePct,
              'up',
              rules.laborRateMultiplier,
              `siding-${row.id}-eavesTrim`
            )
          );
        }
      }

      if (tc.gablesTrim.value) {
        const gablesTrimItem = findItem(priceBook, ACCESSORY_IDS.topTrimEavesGables);
        if (gablesTrimItem && rowGablesShare > 0) {
          lines.push(
            buildLine(
              'siding',
              gablesTrimItem,
              rowGablesShare,
              gablesTrimItem.wastePct,
              'up',
              rules.laborRateMultiplier,
              `siding-${row.id}-gablesTrim`
            )
          );
        }
      }

      const rowRooflineShare = rowEavesShare + rowGablesShare;
      if (tc.stepFlashing.value) {
        const item2 = findItem(priceBook, ACCESSORY_IDS.stepFlashing);
        if (item2 && rowRooflineShare > 0) {
          lines.push(buildLine('siding', item2, rowRooflineShare, item2.wastePct, 'up', rules.laborRateMultiplier, `siding-${row.id}-stepFlashing`));
        }
      }
      if (tc.buttJointFlashing.value) {
        const item2 = findItem(priceBook, ACCESSORY_IDS.buttJointFlashing);
        if (item2 && rowArea > 0) {
          lines.push(buildLine('siding', item2, rowArea, item2.wastePct, 'up', rules.laborRateMultiplier, `siding-${row.id}-buttJoint`));
        }
      }
      if (tc.touchUpPaint.value) {
        const item2 = findItem(priceBook, ACCESSORY_IDS.touchUpPaint);
        if (item2 && rowArea > 0) {
          lines.push(buildLine('siding', item2, rowArea, item2.wastePct, 'up', rules.laborRateMultiplier, `siding-${row.id}-touchUpPaint`));
        }
      }
      if (tc.caulkSealant.value) {
        const item2 = findItem(priceBook, ACCESSORY_IDS.caulkSealant);
        if (item2 && rowArea > 0) {
          lines.push(buildLine('siding', item2, rowArea, item2.wastePct, 'up', rules.laborRateMultiplier, `siding-${row.id}-caulk`));
        }
      }
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
        const topUp = Math.round((rules.laborMinimumDollars - laborSoFar) * 100) / 100;
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
          laborRate: topUp,
          materialCost: 0,
          laborCost: topUp,
          totalCost: topUp,
          overrideKey: `siding-labor-min-${bucket}`,
          overridden: { material: false, labor: false },
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
      lines.push(buildLine('soffit', item, draft.measurements.soffitAreaSqft, item.wastePct, 'up', 1, 'soffit-material'));
    }
    if (spec.includeRemoval) {
      const removal = findItem(priceBook, 'soffit-removal');
      if (removal && draft.measurements.soffitAreaSqft > 0) {
        lines.push(buildLine('soffit', removal, draft.measurements.soffitAreaSqft, 0, 'exact', 1, 'soffit-removal'));
      }
    }
  }

  // ---------- Fascia ----------
  if (ws.fascia) {
    const spec = draft.quoteDetails.fascia;
    const fasciaLengthLnft = draft.measurements.eavesLengthLnft + draft.measurements.gablesLengthLnft;
    const item = findItem(priceBook, spec.productId);
    if (item && fasciaLengthLnft > 0) {
      lines.push(buildLine('fascia', item, fasciaLengthLnft, item.wastePct, 'up', 1, 'fascia-material'));
    }
    if (spec.includeRemoval) {
      const removal = findItem(priceBook, 'fascia-removal');
      if (removal && fasciaLengthLnft > 0) {
        lines.push(buildLine('fascia', removal, fasciaLengthLnft, 0, 'exact', 1, 'fascia-removal'));
      }
    }
  }

  // ---------- Gutters ----------
  if (ws.gutters) {
    const spec = draft.quoteDetails.gutters;
    const item = findItem(priceBook, spec.productId);
    if (item && draft.measurements.gutterLengthLnft > 0) {
      lines.push(buildLine('gutters', item, draft.measurements.gutterLengthLnft, item.wastePct, 'up', 1, 'gutters-material'));
    }
    if (spec.downspoutQty > 0) {
      const downspout = findItem(priceBook, 'gutter-downspout');
      if (downspout) lines.push(buildLine('gutters', downspout, spec.downspoutQty, 0, 'exact', 1, 'gutters-downspout'));
    }
    if (spec.includeGuards) {
      const guards = findItem(priceBook, 'gutter-guards');
      if (guards && draft.measurements.gutterLengthLnft > 0) {
        lines.push(buildLine('gutters', guards, draft.measurements.gutterLengthLnft, guards.wastePct, 'up', 1, 'gutters-guards'));
      }
    }
    if (spec.includeRemoval) {
      const removal = findItem(priceBook, 'gutter-removal');
      if (removal && draft.measurements.gutterLengthLnft > 0) {
        lines.push(buildLine('gutters', removal, draft.measurements.gutterLengthLnft, 0, 'exact', 1, 'gutters-removal'));
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

  // ---------- Equipment Rental ----------
  if (ws.equipmentRental) {
    lines.push(...linesFromPicks('equipmentRental', draft.quoteDetails.equipmentRental, priceBook));
  }

  // ---------- One-Time Charges ----------
  if (ws.oneTimeCharges) {
    const otc = draft.quoteDetails.oneTimeCharges;
    const maybeAdd = (id: string, qty: number, overrideKey: string) => {
      const item = findItem(priceBook, id);
      if (item && qty > 0) lines.push(buildLine('oneTimeCharges', item, qty, 0, 'exact', 1, overrideKey));
    };
    if (otc.threeStory) maybeAdd('otc-three-story', 1, 'otc-threeStory');
    if (otc.osbInsulationBoardSqft > 0) maybeAdd('otc-osb-replacement', otc.osbInsulationBoardSqft, 'otc-osb');
    if (otc.detachResetLightQty > 0) maybeAdd('otc-detach-reset-light', otc.detachResetLightQty, 'otc-detachResetLight');
    if (otc.tripCharge) maybeAdd('otc-trip-charge', 1, 'otc-tripCharge');
    if (otc.laborMinimum) maybeAdd('otc-labor-minimum', 1, 'otc-laborMinimum');
    if (otc.materialDeliveryFee) maybeAdd('otc-material-delivery', 1, 'otc-materialDelivery');
    if (otc.permitFee) maybeAdd('otc-permit-fee', 1, 'otc-permitFee');
    if (otc.scaffoldingLiftRental) maybeAdd('otc-scaffolding-lift', 1, 'otc-scaffoldingLift');
  }

  applyOverrides(lines, draft.lineItemOverrides ?? {});

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
