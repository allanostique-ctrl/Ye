'use client';

import {
  CalculatorDraft,
  PriceBook,
  WORK_SECTIONS,
  WorkSectionKey,
  sidingKey,
} from '@/lib/types';
import { BRANDS, STYLES } from '@/lib/brands';
import { syncSidingRowsFromSelections } from '@/lib/calc/sidingRows';
import { effectiveMeasurements } from '@/lib/calc/measurements';
import { NextButton } from '@/components/NextButton';
import { NumericInput } from '@/components/NumericInput';

interface Props {
  draft: CalculatorDraft;
  updateDraft: (updater: (d: CalculatorDraft) => CalculatorDraft) => void;
  priceBook: PriceBook;
  onNext: () => void;
}

const PROJECT_TYPES = ['New Construction', 'Retrofit / Re-Side', 'Repair', 'Insurance / Storm Claim'];
const CUSTOMER_TYPES = ['Homeowner', 'Property Manager', 'Builder / GC', 'Insurance Adjuster'];
const TIMELINES = ['ASAP', '1–3 Months', '3–6 Months', 'Flexible / Planning'];

export function ChecklistTab({ draft, updateDraft, priceBook, onNext }: Props) {
  const cp = draft.customerProfile;
  const qd = draft.quoteDetails;
  const em = effectiveMeasurements(draft.measurements);
  const demoItems = priceBook.items.filter((i) => i.category === 'demo-removal' && i.active);
  const soffitItems = priceBook.items.filter((i) => i.category === 'soffit' && i.active && i.id !== 'soffit-removal');
  const fasciaItems = priceBook.items.filter((i) => i.category === 'fascia' && i.active && i.id !== 'fascia-removal');
  const gutterItems = priceBook.items.filter(
    (i) => i.category === 'gutters' && i.active && !['gutter-downspout', 'gutter-guards', 'gutter-removal'].includes(i.id)
  );

  function toggleWorkSection(key: WorkSectionKey) {
    updateDraft((d) => ({ ...d, workSections: { ...d.workSections, [key]: !d.workSections[key] } }));
  }

  function toggleSidingSelection(brand: (typeof BRANDS)[number], style: (typeof STYLES)[number]) {
    updateDraft((d) => {
      const key = sidingKey(brand, style);
      const nowChecked = !d.quoteDetails.sidingSelections[key];
      const nextSelections = { ...d.quoteDetails.sidingSelections, [key]: nowChecked };
      const nextRows = syncSidingRowsFromSelections(d.sidingTypeRows, nextSelections, priceBook);
      // Unchecking removes the row that backed this combo — clear it off any
      // measurement section that still pointed to it so the dropdown there
      // doesn't keep showing a link that no longer exists.
      const nextSections = nowChecked
        ? d.measurements.sections
        : d.measurements.sections.map((s) => (s.sidingKey === key ? { ...s, sidingKey: null } : s));
      return {
        ...d,
        measurements: { ...d.measurements, sections: nextSections },
        quoteDetails: { ...d.quoteDetails, sidingSelections: nextSelections },
        sidingTypeRows: nextRows,
      };
    });
  }

  function toggleDemoMaterial(productId: string) {
    updateDraft((d) => {
      const exists = d.quoteDetails.demolitionMaterials.some((p) => p.productId === productId);
      const item = priceBook.items.find((i) => i.id === productId);
      const defaultQty = item?.unit === 'sqft' ? em.facadeAreaSqft : 0;
      const next = exists
        ? d.quoteDetails.demolitionMaterials.filter((p) => p.productId !== productId)
        : [...d.quoteDetails.demolitionMaterials, { id: crypto.randomUUID(), productId, qty: defaultQty }];
      return { ...d, quoteDetails: { ...d.quoteDetails, demolitionMaterials: next } };
    });
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="mb-4 text-lg font-bold">Customer Profile</h2>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Internal only</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="field-label">Project Type</label>
            <div className="grid grid-cols-2 gap-2">
              {PROJECT_TYPES.map((t) => (
                <button
                  key={t}
                  className="choice-btn"
                  data-active={cp.projectType === t ? 'true' : 'false'}
                  onClick={() =>
                    updateDraft((d) => ({
                      ...d,
                      customerProfile: { ...d.customerProfile, projectType: d.customerProfile.projectType === t ? '' : t },
                    }))
                  }
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="field-label">Customer Type</label>
            <div className="grid grid-cols-2 gap-2">
              {CUSTOMER_TYPES.map((t) => (
                <button
                  key={t}
                  className="choice-btn"
                  data-active={cp.customerType === t ? 'true' : 'false'}
                  onClick={() =>
                    updateDraft((d) => ({
                      ...d,
                      customerProfile: { ...d.customerProfile, customerType: d.customerProfile.customerType === t ? '' : t },
                    }))
                  }
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="field-label">Timeline</label>
            <div className="grid grid-cols-2 gap-2">
              {TIMELINES.map((t) => (
                <button
                  key={t}
                  className="choice-btn"
                  data-active={cp.timeline === t ? 'true' : 'false'}
                  onClick={() =>
                    updateDraft((d) => ({
                      ...d,
                      customerProfile: { ...d.customerProfile, timeline: d.customerProfile.timeline === t ? '' : t },
                    }))
                  }
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-4">
          <button
            className="pill"
            data-active={cp.hotLead ? 'true' : 'false'}
            onClick={() => updateDraft((d) => ({ ...d, customerProfile: { ...d.customerProfile, hotLead: !d.customerProfile.hotLead } }))}
          >
            🔥 Hot Lead
          </button>
        </div>
      </div>

      <div className="card">
        <h2 className="mb-3 text-lg font-bold">Scope of Work</h2>
        <div className="flex flex-wrap gap-2">
          {WORK_SECTIONS.map((s) => (
            <button
              key={s.key}
              className="pill"
              data-active={draft.workSections[s.key] ? 'true' : 'false'}
              onClick={() => toggleWorkSection(s.key)}
            >
              {draft.workSections[s.key] ? '☑' : '☐'} {s.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-gray-500">
          Unchecked sections are fully excluded from totals — not just hidden — and their cards won&rsquo;t appear in
          Quote Details.
        </p>
      </div>

      <div className="card overflow-x-auto">
        <h2 className="mb-3 text-lg font-bold">Quote Details</h2>
        <h3 className="mb-2 text-sm font-bold text-gray-600">Siding Material(s) &amp; Style(s)</h3>
        <table className="data-table mb-6">
          <thead>
            <tr>
              <th>Brand</th>
              {STYLES.map((style) => (
                <th key={style}>{style}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {BRANDS.map((brand) => (
              <tr key={brand}>
                <td className="font-semibold">{brand}</td>
                {STYLES.map((style) => {
                  const checked = !!qd.sidingSelections[sidingKey(brand, style)];
                  return (
                    <td key={style}>
                      <button
                        className="choice-btn"
                        data-active={checked ? 'true' : 'false'}
                        onClick={() => toggleSidingSelection(brand, style)}
                      >
                        {checked ? '✓' : ''}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mb-6 text-xs text-gray-500">
          Checked combos auto-generate matching Siding Type rows in Quote Details (capped at 4). Checking James
          Hardie or LP SmartSide auto-swaps corner posts, openings trim, and starter to a shared 4&quot; trim board +
          metal starter package, and enables butt joint flashing, touch-up paint, and caulk/sealant.
        </p>

        <h3 className="mb-2 text-sm font-bold text-gray-600">Colors</h3>
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
          {(['siding', 'trim', 'soffit', 'fascia', 'gutter'] as const).map((k) => (
            <div key={k}>
              <label className="field-label capitalize">{k}</label>
              <input
                className="field-input"
                value={qd.colors[k]}
                onChange={(e) => updateDraft((d) => ({ ...d, quoteDetails: { ...d.quoteDetails, colors: { ...d.quoteDetails.colors, [k]: e.target.value } } }))}
              />
            </div>
          ))}
        </div>

        {draft.workSections.demoRemoval && (
          <div className="mb-6">
            <h3 className="mb-2 text-sm font-bold text-gray-600">Demolition Materials (tear-off)</h3>
            <div className="flex flex-wrap gap-2">
              {demoItems.map((item) => (
                <button
                  key={item.id}
                  className="pill"
                  data-active={qd.demolitionMaterials.some((p) => p.productId === item.id) ? 'true' : 'false'}
                  onClick={() => toggleDemoMaterial(item.id)}
                >
                  {qd.demolitionMaterials.some((p) => p.productId === item.id) ? '☑' : '☐'} {item.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {draft.workSections.soffit && (
          <div className="mb-6">
            <h3 className="mb-2 text-sm font-bold text-gray-600">Soffit Choice</h3>
            <div className="flex flex-wrap items-center gap-3">
              <select
                className="field-input"
                style={{ maxWidth: 320 }}
                value={qd.soffit.productId ?? ''}
                onChange={(e) => updateDraft((d) => ({ ...d, quoteDetails: { ...d.quoteDetails, soffit: { ...d.quoteDetails.soffit, productId: e.target.value || null } } }))}
              >
                <option value="">Select soffit material…</option>
                {soffitItems.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name}
                  </option>
                ))}
              </select>
              <label className="pill" data-active={qd.soffit.includeRemoval ? 'true' : 'false'}>
                <input
                  type="checkbox"
                  className="hidden"
                  checked={qd.soffit.includeRemoval}
                  onChange={(e) => updateDraft((d) => ({ ...d, quoteDetails: { ...d.quoteDetails, soffit: { ...d.quoteDetails.soffit, includeRemoval: e.target.checked } } }))}
                />
                {qd.soffit.includeRemoval ? '☑' : '☐'} Include Removal
              </label>
            </div>
          </div>
        )}

        {draft.workSections.fascia && (
          <div className="mb-6">
            <h3 className="mb-2 text-sm font-bold text-gray-600">Fascia Choice</h3>
            <div className="flex flex-wrap items-center gap-3">
              <select
                className="field-input"
                style={{ maxWidth: 320 }}
                value={qd.fascia.productId ?? ''}
                onChange={(e) => updateDraft((d) => ({ ...d, quoteDetails: { ...d.quoteDetails, fascia: { ...d.quoteDetails.fascia, productId: e.target.value || null } } }))}
              >
                <option value="">Select fascia material…</option>
                {fasciaItems.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name}
                  </option>
                ))}
              </select>
              <label className="pill" data-active={qd.fascia.includeRemoval ? 'true' : 'false'}>
                <input
                  type="checkbox"
                  className="hidden"
                  checked={qd.fascia.includeRemoval}
                  onChange={(e) => updateDraft((d) => ({ ...d, quoteDetails: { ...d.quoteDetails, fascia: { ...d.quoteDetails.fascia, includeRemoval: e.target.checked } } }))}
                />
                {qd.fascia.includeRemoval ? '☑' : '☐'} Include Removal
              </label>
            </div>
          </div>
        )}

        {draft.workSections.gutters && (
          <div className="mb-2">
            <h3 className="mb-2 text-sm font-bold text-gray-600">Gutters Choice</h3>
            <div className="flex flex-wrap items-center gap-3">
              <select
                className="field-input"
                style={{ maxWidth: 320 }}
                value={qd.gutters.productId ?? ''}
                onChange={(e) => updateDraft((d) => ({ ...d, quoteDetails: { ...d.quoteDetails, gutters: { ...d.quoteDetails.gutters, productId: e.target.value || null } } }))}
              >
                <option value="">Select gutter size…</option>
                {gutterItems.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name}
                  </option>
                ))}
              </select>
              <div className="flex items-center gap-2">
                <label className="field-label mb-0">Downspouts</label>
                <NumericInput
                  className="field-input"
                  style={{ width: 90 }}
                  value={qd.gutters.downspoutQty}
                  onChange={(v) => updateDraft((d) => ({ ...d, quoteDetails: { ...d.quoteDetails, gutters: { ...d.quoteDetails.gutters, downspoutQty: v } } }))}
                />
              </div>
              <label className="pill" data-active={qd.gutters.includeGuards ? 'true' : 'false'}>
                <input
                  type="checkbox"
                  className="hidden"
                  checked={qd.gutters.includeGuards}
                  onChange={(e) => updateDraft((d) => ({ ...d, quoteDetails: { ...d.quoteDetails, gutters: { ...d.quoteDetails.gutters, includeGuards: e.target.checked } } }))}
                />
                {qd.gutters.includeGuards ? '☑' : '☐'} Gutter Guards
              </label>
              <label className="pill" data-active={qd.gutters.includeRemoval ? 'true' : 'false'}>
                <input
                  type="checkbox"
                  className="hidden"
                  checked={qd.gutters.includeRemoval}
                  onChange={(e) => updateDraft((d) => ({ ...d, quoteDetails: { ...d.quoteDetails, gutters: { ...d.quoteDetails.gutters, includeRemoval: e.target.checked } } }))}
                />
                {qd.gutters.includeRemoval ? '☑' : '☐'} Include Removal
              </label>
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <h2 className="mb-3 text-lg font-bold">Notes</h2>
        <textarea
          className="field-input"
          rows={4}
          value={cp.notes}
          onChange={(e) => updateDraft((d) => ({ ...d, customerProfile: { ...d.customerProfile, notes: e.target.value } }))}
        />
      </div>

      <NextButton onClick={onNext} label="Next: Quote Details" />
    </div>
  );
}
