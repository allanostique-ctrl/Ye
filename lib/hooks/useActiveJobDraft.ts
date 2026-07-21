'use client';

import { useCallback, useEffect, useState } from 'react';
import { CalculatorDraft, Job, PriceBook, CalcRulesConfig } from '../types';
import { getActiveJobId, getJob, saveJob, getPriceBook, getCalcRules } from '../storage';

export function useActiveJobDraft() {
  const [job, setJob] = useState<Job | null>(null);
  const [priceBook, setPriceBook] = useState<PriceBook | null>(null);
  const [calcRules, setCalcRules] = useState<CalcRulesConfig | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const id = getActiveJobId();
    if (id) {
      const j = getJob(id);
      if (j) setJob(j);
    }
    setPriceBook(getPriceBook());
    setCalcRules(getCalcRules());
    setReady(true);
  }, []);

  const updateDraft = useCallback((updater: (draft: CalculatorDraft) => CalculatorDraft) => {
    setJob((prev) => {
      if (!prev) return prev;
      const now = new Date().toISOString();
      const draft = { ...updater(prev.draft), updatedAt: now };
      const updated: Job = { ...prev, draft, updatedAt: now };
      saveJob(updated);
      return updated;
    });
  }, []);

  const updateJobMeta = useCallback(
    (patch: Partial<Pick<Job, 'name' | 'customerName' | 'salesRep' | 'address'>>) => {
      setJob((prev) => {
        if (!prev) return prev;
        const updated: Job = { ...prev, ...patch, updatedAt: new Date().toISOString() };
        saveJob(updated);
        return updated;
      });
    },
    []
  );

  const refreshPriceBook = useCallback(() => setPriceBook(getPriceBook()), []);
  const refreshCalcRules = useCallback(() => setCalcRules(getCalcRules()), []);

  return { job, priceBook, calcRules, ready, updateDraft, updateJobMeta, refreshPriceBook, refreshCalcRules };
}
