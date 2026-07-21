import { ACCESSORY_IDS } from '../defaultPriceBook';
import { SidingMaterialSelections, TrimConfig } from '../types';
import { Brand, Style, isTrimBoardBrand } from '../brands';

export function trimBoardModeFromSelections(selections: SidingMaterialSelections): boolean {
  return Object.entries(selections).some(([key, checked]) => {
    if (!checked) return false;
    const [brand] = key.split('|') as [Brand, Style];
    return isTrimBoardBrand(brand);
  });
}

/**
 * Re-applies the brand-driven trim package whenever the checked siding materials change.
 * Any manual override the user made survives until the NEXT material change, at which
 * point every trim field (except top-of-siding mode, which is brand-independent) resets
 * and re-derives from scratch.
 */
export function applyMaterialChange(current: TrimConfig, selections: SidingMaterialSelections): TrimConfig {
  const trimBoardMode = trimBoardModeFromSelections(selections);

  if (trimBoardMode) {
    return {
      openingsTrimProductId: { value: ACCESSORY_IDS.trimBoardOpenings, overridden: false },
      outsideCornerProductId: { value: ACCESSORY_IDS.trimBoardOutsideCorner, overridden: false },
      insideCornerProductId: { value: ACCESSORY_IDS.trimBoardInsideCorner, overridden: false },
      starterProductId: { value: ACCESSORY_IDS.metalStarter, overridden: false },
      topOfSidingMode: current.topOfSidingMode,
      buttJointFlashing: { value: true, overridden: false },
      touchUpPaint: { value: true, overridden: false },
      caulkSealant: { value: true, overridden: false },
    };
  }

  return {
    openingsTrimProductId: { value: ACCESSORY_IDS.jChannel, overridden: false },
    outsideCornerProductId: { value: ACCESSORY_IDS.plasticOutsideCorner, overridden: false },
    insideCornerProductId: { value: ACCESSORY_IDS.plasticInsideCorner, overridden: false },
    starterProductId: { value: ACCESSORY_IDS.plasticStarter, overridden: false },
    topOfSidingMode: current.topOfSidingMode,
    buttJointFlashing: { value: false, overridden: false },
    touchUpPaint: { value: false, overridden: false },
    caulkSealant: { value: false, overridden: false },
  };
}
