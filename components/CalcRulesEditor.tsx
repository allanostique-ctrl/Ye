'use client';

import { BrandCalcRules, CalcRulesConfig } from '@/lib/types';
import { CALC_RULE_BRAND_LABELS, CalcRuleBrandKey } from '@/lib/brands';
import { NumericInput } from '@/components/NumericInput';

const BRAND_KEYS: CalcRuleBrandKey[] = ['vinyl', 'jamesHardie', 'lpSmartSide', 'other'];

function BrandCard({
  label,
  rules,
  onChange,
}: {
  label: string;
  rules: BrandCalcRules;
  onChange: (patch: Partial<BrandCalcRules>) => void;
}) {
  return (
    <div className="card">
      <h3 className="mb-3 font-bold">{label}</h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <label className="field-label">Siding Waste %</label>
          <NumericInput className="field-input" value={rules.sidingWastePct} onChange={(v) => onChange({ sidingWastePct: v })} />
        </div>
        <div>
          <label className="field-label">Purchase Rounding</label>
          <select
            className="field-input"
            value={rules.purchaseRounding}
            onChange={(e) => onChange({ purchaseRounding: e.target.value as BrandCalcRules['purchaseRounding'] })}
          >
            <option value="up">Round up</option>
            <option value="nearest">Round nearest</option>
            <option value="exact">Exact (no rounding)</option>
          </select>
        </div>
        <div>
          <label className="field-label">Outside Corner Pieces/Ft</label>
          <NumericInput
            className="field-input"
            value={rules.outsideCornerPiecesPerFt}
            onChange={(v) => onChange({ outsideCornerPiecesPerFt: v })}
          />
        </div>
        <div>
          <label className="field-label">Inside Corner Pieces/Ft</label>
          <NumericInput
            className="field-input"
            value={rules.insideCornerPiecesPerFt}
            onChange={(v) => onChange({ insideCornerPiecesPerFt: v })}
          />
        </div>
        <div>
          <label className="field-label">Trim Waste %</label>
          <NumericInput className="field-input" value={rules.trimWastePct} onChange={(v) => onChange({ trimWastePct: v })} />
        </div>
        <div>
          <label className="field-label">Starter Coverage (lnft/piece)</label>
          <NumericInput
            className="field-input"
            value={rules.starterCoverageLnftPerPiece}
            onChange={(v) => onChange({ starterCoverageLnftPerPiece: v })}
          />
        </div>
        <div>
          <label className="field-label">Labor Minimum ($)</label>
          <NumericInput
            className="field-input"
            value={rules.laborMinimumDollars}
            onChange={(v) => onChange({ laborMinimumDollars: v })}
          />
        </div>
        <div>
          <label className="field-label">Labor Rate Multiplier</label>
          <NumericInput
            className="field-input"
            value={rules.laborRateMultiplier}
            onChange={(v) => onChange({ laborRateMultiplier: v })}
          />
        </div>
      </div>
    </div>
  );
}

export function CalcRulesEditor({
  calcRules,
  onChange,
}: {
  calcRules: CalcRulesConfig;
  onChange: (config: CalcRulesConfig) => void;
}) {
  function updateBrand(key: CalcRuleBrandKey, patch: Partial<BrandCalcRules>) {
    onChange({ ...calcRules, [key]: { ...calcRules[key], ...patch } });
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold">Calculation Rules</h2>
        <p className="text-sm text-gray-500">
          Separate calculation processes per brand — waste percentages, purchase rounding, corner-post
          pieces-per-foot, and labor minimums used by the calculator&rsquo;s formulas.
        </p>
      </div>
      {BRAND_KEYS.map((key) => (
        <BrandCard key={key} label={CALC_RULE_BRAND_LABELS[key]} rules={calcRules[key]} onChange={(patch) => updateBrand(key, patch)} />
      ))}
    </div>
  );
}
