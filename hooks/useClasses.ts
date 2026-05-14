import { useCallback, useEffect } from 'react';
import { loadClasses, type ClassSort } from '../controllers/classController';
import { refreshClasses } from '../repositories/classRepository';
import { refreshStudents } from '../repositories/studentRepository';
import { useQuery, type StoreKey } from '../store/dataStore';
import type { ClassWithStats } from '../types/domain';

// The class list aggregates per-student counters, so it also depends on `students`.
const KEYS: StoreKey[] = ['classes', 'students'];

export const useClasses = (sort: ClassSort = 'alpha') => {
  const fetcher = useCallback(() => loadClasses(sort), [sort]);
  const { data, loading, refresh } = useQuery<ClassWithStats[]>(KEYS, fetcher);

  // Cache-first: the query above shows the local cache immediately; this pulls
  // the authoritative rows from Supabase in the background and invalidates.
  useEffect(() => {
    void refreshClasses();
    void refreshStudents();
  }, []);

  return { classes: data ?? [], loading, refresh };
};
