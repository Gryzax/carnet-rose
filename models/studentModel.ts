import { getStore } from '../database/db';
import type { ClassRow, StudentRow, StudentWithClass } from '../types/domain';

// Student accessors over the local cache.

const byName = (a: StudentRow, b: StudentRow): number =>
  String(a.lastName).localeCompare(String(b.lastName), 'fr', { sensitivity: 'base' }) ||
  String(a.firstName).localeCompare(String(b.firstName), 'fr', { sensitivity: 'base' });

export const getStudentsByClass = async (classId: string): Promise<StudentRow[]> => {
  const store = await getStore();
  const students = await store.all<StudentRow>('students');
  return students.filter((student) => student.classId === classId).sort(byName);
};

export const getStudentById = async (id: string): Promise<StudentRow | null> => {
  const store = await getStore();
  return store.get<StudentRow>('students', id);
};

export const getAllStudents = async (): Promise<StudentWithClass[]> => {
  const store = await getStore();
  const [students, classes] = await Promise.all([
    store.all<StudentRow>('students'),
    store.all<ClassRow>('classes')
  ]);
  const classNameOf = new Map(classes.map((classRow) => [classRow.id, classRow.name]));
  return students.map((student) => ({
    ...student,
    className: classNameOf.get(student.classId) || ''
  }));
};

export const putStudent = async (student: StudentRow): Promise<void> => {
  const store = await getStore();
  await store.put('students', student);
};

export const replaceAllStudents = async (students: StudentRow[]): Promise<void> => {
  const store = await getStore();
  await store.replaceAll('students', students);
};

// Removes a student and their events/archives from the cache.
export const deleteStudentCascade = async (id: string): Promise<void> => {
  const store = await getStore();
  const events = await store.all<{ id: string; studentId: string }>('events');
  const archives = await store.all<{ id: string; studentId: string }>('term_archives');
  for (const event of events) {
    if (event.studentId === id) await store.remove('events', event.id);
  }
  for (const archive of archives) {
    if (archive.studentId === id) await store.remove('term_archives', archive.id);
  }
  await store.remove('students', id);
};
