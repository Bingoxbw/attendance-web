/** Public base path for client fetch / hard redirects. Empty in local root hosting. */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

export function withBase(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${BASE_PATH}${p}`;
}

/** Cookie path must match how the site is served. */
export const COOKIE_PATH = process.env.COOKIE_PATH || BASE_PATH || "/";
