import { MeasurementFieldKey } from './types';

interface FieldPattern {
  key: MeasurementFieldKey;
  // Ordered by specificity — first alias that matches in the document wins.
  aliases: RegExp[];
}

// HOVER "Complete Measurements" PDF wording varies by report version, so each field
// matches against several plausible label spellings and takes the first number that
// follows the label on the same line (or immediately after it in the text stream).
const FIELD_PATTERNS: FieldPattern[] = [
  {
    key: 'facadeAreaSqft',
    aliases: [
      /total\s+facade\s+area/i,
      /total\s+wall\s+area/i,
      /total\s+siding\s+area/i,
      /facade\s+area/i,
    ],
  },
  {
    key: 'openingsPerimeterLnft',
    aliases: [
      /total\s+openings?\s+perimeter/i,
      /openings?\s+perimeter/i,
      /doors?\s*(?:&|and)\s*windows?\s+perimeter/i,
    ],
  },
  {
    key: 'outsideCornerLengthLnft',
    aliases: [/outside\s+corners?\s+length/i, /total\s+outside\s+corners?/i, /outside\s+corners?/i],
  },
  {
    key: 'insideCornerLengthLnft',
    aliases: [/inside\s+corners?\s+length/i, /total\s+inside\s+corners?/i, /inside\s+corners?/i],
  },
  {
    key: 'starterLengthLnft',
    aliases: [/starter\s+(?:strip\s+)?length/i, /total\s+starter/i],
  },
  {
    key: 'fasciaLengthLnft',
    aliases: [/fascia\s+length/i, /total\s+fascia/i],
  },
  {
    key: 'soffitAreaSqft',
    aliases: [/soffit\s+area/i, /total\s+soffit/i],
  },
  {
    key: 'gutterLengthLnft',
    aliases: [/gutter\s+length/i, /total\s+gutters?/i, /eave\s+length/i],
  },
];

const NUMBER_NEAR_LABEL = /(-?[\d,]+(?:\.\d+)?)\s*(?:sq\s*\.?\s*ft|sqft|sf|ft|lf|ln\.?\s*ft)?/i;

function findNumberAfter(text: string, matchIndex: number, matchLength: number): number | null {
  const window = text.slice(matchIndex + matchLength, matchIndex + matchLength + 60);
  const m = window.match(NUMBER_NEAR_LABEL);
  if (!m) return null;
  const n = parseFloat(m[1].replace(/,/g, ''));
  return Number.isFinite(n) ? n : null;
}

export function extractMeasurementsFromText(fullText: string): Partial<Record<MeasurementFieldKey, number>> {
  const result: Partial<Record<MeasurementFieldKey, number>> = {};
  const normalized = fullText.replace(/\s+/g, ' ');

  for (const field of FIELD_PATTERNS) {
    for (const alias of field.aliases) {
      const match = normalized.match(alias);
      if (match && match.index !== undefined) {
        const value = findNumberAfter(normalized, match.index, match[0].length);
        if (value !== null) {
          result[field.key] = value;
          break;
        }
      }
    }
  }

  return result;
}

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  // legacy build runs in Node without a DOM/worker/canvas.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(buffer),
    useWorkerFetch: false,
    isEvalSupported: false,
    disableFontFace: true,
  });
  const doc = await loadingTask.promise;
  let text = '';
  for (let pageNum = 1; pageNum <= doc.numPages; pageNum += 1) {
    const page = await doc.getPage(pageNum);
    const content = await page.getTextContent();
    const pageText = content.items.map((it: any) => ('str' in it ? it.str : '')).join(' ');
    text += `${pageText}\n`;
  }
  await doc.destroy();
  return text;
}
