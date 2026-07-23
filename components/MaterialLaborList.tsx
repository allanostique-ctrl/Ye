import { Fragment } from 'react';
import { CalculationResult, ComputedLineItem, CustomLineItem, SECTION_LABELS, Unit } from '@/lib/types';
import { formatMoney } from '@/lib/format';
import { calculationResultToCSV, downloadTextFile } from '@/lib/csv';
import { NumericInput } from '@/components/NumericInput';

type OverrideField = 'materialCost' | 'laborCost';

const UNIT_OPTIONS: Unit[] = ['sqft', 'lnft', 'each'];

function EditableMoneyCell({
  item,
  field,
  onOverride,
}: {
  item: ComputedLineItem;
  field: OverrideField;
  onOverride: (overrideKey: string, field: OverrideField, value: number | null) => void;
}) {
  const overridden = field === 'materialCost' ? item.overridden.material : item.overridden.labor;
  const value = item[field];
  return (
    <div className="flex items-center justify-end gap-1">
      <NumericInput
        className="field-input text-right"
        style={{ width: 100 }}
        data-overridden={overridden ? 'true' : 'false'}
        value={value}
        onChange={(v) => onOverride(item.overrideKey, field, v)}
      />
      {overridden && (
        <button
          className="text-xs text-gray-400 hover:text-gray-600"
          title="Reset to calculated value"
          onClick={() => onOverride(item.overrideKey, field, null)}
        >
          ↺
        </button>
      )}
    </div>
  );
}

export function MaterialLaborList({
  result,
  exportFileName,
  onOverride,
  onRemoveLine,
  suppressedCount,
  onRestoreSuppressed,
  customItems,
  onAddCustomItem,
  onUpdateCustomItem,
  onRemoveCustomItem,
}: {
  result: CalculationResult;
  exportFileName?: string;
  /** When provided, Material $ / Labor $ cells become editable so a specific job's line
   *  can be manually corrected without touching the underlying Price Book rates. */
  onOverride?: (overrideKey: string, field: OverrideField, value: number | null) => void;
  /** When provided, every computed line gets a delete button that removes it from the
   *  quote entirely (a manual "delete"), not just zeroes its cost. */
  onRemoveLine?: (overrideKey: string) => void;
  /** How many lines are currently deleted this way — shown with a one-click restore. */
  suppressedCount?: number;
  onRestoreSuppressed?: () => void;
  /** Free-form line items the user typed in directly, rendered as their own editable
   *  section below every computed one. */
  customItems?: CustomLineItem[];
  onAddCustomItem?: () => void;
  onUpdateCustomItem?: (id: string, patch: Partial<CustomLineItem>) => void;
  onRemoveCustomItem?: (id: string) => void;
}) {
  const canDelete = Boolean(onRemoveLine) || Boolean(onRemoveCustomItem) || Boolean(onAddCustomItem);
  const showCustomItemsBlock = Boolean(customItems?.length) || Boolean(onAddCustomItem);
  const computedSections = result.sections.filter((s) => s.section !== 'customItems');
  const hasAnyRows = computedSections.some((s) => s.items.length > 0) || showCustomItemsBlock;

  if (!hasAnyRows) {
    return <p className="text-sm text-gray-500">No line items yet — fill in measurements and quote details above.</p>;
  }

  const colCount = canDelete ? 9 : 8;

  return (
    <div>
      <div className="no-print mb-2 flex flex-wrap items-center justify-between gap-2">
        <div>
          {!!suppressedCount && onRestoreSuppressed && (
            <button className="text-xs font-semibold text-brand-600 underline" onClick={onRestoreSuppressed}>
              {suppressedCount} line{suppressedCount === 1 ? '' : 's'} deleted from this quote — restore all
            </button>
          )}
        </div>
        {exportFileName && (
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => downloadTextFile(exportFileName, calculationResultToCSV(result))}
          >
            Export CSV
          </button>
        )}
      </div>
      {onOverride && (
        <p className="no-print mb-2 text-xs text-gray-500">
          Material $ and Labor $ are editable per line — corrections here apply only to this job, not the Price Book.
          {canDelete && ' Use the × to delete a line entirely, or add your own below.'}
        </p>
      )}
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Item</th>
              <th className="text-right">Qty</th>
              <th>Unit</th>
              <th className="text-right">Material $/Unit</th>
              <th className="text-right">Material $</th>
              <th className="text-right">Labor $/Unit</th>
              <th className="text-right">Labor $</th>
              <th className="text-right">Total $</th>
              {canDelete && <th className="no-print"></th>}
            </tr>
          </thead>
          <tbody>
            {computedSections.map((sec) => (
              <Fragment key={sec.section}>
                <tr className="section-header">
                  <td colSpan={colCount}>{SECTION_LABELS[sec.section]}</td>
                </tr>
                {sec.items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      {item.name}
                      {(item.overridden.material || item.overridden.labor) && (
                        <span className="badge ml-2 bg-amber-100 text-amber-700">edited</span>
                      )}
                    </td>
                    <td className="text-right">{item.qty.toLocaleString('en-US', { maximumFractionDigits: 2 })}</td>
                    <td>{item.unit}</td>
                    <td
                      className="text-right text-gray-500"
                      title={
                        item.coveragePerUnit !== 1
                          ? `${formatMoney(item.materialUnitPrice)} per purchase unit (covers ${item.coveragePerUnit} ${item.unit})`
                          : undefined
                      }
                    >
                      {formatMoney(item.materialUnitPrice / (item.coveragePerUnit || 1))}
                    </td>
                    <td className="text-right">
                      {onOverride ? (
                        <EditableMoneyCell item={item} field="materialCost" onOverride={onOverride} />
                      ) : (
                        formatMoney(item.materialCost)
                      )}
                    </td>
                    <td className="text-right text-gray-500">{formatMoney(item.laborRate)}</td>
                    <td className="text-right">
                      {onOverride ? (
                        <EditableMoneyCell item={item} field="laborCost" onOverride={onOverride} />
                      ) : (
                        formatMoney(item.laborCost)
                      )}
                    </td>
                    <td className="text-right">{formatMoney(item.totalCost)}</td>
                    {canDelete && (
                      <td className="no-print text-center">
                        {onRemoveLine && (
                          <button
                            className="text-gray-400 hover:text-red-600"
                            title="Delete this line item"
                            onClick={() => onRemoveLine(item.overrideKey)}
                          >
                            ×
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
                <tr>
                  <td colSpan={4} className="text-right font-semibold text-gray-500">
                    {SECTION_LABELS[sec.section]} Subtotal
                  </td>
                  <td className="text-right font-semibold">{formatMoney(sec.materialSubtotal)}</td>
                  <td></td>
                  <td className="text-right font-semibold">{formatMoney(sec.laborSubtotal)}</td>
                  <td className="text-right font-semibold">{formatMoney(sec.totalSubtotal)}</td>
                  {canDelete && <td className="no-print"></td>}
                </tr>
              </Fragment>
            ))}

            {showCustomItemsBlock && (
              <Fragment>
                <tr className="section-header">
                  <td colSpan={colCount}>Custom Items</td>
                </tr>
                {(customItems ?? []).map((item) => (
                  <tr key={item.id}>
                    <td>
                      {onUpdateCustomItem ? (
                        <input
                          className="field-input"
                          placeholder="Item name"
                          value={item.name}
                          onChange={(e) => onUpdateCustomItem(item.id, { name: e.target.value })}
                        />
                      ) : (
                        item.name || 'Custom Item'
                      )}
                    </td>
                    <td className="text-right">
                      {onUpdateCustomItem ? (
                        <NumericInput
                          className="field-input text-right"
                          style={{ width: 80 }}
                          value={item.qty}
                          onChange={(v) => onUpdateCustomItem(item.id, { qty: v })}
                        />
                      ) : (
                        item.qty.toLocaleString('en-US', { maximumFractionDigits: 2 })
                      )}
                    </td>
                    <td>
                      {onUpdateCustomItem ? (
                        <select
                          className="field-input"
                          value={item.unit}
                          onChange={(e) => onUpdateCustomItem(item.id, { unit: e.target.value as Unit })}
                        >
                          {UNIT_OPTIONS.map((u) => (
                            <option key={u} value={u}>
                              {u}
                            </option>
                          ))}
                        </select>
                      ) : (
                        item.unit
                      )}
                    </td>
                    <td className="text-right text-gray-400">—</td>
                    <td className="text-right">
                      {onUpdateCustomItem ? (
                        <NumericInput
                          className="field-input text-right"
                          style={{ width: 100 }}
                          value={item.materialCost}
                          onChange={(v) => onUpdateCustomItem(item.id, { materialCost: v })}
                        />
                      ) : (
                        formatMoney(item.materialCost)
                      )}
                    </td>
                    <td className="text-right text-gray-400">—</td>
                    <td className="text-right">
                      {onUpdateCustomItem ? (
                        <NumericInput
                          className="field-input text-right"
                          style={{ width: 100 }}
                          value={item.laborCost}
                          onChange={(v) => onUpdateCustomItem(item.id, { laborCost: v })}
                        />
                      ) : (
                        formatMoney(item.laborCost)
                      )}
                    </td>
                    <td className="text-right">{formatMoney(item.materialCost + item.laborCost)}</td>
                    {canDelete && (
                      <td className="no-print text-center">
                        {onRemoveCustomItem && (
                          <button
                            className="text-gray-400 hover:text-red-600"
                            title="Delete this custom item"
                            onClick={() => onRemoveCustomItem(item.id)}
                          >
                            ×
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
                {onAddCustomItem && (
                  <tr>
                    <td colSpan={colCount} className="no-print">
                      <button className="btn btn-secondary btn-sm" onClick={onAddCustomItem}>
                        + Add Custom Line Item
                      </button>
                    </td>
                  </tr>
                )}
              </Fragment>
            )}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={4}>Grand Total</td>
              <td className="text-right">{formatMoney(result.materialTotal)}</td>
              <td></td>
              <td className="text-right">{formatMoney(result.laborTotal)}</td>
              <td className="text-right">{formatMoney(result.grandTotal)}</td>
              {canDelete && <td className="no-print"></td>}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
