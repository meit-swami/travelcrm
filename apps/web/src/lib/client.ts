/**
 * Client-side helpers. All browser → API traffic goes through the Next app's
 * OWN origin (server-side route handlers / BFF proxy), so the browser never
 * needs a separate API URL or CORS. `BASE_PATH` makes this work when the app is
 * served under a sub-path (e.g. /travelcrm) — set NEXT_PUBLIC_BASE_PATH at build.
 */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

/** Fetch a same-origin app path (auto-prefixed with the base path). */
export function clientFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${BASE_PATH}${path}`, init);
}

/** Build a same-origin href (for <a>/download links) with the base path. */
export function appUrl(path: string): string {
  return `${BASE_PATH}${path}`;
}
