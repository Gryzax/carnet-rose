import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAllStudents, getStudentById, getStudentsByClass } from '../models/studentModel';
import { refreshClasses } from '../repositories/classRepository';
import { refreshStudents } from '../repositories/studentRepository';
import { queryKeys } from '../lib/queryClient';

export type StudentSort = 'name' | 'crosses' | 'ticks';

export const useStudents = (classId: string | null | undefined, sort: StudentSort = 'name') => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: queryKeys.studentsByClass(classId ?? '', sort),
    enabled: classId != null,
    queryFn: async () => {
      const rows = await getStudentsByClass(classId as string);
      return [...rows].sort((a, b) => {
        if (sort === 'crosses') return b.crosses - a.crosses;
        if (sort === 'ticks') return b.ticks - a.ticks;
        return a.lastName.localeCompare(b.lastName);
      });
    },
  });

  useEffect(() => {
    void refreshStudents();
  }, []);

  return { students: data ?? [], loading: isLoading, refresh: refetch };
};

export const useAllStudents = () => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: queryKeys.allStudents(),
    queryFn: () => getAllStudents(),
  });

  useEffect(() => {
    // `getAllStudents` joins in class names, so refresh both entities.
    void refreshClasses();
    void refreshStudents();
  }, []);

  return { students: data ?? [], loading: isLoading, refresh: refetch };
};

export const useStudent = (id: string | null | undefined) => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: queryKeys.student(id ?? ''),
    enabled: id != null,
    queryFn: () => getStudentById(id as string),
  });

  useEffect(() => {
    void refreshStudents();
  }, []);

  return { student: data ?? null, loading: isLoading, refresh: refetch };
};
