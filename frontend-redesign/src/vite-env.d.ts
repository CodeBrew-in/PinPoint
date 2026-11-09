/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Backend base URL including /api/v1, for example http://localhost:8000/api/v1. Unset = browser-only demo. */
  readonly VITE_API_URL?: string;
  /** "true" forces the browser-only demo even when VITE_API_URL is set. */
  readonly VITE_USE_MOCKS?: string;
}
