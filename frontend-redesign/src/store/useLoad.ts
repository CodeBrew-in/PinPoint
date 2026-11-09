import { useEffect, useState } from 'react';
import { USE_API } from '../lib/http';

type Loading<T> = { status: 'loading' | 'ready' | 'error'; result: T | undefined; error: string };

/**
 * Runs a loader (a function from remote.ts) when a page opens and reports where it is.
 * In demo mode there is nothing to load, so it is "ready" at once.
 *
 * `haveData` says the page already has something to show (from an earlier visit), so it can show that
 * while the fresh copy loads instead of flashing a loading message.
 */
export function useLoad<T>(load: () => Promise<T>, deps: unknown[], haveData = false): Loading<T> {
  const [state, setState] = useState<Loading<T>>({ status: USE_API ? 'loading' : 'ready', result: undefined, error: '' });

  useEffect(() => {
    if (!USE_API) return;
    let cancelled = false;
    setState((s) => ({ ...s, status: 'loading', error: '' }));
    load()
      .then((result) => !cancelled && setState({ status: 'ready', result, error: '' }))
      .catch((e) => !cancelled && setState({ status: 'error', result: undefined, error: e instanceof Error ? e.message : 'Could not load.' }));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return haveData && state.status === 'loading' ? { ...state, status: 'ready' } : state;
}
