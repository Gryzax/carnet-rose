import { deleteStudentCascade, putStudent, replaceAllStudents } from '../models/studentModel';
import {
  fetchStudents,
  pushStudent,
  softDeleteStudentRemote,
} from '../services/remote/studentRemote';
import { invalidate } from '../lib/queryClient';
import { flushThenPull, pushOrQueue } from './shared';
import type { StudentRow } from '../types/domain';

// Student repository: write-through to the cache, then push-or-queue to Supabase.

export const saveStudent = async (student: StudentRow): Promise<void> => {
  await putStudent(student);
  // Class list shows per-student aggregates, so it depends on `students` too.
  invalidate('classes', 'students');
  await pushOrQueue('student', 'upsert', student, (ctx) => pushStudent(ctx, student));
};

export const removeStudent = async (id: string): Promise<void> => {
  await deleteStudentCascade(id);
  invalidate('classes', 'students', 'events');
  await pushOrQueue('student', 'delete', { id }, (ctx) => softDeleteStudentRemote(ctx, id));
};

export const refreshStudents = async (): Promise<void> => {
  if (await flushThenPull(fetchStudents, replaceAllStudents)) invalidate('classes', 'students');
};
