import { CalculatorDraft, PriceBook, WORK_SECTIONS } from '@/lib/types';

function productName(priceBook: PriceBook, id: string | null): string {
  return priceBook.items.find((i) => i.id === id)?.name ?? '—';
}

export function ScopeSummary({ draft, priceBook }: { draft: CalculatorDraft; priceBook: PriceBook }) {
  const qd = draft.quoteDetails;
  const includedSections = WORK_SECTIONS.filter((s) => draft.workSections[s.key]);
  const sidingLines = draft.sidingTypeRows.map(
    (r) => `${r.brand} ${r.style}${r.primed ? ' (Primed)' : ''} — ${r.areaSqft.toLocaleString()} sqft`
  );

  return (
    <div className="space-y-2 text-sm">
      <p>
        <span className="font-semibold">Scope of Work:</span> {includedSections.map((s) => s.label).join(', ')}
      </p>
      {sidingLines.length > 0 && (
        <p>
          <span className="font-semibold">Siding:</span> {sidingLines.join('; ')}
          {qd.colors.siding ? ` — Color: ${qd.colors.siding}` : ''}
        </p>
      )}
      {qd.colors.trim && (
        <p>
          <span className="font-semibold">Trim Color:</span> {qd.colors.trim}
        </p>
      )}
      {draft.workSections.soffit && (
        <p>
          <span className="font-semibold">Soffit:</span> {productName(priceBook, qd.soffit.productId)}
          {qd.colors.soffit ? ` — Color: ${qd.colors.soffit}` : ''}
          {qd.soffit.includeRemoval ? ' (includes removal of existing)' : ''}
        </p>
      )}
      {draft.workSections.fascia && (
        <p>
          <span className="font-semibold">Fascia:</span> {productName(priceBook, qd.fascia.productId)}
          {qd.colors.fascia ? ` — Color: ${qd.colors.fascia}` : ''}
          {qd.fascia.includeRemoval ? ' (includes removal of existing)' : ''}
        </p>
      )}
      {draft.workSections.gutters && (
        <p>
          <span className="font-semibold">Gutters:</span> {productName(priceBook, qd.gutters.productId)}
          {qd.colors.gutter ? ` — Color: ${qd.colors.gutter}` : ''}
          {qd.gutters.downspoutQty ? `, ${qd.gutters.downspoutQty} downspout(s)` : ''}
          {qd.gutters.includeGuards ? ', gutter guards' : ''}
          {qd.gutters.includeRemoval ? ' (includes removal of existing)' : ''}
        </p>
      )}
      {draft.workSections.demoRemoval && qd.demolitionMaterials.length > 0 && (
        <p>
          <span className="font-semibold">Demolition:</span>{' '}
          {qd.demolitionMaterials.map((p) => productName(priceBook, p.productId)).join(', ')}
        </p>
      )}
    </div>
  );
}
