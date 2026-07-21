import { BrandCalcRules, CalcRulesConfig } from './types';

export const CALC_RULES_SCHEMA_VERSION = 1;

function rules(overrides: Partial<BrandCalcRules>): BrandCalcRules {
  return {
    sidingWastePct: 10,
    purchaseRounding: 'up',
    outsideCornerPiecesPerFt: 1,
    insideCornerPiecesPerFt: 1,
    trimWastePct: 10,
    starterCoverageLnftPerPiece: 12.5,
    laborMinimumDollars: 0,
    laborRateMultiplier: 1,
    ...overrides,
  };
}

export function buildDefaultCalcRules(): CalcRulesConfig {
  return {
    schemaVersion: CALC_RULES_SCHEMA_VERSION,
    vinyl: rules({
      sidingWastePct: 10,
      outsideCornerPiecesPerFt: 1,
      insideCornerPiecesPerFt: 1,
    }),
    jamesHardie: rules({
      sidingWastePct: 15,
      // Hardie/LP trim switch: 2 pieces/ft outside corner, 1 piece/ft inside corner
      outsideCornerPiecesPerFt: 2,
      insideCornerPiecesPerFt: 1,
      trimWastePct: 10,
    }),
    lpSmartSide: rules({
      sidingWastePct: 12,
      outsideCornerPiecesPerFt: 2,
      insideCornerPiecesPerFt: 1,
      trimWastePct: 10,
    }),
    other: rules({
      sidingWastePct: 12,
      outsideCornerPiecesPerFt: 2,
      insideCornerPiecesPerFt: 1,
      trimWastePct: 10,
    }),
  };
}
