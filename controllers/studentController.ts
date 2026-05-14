import { CROSSES_FOR_DETENTION, TICKS_FOR_MERIT, UNDO_LIMIT_SECONDS } from '../constants/config';
import { getLastActiveEvent } from '../models/historyModel';
import { getAllStudents, getStudentById } from '../models/studentModel';
import { removeStudent, saveStudent } from '../repositories/studentRepository';
import { touchClass } from '../repositories/classRepository';
import { removeEvent, saveArchive, saveEvent } from '../repositories/historyRepository';
import { nowIso, secondsBetween } from '../utils/date';
import { uuid } from '../utils/uuid';
import type { ArchiveRow, EventRow, StudentRow } from '../types/domain';

// Student business logic. Counters and history thresholds live here; the
// cache + Supabase write-through and reactive invalidation are handled by the
// repositories these functions delegate to.

export interface TickResult {
  student: StudentRow;
  meritObtained: boolean;
}

export interface CrossResult {
  student: StudentRow;
  detentionTriggered: boolean;
}

export type UndoResult =
  | { cancelled: false; reason: string }
  | { cancelled: true; student: StudentRow };

export interface ResetTrimesterResult {
  archivedAt: string;
  totalStudents: number;
  totalMerits: number;
  totalDetentions: number;
}

export interface AddStudentInput {
  classId: string;
  firstName: string;
  lastName: string;
}

export interface EditStudentInput {
  firstName: string;
  lastName: string;
}

// Builds the history event for a counter change. The previous/new snapshots let
// `undoLastAction` restore the exact state before the action.
const buildEvent = (
  student: StudentRow,
  type: EventRow['type'],
  reason: string,
  previousTicks: number,
  previousCrosses: number,
  next: StudentRow
): EventRow => ({
  id: uuid(),
  studentId: student.id,
  type,
  reason: reason || null,
  trimester: student.currentTrimester,
  createdAt: nowIso(),
  previousTicks,
  previousCrosses,
  newTicks: next.ticks,
  newCrosses: next.crosses,
  cancelled: 0
});

export const addTick = async (student: StudentRow, reason = ''): Promise<TickResult> => {
  const previousTicks = student.ticks;
  const previousCrosses = student.crosses;
  const next: StudentRow = { ...student, ticks: student.ticks + 1 };
  const meritObtained = next.ticks >= TICKS_FOR_MERIT;
  if (meritObtained) {
    next.ticks = 0;
    next.merits += 1;
  }
  await saveStudent(next);
  await touchClass(student.classId);
  await saveEvent(buildEvent(student, 'tick', reason, previousTicks, previousCrosses, next));
  return { student: next, meritObtained };
};

export const addCross = async (student: StudentRow, reason = ''): Promise<CrossResult> => {
  const previousTicks = student.ticks;
  const previousCrosses = student.crosses;
  const next: StudentRow = { ...student, crosses: student.crosses + 1 };
  const detentionTriggered = next.crosses >= CROSSES_FOR_DETENTION;
  if (detentionTriggered) {
    next.crosses = 0;
    next.detentions += 1;
  }
  await saveStudent(next);
  await touchClass(student.classId);
  await saveEvent(buildEvent(student, 'cross', reason, previousTicks, previousCrosses, next));
  return { student: next, detentionTriggered };
};

export const undoLastAction = async (studentId: string): Promise<UndoResult> => {
  const event = await getLastActiveEvent(studentId);
  if (!event) return { cancelled: false, reason: 'Aucune action à annuler' };
  if (secondsBetween(event.createdAt) > UNDO_LIMIT_SECONDS) {
    return { cancelled: false, reason: 'Délai dépassé' };
  }
  const student = await getStudentById(studentId);
  if (!student) return { cancelled: false, reason: 'Élève introuvable' };
  const restored: StudentRow = {
    ...student,
    ticks: event.previousTicks,
    crosses: event.previousCrosses
  };
  await saveStudent(restored);
  await saveEvent({ ...event, cancelled: 1 });
  return { cancelled: true, student: restored };
};

export const deleteEvent = async (eventId: string): Promise<void> => {
  if (!eventId) throw new Error('Événement introuvable.');
  await removeEvent(eventId);
};

export const resetTrimester = async (
  trimesterNumber?: number
): Promise<ResetTrimesterResult> => {
  const students = await getAllStudents();
  const archivedAt = nowIso();
  for (const student of students) {
    const archive: ArchiveRow = {
      id: uuid(),
      studentId: student.id,
      trimester: trimesterNumber || student.currentTrimester,
      merits: student.merits,
      detentions: student.detentions,
      totalTicks: student.ticks,
      totalCrosses: student.crosses,
      archivedAt
    };
    await saveArchive(archive);
  }
  for (const student of students) {
    const { className, ...base } = student;
    void className;
    await saveStudent({
      ...base,
      ticks: 0,
      crosses: 0,
      merits: 0,
      detentions: 0,
      currentTrimester: student.currentTrimester + 1
    });
  }
  return {
    archivedAt,
    totalStudents: students.length,
    totalMerits: students.reduce((sum, s) => sum + s.merits, 0),
    totalDetentions: students.reduce((sum, s) => sum + s.detentions, 0)
  };
};

export const deleteStudent = async (student: StudentRow | string): Promise<void> => {
  const id = typeof student === 'object' ? student?.id : student;
  if (!id) throw new Error('Élève introuvable.');
  await removeStudent(id);
};

export const updateStudent = async (
  student: StudentRow,
  { firstName, lastName }: EditStudentInput
): Promise<StudentRow> => {
  const normalizedFirstName = String(firstName || '').trim();
  const normalizedLastName = String(lastName || '').trim();
  if (!student?.id) throw new Error('Élève introuvable.');
  if (!normalizedFirstName) throw new Error("Le prénom de l'élève est obligatoire.");
  if (!normalizedLastName) throw new Error("Le nom de l'élève est obligatoire.");
  const next: StudentRow = {
    ...student,
    firstName: normalizedFirstName,
    lastName: normalizedLastName
  };
  await saveStudent(next);
  await touchClass(student.classId);
  return next;
};

export const addStudent = async ({
  classId,
  firstName,
  lastName
}: AddStudentInput): Promise<StudentRow> => {
  const normalizedFirstName = String(firstName || '').trim();
  const normalizedLastName = String(lastName || '').trim();
  if (!classId) throw new Error('Classe introuvable.');
  if (!normalizedFirstName) throw new Error("Le prénom de l'élève est obligatoire.");
  if (!normalizedLastName) throw new Error("Le nom de l'élève est obligatoire.");
  const student: StudentRow = {
    id: uuid(),
    classId,
    firstName: normalizedFirstName,
    lastName: normalizedLastName,
    ticks: 0,
    crosses: 0,
    merits: 0,
    detentions: 0,
    currentTrimester: 1
  };
  await saveStudent(student);
  await touchClass(classId);
  return student;
};
