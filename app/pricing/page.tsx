'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Category, PriceBook, CalcRulesConfig } from '@/lib/types';
import {
  getPriceBook,
  savePriceBook,
  resetPriceBookToDefaults,
  getCalcRules,
  saveCalcRules,
  resetCalcRulesToDefaults,
} from '@/lib/storage';
import { priceBookToCSV, csvToPriceBookItems, downloadTextFile } from '@/lib/csv';
import { PriceBookTable } from '@/components/PriceBookTable';
import { SyncedScrollGroup } from '@/components/SyncedScrollGroup';
import { CalcRulesEditor } from '@/components/CalcRulesEditor';

const OTHER_CATEGORIES: { key: Category; title: string }[] = [
  { key: 'siding-accessory', title: 'Siding Accessories' },
  { key: 'sheathing', title: 'Sheathing' },
  { key: 'soffit', title: 'Soffit' },
  { key: 'fascia', title: 'Fascia' },
  { key: 'gutters', title: 'Gutters' },
  { key: 'fixtures', title: 'Fixtures' },
  { key: 'demo-removal', title: 'Demo & Removal' },
  { key: 'furring-framing', title: 'Furring & Framing' },
  { key: 'aluminum-wraps', title: 'Aluminum Wraps' },
  { key: 'door-window-installs', title: 'Door & Window Installs' },
  { key: 'painting-coating', title: 'Painting / Coating' },
  { key: 'one-time-charges', title: 'One-Time Charges' },
];

export default function PricingPage() {
  const [priceBook, setPriceBook] = useState<PriceBook | null>(null);
  const [calcRules, setCalcRules] = useState<CalcRulesConfig | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPriceBook(getPriceBook());
    setCalcRules(getCalcRules());
  }, []);

  if (!priceBook || !calcRules) return null;

  function persist(pb: PriceBook) {
    setPriceBook(pb);
    savePriceBook(pb);
  }

  function updateCategoryItems(category: Category, items: PriceBook['items']) {
    const others = priceBook!.items.filter((i) => i.category !== category);
    persist({ ...priceBook!, items: [...others, ...items] });
  }

  function handleReset() {
    if (!confirm('Reset the entire price book to system defaults? Your custom items and edits will be lost.')) return;
    setPriceBook(resetPriceBookToDefaults());
  }

  function handleExport() {
    downloadTextFile('price-book.csv', priceBookToCSV(priceBook!.items));
  }

  function handleImportFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? '');
      const items = csvToPriceBookItems(text);
      if (!confirm(`Import ${items.length} items? This replaces your entire current price book.`)) return;
      persist({ ...priceBook!, items });
    };
    reader.readAsText(file);
  }

  function handleCalcRulesChange(next: CalcRulesConfig) {
    setCalcRules(next);
    saveCalcRules(next);
  }

  function handleResetCalcRules() {
    if (!confirm('Reset calculation rules to system defaults?')) return;
    setCalcRules(resetCalcRulesToDefaults());
  }

  return (
    <main className="mx-auto max-w-6xl px-6 pb-16 pt-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/" className="btn btn-ghost btn-sm mb-2">
            ← Back to Jobs
          </Link>
          <h1 className="text-2xl font-bold">Price Book &amp; Calculation Settings</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImportFile(file);
              e.target.value = '';
            }}
          />
          <button className="btn btn-secondary" onClick={() => fileInputRef.current?.click()}>
            Import CSV
          </button>
          <button className="btn btn-secondary" onClick={handleExport}>
            Export CSV
          </button>
          <button className="btn btn-danger" onClick={handleReset}>
            Reset to Defaults
          </button>
        </div>
      </div>

      <div className="space-y-6">
        <SyncedScrollGroup>
          <PriceBookTable
            title="Siding"
            category="siding"
            variant="siding"
            items={priceBook.items.filter((i) => i.category === 'siding')}
            onChange={(items) => updateCategoryItems('siding', items)}
          />
          {OTHER_CATEGORIES.map((cat) => (
            <PriceBookTable
              key={cat.key}
              title={cat.title}
              category={cat.key}
              items={priceBook.items.filter((i) => i.category === cat.key)}
              onChange={(items) => updateCategoryItems(cat.key, items)}
            />
          ))}
        </SyncedScrollGroup>

        <div className="flex items-center justify-between">
          <div />
          <button className="btn btn-secondary btn-sm" onClick={handleResetCalcRules}>
            Reset Calculation Rules to Defaults
          </button>
        </div>
        <CalcRulesEditor calcRules={calcRules} onChange={handleCalcRulesChange} />
      </div>

      {/* Spacer so the last card isn't hidden behind the fixed bottom scrollbar */}
      <div style={{ height: 24 }} />
    </main>
  );
}
