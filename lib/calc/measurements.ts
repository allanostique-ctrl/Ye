import { ID, Measurements, MeasurementSection, SidingTypeRow } from '../types';

export interface EffectiveMeasurements {
  facadeAreaSqft: number;
  openingsPerimeterLnft: number;
  outsideCornerLengthLnft: number;
  insideCornerLengthLnft: number;
  starterLengthLnft: number;
}

/**
 * When two or more sections share the same siding material, openings/corners/starter
 * only need to be entered once between them — they all feed the same Siding Type row
 * regardless of which section they're attributed to, so splitting them up is busywork.
 * Facade area is the exception: it's tracked per section on purpose. This picks, for
 * each distinct material, the one (first, in table order) section whose openings/corner/
 * starter values actually count; sections with no material picked yet always count
 * individually since they aren't "the same" as anything yet.
 */
export function primarySectionIds(sections: MeasurementSection[]): Set<ID> {
  const seenKeys = new Set<string>();
  const primaryIds = new Set<ID>();
  for (const s of sections) {
    if (s.sidingKey === null) {
      primaryIds.add(s.id);
    } else if (!seenKeys.has(s.sidingKey)) {
      seenKeys.add(s.sidingKey);
      primaryIds.add(s.id);
    }
  }
  return primaryIds;
}

/**
 * When multi-section manual entry is on, every downstream total is the sum of the
 * per-section table instead of the single top-level fields. Fascia/soffit/gutter stay
 * job-wide either way since they aren't split by siding section.
 */
export function effectiveMeasurements(m: Measurements): EffectiveMeasurements {
  if (m.multiSection && m.sections.length > 0) {
    const primaryIds = primarySectionIds(m.sections);
    return m.sections.reduce<EffectiveMeasurements>(
      (acc, s) => ({
        facadeAreaSqft: acc.facadeAreaSqft + (s.facadeAreaSqft || 0),
        openingsPerimeterLnft: acc.openingsPerimeterLnft + (primaryIds.has(s.id) ? s.openingsPerimeterLnft || 0 : 0),
        outsideCornerLengthLnft:
          acc.outsideCornerLengthLnft + (primaryIds.has(s.id) ? s.outsideCornerLengthLnft || 0 : 0),
        insideCornerLengthLnft: acc.insideCornerLengthLnft + (primaryIds.has(s.id) ? s.insideCornerLengthLnft || 0 : 0),
        starterLengthLnft: acc.starterLengthLnft + (primaryIds.has(s.id) ? s.starterLengthLnft || 0 : 0),
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

/**
 * A Siding Type row's area: the sum of whichever measurement sections it's linked to
 * (when multi-section is on), or its own manually-entered area otherwise.
 */
export function effectiveRowArea(row: SidingTypeRow, m: Measurements): number {
  if (m.multiSection && row.sectionIds.length > 0) {
    return m.sections
      .filter((s) => row.sectionIds.includes(s.id))
      .reduce((sum, s) => sum + (s.facadeAreaSqft || 0), 0);
  }
  return row.areaSqft;
}

export interface RowMeasurements {
  areaSqft: number;
  openingsPerimeterLnft: number;
  outsideCornerLengthLnft: number;
  insideCornerLengthLnft: number;
  starterLengthLnft: number;
}

/**
 * The accessory-quantity inputs (openings trim, corners, starter) for one Siding Type
 * row. When it's linked to measurement sections, uses those sections' own numbers
 * directly — exact, since each section already carries its own corner/opening/starter
 * lengths. Otherwise falls back to splitting the job-wide totals in proportion to this
 * row's share of the total siding area; with only one row (the common single-brand
 * case) that share is 100%, so behavior there is unchanged from before.
 */
export function measurementsForRow(row: SidingTypeRow, m: Measurements, allRows: SidingTypeRow[]): RowMeasurements {
  if (m.multiSection && row.sectionIds.length > 0) {
    const linked = m.sections.filter((s) => row.sectionIds.includes(s.id));
    // Every section linked to one row already shares that row's siding material, so at
    // most one of them needs openings/corner/starter filled in — see primarySectionIds.
    const primaryIds = primarySectionIds(linked);
    return linked.reduce<RowMeasurements>(
      (acc, s) => ({
        areaSqft: acc.areaSqft + (s.facadeAreaSqft || 0),
        openingsPerimeterLnft: acc.openingsPerimeterLnft + (primaryIds.has(s.id) ? s.openingsPerimeterLnft || 0 : 0),
        outsideCornerLengthLnft:
          acc.outsideCornerLengthLnft + (primaryIds.has(s.id) ? s.outsideCornerLengthLnft || 0 : 0),
        insideCornerLengthLnft: acc.insideCornerLengthLnft + (primaryIds.has(s.id) ? s.insideCornerLengthLnft || 0 : 0),
        starterLengthLnft: acc.starterLengthLnft + (primaryIds.has(s.id) ? s.starterLengthLnft || 0 : 0),
      }),
      { areaSqft: 0, openingsPerimeterLnft: 0, outsideCornerLengthLnft: 0, insideCornerLengthLnft: 0, starterLengthLnft: 0 }
    );
  }

  const em = effectiveMeasurements(m);
  const totalArea = allRows.reduce((sum, r) => sum + effectiveRowArea(r, m), 0);
  const rowArea = effectiveRowArea(row, m);
  const share = totalArea > 0 ? rowArea / totalArea : 0;

  return {
    areaSqft: rowArea,
    openingsPerimeterLnft: em.openingsPerimeterLnft * share,
    outsideCornerLengthLnft: em.outsideCornerLengthLnft * share,
    insideCornerLengthLnft: em.insideCornerLengthLnft * share,
    starterLengthLnft: em.starterLengthLnft * share,
  };
}
