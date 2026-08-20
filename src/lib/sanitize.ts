/**
 * Minimal HTML sanitizer — strips dangerous tags and event handlers.
 * Used before passing HTML to dangerouslySetInnerHTML.
 * For a production store, consider DOMPurify (already in node_modules).
 */

const DANGEROUS_TAGS = /<\s*\/?\s*(script|iframe|object|embed|form|input|textarea|button|link|meta|base|applet)\b[^>]*>/gi;
const EVENT_HANDLERS = /\s*on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi;
const JAVASCRIPT_URLS = /href\s*=\s*(?:"javascript:|'javascript:)/gi;
const DATA_URLS = /src\s*=\s*(?:"data:text\/|'data:text\/)/gi;

export function sanitizeHtml(html: string): string {
  return html
    .replace(DANGEROUS_TAGS, '')
    .replace(EVENT_HANDLERS, '')
    .replace(JAVASCRIPT_URLS, ' href=""')
    .replace(DATA_URLS, ' src=""');
}
