import axios from 'axios';

export const TOKEN_KEY = 'token';

// Single axios instance so every request uses the same backend URL and auth token.
// VITE_API_URL includes the /api/v1 prefix (see docs/api-contract.md).
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Turns any API error into one readable message, including 422 field errors
export function getErrorMessage(err: unknown, fallback: string): string {
  if (!axios.isAxiosError(err)) return fallback;
  if (!err.response) return 'Cannot reach the server. Check that the backend is running.';

  const detail = err.response.data?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail) && detail.length > 0) {
    return detail.map((d: { msg?: string }) => d.msg).filter(Boolean).join('. ');
  }
  return fallback;
}

export default api;
