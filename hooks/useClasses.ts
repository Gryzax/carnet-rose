import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { loadClasses, type ClassSort } from '../domain/classController';
import { refreshClasses } from '../repositories/classRepository';
import { refreshStudents } from '../repositories/studentRepository';
import { queryKeys } from '../lib/queryClient';

export const useClasses = (sort: ClassSort = 'alpha') => {
  // The query reads the local SQLite cache. The class list aggregates
  // per-student counters, so student writes invalidate `classes` too (see the
  // student repository) — TanStack matches that against the `classes` prefix.
  const { data, isLoading, refetch } = useQuery({
    queryKey: queryKeys.classes(sort),
    queryFn: () => loadClasses(sort),
  });

  // Cache-first: the query above shows the local cache immediately; this pulls
  // the authoritative rows from Supabase in the background and invalidates.
  useEffect(() => {
    void refreshClasses();
    void refreshStudents();
  }, []);

  return { classes: data ?? [], loading: isLoading, refresh: refetch };
};
