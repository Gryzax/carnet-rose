import { getDb } from '../database/db';

export const getClasses = async () => {
  const db = await getDb();
  return db.getAllAsync(`
    SELECT c.*, COUNT(e.id) as nombreEleves, COALESCE(SUM(e.merites), 0) as totalMerites, COALESCE(SUM(e.retenues), 0) as totalRetenues
    FROM classes c LEFT JOIN eleves e ON e.classeId = c.id
    GROUP BY c.id ORDER BY c.nom COLLATE NOCASE
  `);
};

export const getClassById = async (id) => {
  const db = await getDb();
  return db.getFirstAsync('SELECT * FROM classes WHERE id = ?', id);
};

export const createClass = async (nom) => {
  const db = await getDb();
  return db.runAsync('INSERT INTO classes (nom, creeLe, derniereUtilisation) VALUES (?, datetime("now"), datetime("now"))', nom);
};

export const deleteClass = async (id) => {
  const db = await getDb();
  await db.runAsync('DELETE FROM evenements WHERE eleveId IN (SELECT id FROM eleves WHERE classeId = ?)', id);
  await db.runAsync('DELETE FROM archive_trimestre WHERE eleveId IN (SELECT id FROM eleves WHERE classeId = ?)', id);
  await db.runAsync('DELETE FROM eleves WHERE classeId = ?', id);
  return db.runAsync('DELETE FROM classes WHERE id = ?', id);
};

export const touchClass = async (id) => {
  const db = await getDb();
  return db.runAsync('UPDATE classes SET derniereUtilisation = datetime("now") WHERE id = ?', id);
};
