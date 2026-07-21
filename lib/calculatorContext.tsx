'use client';

import { createContext, useContext } from 'react';
import { useActiveJobDraft } from './hooks/useActiveJobDraft';

type CalculatorContextValue = ReturnType<typeof useActiveJobDraft>;

const CalculatorContext = createContext<CalculatorContextValue | null>(null);

export function CalculatorProvider({ children }: { children: React.ReactNode }) {
  const value = useActiveJobDraft();
  return <CalculatorContext.Provider value={value}>{children}</CalculatorContext.Provider>;
}

export function useCalculator(): CalculatorContextValue {
  const ctx = useContext(CalculatorContext);
  if (!ctx) throw new Error('useCalculator must be used within a CalculatorProvider');
  return ctx;
}
