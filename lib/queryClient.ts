import { QueryClient } from '@tanstack/react-query';

// TanStack Query configured for an offline-first app: the SQLite cache is the
// query source, and remote sync invalidates explicitly. We therefore disable
// all of TanStack's own background refetch triggers and treat data as fresh
// until something calls `invalidate(...)`.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,
      gcTime: Infinity,
      retry: false,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  },
});

// The three persisted entities. Query keys are prefixed with one of these so a
// single `invalidate('students')` reaches every student-derived query.
export type EntityKey = 'classes' | 'students' | 'events';

/** Centralised query-key factory — the single source of truth for cache keys. */
export const queryKeys = {
  classes: (sort: string) => ['classes', sort] as const,
  allStudents: () => ['students', 'all'] as const,
  studentsByClass: (classId: string, sort: string) => ['students', 'class', classId, sort] as const,
  student: (id: string) => ['students', 'detail', id] as const,
  history: (studentId: string, trimester: number) =>
    ['events', 'history', studentId, trimester] as const,
  statistics: (period: string, classId: string | null) => ['statistics', period, classId] as const,
};

/**
 * Bump every query that depends on the given entities. Replaces the old
 * `store/dataStore` reactive layer. The statistics dashboard derives from all
 * three entities, so any write also refreshes it.
 */
export const invalidate = (...keys: EntityKey[]): void => {
  for (const key of keys) {
    void queryClient.invalidateQueries({ queryKey: [key] });
  }
  void queryClient.invalidateQueries({ queryKey: ['statistics'] });
};
