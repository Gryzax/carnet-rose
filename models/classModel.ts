import { getStore } from '../database/db';
import type { ClassRow, ClassWithStats, StudentRow } from '../types/domain';

// Class accessors over the local cache. Pure read/write of whole rows — the
// cache is no longer the source of truth, just a fast local mirror of Supabase.

const byName = (a: { name: string }, b: { name: string }): number =>
  String(a.name).localeCompare(String(b.name), 'fr', { sensitivity: 'base' });

export const getClasses = async (): Promise<ClassWithStats[]> => {
  const store = await getStore();
  const [classes, students] = await Promise.all([
    store.all<ClassRow>('classes'),
    store.all<StudentRow>('students')
  ]);
  return classes
    .map((classRow) => {
      const own = students.filter((student) => student.classId === classRow.id);
      return {
        ...classRow,
        studentCount: own.length,
        totalMerits: own.reduce((sum, student) => sum + (student.merits || 0), 0),
        totalDetentions: own.reduce((sum, student) => sum + (student.detentions || 0), 0)
      };
    })
    .sort(byName);
};

export const getClassById = async (id: string): Promise<ClassRow | null> => {
  const store = await getStore();
  return store.get<ClassRow>('classes', id);
};

export const putClass = async (classRow: ClassRow): Promise<void> => {
  const store = await getStore();
  await store.put('classes', classRow);
};

export const replaceAllClasses = async (classes: ClassRow[]): Promise<void> => {
  const store = await getStore();
  await store.replaceAll('classes', classes);
};

// Removes a class and everything hanging off it (students, their events and
// archives) from the cache. Remote soft-deletes are handled by the repository.
export const deleteClassCascade = async (id: string): Promise<void> => {
  const store = await getStore();
  const students = (await store.all<StudentRow>('students')).filter(
    (student) => student.classId === id
  );
  const studentIds = new Set(students.map((student) => student.id));
  const events = await store.all<{ id: string; studentId: string }>('events');
  const archives = await store.all<{ id: string; studentId: string }>('term_archives');
  for (const event of events) {
    if (studentIds.has(event.studentId)) await store.remove('events', event.id);
  }
  for (const archive of archives) {
    if (studentIds.has(archive.studentId)) await store.remove('term_archives', archive.id);
  }
  for (const student of students) await store.remove('students', student.id);
  await store.remove('classes', id);
};
