import { NextRequest, NextResponse } from 'next/server';
import { extractMeasurementsFromText, extractTextFromPdf } from '@/lib/pdfParse';

export const runtime = 'nodejs';

const MAX_BYTES = 30 * 1024 * 1024;

export async function POST(req: NextRequest) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Expected multipart/form-data with a "file" field.' }, { status: 400 });
  }

  const file = form.get('file');
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'File is too large (max 30MB).' }, { status: 413 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (buffer.subarray(0, 5).toString('latin1') !== '%PDF-') {
    return NextResponse.json({ error: 'That file does not look like a PDF.' }, { status: 400 });
  }

  try {
    const text = await extractTextFromPdf(buffer);
    const measurements = extractMeasurementsFromText(text);
    // Always include the raw extracted text — the Measurements tab surfaces it
    // when auto-fill comes up short so it's obvious what happened, and it can
    // be copied back for tuning the label-matching patterns.
    return NextResponse.json({ measurements, fileName: file.name, rawText: text });
  } catch (err) {
    return NextResponse.json(
      { error: `Could not parse PDF: ${err instanceof Error ? err.message : 'unknown error'}` },
      { status: 422 }
    );
  }
}
