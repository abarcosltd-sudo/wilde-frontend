import DOMPurify from 'dompurify';

const ALLOWED_TAGS = ['b', 'strong', 'i', 'em', 'u', 's', 'strike', 'ul', 'ol', 'li', 'br', 'div', 'p', 'span'];

export const sanitizeHtml = (html: string) =>
  DOMPurify.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR: ['style'] });

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
