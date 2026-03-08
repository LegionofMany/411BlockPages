let cachedDomPurify: any | null | undefined;

function getDomPurify(): any | null {
  if (cachedDomPurify !== undefined) return cachedDomPurify;

  // On the server (including during `next build` static generation), avoid
  // loading DOMPurify/JSDOM. The UI that uses this helper mostly sanitizes
  // content fetched client-side, so a server fallback is sufficient and keeps
  // builds fast and deterministic.
  if (typeof window === 'undefined') {
    cachedDomPurify = null;
    return cachedDomPurify;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('isomorphic-dompurify');
    cachedDomPurify = (mod && (mod.default || mod)) || null;
  } catch {
    cachedDomPurify = null;
  }
  return cachedDomPurify;
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

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

  const DOMPurify = getDomPurify();
  if (!DOMPurify) {
    // Server/build fallback: do not allow raw HTML through.
    return escapeHtml(html);
  }

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
