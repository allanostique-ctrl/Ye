'use client';

export function NumberField({
  label,
  value,
  unit,
  overridden,
  onChange,
}: {
  label: string;
  value: number;
  unit?: string;
  overridden?: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <label className="field-label">
        {label}
        {unit ? <span className="ml-1 font-normal normal-case text-gray-400">({unit})</span> : null}
        {overridden ? <span className="badge ml-2 bg-amber-100 text-amber-700">edited</span> : null}
      </label>
      <input
        type="number"
        step="any"
        className="field-input"
        data-overridden={overridden ? 'true' : 'false'}
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      />
    </div>
  );
}
