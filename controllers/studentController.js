import { CROSSES_FOR_DETENTION, TICKS_FOR_MERIT, UNDO_LIMIT_SECONDS } from '../constants/config';
import { createEvent, getLastActiveEvent, archiveStudent, markEventCancelled } from '../models/historyModel';
import { touchClass } from '../models/classModel';
import { createStudent, deleteStudent, getAllStudents, getStudentById, updateCounters, resetAllStudents } from '../models/studentModel';
import { upsertEvent } from '../services/sync/historySyncService';
import { runBackgroundSync } from '../services/sync/syncService';
import { softDeleteStudent, upsertStudent } from '../services/sync/studentSyncService';
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
  await touchClass(eleve.classeId);
  const event = { eleveId: eleve.id, type: 'tick', raison, trimestre: eleve.trimestreActuel, creeLe: nowIso(), previousTicks, previousCroix, newTicks: next.ticks, newCroix: next.croix };
  const eventResult = await createEvent(event);
  await runBackgroundSync(async (context) => {
    await upsertStudent({ ...context, student: next });
    return upsertEvent({ ...context, event: { ...event, id: eventResult?.lastInsertRowId } });
  });
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
  await touchClass(eleve.classeId);
  const event = { eleveId: eleve.id, type: 'croix', raison, trimestre: eleve.trimestreActuel, creeLe: nowIso(), previousTicks, previousCroix, newTicks: next.ticks, newCroix: next.croix };
  const eventResult = await createEvent(event);
  await runBackgroundSync(async (context) => {
    await upsertStudent({ ...context, student: next });
    return upsertEvent({ ...context, event: { ...event, id: eventResult?.lastInsertRowId } });
  });
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

export const supprimerEleve = async (eleve) => {
  const id = typeof eleve === 'object' ? eleve?.id : eleve;
  if (!id) throw new Error('Élève introuvable.');
  const result = await deleteStudent(id);
  await runBackgroundSync((context) => softDeleteStudent({ ...context, studentId: id }));
  return result;
};

export const ajouterEleve = async ({ classeId, prenom, nom }) => {
  const normalizedPrenom = String(prenom || '').trim();
  const normalizedNom = String(nom || '').trim();
  if (!classeId) throw new Error('Classe introuvable.');
  if (!normalizedPrenom) throw new Error("Le prénom de l'élève est obligatoire.");
  if (!normalizedNom) throw new Error("Le nom de l'élève est obligatoire.");
  const result = await createStudent({ classeId, prenom: normalizedPrenom, nom: normalizedNom });
  await touchClass(classeId);
  if (result?.lastInsertRowId) {
    const student = await getStudentById(result.lastInsertRowId);
    await runBackgroundSync((context) => upsertStudent({ ...context, student }));
  }
  return result;
};
