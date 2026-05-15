import { UNDO_LIMIT_SECONDS } from '../constants/config';
import { getThresholds } from '../utils/thresholds';
import { getAllEvents, getLastActiveEvent } from '../models/historyModel';
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

export interface ForgotResult {
  student: StudentRow;
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
  next: StudentRow,
): EventRow => {
  const { ticksForMerit, crossesForDetention } = getThresholds();
  return {
    id: uuid(),
    studentId: student.id,
    type,
    reason: reason || null,
    trimester: student.currentTrimester,
    createdAt: nowIso(),
    previousTicks: student.ticks,
    previousCrosses: student.crosses,
    newTicks: next.ticks,
    newCrosses: next.crosses,
    previousForgets: student.forgets,
    newForgets: next.forgets,
    cancelled: 0,
    ticksForMerit,
    crossesForDetention,
  };
};

export const addTick = async (student: StudentRow, reason = ''): Promise<TickResult> => {
  const next: StudentRow = { ...student, ticks: student.ticks + 1 };
  const meritObtained = next.ticks >= getThresholds().ticksForMerit;
  if (meritObtained) {
    next.ticks = 0;
    next.merits += 1;
  }
  await saveStudent(next);
  await touchClass(student.classId);
  await saveEvent(buildEvent(student, 'tick', reason, next));
  return { student: next, meritObtained };
};

export const addCross = async (student: StudentRow, reason = ''): Promise<CrossResult> => {
  const next: StudentRow = { ...student, crosses: student.crosses + 1 };
  const detentionTriggered = next.crosses >= getThresholds().crossesForDetention;
  if (detentionTriggered) {
    next.crosses = 0;
    next.detentions += 1;
  }
  await saveStudent(next);
  await touchClass(student.classId);
  await saveEvent(buildEvent(student, 'cross', reason, next));
  return { student: next, detentionTriggered };
};

// Records that a student forgot their notebook. Unlike ticks and crosses this
// is a standalone counter: it never rolls up into merits or detentions.
export const addForgot = async (student: StudentRow): Promise<ForgotResult> => {
  const next: StudentRow = { ...student, forgets: student.forgets + 1 };
  await saveStudent(next);
  await touchClass(student.classId);
  await saveEvent(buildEvent(student, 'forgot', '', next));
  return { student: next };
};

export const undoLastAction = async (studentId: string): Promise<UndoResult> => {
  const event = await getLastActiveEvent(studentId);
  if (!event) return { cancelled: false, reason: 'No action to undo' };
  if (secondsBetween(event.createdAt) > UNDO_LIMIT_SECONDS) {
    return { cancelled: false, reason: 'Undo window expired' };
  }
  const student = await getStudentById(studentId);
  if (!student) return { cancelled: false, reason: 'Student not found' };
  const restored: StudentRow = {
    ...student,
    ticks: event.previousTicks,
    crosses: event.previousCrosses,
    forgets: event.previousForgets,
  };
  await saveStudent(restored);
  await saveEvent({ ...event, cancelled: 1 });
  return { cancelled: true, student: restored };
};

// Recomputes a student's counters from scratch by replaying every non-cancelled
// event of their current trimester in chronological order, using the current
// thresholds. Used after deleting a history entry so the displayed counters
// stay consistent even when the removed event triggered a rollover.
const replayStudentCounters = async (studentId: string): Promise<void> => {
  const student = await getStudentById(studentId);
  if (!student) return;
  const events = await getAllEvents();
  const trimesterEvents = events
    .filter(
      (e) =>
        e.studentId === studentId && e.trimester === student.currentTrimester && e.cancelled === 0,
    )
    .sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
  const fallback = getThresholds();
  let ticks = 0;
  let crosses = 0;
  let forgets = 0;
  let merits = 0;
  let detentions = 0;
  for (const event of trimesterEvents) {
    const tickThreshold = event.ticksForMerit ?? fallback.ticksForMerit;
    const crossThreshold = event.crossesForDetention ?? fallback.crossesForDetention;
    if (event.type === 'tick') {
      ticks += 1;
      if (ticks >= tickThreshold) {
        ticks = 0;
        merits += 1;
      }
    } else if (event.type === 'cross') {
      crosses += 1;
      if (crosses >= crossThreshold) {
        crosses = 0;
        detentions += 1;
      }
    } else if (event.type === 'forgot') {
      forgets += 1;
    }
  }
  // Never regress acquired merits/detentions: replay can only confirm or grow.
  await saveStudent({
    ...student,
    ticks,
    crosses,
    forgets,
    merits: Math.max(student.merits, merits),
    detentions: Math.max(student.detentions, detentions),
  });
  await touchClass(student.classId);
};

export const deleteEvent = async (eventId: string): Promise<void> => {
  if (!eventId) throw new Error('Event not found.');
  const events = await getAllEvents();
  const event = events.find((e) => e.id === eventId);
  await removeEvent(eventId);
  if (event) await replayStudentCounters(event.studentId);
};

export const resetTrimester = async (trimesterNumber?: number): Promise<ResetTrimesterResult> => {
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
      archivedAt,
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
      forgets: 0,
      currentTrimester: student.currentTrimester + 1,
    });
  }
  return {
    archivedAt,
    totalStudents: students.length,
    totalMerits: students.reduce((sum, s) => sum + s.merits, 0),
    totalDetentions: students.reduce((sum, s) => sum + s.detentions, 0),
  };
};

export const deleteStudent = async (student: StudentRow | string): Promise<void> => {
  const id = typeof student === 'object' ? student?.id : student;
  if (!id) throw new Error('Student not found.');
  await removeStudent(id);
};

export const updateStudent = async (
  student: StudentRow,
  { firstName, lastName }: EditStudentInput,
): Promise<StudentRow> => {
  const normalizedFirstName = String(firstName || '').trim();
  const normalizedLastName = String(lastName || '').trim();
  if (!student?.id) throw new Error('Student not found.');
  if (!normalizedFirstName) throw new Error('Student first name is required.');
  if (!normalizedLastName) throw new Error('Student last name is required.');
  const next: StudentRow = {
    ...student,
    firstName: normalizedFirstName,
    lastName: normalizedLastName,
  };
  await saveStudent(next);
  await touchClass(student.classId);
  return next;
};

export const addStudent = async ({
  classId,
  firstName,
  lastName,
}: AddStudentInput): Promise<StudentRow> => {
  const normalizedFirstName = String(firstName || '').trim();
  const normalizedLastName = String(lastName || '').trim();
  if (!classId) throw new Error('Class not found.');
  if (!normalizedFirstName) throw new Error('Student first name is required.');
  if (!normalizedLastName) throw new Error('Student last name is required.');
  const student: StudentRow = {
    id: uuid(),
    classId,
    firstName: normalizedFirstName,
    lastName: normalizedLastName,
    ticks: 0,
    crosses: 0,
    merits: 0,
    detentions: 0,
    forgets: 0,
    currentTrimester: 1,
  };
  await saveStudent(student);
  await touchClass(classId);
  return student;
};
