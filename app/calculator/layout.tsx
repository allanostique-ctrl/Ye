'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CalculatorProvider, useCalculator } from '@/lib/calculatorContext';
import { Sidebar } from '@/components/Sidebar';

function CalculatorShell({ children }: { children: React.ReactNode }) {
  const { job, ready } = useCalculator();
  const router = useRouter();

  if (ready && !job) {
    router.replace('/');
    return null;
  }

  return (
    <div className="min-h-screen">
      <Suspense fallback={null}>
        <Sidebar />
      </Suspense>
      <header className="no-print sticky top-0 z-20 flex items-center gap-4 border-b border-gray-200 bg-white/90 px-6 py-3 backdrop-blur">
        <Link href="/" className="btn btn-ghost btn-sm">
          ← Back to Jobs
        </Link>
        <div className="text-sm font-semibold text-gray-700">{job?.name}</div>
        <div className="ml-auto text-xs text-gray-400">Autosaving…</div>
      </header>
      <main className="mx-auto max-w-4xl px-6 py-8">{ready && job ? children : null}</main>
    </div>
  );
}

export default function CalculatorLayout({ children }: { children: React.ReactNode }) {
  return (
    <CalculatorProvider>
      <CalculatorShell>{children}</CalculatorShell>
    </CalculatorProvider>
  );
}
