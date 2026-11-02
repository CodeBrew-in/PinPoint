/**
 * Talking to the backend (docs/api-contract.md).
 *
 * API mode is on when VITE_API_URL is set at build or start time (and VITE_USE_MOCKS is not "true").
 * Otherwise the app runs fully in the browser with demo data, as before.
 */

const rawUrl = import.meta.env.VITE_API_URL as string | undefined;

export const API_URL = rawUrl ? rawUrl.replace(/\/+$/, '') : '';
export const USE_API = Boolean(API_URL) && import.meta.env.VITE_USE_MOCKS !== 'true';

/** Where uploaded photos live: the API host without the /api/v1 part. */
const API_ORIGIN = API_URL ? new URL(API_URL).origin : '';

/** Same key the other frontend uses, so both read the same login if they share an origin. */
const TOKEN_KEY = 'token';

export const getToken = (): string | null => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};
export const setToken = (token: string) => {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* storage blocked: the login lasts until the page is closed */
  }
};
export const clearToken = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* nothing to clear */
  }
};

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/** One readable sentence from FastAPI's error shapes (a string, or a list of field errors). */
function messageFrom(detail: unknown, fallback: string): string {
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail) && detail.length > 0) {
    const texts = detail
      .map((d: { msg?: string; loc?: unknown[] }) => {
        const field = Array.isArray(d.loc) ? String(d.loc[d.loc.length - 1]) : '';
        return d.msg ? (field && field !== 'body' ? `${field}: ${d.msg}` : d.msg) : '';
      })
      .filter(Boolean);
    if (texts.length) return texts.join('. ');
  }
  return fallback;
}

type Options = { method?: string; json?: unknown; form?: FormData };

export async function request<T>(path: string, options: Options = {}): Promise<T> {
  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (options.json !== undefined) headers['Content-Type'] = 'application/json';

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method: options.method ?? (options.json !== undefined || options.form ? 'POST' : 'GET'),
      headers,
      body: options.json !== undefined ? JSON.stringify(options.json) : options.form,
    });
  } catch {
    throw new ApiError('Cannot reach the server. Check that the backend is running.', 0);
  }

  if (!response.ok) {
    let detail: unknown;
    try {
      detail = (await response.json()).detail;
    } catch {
      /* not JSON */
    }
    throw new ApiError(messageFrom(detail, `The server answered with an error (${response.status}).`), response.status);
  }
  return (await response.json()) as T;
}

/** Photo urls from the API are relative (/media/photos/7.jpg) or absolute (S3 later). */
export const mediaUrl = (path: string) => (/^https?:\/\//.test(path) ? path : `${API_ORIGIN}${path}`);
