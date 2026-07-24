'use client';

import Link from 'next/link';
import { useActiveJobDraft } from '@/lib/hooks/useActiveJobDraft';
import { computeCalculation } from '@/lib/calc/engine';
import { MaterialLaborList } from '@/components/MaterialLaborList';
import { ScopeSummary } from '@/components/ScopeSummary';
import { formatDate, formatMoney } from '@/lib/format';

export default function WorkOrderPage() {
  const { job, priceBook, calcRules, ready } = useActiveJobDraft();

  if (ready && !job) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-10">
        <p className="text-sm text-gray-500">
          No active job. <Link href="/" className="underline">Go back to Jobs</Link>.
        </p>
      </main>
    );
  }

  if (!job || !priceBook || !calcRules) return null;

  const result = computeCalculation(job.draft, priceBook, calcRules);

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <div className="no-print mb-4 flex items-center justify-between">
        <Link href="/calculator?tab=quoteDetails" className="btn btn-ghost btn-sm">
          ← Back to Calculator
        </Link>
        <button className="btn btn-primary" onClick={() => window.print()}>
          🖨️ Print Work Order
        </button>
      </div>

      <div className="print-sheet card space-y-6">
        <header className="flex items-start justify-between border-b border-gray-200 pb-4">
          <div>
            <h1 className="text-xl font-bold">Material &amp; Work Order</h1>
            <p className="text-sm text-gray-500">{job.name}</p>
          </div>
          <div className="text-right text-sm text-gray-500">
            <p>{formatDate(new Date().toISOString())}</p>
          </div>
        </header>

        <div className="grid grid-cols-2 gap-6 text-sm">
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-wide text-gray-400">Job Site</p>
            <p className="font-semibold">{job.address || '—'}</p>
          </div>
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-wide text-gray-400">Sales Rep Contact</p>
            <p className="font-semibold">{job.salesRep || '—'}</p>
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400">Scope of Work</p>
          <ScopeSummary draft={job.draft} priceBook={priceBook} />
        </div>

        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400">Material &amp; Labor Breakdown</p>
          <MaterialLaborList
            result={result}
            exportFileName="material-and-labor-breakdown.csv"
          />
        </div>

        <div className="flex justify-end">
          <div className="w-64 space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Material Total</span>
              <span className="font-semibold">{formatMoney(result.materialTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Labor Total</span>
              <span className="font-semibold">{formatMoney(result.laborTotal)}</span>
            </div>
            <div className="flex justify-between border-t border-gray-300 pt-1 text-base font-bold">
              <span>Grand Total</span>
              <span>{formatMoney(result.grandTotal)}</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
