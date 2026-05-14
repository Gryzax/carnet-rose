import { useMutation } from '@tanstack/react-query';
import {
  addStudent,
  deleteStudent,
  updateStudent,
  type AddStudentInput,
  type EditStudentInput
} from '../domain/studentController';
import type { StudentRow } from '../types/domain';

// Student write operations as TanStack mutations. Cache invalidation is handled
// by the student repository the domain functions delegate to.
export const useStudentMutations = () => {
  const create = useMutation({ mutationFn: (input: AddStudentInput) => addStudent(input) });

  const edit = useMutation({
    mutationFn: ({ student, changes }: { student: StudentRow; changes: EditStudentInput }) =>
      updateStudent(student, changes)
  });

  const remove = useMutation({
    mutationFn: (student: StudentRow | string) => deleteStudent(student)
  });

  return { create, edit, remove };
};
