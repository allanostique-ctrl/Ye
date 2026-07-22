import { MeasurementFieldKey } from './types';

interface FieldPattern {
  key: MeasurementFieldKey;
  // Ordered by specificity — first alias that matches a line wins.
  aliases: RegExp[];
  // Tried only if none of the aliases matched anywhere in the document —
  // a bare keyword, paired with "the line also contains a number."
  loose: RegExp;
}

// HOVER "Complete Measurements" PDF wording varies by report version, so each field
// matches against several plausible label spellings, then falls back to a bare
// keyword if nothing more specific is found.
const FIELD_PATTERNS: FieldPattern[] = [
  {
    key: 'facadeAreaSqft',
    aliases: [
      /total\s+facade\s+area/i,
      /total\s+wall\s+area/i,
      /total\s+siding\s+area/i,
      /net\s+wall\s+area/i,
      /facade\s+area/i,
      /siding\s+area/i,
    ],
    loose: /facade|(?:wall|siding)\s*(?:area|sf|sq\.?\s*ft)/i,
  },
  {
    key: 'openingsPerimeterLnft',
    aliases: [
      /total\s+openings?\s+perimeter/i,
      /openings?\s+perimeter/i,
      /doors?\s*(?:&|and)\s*windows?\s+perimeter/i,
      /openings?\s+trim/i,
    ],
    loose: /opening/i,
  },
  {
    key: 'outsideCornerLengthLnft',
    aliases: [
      /outside\s+corners?\s+length/i,
      /total\s+outside\s+corners?/i,
      /outside\s+corners?/i,
      /ext(?:erior)?\.?\s+corners?/i,
    ],
    loose: /outside\s*corner/i,
  },
  {
    key: 'insideCornerLengthLnft',
    aliases: [
      /inside\s+corners?\s+length/i,
      /total\s+inside\s+corners?/i,
      /inside\s+corners?/i,
      /int(?:erior)?\.?\s+corners?/i,
    ],
    loose: /inside\s*corner/i,
  },
  {
    key: 'starterLengthLnft',
    aliases: [/starter\s+(?:strip\s+)?length/i, /total\s+starter/i, /starter\s+course/i],
    loose: /starter/i,
  },
  {
    key: 'fasciaLengthLnft',
    aliases: [/fascia\s+length/i, /total\s+fascia/i, /fascia\s+board/i],
    loose: /fascia/i,
  },
  {
    key: 'soffitAreaSqft',
    aliases: [/soffit\s+area/i, /total\s+soffit/i],
    loose: /soffit/i,
  },
  {
    key: 'gutterLengthLnft',
    aliases: [/gutter\s+length/i, /total\s+gutters?/i, /eave\s+length/i],
    loose: /gutter|eave/i,
  },
];

const NUMBER_TOKEN = /(-?[\d,]+(?:\.\d+)?)\s*(?:sq\s*\.?\s*ft\.?|sqft|sq\.?|sf|lin\.?\s*ft\.?|lnft|ln\.?\s*ft\.?|lf|ft\.?|'|")?/i;

function firstNumberIn(line: string, fromIndex = 0): number | null {
  const m = line.slice(fromIndex).match(NUMBER_TOKEN);
  if (!m) return null;
  const n = parseFloat(m[1].replace(/,/g, ''));
  return Number.isFinite(n) ? n : null;
}

export function extractMeasurementsFromText(fullText: string): Partial<Record<MeasurementFieldKey, number>> {
  const result: Partial<Record<MeasurementFieldKey, number>> = {};
  const lines = fullText.split('\n').map((l) => l.trim()).filter(Boolean);

  for (const field of FIELD_PATTERNS) {
    // Pass 1: specific aliases, matched line by line so the number we grab
    // is the one actually next to this label, not some unrelated one later.
    outer: for (const line of lines) {
      for (const alias of field.aliases) {
        const match = line.match(alias);
        if (match && match.index !== undefined) {
          const value = firstNumberIn(line, match.index + match[0].length) ?? firstNumberIn(line);
          if (value !== null) {
            result[field.key] = value;
            break outer;
          }
        }
      }
    }
  }

  for (const field of FIELD_PATTERNS) {
    if (result[field.key] !== undefined) continue;
    // Pass 2: nothing specific matched anywhere — fall back to a bare
    // keyword on a line that also contains a number.
    for (const line of lines) {
      if (field.loose.test(line)) {
        const idx = line.search(field.loose);
        const value = firstNumberIn(line, idx) ?? firstNumberIn(line);
        if (value !== null) {
          result[field.key] = value;
          break;
        }
      }
    }
  }

  return result;
}

interface PdfTextItem {
  str: string;
  transform: number[];
}

/**
 * pdfjs's getTextContent() returns text fragments in the order they're drawn,
 * which for a multi-column report often isn't reading order. Reconstruct
 * visual rows by grouping fragments with close y-coordinates, then sort each
 * row left-to-right — this is what makes "Label ... Value" line-based
 * matching reliable for a templated report like HOVER's.
 */
function reconstructLines(items: PdfTextItem[]): string {
  const Y_TOLERANCE = 3;
  const rows: { y: number; parts: { x: number; str: string }[] }[] = [];

  for (const it of items) {
    if (!it.str || !it.str.trim()) continue;
    const x = it.transform?.[4] ?? 0;
    const y = it.transform?.[5] ?? 0;
    let row = rows.find((r) => Math.abs(r.y - y) <= Y_TOLERANCE);
    if (!row) {
      row = { y, parts: [] };
      rows.push(row);
    }
    row.parts.push({ x, str: it.str });
  }

  rows.sort((a, b) => b.y - a.y); // PDF y grows upward; top of page first
  return rows.map((r) => r.parts.sort((a, b) => a.x - b.x).map((p) => p.str).join(' ')).join('\n');
}

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  // legacy build runs in Node without a DOM/worker/canvas.
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(buffer),
    useWorkerFetch: false,
    isEvalSupported: false,
    disableFontFace: true,
  });
  const doc = await loadingTask.promise;
  const pageTexts: string[] = [];
  for (let pageNum = 1; pageNum <= doc.numPages; pageNum += 1) {
    const page = await doc.getPage(pageNum);
    const content = await page.getTextContent();
    pageTexts.push(reconstructLines(content.items as PdfTextItem[]));
  }
  await doc.destroy();
  return pageTexts.join('\n');
}
