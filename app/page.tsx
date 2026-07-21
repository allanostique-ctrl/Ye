'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Job, PriceBook, CalcRulesConfig } from '@/lib/types';
import { createJob, deleteJob, getCalcRules, getJobs, getPriceBook, setActiveJobId } from '@/lib/storage';
import { computeCalculation } from '@/lib/calc/engine';
import { JobModal, NewJobInput } from '@/components/JobModal';

function formatMoney(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function JobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [priceBook, setPriceBook] = useState<PriceBook | null>(null);
  const [calcRules, setCalcRules] = useState<CalcRulesConfig | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setJobs(getJobs());
    setPriceBook(getPriceBook());
    setCalcRules(getCalcRules());
    setLoaded(true);
  }, []);

  const totals = useMemo(() => {
    if (!priceBook || !calcRules) return new Map<string, number>();
    const map = new Map<string, number>();
    for (const job of jobs) {
      try {
        const result = computeCalculation(job.draft, priceBook, calcRules);
        map.set(job.id, result.grandTotal);
      } catch {
        map.set(job.id, 0);
      }
    }
    return map;
  }, [jobs, priceBook, calcRules]);

  function handleCreate(input: NewJobInput) {
    const job = createJob({ name: input.name, customerName: input.name, salesRep: input.salesRep, address: input.address });
    setActiveJobId(job.id);
    router.push('/calculator');
  }

  function handleOpen(job: Job) {
    setActiveJobId(job.id);
    router.push('/calculator');
  }

  function handleDelete(job: Job) {
    if (!confirm(`Delete "${job.name}"? This cannot be undone.`)) return;
    deleteJob(job.id);
    setJobs(getJobs());
  }

  const sortedJobs = [...jobs].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Jobs</h1>
          <p className="text-sm text-gray-500">Siding Materials Calculator</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/pricing" className="btn btn-ghost">
            ⚙️ Settings
          </Link>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            + New Job
          </button>
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        {!loaded ? (
          <div className="p-8 text-center text-sm text-gray-500">Loading…</div>
        ) : sortedJobs.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-500">
            No jobs yet. Click <span className="font-semibold">+ New Job</span> to get started.
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Job Name</th>
                <th>Customer</th>
                <th>Sales Rep</th>
                <th>Last Updated</th>
                <th className="text-right">Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sortedJobs.map((job) => (
                <tr key={job.id}>
                  <td className="font-semibold">{job.name}</td>
                  <td>{job.customerName || '—'}</td>
                  <td>{job.salesRep || '—'}</td>
                  <td>{formatDate(job.updatedAt)}</td>
                  <td className="text-right font-semibold">{formatMoney(totals.get(job.id) ?? 0)}</td>
                  <td>
                    <div className="flex justify-end gap-2">
                      <button className="btn btn-secondary btn-sm" onClick={() => handleOpen(job)}>
                        Open
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(job)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && <JobModal onClose={() => setShowModal(false)} onCreate={handleCreate} />}
    </main>
  );
}
