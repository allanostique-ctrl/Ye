'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useActiveJobDraft } from '@/lib/hooks/useActiveJobDraft';
import { getCompanyInfo, saveCompanyInfo, CompanyInfo } from '@/lib/storage';
import { computeCalculation } from '@/lib/calc/engine';
import { MaterialLaborList } from '@/components/MaterialLaborList';
import { ScopeSummary } from '@/components/ScopeSummary';
import { formatDate, formatMoney } from '@/lib/format';

const TERMS_TEXT = `This proposal is valid for 30 days from the date above. Pricing includes materials and labor as itemized. Payment terms: 1/3 deposit due upon signing, 1/3 due at material delivery, remaining balance due upon substantial completion. Any changes to the scope of work described above will be documented in a signed change order. Contractor carries general liability insurance and, where applicable, workers' compensation coverage; certificates available upon request.`;

export default function ProposalPage() {
  const { job, priceBook, calcRules, ready } = useActiveJobDraft();
  const [company, setCompany] = useState<CompanyInfo | null>(null);

  useEffect(() => {
    setCompany(getCompanyInfo());
  }, []);

  if (ready && !job) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-10">
        <p className="text-sm text-gray-500">
          No active job. <Link href="/" className="underline">Go back to Jobs</Link>.
        </p>
      </main>
    );
  }

  if (!job || !priceBook || !calcRules || !company) return null;

  const result = computeCalculation(job.draft, priceBook, calcRules);

  function updateCompany(patch: Partial<CompanyInfo>) {
    setCompany((prev) => {
      const next = { ...(prev as CompanyInfo), ...patch };
      saveCompanyInfo(next);
      return next;
    });
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <div className="no-print mb-4 flex items-center justify-between">
        <Link href="/calculator?tab=quoteDetails" className="btn btn-ghost btn-sm">
          ← Back to Calculator
        </Link>
        <button className="btn btn-primary" onClick={() => window.print()}>
          🖨️ Print Proposal
        </button>
      </div>

      <div className="print-sheet card space-y-6">
        <header className="flex items-start justify-between border-b border-gray-200 pb-4">
          <div className="space-y-1">
            <input
              className="w-full border-none bg-transparent text-xl font-bold outline-none"
              value={company.name}
              onChange={(e) => updateCompany({ name: e.target.value })}
            />
            <input
              className="w-full border-none bg-transparent text-sm text-gray-500 outline-none"
              value={company.address}
              onChange={(e) => updateCompany({ address: e.target.value })}
            />
            <input
              className="w-full border-none bg-transparent text-sm text-gray-500 outline-none"
              value={company.phone}
              onChange={(e) => updateCompany({ phone: e.target.value })}
            />
            <input
              className="w-full border-none bg-transparent text-sm text-gray-500 outline-none"
              value={company.email}
              onChange={(e) => updateCompany({ email: e.target.value })}
            />
          </div>
          <div className="text-right text-sm text-gray-500">
            <p className="text-lg font-bold text-gray-800">Proposal</p>
            <p>{formatDate(new Date().toISOString())}</p>
            <p>Job: {job.name}</p>
          </div>
        </header>

        <div className="grid grid-cols-2 gap-6 text-sm">
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-wide text-gray-400">Prepared For</p>
            <p className="font-semibold">{job.customerName || job.name}</p>
            <p>{job.address}</p>
          </div>
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-wide text-gray-400">Prepared By</p>
            <p className="font-semibold">{job.salesRep || '—'}</p>
            <p>{company.name}</p>
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400">Scope &amp; Specifications</p>
          <ScopeSummary draft={job.draft} priceBook={priceBook} />
        </div>

        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400">Priced Line Items</p>
          <MaterialLaborList result={result} customItems={job.draft.customLineItems} />
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

        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400">Terms</p>
          <p className="text-xs leading-relaxed text-gray-600">{TERMS_TEXT}</p>
        </div>

        <div className="grid grid-cols-2 gap-10 pt-8 text-sm">
          <div>
            <div className="mb-1 border-b border-gray-400 pb-8" />
            <p>Customer Signature / Date</p>
          </div>
          <div>
            <div className="mb-1 border-b border-gray-400 pb-8" />
            <p>{company.name} Representative / Date</p>
          </div>
        </div>
      </div>
    </main>
  );
}
