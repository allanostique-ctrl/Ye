'use client';

import { useRef, useState } from 'react';
import {
  CalculatorDraft,
  MeasurementFieldKey,
  MEASUREMENT_FIELDS,
  PriceBook,
  emptyMeasurementSection,
  sidingKey as buildSidingKey,
} from '@/lib/types';
import { BRANDS, STYLES } from '@/lib/brands';
import { effectiveMeasurements, effectiveRowArea, primarySectionIds } from '@/lib/calc/measurements';
import { syncSidingRowsFromSelections, assignSectionToSidingKey } from '@/lib/calc/sidingRows';
import { NextButton } from '@/components/NextButton';
import { NumericInput } from '@/components/NumericInput';

interface Props {
  draft: CalculatorDraft;
  updateDraft: (updater: (d: CalculatorDraft) => CalculatorDraft) => void;
  priceBook: PriceBook;
  onNext: () => void;
}

const PER_SECTION_KEYS: {
  key: 'facadeAreaSqft' | 'openingsPerimeterLnft' | 'outsideCornerLengthLnft' | 'insideCornerLengthLnft' | 'starterLengthLnft';
  label: string;
  unit: string;
}[] = [
  { key: 'facadeAreaSqft', label: 'Facade Area', unit: 'sqft' },
  { key: 'openingsPerimeterLnft', label: 'Openings Perimeter', unit: 'lnft' },
  { key: 'outsideCornerLengthLnft', label: 'Outside Corner', unit: 'lnft' },
  { key: 'insideCornerLengthLnft', label: 'Inside Corner', unit: 'lnft' },
  { key: 'starterLengthLnft', label: 'Starter Length', unit: 'lnft' },
];

function fmt(n: number): string {
  return (n || 0).toLocaleString('en-US', { maximumFractionDigits: 1 });
}

export function MeasurementsTab({ draft, updateDraft, priceBook, onNext }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rawText, setRawText] = useState<string | null>(null);
  const [showRawText, setShowRawText] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const m = draft.measurements;
  const em = effectiveMeasurements(m);
  const dedupPrimaryIds = primarySectionIds(m.sections);

  function setField(key: MeasurementFieldKey, value: number) {
    updateDraft((d) => ({
      ...d,
      measurements: {
        ...d.measurements,
        [key]: value,
        overridden: { ...d.measurements.overridden, [key]: true },
      },
    }));
  }

  function setMultiSection(on: boolean) {
    updateDraft((d) => {
      // Turning this off shouldn't silently zero out a row's area — snapshot
      // whatever each row's linked sections currently add up to into its
      // manual area field first, so nothing is lost.
      const sidingTypeRows = on
        ? d.sidingTypeRows
        : d.sidingTypeRows.map((row) => ({ ...row, areaSqft: effectiveRowArea(row, d.measurements) }));
      return {
        ...d,
        sidingTypeRows,
        measurements: {
          ...d.measurements,
          multiSection: on,
          sections:
            on && d.measurements.sections.length === 0
              ? [emptyMeasurementSection('Section 1'), emptyMeasurementSection('Section 2')]
              : d.measurements.sections,
        },
      };
    });
  }

  function addSection() {
    updateDraft((d) => ({
      ...d,
      measurements: {
        ...d.measurements,
        sections: [...d.measurements.sections, emptyMeasurementSection(`Section ${d.measurements.sections.length + 1}`)],
      },
    }));
  }

  function removeSection(id: string) {
    updateDraft((d) => ({
      ...d,
      measurements: { ...d.measurements, sections: d.measurements.sections.filter((s) => s.id !== id) },
    }));
  }

  function updateSection(id: string, patch: Partial<(typeof m.sections)[number]>) {
    updateDraft((d) => ({
      ...d,
      measurements: {
        ...d.measurements,
        sections: d.measurements.sections.map((s) => (s.id === id ? { ...s, ...patch } : s)),
      },
    }));
  }

  // Picking a siding material for a section here auto-checks it in the Checklist
  // grid and links this section straight to the matching Siding Type row in Quote
  // Details, so its area is already populated by the time you get there.
  function setSectionSidingKey(sectionId: string, newKey: string | null) {
    updateDraft((d) => {
      const nextSections = d.measurements.sections.map((s) => (s.id === sectionId ? { ...s, sidingKey: newKey } : s));
      const nextSelections = newKey
        ? { ...d.quoteDetails.sidingSelections, [newKey]: true }
        : d.quoteDetails.sidingSelections;
      const syncedRows = syncSidingRowsFromSelections(d.sidingTypeRows, nextSelections, priceBook);
      const nextRows = assignSectionToSidingKey(syncedRows, sectionId, newKey);
      return {
        ...d,
        measurements: { ...d.measurements, sections: nextSections },
        quoteDetails: { ...d.quoteDetails, sidingSelections: nextSelections },
        sidingTypeRows: nextRows,
      };
    });
  }

  async function handleUpload(file: File) {
    setUploading(true);
    setError(null);
    setRawText(null);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/parse-hover', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed to parse PDF.');
        return;
      }
      const parsed: Partial<Record<MeasurementFieldKey, number>> = data.measurements ?? {};
      setRawText(typeof data.rawText === 'string' ? data.rawText : null);
      if (Object.keys(parsed).length === 0) {
        setError(
          "Parsed the PDF, but couldn't find any recognizable measurement labels in it — see the extracted text below and send it to me so I can fix the matching."
        );
        setShowRawText(true);
      } else if (Object.keys(parsed).length < MEASUREMENT_FIELDS.length) {
        setShowRawText(false);
      }
      updateDraft((d) => {
        const next = { ...d.measurements };
        next.raw = { ...next.raw, ...parsed };
        next.pdfFileName = data.fileName;
        next.parsedAt = new Date().toISOString();
        for (const [key, value] of Object.entries(parsed) as [MeasurementFieldKey, number][]) {
          if (!next.overridden[key]) {
            (next as any)[key] = value;
          }
        }
        return { ...d, measurements: next };
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse PDF.');
    } finally {
      setUploading(false);
    }
  }

  const unmatchedFields = MEASUREMENT_FIELDS.filter((f) => m.raw[f.key] === undefined);

  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="mb-1 text-lg font-bold">Measurements</h2>
        <p className="mb-4 text-sm text-gray-500">
          Upload a HOVER &ldquo;Complete Measurements&rdquo; PDF to auto-fill the table below, then override anything
          that needs adjusting — edited values (not the raw PDF numbers) drive every calculation downstream.
        </p>
        <div className="flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(file);
              e.target.value = '';
            }}
          />
          <button className="btn btn-secondary" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            {uploading ? 'Parsing…' : '📄 Upload HOVER PDF'}
          </button>
          {m.pdfFileName && (
            <span className="text-xs text-gray-500">
              Last parsed: <span className="font-medium">{m.pdfFileName}</span>
            </span>
          )}
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        {!error && m.pdfFileName && unmatchedFields.length > 0 && (
          <p className="mt-2 text-sm text-amber-600">
            ⚠ Couldn&rsquo;t find a value for: {unmatchedFields.map((f) => f.label).join(', ')}. Enter those by hand
            below, or check the extracted text.
          </p>
        )}
        {rawText && (
          <div className="mt-3">
            <button className="text-xs font-semibold text-brand-600 underline" onClick={() => setShowRawText((v) => !v)}>
              {showRawText ? 'Hide' : 'Show'} extracted PDF text (for troubleshooting)
            </button>
            {showRawText && (
              <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap rounded border border-gray-200 bg-gray-50 p-2 text-xs text-gray-600">
                {rawText}
              </pre>
            )}
          </div>
        )}
      </div>

      <div className="card overflow-x-auto">
        <h3 className="mb-3 font-bold">Reference Measurements</h3>
        <p className="mb-3 text-xs text-gray-500">
          This table holds the totals for the whole job — auto-filled from the HOVER PDF above and always editable.
        </p>
        <table className="data-table" style={{ maxWidth: 480 }}>
          <thead>
            <tr>
              <th>Field</th>
              <th className="text-right">Value</th>
              <th>Unit</th>
            </tr>
          </thead>
          <tbody>
            {MEASUREMENT_FIELDS.map((f) => (
              <tr key={f.key}>
                <td className="font-medium">
                  {f.label}
                  {m.overridden[f.key] && <span className="badge ml-2 bg-amber-100 text-amber-700">edited</span>}
                </td>
                <td>
                  <NumericInput
                    className="field-input text-right"
                    data-overridden={m.overridden[f.key] ? 'true' : 'false'}
                    value={m[f.key]}
                    onChange={(v) => setField(f.key, v)}
                  />
                </td>
                <td className="text-gray-400">{f.unit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <label className="pill" data-active={m.multiSection ? 'true' : 'false'}>
          <input
            type="checkbox"
            className="hidden"
            checked={m.multiSection}
            onChange={(e) => setMultiSection(e.target.checked)}
          />
          {m.multiSection ? '☑' : '☐'} Multiple siding areas — divide the totals above across sections
        </label>
        <p className="mt-2 text-xs text-gray-500">
          Turn this on when a job mixes siding materials across different elevations and HOVER&rsquo;s single facade
          total doesn&rsquo;t break things out the way you need. The Reference Measurements above stay put as your
          total; this table lets you split facade area, openings, corners, and starter length across named sections,
          and the section totals — not the reference row — feed the rest of the job. Pick a siding material per
          section below and it auto-checks that combo in Checklist and links the section straight to its Quote
          Details row, area included. When two sections share the same material, only the first one needs openings,
          corners, and starter length filled in — they both feed the same Quote Details row either way, so only
          facade area needs to be split between them.
        </p>
      </div>

      {m.multiSection && (
        <div className="card overflow-x-auto">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-bold">Divide Siding Areas by Section</h3>
            <button className="btn btn-secondary btn-sm" onClick={addSection}>
              + Add Section
            </button>
          </div>
          <table className="data-table" style={{ tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: 190 }} />
              {m.sections.map((s) => (
                <col key={s.id} style={{ width: 190 }} />
              ))}
              <col style={{ width: 170 }} />
            </colgroup>
            <thead>
              <tr>
                <th>Field</th>
                {m.sections.map((section) => (
                  <th key={section.id}>
                    <div className="flex items-center gap-1">
                      <input
                        className="field-input min-w-0 flex-1"
                        value={section.name}
                        onChange={(e) => updateSection(section.id, { name: e.target.value })}
                      />
                      <button
                        className="btn btn-danger btn-sm shrink-0 px-2"
                        title="Remove section"
                        onClick={() => removeSection(section.id)}
                      >
                        ×
                      </button>
                    </div>
                  </th>
                ))}
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-brand-50/40">
                <td className="font-medium">Siding Material</td>
                {m.sections.map((section) => (
                  <td key={section.id}>
                    <select
                      className="field-input"
                      value={section.sidingKey ?? ''}
                      onChange={(e) => setSectionSidingKey(section.id, e.target.value || null)}
                    >
                      <option value="">Select…</option>
                      {BRANDS.map((brand) =>
                        STYLES.map((style) => (
                          <option key={`${brand}|${style}`} value={buildSidingKey(brand, style)}>
                            {brand} — {style}
                          </option>
                        ))
                      )}
                    </select>
                  </td>
                ))}
                <td></td>
              </tr>
              {PER_SECTION_KEYS.map((f) => {
                const total = em[f.key];
                const reference = m[f.key];
                const exceeds = reference > 0 && total > reference + 0.01;
                const isDedupedField = f.key !== 'facadeAreaSqft';
                return (
                  <tr key={f.key}>
                    <td className="font-medium">
                      {f.label} <span className="text-gray-400">({f.unit})</span>
                    </td>
                    {m.sections.map((section) => {
                      const isDuplicateMaterial = isDedupedField && !dedupPrimaryIds.has(section.id);
                      if (isDuplicateMaterial) {
                        const primaryName = m.sections.find(
                          (s) => s.sidingKey === section.sidingKey && dedupPrimaryIds.has(s.id)
                        )?.name;
                        return (
                          <td key={section.id}>
                            <div
                              className="field-input flex items-center text-xs italic text-gray-400"
                              style={{ background: '#f3f4f6' }}
                              title="Same siding material as another section — only needs to be entered once."
                            >
                              Not needed{primaryName ? ` (see ${primaryName})` : ''}
                            </div>
                          </td>
                        );
                      }
                      return (
                        <td key={section.id}>
                          <NumericInput
                            className="field-input"
                            value={section[f.key]}
                            onChange={(v) => updateSection(section.id, { [f.key]: v } as any)}
                          />
                        </td>
                      );
                    })}
                    <td className={`font-bold ${exceeds ? 'text-amber-600' : ''}`}>
                      {fmt(total)}
                      {exceeds && (
                        <div className="text-xs font-normal text-amber-600">
                          ⚠ exceeds HOVER total ({fmt(reference)})
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="mt-2 text-xs text-gray-500">
            Warnings are informational only — every value here stays fully editable even if section totals run over
            the HOVER reference.
          </p>
        </div>
      )}

      <NextButton onClick={onNext} label="Next: Checklist" />
    </div>
  );
}
