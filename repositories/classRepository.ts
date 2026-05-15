import {
  deleteClassCascade,
  getClassById,
  putClass,
  replaceAllClasses,
} from '../models/classModel';
import { getStudentsByClass } from '../models/studentModel';
import { fetchClasses, pushClass, softDeleteClassRemote } from '../services/remote/classRemote';
import { softDeleteStudentRemote } from '../services/remote/studentRemote';
import { invalidate } from '../lib/queryClient';
import { nowIso } from '../utils/date';
import { flushThenPull, pushOrQueue } from './shared';
import type { ClassRow } from '../types/domain';

// Class repository: write-through to the cache, then push-or-queue to Supabase.
// Every write invalidates the reactive store so all mounted screens refresh.

export const saveClass = async (classRow: ClassRow): Promise<void> => {
  await putClass(classRow);
  invalidate('classes');
  await pushOrQueue('class', 'upsert', classRow, (ctx) => pushClass(ctx, classRow));
};

export const removeClass = async (id: string): Promise<void> => {
  // Capture the students before the cascade wipes them — they need their own
  // remote soft-delete (Supabase has no cascade on our soft-delete column).
  const students = await getStudentsByClass(id);
  await deleteClassCascade(id);
  invalidate('classes', 'students', 'events');
  await pushOrQueue('class', 'delete', { id }, (ctx) => softDeleteClassRemote(ctx, id));
  for (const student of students) {
    await pushOrQueue('student', 'delete', { id: student.id }, (ctx) =>
      softDeleteStudentRemote(ctx, student.id),
    );
  }
};

// Marks a class as recently used (cache + remote). No-op if it's gone.
export const touchClass = async (id: string): Promise<void> => {
  const classRow = await getClassById(id);
  if (!classRow) return;
  await saveClass({ ...classRow, lastUsedAt: nowIso() });
};

export const refreshClasses = async (): Promise<void> => {
  if (await flushThenPull(fetchClasses, replaceAllClasses)) invalidate('classes');
};
