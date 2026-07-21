'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCalculator } from '@/lib/calculatorContext';
import { MeasurementsTab } from '@/components/tabs/MeasurementsTab';
import { ChecklistTab } from '@/components/tabs/ChecklistTab';
import { QuoteDetailsTab } from '@/components/tabs/QuoteDetailsTab';

function CalculatorPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tab = searchParams.get('tab') ?? 'measurements';
  const { job, priceBook, calcRules, updateDraft } = useCalculator();

  if (!job || !priceBook || !calcRules) return null;

  function goNext(nextTab: string) {
    router.push(`/calculator?tab=${nextTab}`);
  }

  if (tab === 'checklist') {
    return (
      <ChecklistTab
        draft={job.draft}
        updateDraft={updateDraft}
        priceBook={priceBook}
        onNext={() => goNext('quoteDetails')}
      />
    );
  }

  if (tab === 'quoteDetails') {
    return (
      <QuoteDetailsTab
        draft={job.draft}
        updateDraft={updateDraft}
        priceBook={priceBook}
        calcRules={calcRules}
        onNext={() => router.push('/preview')}
      />
    );
  }

  return <MeasurementsTab draft={job.draft} updateDraft={updateDraft} onNext={() => goNext('checklist')} />;
}

export default function CalculatorPage() {
  return (
    <Suspense fallback={null}>
      <CalculatorPageInner />
    </Suspense>
  );
}
