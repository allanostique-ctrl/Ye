'use client';

import { useRef, useState } from 'react';
import {
  CalculatorDraft,
  MeasurementFieldKey,
  emptyMeasurementSection,
} from '@/lib/types';
import { effectiveMeasurements } from '@/lib/calc/measurements';
import { NumberField } from '@/components/NumberField';
import { NextButton } from '@/components/NextButton';

interface Props {
  draft: CalculatorDraft;
  updateDraft: (updater: (d: CalculatorDraft) => CalculatorDraft) => void;
  onNext: () => void;
}

const PER_SECTION_KEYS: { key: 'facadeAreaSqft' | 'openingsPerimeterLnft' | 'outsideCornerLengthLnft' | 'insideCornerLengthLnft' | 'starterLengthLnft'; label: string; unit: string }[] = [
  { key: 'facadeAreaSqft', label: 'Facade Area', unit: 'sqft' },
  { key: 'openingsPerimeterLnft', label: 'Openings Perimeter', unit: 'lnft' },
  { key: 'outsideCornerLengthLnft', label: 'Outside Corner', unit: 'lnft' },
  { key: 'insideCornerLengthLnft', label: 'Inside Corner', unit: 'lnft' },
  { key: 'starterLengthLnft', label: 'Starter Length', unit: 'lnft' },
];

export function MeasurementsTab({ draft, updateDraft, onNext }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const m = draft.measurements;
  const em = effectiveMeasurements(m);

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
    updateDraft((d) => ({
      ...d,
      measurements: {
        ...d.measurements,
        multiSection: on,
        sections: on && d.measurements.sections.length === 0 ? [emptyMeasurementSection('Section 1')] : d.measurements.sections,
      },
    }));
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

  function updateSection(id: string, patch: Partial<typeof m.sections[number]>) {
    updateDraft((d) => ({
      ...d,
      measurements: {
        ...d.measurements,
        sections: d.measurements.sections.map((s) => (s.id === id ? { ...s, ...patch } : s)),
      },
    }));
  }

  async function handleUpload(file: File) {
    setUploading(true);
    setError(null);
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

  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="mb-1 text-lg font-bold">Measurements</h2>
        <p className="mb-4 text-sm text-gray-500">
          Upload a HOVER &ldquo;Complete Measurements&rdquo; PDF to auto-fill the fields below, then override anything
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
      </div>

      <div className="card">
        <label className="pill" data-active={m.multiSection ? 'true' : 'false'}>
          <input
            type="checkbox"
            className="hidden"
            checked={m.multiSection}
            onChange={(e) => setMultiSection(e.target.checked)}
          />
          {m.multiSection ? '☑' : '☐'} Multiple siding areas — enter measurements per section
        </label>
        <p className="mt-2 text-xs text-gray-500">
          Turn this on when a job mixes siding materials across different elevations and HOVER&rsquo;s single facade
          total doesn&rsquo;t break things out the way you need. A manual table replaces the facade/openings/corner
          fields below, and section totals feed the rest of the job.
        </p>
      </div>

      {!m.multiSection ? (
        <div className="card grid grid-cols-2 gap-4 sm:grid-cols-3">
          <NumberField
            label="Facade Area"
            unit="sqft"
            value={m.facadeAreaSqft}
            overridden={!!m.overridden.facadeAreaSqft}
            onChange={(v) => setField('facadeAreaSqft', v)}
          />
          <NumberField
            label="Openings Perimeter"
            unit="lnft"
            value={m.openingsPerimeterLnft}
            overridden={!!m.overridden.openingsPerimeterLnft}
            onChange={(v) => setField('openingsPerimeterLnft', v)}
          />
          <NumberField
            label="Outside Corner Length"
            unit="lnft"
            value={m.outsideCornerLengthLnft}
            overridden={!!m.overridden.outsideCornerLengthLnft}
            onChange={(v) => setField('outsideCornerLengthLnft', v)}
          />
          <NumberField
            label="Inside Corner Length"
            unit="lnft"
            value={m.insideCornerLengthLnft}
            overridden={!!m.overridden.insideCornerLengthLnft}
            onChange={(v) => setField('insideCornerLengthLnft', v)}
          />
          <NumberField
            label="Starter Length"
            unit="lnft"
            value={m.starterLengthLnft}
            overridden={!!m.overridden.starterLengthLnft}
            onChange={(v) => setField('starterLengthLnft', v)}
          />
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-bold">Per-Section Measurements</h3>
            <button className="btn btn-secondary btn-sm" onClick={addSection}>
              + Add Section
            </button>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Section Name</th>
                {PER_SECTION_KEYS.map((f) => (
                  <th key={f.key}>
                    {f.label} ({f.unit})
                  </th>
                ))}
                <th></th>
              </tr>
            </thead>
            <tbody>
              {m.sections.map((section) => (
                <tr key={section.id}>
                  <td>
                    <input
                      className="field-input"
                      value={section.name}
                      onChange={(e) => updateSection(section.id, { name: e.target.value })}
                    />
                  </td>
                  {PER_SECTION_KEYS.map((f) => (
                    <td key={f.key}>
                      <input
                        type="number"
                        step="any"
                        className="field-input"
                        value={section[f.key]}
                        onChange={(e) => updateSection(section.id, { [f.key]: parseFloat(e.target.value) || 0 } as any)}
                      />
                    </td>
                  ))}
                  <td>
                    <button className="btn btn-danger btn-sm" onClick={() => removeSection(section.id)}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td>Totals</td>
                <td>{em.facadeAreaSqft.toFixed(1)}</td>
                <td>{em.openingsPerimeterLnft.toFixed(1)}</td>
                <td>{em.outsideCornerLengthLnft.toFixed(1)}</td>
                <td>{em.insideCornerLengthLnft.toFixed(1)}</td>
                <td>{em.starterLengthLnft.toFixed(1)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      <div className="card grid grid-cols-2 gap-4 sm:grid-cols-3">
        <NumberField
          label="Fascia Length"
          unit="lnft"
          value={m.fasciaLengthLnft}
          overridden={!!m.overridden.fasciaLengthLnft}
          onChange={(v) => setField('fasciaLengthLnft', v)}
        />
        <NumberField
          label="Soffit Area"
          unit="sqft"
          value={m.soffitAreaSqft}
          overridden={!!m.overridden.soffitAreaSqft}
          onChange={(v) => setField('soffitAreaSqft', v)}
        />
        <NumberField
          label="Gutter Length"
          unit="lnft"
          value={m.gutterLengthLnft}
          overridden={!!m.overridden.gutterLengthLnft}
          onChange={(v) => setField('gutterLengthLnft', v)}
        />
      </div>

      <NextButton onClick={onNext} label="Next: Checklist" />
    </div>
  );
}
