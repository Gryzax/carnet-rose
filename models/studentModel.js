import { getDb } from '../database/db';

export const getStudentsByClass = async (classeId) => {
  const db = await getDb();
  return db.getAllAsync('SELECT * FROM eleves WHERE classeId = ? ORDER BY nom COLLATE NOCASE, prenom COLLATE NOCASE', classeId);
};

export const getStudentById = async (id) => {
  const db = await getDb();
  return db.getFirstAsync('SELECT * FROM eleves WHERE id = ?', id);
};

export const getAllStudents = async () => {
  const db = await getDb();
  return db.getAllAsync('SELECT e.*, c.nom as classeNom FROM eleves e JOIN classes c ON c.id = e.classeId');
};

export const createStudent = async ({ classeId, prenom, nom }) => {
  const db = await getDb();
  return db.runAsync('INSERT INTO eleves (classeId, prenom, nom, ticks, croix, merites, retenues, trimestreActuel) VALUES (?, ?, ?, 0, 0, 0, 0, 1)', classeId, prenom, nom);
};

export const updateCounters = async (id, fields) => {
  const db = await getDb();
  return db.runAsync('UPDATE eleves SET ticks = ?, croix = ?, merites = ?, retenues = ?, trimestreActuel = ? WHERE id = ?', fields.ticks, fields.croix, fields.merites, fields.retenues, fields.trimestreActuel, id);
};

export const resetAllStudents = async () => {
  const db = await getDb();
  return db.runAsync('UPDATE eleves SET ticks = 0, croix = 0, merites = 0, retenues = 0, trimestreActuel = trimestreActuel + 1');
};
