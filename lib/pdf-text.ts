import { MAX_IMPORT_TEXT } from './configuration-import';
import workerUrl from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url';

export const MAX_PDF_BYTES = 12 * 1024 * 1024;
export const MAX_PDF_PAGES = 20;
export type PdfImportText = { text: string; pages: number; emptyPages: number };

// Only text is read. The original file never leaves the user's browser.
export async function extractPdfText(file: File, onProgress?: (page: number, total: number) => void, signal?: AbortSignal): Promise<PdfImportText> {
  if (!/\.pdf$/i.test(file.name) && file.type !== 'application/pdf') throw new Error('Choose a PDF file, or paste the order text.');
  if (file.size > MAX_PDF_BYTES) throw new Error('Choose a PDF under 12 MB. Export only the configuration or receipt pages.');
  const data = new Uint8Array(await file.arrayBuffer());
  if (signal?.aborted) throw new Error('Import canceled.');
  if (!new TextDecoder().decode(data.subarray(0, 1024)).includes('%PDF-')) throw new Error('This file is not a readable PDF. Export a fresh PDF or paste its text.');
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
  const task = pdfjs.getDocument({ data, useSystemFonts: false, disableFontFace: true });
  const cancel = () => { void task.destroy(); };
  signal?.addEventListener('abort', cancel, { once: true });
  if (signal?.aborted) cancel();
  const timeout = setTimeout(cancel, 45_000);
  try {
    const pdf = await task.promise;
    if (pdf.numPages > MAX_PDF_PAGES) throw new Error('Choose a PDF with 20 pages or fewer. Import just the configuration or order-summary pages.');
    const pages: string[] = [];
    let emptyPages = 0;
    for (let n = 1; n <= pdf.numPages; n++) {
      if (signal?.aborted) throw new Error('Import canceled.');
      onProgress?.(n, pdf.numPages);
      const page = await pdf.getPage(n);
      const content = await page.getTextContent();
      let text = '', previousY: number | undefined;
      for (const item of content.items) {
        if (!('str' in item)) continue;
        const y = item.transform[5];
        if (previousY !== undefined && Math.abs(y - previousY) > 3 && !text.endsWith('\n')) text += '\n';
        text += item.str + (item.hasEOL ? '\n' : ' ');
        previousY = y;
      }
      if (text.trim().length < 8) emptyPages++;
      pages.push(text);
      page.cleanup();
      if (pages.reduce((total, value) => total + value.length, 0) > MAX_IMPORT_TEXT) throw new Error('This PDF has too much text. Import the summary pages only.');
    }
    const text = pages.join('\n\n');
    if (text.trim().length < 8) throw new Error('This PDF has no selectable text. For a scan or screenshot, copy its text with Live Text/OCR and paste it here, or use a PDF saved directly from the order page.');
    return { text, pages: pdf.numPages, emptyPages };
  } catch (error) {
    const name = (error as Error).name;
    if (signal?.aborted) throw new Error('Import canceled.');
    if (name === 'PasswordException') throw new Error('This PDF is password protected. Export an unlocked copy, or paste the order text.');
    if (name === 'InvalidPDFException') throw new Error('The PDF could not be read. Export a fresh copy or paste the order text.');
    if (/worker|destroy|abort/i.test((error as Error).message)) throw new Error('The PDF reader could not finish. Try a smaller PDF or paste the order text.');
    throw error;
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', cancel);
    await task.destroy();
  }
}
