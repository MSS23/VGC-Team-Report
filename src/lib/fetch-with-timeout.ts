/**
 * fetch() wrapped with an AbortController-based timeout.
 *
 * Replaces the hand-rolled `new AbortController()` + `setTimeout` + `finally`
 * boilerplate that was duplicated across API routes. The timer is always
 * cleared in a `finally`, so it never leaks whether the request succeeds,
 * fails, or times out.
 *
 * On timeout the underlying fetch rejects with an `AbortError` (a DOMException
 * with `name === "AbortError"`) — callers can detect this the same way they did
 * with their inline controllers.
 *
 * @param url        Request URL.
 * @param options    Standard fetch options. Any `signal` you pass is replaced
 *                   by the internal timeout signal.
 * @param timeoutMs  Timeout in milliseconds (default 10000).
 */
export async function fetchWithTimeout(
  url: string | URL | Request,
  options: RequestInit = {},
  timeoutMs = 10000,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}
