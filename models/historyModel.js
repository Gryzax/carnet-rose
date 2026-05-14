import { getDb } from '../database/db';

export const createEvent = async (event) => {
  const db = await getDb();
  return db.runAsync(
    'INSERT INTO evenements (eleveId, type, raison, trimestre, creeLe, previousTicks, previousCroix, newTicks, newCroix, annule) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)',
    event.eleveId, event.type, event.raison, event.trimestre, event.creeLe, event.previousTicks, event.previousCroix, event.newTicks, event.newCroix
  );
};

export const getCurrentHistory = async (eleveId, trimestre) => {
  const db = await getDb();
  return db.getAllAsync('SELECT * FROM evenements WHERE eleveId = ? AND trimestre = ? ORDER BY creeLe DESC', eleveId, trimestre);
};

export const getLastActiveEvent = async (eleveId) => {
  const db = await getDb();
  return db.getFirstAsync('SELECT * FROM evenements WHERE eleveId = ? AND annule = 0 ORDER BY creeLe DESC, id DESC LIMIT 1', eleveId);
};

export const getAllEvents = async () => {
  const db = await getDb();
  return db.getAllAsync('SELECT * FROM evenements ORDER BY creeLe ASC, id ASC');
};

export const markEventCancelled = async (id) => {
  const db = await getDb();
  return db.runAsync('UPDATE evenements SET annule = 1 WHERE id = ?', id);
};

export const archiveStudent = async (student, trimester, archiveLe) => {
  const db = await getDb();
  return db.runAsync('INSERT INTO archive_trimestre (eleveId, trimestre, merites, retenues, totalTicks, totalCroix, archiveLe) VALUES (?, ?, ?, ?, ?, ?, ?)', student.id, trimester, student.merites, student.retenues, student.ticks, student.croix, archiveLe);
};

export const getArchives = async (eleveId) => {
  const db = await getDb();
  return db.getAllAsync('SELECT * FROM archive_trimestre WHERE eleveId = ? ORDER BY archiveLe DESC', eleveId);
};

export const getAllArchives = async () => {
  const db = await getDb();
  return db.getAllAsync('SELECT * FROM archive_trimestre ORDER BY archiveLe ASC, id ASC');
};
