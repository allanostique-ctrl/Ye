'use client';

import { BrandCalcRules, CalcRulesConfig } from '@/lib/types';
import { CALC_RULE_BRAND_LABELS, CalcRuleBrandKey } from '@/lib/brands';

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
          <input
            type="number"
            className="field-input"
            value={rules.sidingWastePct}
            onChange={(e) => onChange({ sidingWastePct: parseFloat(e.target.value) || 0 })}
          />
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
          <input
            type="number"
            step="any"
            className="field-input"
            value={rules.outsideCornerPiecesPerFt}
            onChange={(e) => onChange({ outsideCornerPiecesPerFt: parseFloat(e.target.value) || 0 })}
          />
        </div>
        <div>
          <label className="field-label">Inside Corner Pieces/Ft</label>
          <input
            type="number"
            step="any"
            className="field-input"
            value={rules.insideCornerPiecesPerFt}
            onChange={(e) => onChange({ insideCornerPiecesPerFt: parseFloat(e.target.value) || 0 })}
          />
        </div>
        <div>
          <label className="field-label">Trim Waste %</label>
          <input
            type="number"
            className="field-input"
            value={rules.trimWastePct}
            onChange={(e) => onChange({ trimWastePct: parseFloat(e.target.value) || 0 })}
          />
        </div>
        <div>
          <label className="field-label">Starter Coverage (lnft/piece)</label>
          <input
            type="number"
            step="any"
            className="field-input"
            value={rules.starterCoverageLnftPerPiece}
            onChange={(e) => onChange({ starterCoverageLnftPerPiece: parseFloat(e.target.value) || 0 })}
          />
        </div>
        <div>
          <label className="field-label">Labor Minimum ($)</label>
          <input
            type="number"
            className="field-input"
            value={rules.laborMinimumDollars}
            onChange={(e) => onChange({ laborMinimumDollars: parseFloat(e.target.value) || 0 })}
          />
        </div>
        <div>
          <label className="field-label">Labor Rate Multiplier</label>
          <input
            type="number"
            step="any"
            className="field-input"
            value={rules.laborRateMultiplier}
            onChange={(e) => onChange({ laborRateMultiplier: parseFloat(e.target.value) || 0 })}
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
