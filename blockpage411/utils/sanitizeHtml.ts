import DOMPurify from 'isomorphic-dompurify';

const DEFAULT_ALLOWED_TAGS = [
  'a',
  'b',
  'br',
  'code',
  'div',
  'em',
  'i',
  'li',
  'ol',
  'p',
  'pre',
  'span',
  'strong',
  'ul',
];

const DEFAULT_ALLOWED_ATTR = ['href', 'title', 'target', 'rel'];

export function sanitizeHtml(input: unknown): string {
  const html = typeof input === 'string' ? input : '';
  if (!html) return '';

  // DOMPurify will also remove event handlers like onclick and unsafe URLs.
  const sanitized = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: DEFAULT_ALLOWED_TAGS,
    ALLOWED_ATTR: DEFAULT_ALLOWED_ATTR,
    // Keep the output as HTML (not DOM nodes).
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
    // Ensure a plain string return value (avoid TrustedHTML typing/runtime).
    RETURN_TRUSTED_TYPE: false,
  } as any);

  if (typeof sanitized === 'string') return sanitized;
  try {
    // TrustedHTML implements toString() in browsers that support it.
    return String(sanitized);
  } catch {
    return '';
  }
}
