'use client';

import { useState } from 'react';
import { Category, LineItemPick, PriceBook } from '@/lib/types';
import { NumericInput } from '@/components/NumericInput';

export function LineItemPickList({
  category,
  picks,
  priceBook,
  onChange,
  defaultQty = 0,
}: {
  category: Category;
  picks: LineItemPick[];
  priceBook: PriceBook;
  onChange: (picks: LineItemPick[]) => void;
  defaultQty?: number;
}) {
  const items = priceBook.items.filter((i) => i.category === category && i.active);
  const [selected, setSelected] = useState<string>('');

  function addItem() {
    const productId = selected || items[0]?.id;
    if (!productId) return;
    if (picks.some((p) => p.productId === productId)) return;
    onChange([...picks, { id: crypto.randomUUID(), productId, qty: defaultQty }]);
    setSelected('');
  }

  function updateQty(id: string, qty: number) {
    onChange(picks.map((p) => (p.id === id ? { ...p, qty } : p)));
  }

  function remove(id: string) {
    onChange(picks.filter((p) => p.id !== id));
  }

  function itemName(productId: string | null): string {
    return items.find((i) => i.id === productId)?.name ?? priceBook.items.find((i) => i.id === productId)?.name ?? 'Unknown item';
  }

  function itemUnit(productId: string | null): string {
    return items.find((i) => i.id === productId)?.unit ?? priceBook.items.find((i) => i.id === productId)?.unit ?? '';
  }

  return (
    <div className="space-y-2">
      {picks.length > 0 && (
        <table className="data-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Qty</th>
              <th>Unit</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {picks.map((p) => (
              <tr key={p.id}>
                <td>{itemName(p.productId)}</td>
                <td>
                  <NumericInput className="field-input" style={{ width: 100 }} value={p.qty} onChange={(qty) => updateQty(p.id, qty)} />
                </td>
                <td>{itemUnit(p.productId)}</td>
                <td>
                  <button className="btn btn-danger btn-sm" onClick={() => remove(p.id)}>
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div className="flex items-center gap-2">
        <select className="field-input" style={{ maxWidth: 320 }} value={selected} onChange={(e) => setSelected(e.target.value)}>
          <option value="">Select an item to add…</option>
          {items
            .filter((i) => !picks.some((p) => p.productId === i.id))
            .map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
        </select>
        <button className="btn btn-secondary btn-sm" onClick={addItem} disabled={!selected}>
          + Add
        </button>
      </div>
    </div>
  );
}
