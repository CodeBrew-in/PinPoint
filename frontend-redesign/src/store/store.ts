import { useSyncExternalStore } from 'react';
import { USE_API } from '../lib/http';
import { seedState } from './seed';
import type { State } from './types';

// Bump the version when the seed data changes, so old browser data does not hide it.
const KEY = 'pinpoint.state.v3';

/** API mode starts empty: everything in here is a cache of what the server returned. */
const emptyState = (): State => ({ users: [], maps: [], reports: [], sessionUserId: null });

function load(): State {
  if (USE_API) return emptyState();
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw) as State;
      if (s && Array.isArray(s.users) && Array.isArray(s.maps) && Array.isArray(s.reports)) return s;
    }
  } catch {
    /* storage unavailable or corrupt: start from the seed */
  }
  return seedState();
}

let state: State = load();
const listeners = new Set<() => void>();

export const getState = () => state;

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

/**
 * Replace the state (always with a new object). In demo mode it is also saved, and this throws if the
 * browser storage is full. In API mode the server is the source of truth, so nothing is saved here.
 */
export function commit(next: State) {
  const prev = state;
  state = next;
  if (!USE_API) {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      state = prev;
      throw new Error('Browser storage is full. Remove some photos and try again.');
    }
  }
  listeners.forEach((l) => l());
}

export const useAppState = () => useSyncExternalStore(subscribe, getState);

export function resetDemoData() {
  commit(seedState());
}

/* ---------- has the login been checked yet? ---------- */

// In demo mode there is nothing to check. In API mode the saved token is verified with the server first,
// so a protected page does not bounce a signed-in person to the sign-in page while that is happening.
let authReady = !USE_API;
const authListeners = new Set<() => void>();

export function setAuthReady(ready: boolean) {
  authReady = ready;
  authListeners.forEach((l) => l());
}

export const useAuthReady = () =>
  useSyncExternalStore(
    (l) => {
      authListeners.add(l);
      return () => authListeners.delete(l);
    },
    () => authReady,
  );
