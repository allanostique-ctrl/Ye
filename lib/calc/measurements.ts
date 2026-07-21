import { Measurements } from '../types';

export interface EffectiveMeasurements {
  facadeAreaSqft: number;
  openingsPerimeterLnft: number;
  outsideCornerLengthLnft: number;
  insideCornerLengthLnft: number;
  starterLengthLnft: number;
}

/**
 * When multi-section manual entry is on, every downstream total is the sum of the
 * per-section table instead of the single top-level fields. Fascia/soffit/gutter stay
 * job-wide either way since they aren't split by siding section.
 */
export function effectiveMeasurements(m: Measurements): EffectiveMeasurements {
  if (m.multiSection && m.sections.length > 0) {
    return m.sections.reduce<EffectiveMeasurements>(
      (acc, s) => ({
        facadeAreaSqft: acc.facadeAreaSqft + (s.facadeAreaSqft || 0),
        openingsPerimeterLnft: acc.openingsPerimeterLnft + (s.openingsPerimeterLnft || 0),
        outsideCornerLengthLnft: acc.outsideCornerLengthLnft + (s.outsideCornerLengthLnft || 0),
        insideCornerLengthLnft: acc.insideCornerLengthLnft + (s.insideCornerLengthLnft || 0),
        starterLengthLnft: acc.starterLengthLnft + (s.starterLengthLnft || 0),
      }),
      {
        facadeAreaSqft: 0,
        openingsPerimeterLnft: 0,
        outsideCornerLengthLnft: 0,
        insideCornerLengthLnft: 0,
        starterLengthLnft: 0,
      }
    );
  }
  return {
    facadeAreaSqft: m.facadeAreaSqft,
    openingsPerimeterLnft: m.openingsPerimeterLnft,
    outsideCornerLengthLnft: m.outsideCornerLengthLnft,
    insideCornerLengthLnft: m.insideCornerLengthLnft,
    starterLengthLnft: m.starterLengthLnft,
  };
}
