'use client';

import {
  CalcRulesConfig,
  CalculatorDraft,
  PriceBook,
  PriceBookItem,
  SidingTypeRow,
  WORK_SECTIONS,
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
  const result = computeCalculation(draft, priceBook, calcRules);
  const multiSection = draft.measurements.multiSection;
  const sections = draft.measurements.sections;

  const areaSum = draft.sidingTypeRows.reduce((s, r) => s + effectiveRowArea(r, draft.measurements), 0);
  const areaMismatch = Math.abs(areaSum - em.facadeAreaSqft) > 0.5;
  const unassignedSections = multiSection
    ? sections.filter((s) => !draft.sidingTypeRows.some((r) => r.sectionIds.includes(s.id)))
    : [];

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

  function handleOverride(overrideKey: string, field: 'materialCost' | 'laborCost', value: number | null) {
    updateDraft((d) => {
      const existing = d.lineItemOverrides[overrideKey] ?? {};
      const next = { ...existing, [field]: value === null ? undefined : value };
      const cleaned: typeof next = {};
      if (next.materialCost !== undefined) cleaned.materialCost = next.materialCost;
      if (next.laborCost !== undefined) cleaned.laborCost = next.laborCost;
      const nextOverrides = { ...d.lineItemOverrides };
      if (Object.keys(cleaned).length === 0) {
        delete nextOverrides[overrideKey];
      } else {
        nextOverrides[overrideKey] = cleaned;
      }
      return { ...d, lineItemOverrides: nextOverrides };
    });
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

      {draft.workSections.sheathing && (
        <div className="card">
          <h2 className="mb-3 text-lg font-bold">{WORK_SECTIONS.find((s) => s.key === 'sheathing')?.label}</h2>
          <LineItemPickList
            category="sheathing"
            picks={qd.sheathing}
            priceBook={priceBook}
            defaultQty={em.facadeAreaSqft}
            onChange={(picks) => updateDraft((d) => ({ ...d, quoteDetails: { ...d.quoteDetails, sheathing: picks } }))}
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
        </div>
      )}

      {draft.workSections.furringFraming && (
        <div className="card">
          <h2 className="mb-3 text-lg font-bold">Furring &amp; Framing</h2>
          <LineItemPickList
            category="furring-framing"
            picks={qd.furringFraming}
            priceBook={priceBook}
            defaultQty={0}
            onChange={(picks) => updateDraft((d) => ({ ...d, quoteDetails: { ...d.quoteDetails, furringFraming: picks } }))}
          />
        </div>
      )}

      {draft.workSections.aluminumWraps && (
        <div className="card">
          <h2 className="mb-3 text-lg font-bold">Aluminum Wraps</h2>
          <LineItemPickList
            category="aluminum-wraps"
            picks={qd.aluminumWraps}
            priceBook={priceBook}
            defaultQty={1}
            onChange={(picks) => updateDraft((d) => ({ ...d, quoteDetails: { ...d.quoteDetails, aluminumWraps: picks } }))}
          />
        </div>
      )}

      {draft.workSections.doorWindowInstalls && (
        <div className="card">
          <h2 className="mb-3 text-lg font-bold">Door &amp; Window Installs</h2>
          <LineItemPickList
            category="door-window-installs"
            picks={qd.doorWindowInstalls}
            priceBook={priceBook}
            defaultQty={1}
            onChange={(picks) => updateDraft((d) => ({ ...d, quoteDetails: { ...d.quoteDetails, doorWindowInstalls: picks } }))}
          />
        </div>
      )}

      {draft.workSections.paintingCoating && (
        <div className="card">
          <h2 className="mb-3 text-lg font-bold">Painting / Coating</h2>
          <LineItemPickList
            category="painting-coating"
            picks={qd.paintingCoating}
            priceBook={priceBook}
            defaultQty={em.facadeAreaSqft}
            onChange={(picks) => updateDraft((d) => ({ ...d, quoteDetails: { ...d.quoteDetails, paintingCoating: picks } }))}
          />
        </div>
      )}

      {draft.workSections.equipmentRental && (
        <div className="card">
          <h2 className="mb-3 text-lg font-bold">Equipment Rental</h2>
          <LineItemPickList
            category="equipment-rental"
            picks={qd.equipmentRental}
            priceBook={priceBook}
            defaultQty={1}
            onChange={(picks) => updateDraft((d) => ({ ...d, quoteDetails: { ...d.quoteDetails, equipmentRental: picks } }))}
          />
        </div>
      )}

      {draft.workSections.soffit && (
        <div className="card">
          <h2 className="mb-1 text-lg font-bold">Soffit</h2>
          <p className="mb-3 text-xs text-gray-500">Material and removal choice set in Checklist. Computed below.</p>
          {result.sections.find((s) => s.section === 'soffit') && (
            <MaterialLaborList result={{ sections: [result.sections.find((s) => s.section === 'soffit')!], materialTotal: 0, laborTotal: 0, grandTotal: 0 }} onOverride={handleOverride} />
          )}
        </div>
      )}

      {draft.workSections.fascia && (
        <div className="card">
          <h2 className="mb-1 text-lg font-bold">Fascia</h2>
          <p className="mb-3 text-xs text-gray-500">Material and removal choice set in Checklist. Computed below.</p>
          {result.sections.find((s) => s.section === 'fascia') && (
            <MaterialLaborList result={{ sections: [result.sections.find((s) => s.section === 'fascia')!], materialTotal: 0, laborTotal: 0, grandTotal: 0 }} onOverride={handleOverride} />
          )}
        </div>
      )}

      {draft.workSections.gutters && (
        <div className="card">
          <h2 className="mb-1 text-lg font-bold">Gutters</h2>
          <p className="mb-3 text-xs text-gray-500">Size, downspouts, guards, and removal choice set in Checklist. Computed below.</p>
          {result.sections.find((s) => s.section === 'gutters') && (
            <MaterialLaborList result={{ sections: [result.sections.find((s) => s.section === 'gutters')!], materialTotal: 0, laborTotal: 0, grandTotal: 0 }} onOverride={handleOverride} />
          )}
        </div>
      )}

      {draft.workSections.oneTimeCharges && (
        <div className="card">
          <h2 className="mb-3 text-lg font-bold">One-Time Charges</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {(
              [
                ['threeStory', '3-Story Charge', 'toggle'],
                ['tripCharge', 'Trip Charge', 'toggle'],
                ['laborMinimum', 'Labor Minimum', 'toggle'],
                ['materialDeliveryFee', 'Material Delivery Fee', 'toggle'],
                ['permitFee', 'Permit Fee', 'toggle'],
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
        </div>
      )}

      <div className="card">
        <h2 className="mb-3 text-lg font-bold">Material and Labor List</h2>
        <MaterialLaborList result={result} exportFileName="material-and-labor-list.csv" onOverride={handleOverride} />
      </div>

      <NextButton onClick={onNext} label="Next: Proposal" />
    </div>
  );
}
