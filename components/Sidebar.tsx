'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const TAB_ITEMS: { key: string; label: string }[] = [
  { key: 'measurements', label: 'Measurements' },
  { key: 'checklist', label: 'Checklist' },
  { key: 'quoteDetails', label: 'Quote Details' },
];

const PANEL_WIDTH = 236;
const TAB_WIDTH = 36;

export function Sidebar() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') ?? 'measurements';

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  function selectTab(tab: string) {
    router.push(`/calculator?tab=${tab}`);
    setOpen(false);
  }

  function goTo(path: string) {
    setOpen(false);
    router.push(path);
  }

  return (
    <>
      {open && (
        <div
          className="no-print fixed inset-0 z-30 bg-black/30"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}
      <div
        className="no-print fixed left-0 top-0 z-40 h-full transition-transform duration-200 ease-out"
        style={{ transform: `translateX(${open ? 0 : -PANEL_WIDTH}px)` }}
      >
        <div className="flex h-full">
          <nav
            style={{ width: PANEL_WIDTH }}
            className="flex h-full flex-col border-r border-gray-200 bg-white pt-6 shadow-xl"
          >
            <div className="px-4 pb-3 text-xs font-bold uppercase tracking-wide text-gray-400">
              Sections
            </div>
            <ul className="flex-1 space-y-1 px-2">
              {TAB_ITEMS.map((item) => (
                <li key={item.key}>
                  <button
                    className={`w-full rounded-md px-3 py-2 text-left text-sm font-semibold transition-colors ${
                      activeTab === item.key
                        ? 'bg-brand-50 text-brand-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                    onClick={() => selectTab(item.key)}
                  >
                    {item.label}
                  </button>
                </li>
              ))}
              <li className="my-2 border-t border-gray-100" />
              <li>
                <button
                  className="w-full rounded-md px-3 py-2 text-left text-sm font-semibold text-gray-600 hover:bg-gray-100"
                  onClick={() => goTo('/preview')}
                >
                  Proposal
                </button>
              </li>
              <li>
                <button
                  className="w-full rounded-md px-3 py-2 text-left text-sm font-semibold text-gray-600 hover:bg-gray-100"
                  onClick={() => goTo('/work-order')}
                >
                  Material &amp; Work Order
                </button>
              </li>
            </ul>
          </nav>
          <button
            aria-label="Toggle section navigation"
            style={{ width: TAB_WIDTH }}
            className="mt-6 flex h-24 flex-col items-center justify-center gap-1 self-start rounded-r-lg border border-l-0 border-gray-200 bg-white text-gray-500 shadow-md"
            onClick={() => setOpen((o) => !o)}
          >
            <span className="text-base leading-none">☰</span>
            <span className="text-[10px] font-bold tracking-wide [writing-mode:vertical-rl]">
              Menu
            </span>
          </button>
        </div>
      </div>
    </>
  );
}
