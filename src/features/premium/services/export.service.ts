import { sanitizeHtml, escapeHtml } from '@/utils';

/**
 * Client-side export.
 *
 * This used to POST to `/export` on the external API, which returns 404 — that
 * service only exposes `/api/health`. Everything here runs in the browser, so
 * export works without a backend at all.
 *
 * EPUB is deliberately absent: it is a ZIP container with a required manifest,
 * which needs a zip dependency to produce a file that readers will actually
 * open. A broken .epub would be worse than not offering it.
 */
export type ExportFormat = 'pdf' | 'doc' | 'txt';

export const EXPORT_FORMATS: { value: ExportFormat; label: string }[] = [
  { value: 'pdf', label: 'PDF (via print)' },
  { value: 'doc', label: 'Word (.doc)' },
  { value: 'txt', label: 'Plain text (.txt)' },
];

const documentHtml = (title: string, bodyHtml: string) => `
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(title)}</title>
    <style>
      body { font-family: Georgia, serif; line-height: 1.6; margin: 2.5cm; color: #111; }
      h1 { font-size: 20pt; margin-bottom: 1.5em; }
      h2, h3, h4 { font-size: 14pt; margin-top: 2em; }
    </style>
  </head>
  <body>
    <h1>${escapeHtml(title)}</h1>
    ${sanitizeHtml(bodyHtml)}
  </body>
</html>`;

const slug = (title: string) =>
  (title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'untitled');

const download = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Revoked on the next tick so the download has taken hold of the URL first.
  setTimeout(() => URL.revokeObjectURL(url), 0);
};

/** Strips markup to readable text, collapsing block boundaries into newlines. */
const htmlToText = (html: string): string => {
  const el = document.createElement('div');
  el.innerHTML = sanitizeHtml(html);
  el.querySelectorAll('br').forEach(br => br.replaceWith('\n'));
  el.querySelectorAll('p, div, li, h2, h3, h4').forEach(block => block.append('\n'));
  return (el.textContent ?? '').replace(/\n{3,}/g, '\n\n').trim();
};

/**
 * Renders the document in a hidden iframe and opens the print dialog, where the
 * user can choose "Save as PDF". Uses an iframe rather than `window.open` so it
 * isn't swallowed by a popup blocker.
 */
const printAsPdf = (title: string, bodyHtml: string) =>
  new Promise<void>(resolve => {
    const frame = document.createElement('iframe');
    frame.setAttribute('aria-hidden', 'true');
    frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
    document.body.appendChild(frame);

    const cleanup = () => { frame.remove(); resolve(); };

    frame.onload = () => {
      const win = frame.contentWindow;
      if (!win) return cleanup();
      win.focus();
      win.print();
      // The print dialog is modal and gives no reliable completion event, so the
      // frame is torn down shortly after it is dismissed.
      win.addEventListener('afterprint', cleanup, { once: true });
      setTimeout(cleanup, 60_000);
    };

    const doc = frame.contentDocument;
    if (!doc) return cleanup();
    doc.open();
    doc.write(documentHtml(title, bodyHtml));
    doc.close();
  });

export const exportWork = async (
  title: string, bodyHtml: string, format: ExportFormat,
): Promise<void> => {
  const name = slug(title);

  if (format === 'pdf') return printAsPdf(title, bodyHtml);

  if (format === 'doc') {
    return download(
      new Blob([documentHtml(title, bodyHtml)], { type: 'application/msword' }),
      `${name}.doc`,
    );
  }

  return download(
    new Blob([`${title}\n\n${htmlToText(bodyHtml)}`], { type: 'text/plain;charset=utf-8' }),
    `${name}.txt`,
  );
};
