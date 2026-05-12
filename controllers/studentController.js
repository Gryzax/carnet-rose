import { CROSSES_FOR_DETENTION, TICKS_FOR_MERIT, UNDO_LIMIT_SECONDS } from '../constants/config';
import { createEvent, getLastActiveEvent, archiveStudent, markEventCancelled } from '../models/historyModel';
import { getAllStudents, getStudentById, updateCounters, resetAllStudents } from '../models/studentModel';
import { nowIso, secondsBetween } from '../utils/date';

export const ajouterTick = async (eleve, raison = '') => {
  const previousTicks = eleve.ticks;
  const previousCroix = eleve.croix;
  let next = { ...eleve };
  if (next.croix > 0) next.croix -= 1;
  else next.ticks += 1;
  const meritObtenu = next.ticks >= TICKS_FOR_MERIT;
  if (meritObtenu) {
    next.ticks = 0;
    next.merites += 1;
  }
  await updateCounters(eleve.id, next);
  await createEvent({ eleveId: eleve.id, type: 'tick', raison, trimestre: eleve.trimestreActuel, creeLe: nowIso(), previousTicks, previousCroix, newTicks: next.ticks, newCroix: next.croix });
  return { eleve: next, meritObtenu };
};

export const ajouterCroix = async (eleve, raison = '') => {
  const previousTicks = eleve.ticks;
  const previousCroix = eleve.croix;
  let next = { ...eleve, croix: eleve.croix + 1 };
  if (next.ticks > 0) next.ticks -= 1;
  const retenueDeclenchee = next.croix >= CROSSES_FOR_DETENTION;
  if (retenueDeclenchee) {
    next.croix = 0;
    next.retenues += 1;
  }
  await updateCounters(eleve.id, next);
  await createEvent({ eleveId: eleve.id, type: 'croix', raison, trimestre: eleve.trimestreActuel, creeLe: nowIso(), previousTicks, previousCroix, newTicks: next.ticks, newCroix: next.croix });
  return { eleve: next, retenueDeclenchee };
};

export const annulerDerniereAction = async (eleveId) => {
  const event = await getLastActiveEvent(eleveId);
  if (!event) return { annule: false, raison: 'Aucune action à annuler' };
  if (secondsBetween(event.creeLe) > UNDO_LIMIT_SECONDS) return { annule: false, raison: 'Délai dépassé' };
  const eleve = await getStudentById(eleveId);
  const restored = { ...eleve, ticks: event.previousTicks, croix: event.previousCroix };
  await updateCounters(eleveId, restored);
  await markEventCancelled(event.id);
  return { annule: true, eleve: restored };
};

export const reinitialiserTrimestre = async (numeroTrimestre) => {
  const students = await getAllStudents();
  const archiveLe = nowIso();
  for (const student of students) await archiveStudent(student, numeroTrimestre || student.trimestreActuel, archiveLe);
  await resetAllStudents();
  return {
    archiveLe,
    totalEleves: students.length,
    totalMerites: students.reduce((sum, s) => sum + s.merites, 0),
    totalRetenues: students.reduce((sum, s) => sum + s.retenues, 0)
  };
};
