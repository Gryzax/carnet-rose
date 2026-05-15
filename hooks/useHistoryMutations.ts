import { useMutation } from '@tanstack/react-query';
import {
  addCross,
  addForgot,
  addTick,
  deleteEvent,
  undoLastAction,
} from '../domain/studentController';
import type { StudentRow } from '../types/domain';

// Counter and history write operations as TanStack mutations. The history and
// student repositories handle cache invalidation.
export const useHistoryMutations = () => {
  const tick = useMutation({
    mutationFn: ({ student, reason }: { student: StudentRow; reason?: string }) =>
      addTick(student, reason),
  });

  const cross = useMutation({
    mutationFn: ({ student, reason }: { student: StudentRow; reason?: string }) =>
      addCross(student, reason),
  });

  const forgot = useMutation({
    mutationFn: ({ student }: { student: StudentRow }) => addForgot(student),
  });

  const undo = useMutation({ mutationFn: (studentId: string) => undoLastAction(studentId) });

  const removeEvent = useMutation({ mutationFn: (eventId: string) => deleteEvent(eventId) });

  return { tick, cross, forgot, undo, removeEvent };
};
