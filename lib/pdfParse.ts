import { MeasurementFieldKey } from './types';

// ---------- Generic fallback matching (for report layouts that don't match
// the specific HOVER template handled below) ----------

interface FieldPattern {
  key: MeasurementFieldKey;
  aliases: RegExp[];
  loose: RegExp;
}

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
    aliases: [/starter\s+(?:strip\s+)?length/i, /total\s+starter/i, /starter\s+course/i, /level\s+starter/i],
    loose: /starter/i,
  },
  {
    key: 'fasciaLengthLnft',
    aliases: [/fascia\s+length/i, /total\s+fascia/i, /fascia\s+board/i, /eaves\s+fascia/i],
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

function firstPlainNumber(text: string, fromIndex = 0): number | null {
  const m = text.slice(fromIndex).match(/(-?[\d,]+(?:\.\d+)?)/);
  if (!m) return null;
  const n = parseFloat(m[1].replace(/,/g, ''));
  return Number.isFinite(n) ? n : null;
}

/**
 * HOVER writes lengths as feet'-inches" (e.g. 264' 4") or bare whole feet (59').
 * A trailing bare number is only treated as inches when it's immediately
 * followed by a closing inch-mark ("); an unquoted trailing number belongs to
 * a different table column (a count, a second Siding/Other value, etc.) and
 * is deliberately ignored by stopping the match right after the foot-mark.
 */
function firstLength(text: string, fromIndex = 0): number | null {
  const rest = text.slice(fromIndex);
  const m = rest.match(/(-?\d+)'(?:\s*(\d+)")?/);
  if (m) {
    const feet = parseInt(m[1], 10);
    const inches = m[2] ? parseInt(m[2], 10) : 0;
    return Math.round((feet + inches / 12) * 100) / 100;
  }
  return firstPlainNumber(rest);
}

function applyGenericFallback(result: Partial<Record<MeasurementFieldKey, number>>, fullText: string): void {
  const lines = fullText.split('\n').map((l) => l.trim()).filter(Boolean);

  for (const field of FIELD_PATTERNS) {
    if (result[field.key] !== undefined) continue;
    outer: for (const line of lines) {
      for (const alias of field.aliases) {
        const match = line.match(alias);
        if (match && match.index !== undefined) {
          const value = firstLength(line, match.index + match[0].length) ?? firstPlainNumber(line);
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
    for (const line of lines) {
      if (field.loose.test(line)) {
        const idx = line.search(field.loose);
        const value = firstLength(line, idx) ?? firstPlainNumber(line);
        if (value !== null) {
          result[field.key] = value;
          break;
        }
      }
    }
  }
}

// ---------- HOVER "Complete Measurements" template-specific extraction ----------

interface Section {
  title: string;
  lines: string[];
}

/** A standalone all-caps line with no digits reads as a section/page title in this report. */
const SECTION_HEADER_RE = /^[A-Z][A-Z /&*'-]{1,40}$/;

function splitIntoSections(fullText: string): Section[] {
  const lines = fullText.split('\n').map((l) => l.trim()).filter(Boolean);
  const sections: Section[] = [];
  let current: Section = { title: '', lines: [] };

  for (const line of lines) {
    if (SECTION_HEADER_RE.test(line) && !/\d/.test(line) && line === line.toUpperCase()) {
      sections.push(current);
      current = { title: line, lines: [] };
    } else {
      current.lines.push(line);
    }
  }
  sections.push(current);
  return sections;
}

function linesOfSection(sections: Section[], titleMatch: RegExp): string[] {
  return sections.filter((s) => titleMatch.test(s.title)).flatMap((s) => s.lines);
}

function extractHoverTemplate(fullText: string): Partial<Record<MeasurementFieldKey, number>> {
  const result: Partial<Record<MeasurementFieldKey, number>> = {};
  const sections = splitIntoSections(fullText);
  const summaryLines = linesOfSection(sections, /^summary$/i);
  const soffitLines = linesOfSection(sections, /^soffit$/i);
  const gutterLines = linesOfSection(sections, /^gutter system$/i);

  function matchInLines(lines: string[], pattern: RegExp, extractor: (line: string, afterIndex: number) => number | null) {
    for (const line of lines) {
      const m = line.match(pattern);
      if (m && m.index !== undefined) {
        const value = extractor(line, m.index + m[0].length);
        if (value !== null) return value;
      }
    }
    return null;
  }

  // "Facades  2002 ft²  89 ft²" — the Areas table on the Summary page.
  const facade = matchInLines(summaryLines, /^facades\b/i, firstPlainNumber);
  if (facade !== null) result.facadeAreaSqft = facade;

  // "Total Perimeter  325' 8"  15' 2"" — the Openings table on the Summary page.
  const perimeter = matchInLines(summaryLines, /total\s+perimeter/i, firstLength);
  if (perimeter !== null) result.openingsPerimeterLnft = perimeter;

  // "Outside Length  59'  11' 6"" / "Inside Length  50' 2"  -" — the Corners table.
  const outside = matchInLines(summaryLines, /outside\s+length/i, firstLength);
  if (outside !== null) result.outsideCornerLengthLnft = outside;

  const inside = matchInLines(summaryLines, /inside\s+length/i, firstLength);
  if (inside !== null) result.insideCornerLengthLnft = inside;

  // "Level Starter  264' 4"  9' 6"" — the Trim table.
  const starter = matchInLines(summaryLines, /level\s+starter/i, firstLength);
  if (starter !== null) result.starterLengthLnft = starter;

  // Fascia runs along both eaves and rakes — sum whichever of the two are present.
  const eavesFascia = matchInLines(summaryLines, /eaves\s+fascia/i, firstLength);
  const rakesFascia = matchInLines(summaryLines, /rakes\s+fascia/i, firstLength);
  if (eavesFascia !== null || rakesFascia !== null) {
    result.fasciaLengthLnft = Math.round(((eavesFascia ?? 0) + (rakesFascia ?? 0)) * 100) / 100;
  }

  // Dedicated Soffit Summary page: "Totals  302' 6"  796 ft²" — take the area (last), not the length.
  for (const line of soffitLines) {
    if (/^totals?\b/i.test(line)) {
      const m = line.match(/([\d,]+)\s*ft/i);
      if (m) {
        result.soffitAreaSqft = parseFloat(m[1].replace(/,/g, ''));
        break;
      }
    }
  }

  // Dedicated Gutter System page: "Total  128'  5" (the trailing 5 is a Sections count, not inches).
  for (const line of gutterLines) {
    if (/^total\b/i.test(line)) {
      const m = line.match(/^total\b/i);
      const value = m ? firstLength(line, m.index! + m[0].length) : null;
      if (value !== null) {
        result.gutterLengthLnft = value;
        break;
      }
    }
  }

  return result;
}

export function extractMeasurementsFromText(fullText: string): Partial<Record<MeasurementFieldKey, number>> {
  const result = extractHoverTemplate(fullText);
  applyGenericFallback(result, fullText);
  return result;
}

// ---------- PDF text extraction ----------

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
