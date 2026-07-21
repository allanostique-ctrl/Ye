import { Fragment } from 'react';
import { CalculationResult, SECTION_LABELS } from '@/lib/types';
import { formatMoney } from '@/lib/format';
import { calculationResultToCSV, downloadTextFile } from '@/lib/csv';

export function MaterialLaborList({ result, exportFileName }: { result: CalculationResult; exportFileName?: string }) {
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
                  <td>{item.name}</td>
                  <td className="text-right">{item.qty.toLocaleString('en-US', { maximumFractionDigits: 2 })}</td>
                  <td>{item.unit}</td>
                  <td className="text-right">{formatMoney(item.materialCost)}</td>
                  <td className="text-right">{formatMoney(item.laborCost)}</td>
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
