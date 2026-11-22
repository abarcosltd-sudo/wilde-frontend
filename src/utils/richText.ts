import DOMPurify from 'dompurify';

const ALLOWED_TAGS = [
  'b', 'strong', 'i', 'em', 'u', 's', 'strike', 'ul', 'ol', 'li', 'br', 'div', 'p', 'span',
  // Chapter headings, emitted by the reader when it stitches a long work together.
  'h2', 'h3', 'h4',
];

export const sanitizeHtml = (html: string) =>
  DOMPurify.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR: ['style'] });

/**
 * Escapes plain text for interpolation into an HTML string.
 *
 * Sanitising afterwards would strip any injected markup anyway, but escaping at
 * the point of interpolation means a chapter titled `A <b>Bold</b> Move` renders
 * as written instead of silently turning bold.
 */
export const escapeHtml = (text: string) =>
  text.replace(/[&<>"']/g, ch => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch] as string
  ));

export const truncateHtml = (html: string, maxChars: number): string => {
  const container = document.createElement('div');
  container.innerHTML = sanitizeHtml(html);
  let remaining = maxChars;

  // Visits every node in document order so nodes past the character budget
  // are always removed, not just left dangling when a sibling loop stops early.
  const walk = (node: ChildNode) => {
    if (remaining <= 0) { node.remove(); return; }
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent ?? '';
      if (text.length > remaining) {
        node.textContent = text.slice(0, remaining) + '…';
        remaining = 0;
      } else {
        remaining -= text.length;
      }
      return;
    }
    for (const child of Array.from(node.childNodes)) walk(child);
  };

  for (const child of Array.from(container.childNodes)) walk(child);
  return container.innerHTML;
};

/**
 * The readable text of a stored work, for previews.
 *
 * Rich-text types are stored as HTML and the rest as plain text with real line
 * breaks, so this accepts either: block ends become a space, tags are dropped,
 * and newlines in plain text survive (a poem preview should keep its lines).
 * Parsed with `DOMParser`, which builds an inert document — nothing in it runs.
 */
export const toPlainText = (html: string): string => {
  const doc = new DOMParser().parseFromString(
    html.replace(/<\/(p|div|li|h[2-4])>|<br\s*\/?>/gi, ' '), 'text/html');
  return (doc.body.textContent ?? '')
    .replace(/[ \t]+/g, ' ')
    .replace(/ ?\n ?/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};
