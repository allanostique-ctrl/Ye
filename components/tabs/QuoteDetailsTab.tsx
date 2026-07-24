'use client';

import {
  CalcRulesConfig,
  CalculatorDraft,
  CustomLineItem,
  FURRING_WOOD_TYPES,
  FurringWoodType,
  PAINTING_SURFACE_TYPES,
  PaintingSurfaceType,
  PriceBook,
  PriceBookItem,
  SidingTypeRow,
  WRAPS_MATERIAL_TYPES,
  WorkSectionKey,
  WrapsMaterialType,
  emptyCustomLineItem,
  sidingKey,
} from '@/lib/types';
import { BRANDS, Brand, STYLES, Style, brandSupportsPrimed } from '@/lib/brands';
import { MAX_SIDING_ROWS, dedupeSidingRows } from '@/lib/calc/sidingRows';
import { trimConfigForBrand } from '@/lib/calc/trimSwitch';
import { effectiveMeasurements, effectiveRowArea } from '@/lib/calc/measurements';
import { computeCalculation } from '@/lib/calc/engine';
import { LineItemPickList } from '@/components/LineItemPickList';
import { MaterialLaborList } from '@/components/MaterialLaborList';
import { NextButton } from '@/components/NextButton';
import { NumericInput } from '@/components/NumericInput';

interface Props {
  draft: CalculatorDraft;
  updateDraft: (updater: (d: CalculatorDraft) => CalculatorDraft) => void;
  priceBook: PriceBook;
  calcRules: CalcRulesConfig;
  onNext: () => void;
}

function findSidingProduct(priceBook: PriceBook, brand: Brand, style: Style, primed: boolean) {
  return priceBook.items.find(
    (i) => i.category === 'siding' && i.brand === brand && i.style === style && i.primed === primed
  );
}

function SidingAccessoriesCard({
  row,
  accessoryItems,
  onUpdateTrim,
}: {
  row: SidingTypeRow;
  accessoryItems: PriceBookItem[];
  onUpdateTrim: <K extends keyof SidingTypeRow['trimConfig']>(key: K, value: SidingTypeRow['trimConfig'][K]['value']) => void;
}) {
  const tc = row.trimConfig;
  return (
    <div className="card">
      <h2 className="mb-3 text-lg font-bold">
        Siding Accessories — {row.brand} {row.style}
        {row.primed ? ' (Primed)' : ''}
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="field-label">Trim Around Openings</label>
          <select
            className="field-input"
            value={tc.openingsTrimProductId.value ?? ''}
            onChange={(e) => onUpdateTrim('openingsTrimProductId', e.target.value || null)}
          >
            <option value="">None</option>
            {accessoryItems.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label">Outside Corner Posts</label>
          <select
            className="field-input"
            value={tc.outsideCornerProductId.value ?? ''}
            onChange={(e) => onUpdateTrim('outsideCornerProductId', e.target.value || null)}
          >
            <option value="">None</option>
            {accessoryItems.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label">Inside Corner Posts</label>
          <select
            className="field-input"
            value={tc.insideCornerProductId.value ?? ''}
            onChange={(e) => onUpdateTrim('insideCornerProductId', e.target.value || null)}
          >
            <option value="">None</option>
            {accessoryItems.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label">Starter</label>
          <select
            className="field-input"
            value={tc.starterProductId.value ?? ''}
            onChange={(e) => onUpdateTrim('starterProductId', e.target.value || null)}
          >
            <option value="">None</option>
            {accessoryItems.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label">Fasteners</label>
          <select
            className="field-input"
            value={tc.fastenerProductId.value ?? ''}
            onChange={(e) => onUpdateTrim('fastenerProductId', e.target.value || null)}
          >
            <option value="">None</option>
            {accessoryItems.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4">
        <label className="field-label">Top-of-Siding Trim</label>
        <div className="flex gap-2">
          <button
            className="pill"
            data-active={tc.eavesTrim.value ? 'true' : 'false'}
            onClick={() => onUpdateTrim('eavesTrim', !tc.eavesTrim.value)}
          >
            {tc.eavesTrim.value ? '☑' : '☐'} Eaves
          </button>
          <button
            className="pill"
            data-active={tc.gablesTrim.value ? 'true' : 'false'}
            onClick={() => onUpdateTrim('gablesTrim', !tc.gablesTrim.value)}
          >
            {tc.gablesTrim.value ? '☑' : '☐'} Gables
          </button>
        </div>
        <p className="mt-1 text-xs text-gray-500">Select either or both — each calculates its own line item.</p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          className="pill"
          data-active={tc.buttJointFlashing.value ? 'true' : 'false'}
          onClick={() => onUpdateTrim('buttJointFlashing', !tc.buttJointFlashing.value)}
        >
          {tc.buttJointFlashing.value ? '☑' : '☐'} Butt Joint Flashing
        </button>
        <button
          className="pill"
          data-active={tc.touchUpPaint.value ? 'true' : 'false'}
          onClick={() => onUpdateTrim('touchUpPaint', !tc.touchUpPaint.value)}
        >
          {tc.touchUpPaint.value ? '☑' : '☐'} Touch-Up Paint
        </button>
        <button
          className="pill"
          data-active={tc.caulkSealant.value ? 'true' : 'false'}
          onClick={() => onUpdateTrim('caulkSealant', !tc.caulkSealant.value)}
        >
          {tc.caulkSealant.value ? '☑' : '☐'} Caulk / Sealant
        </button>
        <button
          className="pill"
          data-active={tc.stepFlashing.value ? 'true' : 'false'}
          onClick={() => onUpdateTrim('stepFlashing', !tc.stepFlashing.value)}
        >
          {tc.stepFlashing.value ? '☑' : '☐'} Step Flashing
        </button>
      </div>
    </div>
  );
}

export function QuoteDetailsTab({ draft, updateDraft, priceBook, calcRules, onNext }: Props) {
  const qd = draft.quoteDetails;
  const em = effectiveMeasurements(draft.measurements);
  const accessoryItems = priceBook.items.filter((i) => i.category === 'siding-accessory' && i.active);
  const equipmentItems = priceBook.items.filter((i) => i.category === 'equipment-rental' && i.active);
  const result = computeCalculation(draft, priceBook, calcRules);
  const suppressedCount = Object.values(draft.lineItemOverrides).filter((o) => o.suppressed).length;
  const multiSection = draft.measurements.multiSection;
  const sections = draft.measurements.sections;

  const areaSum = draft.sidingTypeRows.reduce((s, r) => s + effectiveRowArea(r, draft.measurements), 0);
  const areaMismatch = Math.abs(areaSum - em.facadeAreaSqft) > 0.5;
  const unassignedSections = multiSection
    ? sections.filter((s) => !draft.sidingTypeRows.some((r) => r.sectionIds.includes(s.id)))
    : [];

  /** A single work section's slice of `result`, shaped as its own CalculationResult so a
   *  card can show its own mini Material/Labor preview (with qty override and its own
   *  "+ Add Custom Line Item" button) right next to that section's inputs. Falls back to
   *  an empty section rather than omitting the preview, so the Add button is still reachable
   *  even before any line items exist yet. */
  function sectionResult(section: WorkSectionKey) {
    const found = result.sections.find((s) => s.section === section) ?? {
      section,
      items: [],
      materialSubtotal: 0,
      laborSubtotal: 0,
      totalSubtotal: 0,
    };
    return {
      sections: [found],
      materialTotal: found.materialSubtotal,
      laborTotal: found.laborSubtotal,
      grandTotal: found.totalSubtotal,
    };
  }

  function updateRow(id: string, patch: Partial<SidingTypeRow>) {
    updateDraft((d) => {
      const nextRows = d.sidingTypeRows.map((r) => {
        if (r.id !== id) return r;
        const merged = { ...r, ...patch };
        if ('brand' in patch || 'style' in patch || 'primed' in patch) {
          const product = findSidingProduct(priceBook, merged.brand, merged.style, merged.primed);
          merged.productId = product?.id ?? null;
        }
        if ('brand' in patch) {
          // A brand change is a material change for THIS row — re-derive its own
          // accessory package fresh, same as the checklist-driven auto-swap.
          merged.trimConfig = trimConfigForBrand(merged.brand, r.trimConfig);
        }
        return merged;
      });
      // If that change made this row's material (brand+style+primed) match another
      // row, fold them into one instead of pricing the same siding twice.
      const shouldDedupe = 'brand' in patch || 'style' in patch || 'primed' in patch;
      return { ...d, sidingTypeRows: shouldDedupe ? dedupeSidingRows(nextRows) : nextRows };
    });
  }

  function toggleRowSection(rowId: string, sectionId: string) {
    updateDraft((d) => {
      const targetRow = d.sidingTypeRows.find((r) => r.id === rowId);
      const linking = targetRow ? !targetRow.sectionIds.includes(sectionId) : false;
      const newKey = linking && targetRow ? sidingKey(targetRow.brand, targetRow.style) : null;
      return {
        ...d,
        // Keep the Measurements tab's per-section dropdown in sync with whatever
        // gets linked here, so the two screens never disagree about the pairing.
        measurements: {
          ...d.measurements,
          sections: d.measurements.sections.map((s) => (s.id === sectionId ? { ...s, sidingKey: newKey } : s)),
        },
        sidingTypeRows: d.sidingTypeRows.map((r) => {
          if (r.id === rowId) {
            return { ...r, sectionIds: linking ? [...r.sectionIds, sectionId] : r.sectionIds.filter((id) => id !== sectionId) };
          }
          // A section can only feed one row at a time — unlink it from wherever else it was.
          if (r.sectionIds.includes(sectionId)) {
            return { ...r, sectionIds: r.sectionIds.filter((id) => id !== sectionId) };
          }
          return r;
        }),
      };
    });
  }

  function addRow() {
    updateDraft((d) => {
      if (d.sidingTypeRows.length >= MAX_SIDING_ROWS) return d;
      const brand: Brand = 'Vinyl';
      const style: Style = 'Lap';
      const product = findSidingProduct(priceBook, brand, style, false);
      const newRow: SidingTypeRow = {
        id: crypto.randomUUID(),
        brand,
        style,
        primed: false,
        productId: product?.id ?? null,
        areaSqft: 0,
        sectionIds: [],
        autoGenerated: false,
        trimConfig: trimConfigForBrand(brand),
      };
      // Left as the Vinyl — Lap default, this is a fresh blank row to fill in — no
      // dedupe here. Once its brand/style dropdown gets changed, updateRow's own
      // dedupe pass takes over if it now matches another row.
      return { ...d, sidingTypeRows: [...d.sidingTypeRows, newRow] };
    });
  }

  function removeRow(id: string) {
    updateDraft((d) => ({ ...d, sidingTypeRows: d.sidingTypeRows.filter((r) => r.id !== id) }));
  }

  function setRowTrimField<K extends keyof SidingTypeRow['trimConfig']>(
    rowId: string,
    key: K,
    value: SidingTypeRow['trimConfig'][K]['value']
  ) {
    updateDraft((d) => ({
      ...d,
      sidingTypeRows: d.sidingTypeRows.map((r) =>
        r.id === rowId ? { ...r, trimConfig: { ...r.trimConfig, [key]: { value, overridden: true } } } : r
      ),
    }));
  }

  function handleOverride(overrideKey: string, field: 'qty' | 'materialCost' | 'laborCost', value: number | null) {
    updateDraft((d) => {
      const existing = d.lineItemOverrides[overrideKey] ?? {};
      const next = { ...existing, [field]: value === null ? undefined : value };
      const cleaned: typeof next = {};
      if (next.qty !== undefined) cleaned.qty = next.qty;
      if (next.materialCost !== undefined) cleaned.materialCost = next.materialCost;
      if (next.laborCost !== undefined) cleaned.laborCost = next.laborCost;
      if (next.suppressed) cleaned.suppressed = true;
      const nextOverrides = { ...d.lineItemOverrides };
      if (Object.keys(cleaned).length === 0) {
        delete nextOverrides[overrideKey];
      } else {
        nextOverrides[overrideKey] = cleaned;
      }
      return { ...d, lineItemOverrides: nextOverrides };
    });
  }

  /** A manual "delete" of a computed line — removes it from the quote entirely rather
   *  than zeroing its cost, while keeping any Material $/Labor $ correction already on
   *  it so restoring brings the line back exactly as it was. */
  function handleRemoveLine(overrideKey: string) {
    updateDraft((d) => ({
      ...d,
      lineItemOverrides: {
        ...d.lineItemOverrides,
        [overrideKey]: { ...d.lineItemOverrides[overrideKey], suppressed: true },
      },
    }));
  }

  function handleRestoreSuppressed() {
    updateDraft((d) => {
      const nextOverrides: typeof d.lineItemOverrides = {};
      for (const [key, override] of Object.entries(d.lineItemOverrides)) {
        const { suppressed, ...rest } = override;
        if (Object.keys(rest).length > 0) nextOverrides[key] = rest;
      }
      return { ...d, lineItemOverrides: nextOverrides };
    });
  }

  function handleAddCustomItem(section: WorkSectionKey) {
    updateDraft((d) => ({ ...d, customLineItems: [...d.customLineItems, emptyCustomLineItem(section)] }));
  }

  function handleUpdateCustomItem(id: string, patch: Partial<CustomLineItem>) {
    updateDraft((d) => ({
      ...d,
      customLineItems: d.customLineItems.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }));
  }

  function handleRemoveCustomItem(id: string) {
    updateDraft((d) => ({ ...d, customLineItems: d.customLineItems.filter((c) => c.id !== id) }));
  }

  function toggleEquipmentPick(productId: string) {
    updateDraft((d) => {
      const exists = d.quoteDetails.equipmentRental.some((p) => p.productId === productId);
      const next = exists
        ? d.quoteDetails.equipmentRental.filter((p) => p.productId !== productId)
        : [...d.quoteDetails.equipmentRental, { id: crypto.randomUUID(), productId, qty: 1 }];
      return { ...d, quoteDetails: { ...d.quoteDetails, equipmentRental: next } };
    });
  }

  function togglePaintingPrep(key: 'heavyPrep' | 'powerWash') {
    updateDraft((d) => ({
      ...d,
      quoteDetails: { ...d.quoteDetails, paintingPrep: { ...d.quoteDetails.paintingPrep, [key]: !d.quoteDetails.paintingPrep[key] } },
    }));
  }

  return (
    <div className="space-y-6">
      <div className="card overflow-x-auto">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">Siding Types</h2>
          <button className="btn btn-secondary btn-sm" onClick={addRow} disabled={draft.sidingTypeRows.length >= MAX_SIDING_ROWS}>
            + Add Row
          </button>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Brand</th>
              <th>Style</th>
              <th>Primed</th>
              {multiSection && <th>Section(s)</th>}
              <th className="text-right">Area (sqft)</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {draft.sidingTypeRows.map((row) => {
              const linked = multiSection && row.sectionIds.length > 0;
              return (
                <tr key={row.id}>
                  <td>
                    <select className="field-input" value={row.brand} onChange={(e) => updateRow(row.id, { brand: e.target.value as Brand })}>
                      {BRANDS.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <select className="field-input" value={row.style} onChange={(e) => updateRow(row.id, { style: e.target.value as Style })}>
                      {STYLES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <select
                      className="field-input"
                      value={row.primed ? 'primed' : 'unprimed'}
                      disabled={!brandSupportsPrimed(row.brand)}
                      onChange={(e) => updateRow(row.id, { primed: e.target.value === 'primed' })}
                    >
                      <option value="unprimed">Unprimed</option>
                      <option value="primed">Primed</option>
                    </select>
                  </td>
                  {multiSection && (
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {sections.map((s) => (
                          <button
                            key={s.id}
                            className="pill btn-sm"
                            data-active={row.sectionIds.includes(s.id) ? 'true' : 'false'}
                            onClick={() => toggleRowSection(row.id, s.id)}
                          >
                            {s.name}
                          </button>
                        ))}
                      </div>
                    </td>
                  )}
                  <td>
                    {linked ? (
                      <div className="text-right">
                        <span className="font-semibold">{effectiveRowArea(row, draft.measurements).toFixed(1)}</span>
                        <div className="text-xs text-gray-400">from sections</div>
                      </div>
                    ) : (
                      <NumericInput
                        className="field-input text-right"
                        value={row.areaSqft}
                        onChange={(v) => updateRow(row.id, { areaSqft: v })}
                      />
                    )}
                  </td>
                  <td>
                    <button className="btn btn-danger btn-sm" onClick={() => removeRow(row.id)}>
                      Remove
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={multiSection ? 4 : 3}>Sum vs. Facade Area ({em.facadeAreaSqft.toFixed(1)} sqft)</td>
              <td className="text-right">{areaSum.toFixed(1)}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
        {areaMismatch && (
          <p className="mt-2 text-sm font-semibold text-amber-600">
            ⚠ Siding row areas ({areaSum.toFixed(1)} sqft) don&rsquo;t match the facade total ({em.facadeAreaSqft.toFixed(1)} sqft).
          </p>
        )}
        {unassignedSections.length > 0 && (
          <p className="mt-2 text-sm font-semibold text-amber-600">
            ⚠ These sections aren&rsquo;t linked to a siding row yet: {unassignedSections.map((s) => s.name).join(', ')}.
          </p>
        )}
        <p className="mt-2 text-xs text-gray-500">
          Setting a row&rsquo;s Brand/Style/Primed to match another row already in this table merges them into one —
          same material always means the same trims, starter, and fasteners, so it&rsquo;s priced once, not twice.
        </p>
      </div>

      {draft.sidingTypeRows.map((row) => (
        <SidingAccessoriesCard
          key={row.id}
          row={row}
          accessoryItems={accessoryItems}
          onUpdateTrim={(key, value) => setRowTrimField(row.id, key, value)}
        />
      ))}

      <div className="card">
        <h2 className="mb-3 text-lg font-bold">Siding Material &amp; Labor</h2>
        <MaterialLaborList
          result={sectionResult('siding')}
          onOverride={handleOverride}
          onAddCustomItem={handleAddCustomItem}
          onUpdateCustomItem={handleUpdateCustomItem}
          onRemoveCustomItem={handleRemoveCustomItem}
        />
      </div>

      {draft.workSections.sheathing && (
        <div className="card">
          <h2 className="mb-3 text-lg font-bold">Sheathing</h2>
          <LineItemPickList
            category="sheathing"
            picks={qd.sheathing}
            priceBook={priceBook}
            defaultQty={em.facadeAreaSqft}
            onChange={(picks) => updateDraft((d) => ({ ...d, quoteDetails: { ...d.quoteDetails, sheathing: picks } }))}
          />
          <MaterialLaborList
            result={sectionResult('sheathing')}
            onOverride={handleOverride}
            onAddCustomItem={handleAddCustomItem}
            onUpdateCustomItem={handleUpdateCustomItem}
            onRemoveCustomItem={handleRemoveCustomItem}
          />
        </div>
      )}

      {draft.workSections.demoRemoval && (
        <div className="card">
          <h2 className="mb-3 text-lg font-bold">Demo &amp; Removal</h2>
          <LineItemPickList
            category="demo-removal"
            picks={qd.demolitionMaterials}
            priceBook={priceBook}
            defaultQty={em.facadeAreaSqft}
            onChange={(picks) => updateDraft((d) => ({ ...d, quoteDetails: { ...d.quoteDetails, demolitionMaterials: picks } }))}
          />
          <MaterialLaborList
            result={sectionResult('demoRemoval')}
            onOverride={handleOverride}
            onAddCustomItem={handleAddCustomItem}
            onUpdateCustomItem={handleUpdateCustomItem}
            onRemoveCustomItem={handleRemoveCustomItem}
          />
        </div>
      )}

      {draft.workSections.fixtures && (
        <div className="card">
          <h2 className="mb-3 text-lg font-bold">Fixtures</h2>
          <LineItemPickList
            category="fixtures"
            picks={qd.fixtures}
            priceBook={priceBook}
            defaultQty={1}
            onChange={(picks) => updateDraft((d) => ({ ...d, quoteDetails: { ...d.quoteDetails, fixtures: picks } }))}
          />
          <MaterialLaborList
            result={sectionResult('fixtures')}
            onOverride={handleOverride}
            onAddCustomItem={handleAddCustomItem}
            onUpdateCustomItem={handleUpdateCustomItem}
            onRemoveCustomItem={handleRemoveCustomItem}
          />
        </div>
      )}

      {draft.workSections.furringFraming && (
        <div className="card">
          <h2 className="mb-3 text-lg font-bold">Furring &amp; Framing</h2>
          <div className="mb-4">
            <label className="field-label">Framing Lumber Size</label>
            <div className="flex flex-wrap gap-2">
              {FURRING_WOOD_TYPES.map((wood) => (
                <button
                  key={wood}
                  className="choice-btn"
                  style={{ width: 'auto' }}
                  data-active={qd.furringFramingWoodType === wood ? 'true' : 'false'}
                  onClick={() =>
                    updateDraft((d) => ({
                      ...d,
                      quoteDetails: {
                        ...d.quoteDetails,
                        furringFramingWoodType: d.quoteDetails.furringFramingWoodType === wood ? '' : (wood as FurringWoodType),
                      },
                    }))
                  }
                >
                  {wood}
                </button>
              ))}
            </div>
          </div>
          <LineItemPickList
            category="furring-framing"
            picks={qd.furringFraming}
            priceBook={priceBook}
            defaultQty={0}
            onChange={(picks) => updateDraft((d) => ({ ...d, quoteDetails: { ...d.quoteDetails, furringFraming: picks } }))}
          />
          <MaterialLaborList
            result={sectionResult('furringFraming')}
            onOverride={handleOverride}
            onAddCustomItem={handleAddCustomItem}
            onUpdateCustomItem={handleUpdateCustomItem}
            onRemoveCustomItem={handleRemoveCustomItem}
          />
        </div>
      )}

      {draft.workSections.aluminumWraps && (
        <div className="card">
          <h2 className="mb-3 text-lg font-bold">Wraps</h2>
          <div className="mb-4">
            <label className="field-label">Wrap Material</label>
            <div className="flex flex-wrap gap-2">
              {WRAPS_MATERIAL_TYPES.map((material) => (
                <button
                  key={material}
                  className="choice-btn"
                  style={{ width: 'auto' }}
                  data-active={qd.wrapsMaterialType === material ? 'true' : 'false'}
                  onClick={() =>
                    updateDraft((d) => ({
                      ...d,
                      quoteDetails: {
                        ...d.quoteDetails,
                        wrapsMaterialType: d.quoteDetails.wrapsMaterialType === material ? '' : (material as WrapsMaterialType),
                      },
                    }))
                  }
                >
                  {material}
                </button>
              ))}
            </div>
          </div>
          <LineItemPickList
            category="aluminum-wraps"
            picks={qd.aluminumWraps}
            priceBook={priceBook}
            defaultQty={1}
            onChange={(picks) => updateDraft((d) => ({ ...d, quoteDetails: { ...d.quoteDetails, aluminumWraps: picks } }))}
          />
          <MaterialLaborList
            result={sectionResult('aluminumWraps')}
            onOverride={handleOverride}
            onAddCustomItem={handleAddCustomItem}
            onUpdateCustomItem={handleUpdateCustomItem}
            onRemoveCustomItem={handleRemoveCustomItem}
          />
        </div>
      )}

      {draft.workSections.paintingCoating && (
        <div className="card">
          <h2 className="mb-3 text-lg font-bold">Painting / Coating</h2>
          <div className="mb-4">
            <label className="field-label">Surface Being Painted</label>
            <div className="flex flex-wrap gap-2">
              {PAINTING_SURFACE_TYPES.map((surface) => (
                <button
                  key={surface}
                  className="choice-btn"
                  style={{ width: 'auto' }}
                  data-active={qd.paintingSurfaceType === surface ? 'true' : 'false'}
                  onClick={() =>
                    updateDraft((d) => ({
                      ...d,
                      quoteDetails: {
                        ...d.quoteDetails,
                        paintingSurfaceType: d.quoteDetails.paintingSurfaceType === surface ? '' : (surface as PaintingSurfaceType),
                      },
                    }))
                  }
                >
                  {surface}
                </button>
              ))}
            </div>
          </div>
          <div className="mb-4 flex flex-wrap gap-2">
            <button className="pill" data-active={qd.paintingPrep.heavyPrep ? 'true' : 'false'} onClick={() => togglePaintingPrep('heavyPrep')}>
              {qd.paintingPrep.heavyPrep ? '☑' : '☐'} Heavy Prep (scraping/sanding)
            </button>
            <button className="pill" data-active={qd.paintingPrep.powerWash ? 'true' : 'false'} onClick={() => togglePaintingPrep('powerWash')}>
              {qd.paintingPrep.powerWash ? '☑' : '☐'} Power Wash
            </button>
          </div>
          <LineItemPickList
            category="painting-coating"
            picks={qd.paintingCoating}
            priceBook={priceBook}
            defaultQty={em.facadeAreaSqft}
            onChange={(picks) => updateDraft((d) => ({ ...d, quoteDetails: { ...d.quoteDetails, paintingCoating: picks } }))}
          />
          <MaterialLaborList
            result={sectionResult('paintingCoating')}
            onOverride={handleOverride}
            onAddCustomItem={handleAddCustomItem}
            onUpdateCustomItem={handleUpdateCustomItem}
            onRemoveCustomItem={handleRemoveCustomItem}
          />
        </div>
      )}

      {draft.workSections.soffit && (
        <div className="card">
          <h2 className="mb-1 text-lg font-bold">Soffit</h2>
          <p className="mb-3 text-xs text-gray-500">Material and removal choice set in Checklist. Computed below.</p>
          <MaterialLaborList
            result={sectionResult('soffit')}
            onOverride={handleOverride}
            onAddCustomItem={handleAddCustomItem}
            onUpdateCustomItem={handleUpdateCustomItem}
            onRemoveCustomItem={handleRemoveCustomItem}
          />
        </div>
      )}

      {draft.workSections.fascia && (
        <div className="card">
          <h2 className="mb-1 text-lg font-bold">Fascia</h2>
          <p className="mb-3 text-xs text-gray-500">Material and removal choice set in Checklist. Computed below.</p>
          <MaterialLaborList
            result={sectionResult('fascia')}
            onOverride={handleOverride}
            onAddCustomItem={handleAddCustomItem}
            onUpdateCustomItem={handleUpdateCustomItem}
            onRemoveCustomItem={handleRemoveCustomItem}
          />
        </div>
      )}

      {draft.workSections.gutters && (
        <div className="card">
          <h2 className="mb-1 text-lg font-bold">Gutters</h2>
          <p className="mb-3 text-xs text-gray-500">Size, downspouts, guards, and removal choice set in Checklist. Computed below.</p>
          <MaterialLaborList
            result={sectionResult('gutters')}
            onOverride={handleOverride}
            onAddCustomItem={handleAddCustomItem}
            onUpdateCustomItem={handleUpdateCustomItem}
            onRemoveCustomItem={handleRemoveCustomItem}
          />
        </div>
      )}

      <div className="card">
        <h2 className="mb-1 text-lg font-bold">House Wrap &amp; Flashing</h2>
        <p className="mb-3 text-xs text-gray-500">
          House wrap, seam tape, Vycor tape, and window head flashing auto-populate from measurements. Delete a line
          below if a job doesn&rsquo;t need it, or add your own.
        </p>
        <MaterialLaborList
          result={sectionResult('weatherBarrier')}
          onOverride={handleOverride}
          onRemoveLine={handleRemoveLine}
          onAddCustomItem={handleAddCustomItem}
          onUpdateCustomItem={handleUpdateCustomItem}
          onRemoveCustomItem={handleRemoveCustomItem}
        />
      </div>

      <div className="card">
        <h2 className="mb-3 text-lg font-bold">Requirements</h2>
        <p className="mb-3 text-xs text-gray-500">
          Common jobsite requirements — click to add or remove from this quote.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {equipmentItems.map((item) => {
            const isOn = qd.equipmentRental.some((p) => p.productId === item.id);
            return (
              <button key={item.id} className="pill" data-active={isOn ? 'true' : 'false'} onClick={() => toggleEquipmentPick(item.id)}>
                {isOn ? '☑' : '☐'} {item.name}
              </button>
            );
          })}
          {(
            [
              ['threeStory', '3-Story Charge', 'toggle'],
              ['tripCharge', 'Trip Charge', 'toggle'],
              ['laborMinimum', 'Labor Minimum', 'toggle'],
              ['materialDeliveryFee', 'Material Delivery Fee', 'toggle'],
              ['permitFee', 'Permitting', 'toggle'],
              ['scaffoldingLiftRental', 'Scaffolding / Lift Rental', 'toggle'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              className="pill"
              data-active={qd.oneTimeCharges[key] ? 'true' : 'false'}
              onClick={() =>
                updateDraft((d) => ({
                  ...d,
                  quoteDetails: { ...d.quoteDetails, oneTimeCharges: { ...d.quoteDetails.oneTimeCharges, [key]: !d.quoteDetails.oneTimeCharges[key] } },
                }))
              }
            >
              {qd.oneTimeCharges[key] ? '☑' : '☐'} {label}
            </button>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div>
            <label className="field-label">OSB / Insulation Board (sqft)</label>
            <NumericInput
              className="field-input"
              value={qd.oneTimeCharges.osbInsulationBoardSqft}
              onChange={(v) =>
                updateDraft((d) => ({
                  ...d,
                  quoteDetails: { ...d.quoteDetails, oneTimeCharges: { ...d.quoteDetails.oneTimeCharges, osbInsulationBoardSqft: v } },
                }))
              }
            />
          </div>
          <div>
            <label className="field-label">Detach &amp; Reset Lights (qty)</label>
            <NumericInput
              className="field-input"
              value={qd.oneTimeCharges.detachResetLightQty}
              onChange={(v) =>
                updateDraft((d) => ({
                  ...d,
                  quoteDetails: { ...d.quoteDetails, oneTimeCharges: { ...d.quoteDetails.oneTimeCharges, detachResetLightQty: v } },
                }))
              }
            />
          </div>
        </div>
        <MaterialLaborList
          result={sectionResult('requirements')}
          onOverride={handleOverride}
          onAddCustomItem={handleAddCustomItem}
          onUpdateCustomItem={handleUpdateCustomItem}
          onRemoveCustomItem={handleRemoveCustomItem}
        />
      </div>

      <div className="card">
        <h2 className="mb-3 text-lg font-bold">Material and Labor List</h2>
        <p className="mb-3 text-xs text-gray-500">The full quote across every section — the same data shown in each section&rsquo;s own preview above, all in one place.</p>
        <MaterialLaborList
          result={result}
          exportFileName="material-and-labor-list.csv"
          onOverride={handleOverride}
          onRemoveLine={handleRemoveLine}
          suppressedCount={suppressedCount}
          onRestoreSuppressed={handleRestoreSuppressed}
          onAddCustomItem={handleAddCustomItem}
          onUpdateCustomItem={handleUpdateCustomItem}
          onRemoveCustomItem={handleRemoveCustomItem}
        />
      </div>

      <NextButton onClick={onNext} label="Next: Proposal" />
    </div>
  );
}
