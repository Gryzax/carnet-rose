import { useCallback, useEffect } from 'react';
import { getAllStudents, getStudentById, getStudentsByClass } from '../models/studentModel';
import { refreshClasses } from '../repositories/classRepository';
import { refreshStudents } from '../repositories/studentRepository';
import { useQuery, type StoreKey } from '../store/dataStore';
import type { StudentRow, StudentWithClass } from '../types/domain';

const KEYS: StoreKey[] = ['students'];

export type StudentSort = 'name' | 'crosses' | 'ticks';

export const useStudents = (classId: string | null | undefined, sort: StudentSort = 'name') => {
  const fetcher = useCallback(async () => {
    const data = await getStudentsByClass(classId as string);
    return [...data].sort((a, b) => {
      if (sort === 'crosses') return b.crosses - a.crosses;
      if (sort === 'ticks') return b.ticks - a.ticks;
      return a.lastName.localeCompare(b.lastName);
    });
  }, [classId, sort]);
  const { data, loading, refresh } = useQuery<StudentRow[]>(KEYS, fetcher, {
    enabled: classId != null
  });

  useEffect(() => {
    void refreshStudents();
  }, []);

  return { students: data ?? [], loading, refresh };
};

export const useAllStudents = () => {
  const fetcher = useCallback(() => getAllStudents(), []);
  const { data, loading, refresh } = useQuery<StudentWithClass[]>(KEYS, fetcher);

  useEffect(() => {
    // `getAllStudents` joins in class names, so refresh both entities.
    void refreshClasses();
    void refreshStudents();
  }, []);

  return { students: data ?? [], loading, refresh };
};

export const useStudent = (id: string | null | undefined) => {
  const fetcher = useCallback(() => getStudentById(id as string), [id]);
  const { data, loading, refresh } = useQuery<StudentRow | null>(KEYS, fetcher, {
    enabled: id != null
  });

  useEffect(() => {
    void refreshStudents();
  }, []);

  return { student: data ?? null, loading, refresh };
};
