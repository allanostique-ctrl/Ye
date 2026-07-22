import { ACCESSORY_IDS } from '../defaultPriceBook';
import { TrimConfig, defaultTrimConfig } from '../types';
import { Brand, isTrimBoardBrand } from '../brands';

/**
 * Derives the brand-driven trim/accessory package for a single Siding Type row's
 * OWN brand — each row gets its own package, since a mixed-brand job (e.g. Vinyl
 * + Hardie) needs Vinyl J-channel on the Vinyl row and Hardie trim board on the
 * Hardie row at the same time, not one shared job-wide setting.
 *
 * Any manual override the user made on this row survives until the NEXT material
 * change on THIS row (i.e. its brand changes), at which point every trim field
 * (except top-of-siding mode, which is brand-independent) resets and re-derives
 * from scratch.
 */
export function trimConfigForBrand(brand: Brand, current?: TrimConfig): TrimConfig {
  const topOfSidingMode = current?.topOfSidingMode ?? defaultTrimConfig().topOfSidingMode;
  // Step flashing is situational (roof/wall intersections), not brand-driven — preserve it too.
  const stepFlashing = current?.stepFlashing ?? defaultTrimConfig().stepFlashing;

  if (isTrimBoardBrand(brand)) {
    return {
      openingsTrimProductId: { value: ACCESSORY_IDS.trimBoardOpenings, overridden: false },
      outsideCornerProductId: { value: ACCESSORY_IDS.trimBoardOutsideCorner, overridden: false },
      insideCornerProductId: { value: ACCESSORY_IDS.trimBoardInsideCorner, overridden: false },
      starterProductId: { value: ACCESSORY_IDS.metalStarter, overridden: false },
      fastenerProductId: { value: ACCESSORY_IDS.fiberCementNails, overridden: false },
      topOfSidingMode,
      buttJointFlashing: { value: true, overridden: false },
      touchUpPaint: { value: true, overridden: false },
      caulkSealant: { value: true, overridden: false },
      stepFlashing,
    };
  }

  return {
    openingsTrimProductId: { value: ACCESSORY_IDS.jChannel, overridden: false },
    outsideCornerProductId: { value: ACCESSORY_IDS.plasticOutsideCorner, overridden: false },
    insideCornerProductId: { value: ACCESSORY_IDS.plasticInsideCorner, overridden: false },
    starterProductId: { value: ACCESSORY_IDS.plasticStarter, overridden: false },
    fastenerProductId: { value: ACCESSORY_IDS.vinylNails, overridden: false },
    topOfSidingMode,
    buttJointFlashing: { value: false, overridden: false },
    touchUpPaint: { value: false, overridden: false },
    caulkSealant: { value: false, overridden: false },
    stepFlashing,
  };
}
