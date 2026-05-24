/**
 * Tagged template helper for safe email HTML construction.
 *
 * All interpolated values are HTML-escaped by default. Use raw() to opt out
 * for trusted markup fragments (pre-escaped strings, numeric stat cards, etc.).
 *
 * Usage:
 *   const body = html`<h1>Hello, ${firstName}!</h1>${raw(trustedHtmlBlock)}`;
 */

class RawHtml {
  constructor(public readonly value: string) {}
}

/** Marks a string as pre-escaped / trusted so html`` won't double-escape it. */
export function raw(value: string | number): RawHtml {
  return new RawHtml(String(value));
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Tagged template literal that HTML-escapes every interpolated value unless
 * it is wrapped with raw(). Returns a plain string.
 */
export function html(strings: TemplateStringsArray, ...values: unknown[]): string {
  let result = "";
  for (let i = 0; i < strings.length; i++) {
    result += strings[i];
    if (i < values.length) {
      const v = values[i];
      if (v instanceof RawHtml) {
        result += v.value;
      } else if (v === null || v === undefined) {
        // omit
      } else {
        result += escapeHtml(String(v));
      }
    }
  }
  return result;
}
