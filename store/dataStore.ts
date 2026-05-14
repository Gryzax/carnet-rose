import { useCallback, useEffect, useState } from 'react';

// Reactive layer over the SQLite models.
//
// Screens read data through `useQuery`; controllers call `invalidate(...keys)`
// after a write. Every mounted query that depends on an invalidated key
// refetches automatically, so data stays consistent across screens without
// manual refresh plumbing or refresh-on-focus hacks.
//
// Keys are coarse-grained on purpose — the dataset is small and correctness
// matters more than shaving the occasional extra SQLite read.

export type StoreKey = 'classes' | 'students' | 'events';

const revisions: Record<StoreKey, number> = { classes: 0, students: 0, events: 0 };
const listeners = new Set<() => void>();

/** Bump the given keys and wake every query that depends on them. */
export const invalidate = (...keys: StoreKey[]): void => {
  for (const key of keys) {
    if (key in revisions) revisions[key] += 1;
  }
  listeners.forEach((listener) => listener());
};

const revisionOf = (keys: StoreKey[]): string => keys.map((key) => revisions[key] || 0).join('|');

export interface UseQueryOptions {
  enabled?: boolean;
}

export interface UseQueryResult<T> {
  data: T | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

/**
 * Runs `fetcher` on mount, whenever `fetcher` changes (i.e. its inputs change),
 * and whenever one of `keys` is invalidated. Keeps the previous data while a
 * refetch is in flight to avoid UI flicker.
 */
export const useQuery = <T,>(
  keys: StoreKey[],
  fetcher: () => Promise<T>,
  { enabled = true }: UseQueryOptions = {}
): UseQueryResult<T> => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [revision, setRevision] = useState(() => revisionOf(keys));
  const keyId = keys.join(',');

  // Track invalidations for the keys this query depends on.
  useEffect(() => {
    const sync = () => setRevision(revisionOf(keys));
    listeners.add(sync);
    sync();
    return () => {
      listeners.delete(sync);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyId]);

  // Auto-fetch on mount, on input change, and on invalidation.
  useEffect(() => {
    if (!enabled) {
      setData(null);
      setLoading(false);
      return undefined;
    }
    let active = true;
    setLoading(true);
    fetcher()
      .then((result) => {
        if (active) setData(result);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [enabled, fetcher, revision]);

  // Imperative refetch, kept for the rare caller that needs it.
  const refresh = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    try {
      setData(await fetcher());
    } finally {
      setLoading(false);
    }
  }, [enabled, fetcher]);

  return { data, loading, refresh };
};
