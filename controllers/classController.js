import { createClass, deleteClass, getClassById, getClasses, touchClass } from '../models/classModel';
import { getStudentsByClass } from '../models/studentModel';
import { softDeleteClass, upsertClass } from '../services/sync/classSyncService';
import { runBackgroundSync } from '../services/sync/syncService';
import { softDeleteStudent } from '../services/sync/studentSyncService';

export const chargerClasses = async (tri = 'alpha') => {
  const classes = await getClasses();
  if (tri === 'recent') return [...classes].sort((a, b) => String(b.derniereUtilisation || '').localeCompare(String(a.derniereUtilisation || '')));
  return classes;
};

export const ajouterClasse = async (nom) => {
  const normalizedName = String(nom || '').trim();
  if (!normalizedName) throw new Error('Le nom de la classe est obligatoire.');
  const result = await createClass(normalizedName);
  if (result?.lastInsertRowId) {
    const classe = await getClassById(result.lastInsertRowId);
    await runBackgroundSync((context) => upsertClass({ ...context, classe }));
  }
  return result;
};

export const supprimerClasse = async (classe) => {
  const id = typeof classe === 'object' ? classe?.id : classe;
  if (!id) throw new Error('La classe est introuvable.');
  const students = await getStudentsByClass(id) || [];
  const result = await deleteClass(id);
  await runBackgroundSync(async (context) => {
    for (const student of students) {
      await softDeleteStudent({ ...context, studentId: student.id });
    }
    return softDeleteClass({ ...context, classId: id });
  });
  return result;
};

export const marquerClasseUtilisee = async (classe) => {
  const id = typeof classe === 'object' ? classe?.id : classe;
  if (!id) return null;
  return touchClass(id);
};
