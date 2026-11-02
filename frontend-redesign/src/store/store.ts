import { useSyncExternalStore } from 'react';
import { seedState } from './seed';
import type { State } from './types';

// Bump the version when the seed data changes, so old browser data does not hide it.
const KEY = 'pinpoint.state.v3';

function load(): State {
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

/** Replace the state (always with a new object) and save it. Throws if the browser storage is full. */
export function commit(next: State) {
  const prev = state;
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    state = prev;
    throw new Error('Browser storage is full. Remove some photos and try again.');
  }
  listeners.forEach((l) => l());
}

export const useAppState = () => useSyncExternalStore(subscribe, getState);

export function resetDemoData() {
  commit(seedState());
}
