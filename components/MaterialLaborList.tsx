import { Fragment } from 'react';
import { CalculationResult, ComputedLineItem, SECTION_LABELS } from '@/lib/types';
import { formatMoney } from '@/lib/format';
import { calculationResultToCSV, downloadTextFile } from '@/lib/csv';
import { NumericInput } from '@/components/NumericInput';

type OverrideField = 'materialCost' | 'laborCost';

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
}: {
  result: CalculationResult;
  exportFileName?: string;
  /** When provided, Material $ / Labor $ cells become editable so a specific job's line
   *  can be manually corrected without touching the underlying Price Book rates. */
  onOverride?: (overrideKey: string, field: OverrideField, value: number | null) => void;
}) {
  if (result.sections.every((s) => s.items.length === 0)) {
    return <p className="text-sm text-gray-500">No line items yet — fill in measurements and quote details above.</p>;
  }
  return (
    <div>
      {exportFileName && (
        <div className="no-print mb-2 flex justify-end">
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => downloadTextFile(exportFileName, calculationResultToCSV(result))}
          >
            Export CSV
          </button>
        </div>
      )}
      {onOverride && (
        <p className="no-print mb-2 text-xs text-gray-500">
          Material $ and Labor $ are editable per line — corrections here apply only to this job, not the Price Book.
        </p>
      )}
      <div className="overflow-x-auto">
      <table className="data-table">
        <thead>
          <tr>
            <th>Item</th>
            <th className="text-right">Qty</th>
            <th>Unit</th>
            <th className="text-right">Material $</th>
            <th className="text-right">Labor $</th>
            <th className="text-right">Total $</th>
          </tr>
        </thead>
        <tbody>
          {result.sections.map((sec) => (
            <Fragment key={sec.section}>
              <tr className="section-header">
                <td colSpan={6}>{SECTION_LABELS[sec.section]}</td>
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
                  <td className="text-right">
                    {onOverride ? (
                      <EditableMoneyCell item={item} field="materialCost" onOverride={onOverride} />
                    ) : (
                      formatMoney(item.materialCost)
                    )}
                  </td>
                  <td className="text-right">
                    {onOverride ? (
                      <EditableMoneyCell item={item} field="laborCost" onOverride={onOverride} />
                    ) : (
                      formatMoney(item.laborCost)
                    )}
                  </td>
                  <td className="text-right">{formatMoney(item.totalCost)}</td>
                </tr>
              ))}
              <tr>
                <td colSpan={3} className="text-right font-semibold text-gray-500">
                  {SECTION_LABELS[sec.section]} Subtotal
                </td>
                <td className="text-right font-semibold">{formatMoney(sec.materialSubtotal)}</td>
                <td className="text-right font-semibold">{formatMoney(sec.laborSubtotal)}</td>
                <td className="text-right font-semibold">{formatMoney(sec.totalSubtotal)}</td>
              </tr>
            </Fragment>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={3}>Grand Total</td>
            <td className="text-right">{formatMoney(result.materialTotal)}</td>
            <td className="text-right">{formatMoney(result.laborTotal)}</td>
            <td className="text-right">{formatMoney(result.grandTotal)}</td>
          </tr>
        </tfoot>
      </table>
      </div>
    </div>
  );
}
