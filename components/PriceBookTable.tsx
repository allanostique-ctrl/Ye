'use client';

import { Fragment } from 'react';
import { PriceBookItem, Category, Unit } from '@/lib/types';
import { BRANDS, STYLES, Brand, Style, brandSupportsPrimed } from '@/lib/brands';

const UNITS: Unit[] = ['sqft', 'lnft', 'each'];

const COL_WIDTHS = {
  brand: 130,
  style: 150,
  primed: 90,
  name: 240,
  unit: 80,
  coverage: 120,
  waste: 80,
  material: 110,
  labor: 100,
  active: 70,
  actions: 90,
};

function colgroup(showBrand: boolean, showStyle: boolean) {
  return (
    <colgroup>
      {showBrand && <col style={{ width: COL_WIDTHS.brand }} />}
      {showStyle && <col style={{ width: COL_WIDTHS.style }} />}
      {showStyle && <col style={{ width: COL_WIDTHS.primed }} />}
      <col style={{ width: COL_WIDTHS.name }} />
      <col style={{ width: COL_WIDTHS.unit }} />
      <col style={{ width: COL_WIDTHS.coverage }} />
      <col style={{ width: COL_WIDTHS.waste }} />
      <col style={{ width: COL_WIDTHS.material }} />
      <col style={{ width: COL_WIDTHS.labor }} />
      <col style={{ width: COL_WIDTHS.active }} />
      <col style={{ width: COL_WIDTHS.actions }} />
    </colgroup>
  );
}

function emptyItem(category: Category, brand: string): PriceBookItem {
  return {
    id: crypto.randomUUID(),
    category,
    brand: brand as any,
    style: '',
    primed: false,
    name: 'New Item',
    unit: 'each',
    coveragePerUnit: 1,
    wastePct: 0,
    materialPrice: 0,
    laborRate: 0,
    isDefault: false,
    active: true,
  };
}

function Row({
  item,
  variant,
  onChange,
  onDelete,
}: {
  item: PriceBookItem;
  variant: 'siding' | 'generic';
  onChange: (patch: Partial<PriceBookItem>) => void;
  onDelete: () => void;
}) {
  const showStyle = variant === 'siding';
  return (
    <tr>
      <td>
        {variant === 'siding' ? (
          <select className="field-input" value={item.brand} onChange={(e) => onChange({ brand: e.target.value as Brand })}>
            {BRANDS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        ) : (
          <input className="field-input" value={item.brand} onChange={(e) => onChange({ brand: e.target.value as any })} />
        )}
      </td>
      {showStyle && (
        <>
          <td>
            <select className="field-input" value={item.style} onChange={(e) => onChange({ style: e.target.value as Style })}>
              {STYLES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </td>
          <td>
            <select
              className="field-input"
              value={item.primed ? 'primed' : 'unprimed'}
              disabled={!brandSupportsPrimed(item.brand as Brand)}
              onChange={(e) => onChange({ primed: e.target.value === 'primed' })}
            >
              <option value="unprimed">No</option>
              <option value="primed">Primed</option>
            </select>
          </td>
        </>
      )}
      <td>
        <input className="field-input" value={item.name} onChange={(e) => onChange({ name: e.target.value })} />
      </td>
      <td>
        <select className="field-input" value={item.unit} onChange={(e) => onChange({ unit: e.target.value as Unit })}>
          {UNITS.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
      </td>
      <td>
        <input
          type="number"
          step="any"
          className="field-input"
          value={item.coveragePerUnit}
          onChange={(e) => onChange({ coveragePerUnit: parseFloat(e.target.value) || 0 })}
        />
      </td>
      <td>
        <input
          type="number"
          step="any"
          className="field-input"
          value={item.wastePct}
          onChange={(e) => onChange({ wastePct: parseFloat(e.target.value) || 0 })}
        />
      </td>
      <td>
        <input
          type="number"
          step="any"
          className="field-input"
          value={item.materialPrice}
          onChange={(e) => onChange({ materialPrice: parseFloat(e.target.value) || 0 })}
        />
      </td>
      <td>
        <input
          type="number"
          step="any"
          className="field-input"
          value={item.laborRate}
          onChange={(e) => onChange({ laborRate: parseFloat(e.target.value) || 0 })}
        />
      </td>
      <td className="text-center">
        <input type="checkbox" checked={item.active} onChange={(e) => onChange({ active: e.target.checked })} />
      </td>
      <td>
        <button className="btn btn-danger btn-sm" onClick={onDelete}>
          Delete
        </button>
      </td>
    </tr>
  );
}

export function PriceBookTable({
  title,
  category,
  items,
  onChange,
  variant = 'generic',
  newItemBrand = 'Universal',
}: {
  title: string;
  category: Category;
  items: PriceBookItem[];
  onChange: (items: PriceBookItem[]) => void;
  variant?: 'siding' | 'generic';
  newItemBrand?: string;
}) {
  const showStyle = variant === 'siding';

  function updateItem(id: string, patch: Partial<PriceBookItem>) {
    onChange(items.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }

  function deleteItem(id: string) {
    onChange(items.filter((i) => i.id !== id));
  }

  function addItem() {
    onChange([...items, emptyItem(category, variant === 'siding' ? BRANDS[0] : newItemBrand)]);
  }

  const grouped =
    variant === 'siding'
      ? BRANDS.map((brand) => ({ brand, rows: items.filter((i) => i.brand === brand) }))
      : [{ brand: null, rows: items }];

  return (
    <div className="card">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold">{title}</h2>
        <button className="btn btn-secondary btn-sm" onClick={addItem}>
          + Add Item
        </button>
      </div>
      <table className="data-table" style={{ tableLayout: 'fixed', minWidth: 900 }}>
        {colgroup(true, showStyle)}
        <thead>
          <tr>
            <th>Brand</th>
            {showStyle && (
              <>
                <th>Style</th>
                <th>Primed</th>
              </>
            )}
            <th>Name</th>
            <th>Unit</th>
            <th>Coverage/Unit</th>
            <th>Waste %</th>
            <th>Material $</th>
            <th>Labor $</th>
            <th>Active</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {grouped.map((group) => (
            <Fragment key={group.brand ?? 'all'}>
              {variant === 'siding' && (
                <tr className="section-header">
                  <td colSpan={11}>{group.brand}</td>
                </tr>
              )}
              {group.rows.map((item) => (
                <Row
                  key={item.id}
                  item={item}
                  variant={variant}
                  onChange={(patch) => updateItem(item.id, patch)}
                  onDelete={() => deleteItem(item.id)}
                />
              ))}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
