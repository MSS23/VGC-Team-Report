/**
 * Client-side CSRF token helper.
 *
 * Reads the csrf_token cookie and provides it as a header
 * for all state-changing API requests.
 */

function getCsrfToken(): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]*)/);
  return match?.[1] ?? "";
}

/**
 * Enhanced fetch wrapper that auto-attaches CSRF token to
 * POST/PUT/DELETE/PATCH requests.
 */
export function secureFetch(url: string, init?: RequestInit): Promise<Response> {
  const method = (init?.method ?? "GET").toUpperCase();

  if (["POST", "PUT", "DELETE", "PATCH"].includes(method)) {
    const headers = new Headers(init?.headers);
    if (!headers.has("X-CSRF-Token")) {
      headers.set("X-CSRF-Token", getCsrfToken());
    }
    return fetch(url, { ...init, headers });
  }

  return fetch(url, init);
}
