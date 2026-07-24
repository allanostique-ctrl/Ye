import { Fragment } from 'react';
import { CalculationResult, ComputedLineItem, SECTION_LABELS, Unit, WorkSectionKey } from '@/lib/types';
import { formatMoney } from '@/lib/format';
import { calculationResultToCSV, downloadTextFile } from '@/lib/csv';
import { NumericInput } from '@/components/NumericInput';

type OverrideField = 'qty' | 'materialCost' | 'laborCost';

const UNIT_OPTIONS: Unit[] = ['sqft', 'lnft', 'each'];

/** The id of the CustomLineItem a synthesized custom row came from — everything after
 *  the "custom-" prefix in its overrideKey. */
function customItemId(item: ComputedLineItem): string {
  return item.overrideKey.replace(/^custom-/, '');
}

function EditableCell({
  item,
  field,
  onOverride,
}: {
  item: ComputedLineItem;
  field: OverrideField;
  onOverride: (overrideKey: string, field: OverrideField, value: number | null) => void;
}) {
  const overridden = item.overridden[field === 'materialCost' ? 'material' : field === 'laborCost' ? 'labor' : 'qty'];
  const value = item[field];
  return (
    <div className="flex items-center justify-end gap-1">
      <NumericInput
        className="field-input text-right"
        style={{ width: field === 'qty' ? 80 : 100 }}
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
  columns = 'full',
  onOverride,
  onRemoveLine,
  suppressedCount,
  onRestoreSuppressed,
  onAddCustomItem,
  onUpdateCustomItem,
  onRemoveCustomItem,
}: {
  result: CalculationResult;
  exportFileName?: string;
  /** 'totalOnly' hides every column except Item and Total $ — for a customer-facing
   *  Proposal where the material/labor/qty breakdown isn't meant to be shown. */
  columns?: 'full' | 'totalOnly';
  /** When provided, Qty / Material $ / Labor $ cells become editable so a specific job's
   *  line can be manually corrected without touching the underlying Price Book rates. */
  onOverride?: (overrideKey: string, field: OverrideField, value: number | null) => void;
  /** When provided, every computed line gets a delete button that removes it from the
   *  quote entirely (a manual "delete"), not just zeroes its cost. */
  onRemoveLine?: (overrideKey: string) => void;
  /** How many lines are currently deleted this way — shown with a one-click restore. */
  suppressedCount?: number;
  onRestoreSuppressed?: () => void;
  /** When provided, every section gets its own "+ Add Custom Line Item" row, tagged to
   *  that section so the new line shows up right there, not in one generic bucket. */
  onAddCustomItem?: (section: WorkSectionKey) => void;
  onUpdateCustomItem?: (id: string, patch: { name?: string; qty?: number; unit?: Unit; materialCost?: number; laborCost?: number }) => void;
  onRemoveCustomItem?: (id: string) => void;
}) {
  const totalOnly = columns === 'totalOnly';
  const interactive = Boolean(onOverride) || Boolean(onAddCustomItem);
  const canDelete = !totalOnly && (Boolean(onRemoveLine) || Boolean(onRemoveCustomItem) || Boolean(onAddCustomItem));
  const hasAnyRows = interactive || result.sections.some((s) => s.items.length > 0);

  if (!hasAnyRows) {
    return <p className="text-sm text-gray-500">No line items yet — fill in measurements and quote details above.</p>;
  }

  const colCount = totalOnly ? 2 : canDelete ? 9 : 8;
  const leadColSpan = totalOnly ? 1 : 4;

  return (
    <div>
      {!totalOnly && (
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
      )}
      {onOverride && (
        <p className="no-print mb-2 text-xs text-gray-500">
          Qty, Material $, and Labor $ are editable per line — corrections here apply only to this job, not the
          Price Book.
          {canDelete && ' Use the × to delete a line entirely, or add your own below.'}
        </p>
      )}
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Item</th>
              {!totalOnly && (
                <>
                  <th className="text-right">Qty</th>
                  <th>Unit</th>
                  <th className="text-right">Material $/Unit</th>
                  <th className="text-right">Material $</th>
                  <th className="text-right">Labor $/Unit</th>
                  <th className="text-right">Labor $</th>
                </>
              )}
              <th className="text-right">Total $</th>
              {canDelete && <th className="no-print"></th>}
            </tr>
          </thead>
          <tbody>
            {result.sections.map((sec) => (
              <Fragment key={sec.section}>
                <tr className="section-header">
                  <td colSpan={colCount}>{SECTION_LABELS[sec.section]}</td>
                </tr>
                {sec.items.map((item) => {
                  if (item.isCustom) {
                    const id = customItemId(item);
                    return (
                      <tr key={item.id}>
                        <td>
                          {onUpdateCustomItem ? (
                            <input
                              className="field-input"
                              placeholder="Item name"
                              value={item.name}
                              onChange={(e) => onUpdateCustomItem(id, { name: e.target.value })}
                            />
                          ) : (
                            item.name || 'Custom Item'
                          )}
                        </td>
                        {!totalOnly && (
                          <>
                            <td className="text-right">
                              {onUpdateCustomItem ? (
                                <NumericInput
                                  className="field-input text-right"
                                  style={{ width: 80 }}
                                  value={item.qty}
                                  onChange={(v) => onUpdateCustomItem(id, { qty: v })}
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
                                  onChange={(e) => onUpdateCustomItem(id, { unit: e.target.value as Unit })}
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
                                  onChange={(v) => onUpdateCustomItem(id, { materialCost: v })}
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
                                  onChange={(v) => onUpdateCustomItem(id, { laborCost: v })}
                                />
                              ) : (
                                formatMoney(item.laborCost)
                              )}
                            </td>
                          </>
                        )}
                        <td className="text-right">{formatMoney(item.materialCost + item.laborCost)}</td>
                        {canDelete && (
                          <td className="no-print text-center">
                            {onRemoveCustomItem && (
                              <button
                                className="text-gray-400 hover:text-red-600"
                                title="Delete this custom item"
                                onClick={() => onRemoveCustomItem(id)}
                              >
                                ×
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  }
                  return (
                    <tr key={item.id}>
                      <td>
                        {item.name}
                        {(item.overridden.qty || item.overridden.material || item.overridden.labor) && (
                          <span className="badge ml-2 bg-amber-100 text-amber-700">edited</span>
                        )}
                      </td>
                      {!totalOnly && (
                        <>
                          <td className="text-right">
                            {onOverride ? (
                              <EditableCell item={item} field="qty" onOverride={onOverride} />
                            ) : (
                              item.qty.toLocaleString('en-US', { maximumFractionDigits: 2 })
                            )}
                          </td>
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
                              <EditableCell item={item} field="materialCost" onOverride={onOverride} />
                            ) : (
                              formatMoney(item.materialCost)
                            )}
                          </td>
                          <td className="text-right text-gray-500">{formatMoney(item.laborRate)}</td>
                          <td className="text-right">
                            {onOverride ? (
                              <EditableCell item={item} field="laborCost" onOverride={onOverride} />
                            ) : (
                              formatMoney(item.laborCost)
                            )}
                          </td>
                        </>
                      )}
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
                  );
                })}
                {onAddCustomItem && (
                  <tr>
                    <td colSpan={colCount} className="no-print">
                      <button className="btn btn-secondary btn-sm" onClick={() => onAddCustomItem(sec.section)}>
                        + Add Custom Line Item
                      </button>
                    </td>
                  </tr>
                )}
                <tr>
                  <td colSpan={leadColSpan} className="text-right font-semibold text-gray-500">
                    {SECTION_LABELS[sec.section]} Subtotal
                  </td>
                  {!totalOnly && (
                    <>
                      <td className="text-right font-semibold">{formatMoney(sec.materialSubtotal)}</td>
                      <td></td>
                      <td className="text-right font-semibold">{formatMoney(sec.laborSubtotal)}</td>
                    </>
                  )}
                  <td className="text-right font-semibold">{formatMoney(sec.totalSubtotal)}</td>
                  {canDelete && <td className="no-print"></td>}
                </tr>
              </Fragment>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={leadColSpan}>Grand Total</td>
              {!totalOnly && (
                <>
                  <td className="text-right">{formatMoney(result.materialTotal)}</td>
                  <td></td>
                  <td className="text-right">{formatMoney(result.laborTotal)}</td>
                </>
              )}
              <td className="text-right">{formatMoney(result.grandTotal)}</td>
              {canDelete && <td className="no-print"></td>}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
