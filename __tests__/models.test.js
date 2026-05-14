const mockDb = {
  getAllAsync: jest.fn(),
  getFirstAsync: jest.fn(),
  runAsync: jest.fn()
};

jest.mock('../database/db', () => ({ getDb: jest.fn(() => Promise.resolve(mockDb)) }));
jest.mock('../services/sync/syncService', () => ({
  runBackgroundSync: jest.fn((callback) => callback({ user: { id: 'user-1' }, session: { accessToken: 'token' } }))
}));
jest.mock('../services/sync/classSyncService', () => ({
  softDeleteClass: jest.fn(() => Promise.resolve({ error: null })),
  upsertClass: jest.fn(() => Promise.resolve({ error: null }))
}));
jest.mock('../services/sync/studentSyncService', () => ({
  softDeleteStudent: jest.fn(() => Promise.resolve({ error: null }))
}));

import { ajouterClasse, chargerClasses, marquerClasseUtilisee, supprimerClasse } from '../controllers/classController';
import { getStatistics } from '../controllers/statisticsController';
import { createClass, deleteClass, getClassById, getClasses, touchClass } from '../models/classModel';
import { archiveStudent, createEvent, getArchives, getCurrentHistory, getLastActiveEvent, markEventCancelled } from '../models/historyModel';
import { createStudent, deleteStudent, getAllStudents, getStudentById, getStudentsByClass, resetAllStudents, updateCounters } from '../models/studentModel';
import { softDeleteClass, upsertClass } from '../services/sync/classSyncService';
import { softDeleteStudent } from '../services/sync/studentSyncService';

beforeEach(() => jest.clearAllMocks());

test('classModel exécute les requêtes', async () => {
  await getClasses();
  await getClassById(2);
  await createClass('6e Rose');
  await deleteClass(1);
  await touchClass(1);
  expect(mockDb.getAllAsync).toHaveBeenCalledWith(expect.stringContaining('FROM classes c LEFT JOIN eleves'));
  expect(mockDb.getFirstAsync).toHaveBeenCalledWith(expect.stringContaining('classes WHERE id'), 2);
  expect(mockDb.runAsync).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO classes'), '6e Rose');
  expect(mockDb.runAsync).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM evenements'), 1);
  expect(mockDb.runAsync).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM archive_trimestre'), 1);
  expect(mockDb.runAsync).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM eleves'), 1);
  expect(mockDb.runAsync).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM classes'), 1);
  expect(mockDb.runAsync).toHaveBeenCalledWith(expect.stringContaining('derniereUtilisation'), 1);
});

test('studentModel exécute les requêtes CRUD', async () => {
  await getStudentsByClass(1);
  await getStudentById(2);
  await getAllStudents();
  await createStudent({ classeId: 1, prenom: 'Emma', nom: 'Martin' });
  await deleteStudent(2);
  await updateCounters(2, { ticks: 1, croix: 2, merites: 3, retenues: 4, trimestreActuel: 1 });
  await resetAllStudents();
  expect(mockDb.getAllAsync).toHaveBeenCalledWith(expect.stringContaining('WHERE classeId = ?'), 1);
  expect(mockDb.getFirstAsync).toHaveBeenCalledWith(expect.stringContaining('WHERE id = ?'), 2);
  expect(mockDb.runAsync).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO eleves'), 1, 'Emma', 'Martin');
  expect(mockDb.runAsync).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM evenements'), 2);
  expect(mockDb.runAsync).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM archive_trimestre'), 2);
  expect(mockDb.runAsync).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM eleves WHERE id'), 2);
});

test('historyModel exécute historique et archives', async () => {
  await createEvent({ eleveId: 1, type: 'tick', raison: 'Effort', trimestre: 1, creeLe: 'now', previousTicks: 0, previousCroix: 0, newTicks: 1, newCroix: 0 });
  await getCurrentHistory(1, 1);
  await getLastActiveEvent(1);
  await markEventCancelled(9);
  await archiveStudent({ id: 1, merites: 2, retenues: 1, ticks: 3, croix: 0 }, 1, 'now');
  await getArchives(1);
  expect(mockDb.runAsync).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO evenements'), 1, 'tick', 'Effort', 1, 'now', 0, 0, 1, 0);
  expect(mockDb.runAsync).toHaveBeenCalledWith(expect.stringContaining('annule = 1'), 9);
  expect(mockDb.getAllAsync).toHaveBeenCalledWith(expect.stringContaining('archive_trimestre'), 1);
});

test('classController trie et ajoute une classe', async () => {
  mockDb.getAllAsync.mockResolvedValueOnce([{ nom: 'B', derniereUtilisation: '2024' }, { nom: 'A', derniereUtilisation: '2026' }]);
  mockDb.runAsync.mockResolvedValueOnce({ lastInsertRowId: 22 });
  mockDb.getFirstAsync.mockResolvedValueOnce({ id: 22, nom: '4e Rose', creeLe: 'now', derniereUtilisation: 'now' });
  const recent = await chargerClasses('recent');
  await ajouterClasse('  4e Rose  ');
  await marquerClasseUtilisee(12);
  expect(recent[0].nom).toBe('A');
  expect(mockDb.runAsync).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO classes'), '4e Rose');
  expect(upsertClass).toHaveBeenCalledWith(expect.objectContaining({ classe: expect.objectContaining({ id: 22 }) }));
  expect(mockDb.runAsync).toHaveBeenCalledWith(expect.stringContaining('derniereUtilisation'), 12);
});

test('classController refuse un nom de classe vide', async () => {
  await expect(ajouterClasse('   ')).rejects.toThrow('Le nom de la classe est obligatoire.');
  expect(mockDb.runAsync).not.toHaveBeenCalled();
});

test('classController supprime une classe vide', async () => {
  mockDb.getAllAsync.mockResolvedValueOnce([]);
  await supprimerClasse({ id: 10, nom: '4e Rose', nombreEleves: 0 });
  expect(mockDb.runAsync).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM classes'), 10);
  expect(softDeleteClass).toHaveBeenCalledWith(expect.objectContaining({ classId: 10 }));
});

test('classController supprime une classe avec eleves', async () => {
  mockDb.getAllAsync.mockResolvedValueOnce([{ id: 100 }, { id: 101 }]);
  await supprimerClasse({ id: 11, nom: '3e Rose', nombreEleves: 4 });
  expect(mockDb.runAsync).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM evenements'), 11);
  expect(mockDb.runAsync).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM archive_trimestre'), 11);
  expect(mockDb.runAsync).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM eleves'), 11);
  expect(mockDb.runAsync).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM classes'), 11);
  expect(softDeleteStudent).toHaveBeenCalledWith(expect.objectContaining({ studentId: 100 }));
  expect(softDeleteStudent).toHaveBeenCalledWith(expect.objectContaining({ studentId: 101 }));
});

test('statisticsController calcule les tops', async () => {
  mockDb.getAllAsync
    .mockResolvedValueOnce([{ nom: '6e', totalMerites: 2, totalRetenues: 1 }])
    .mockResolvedValueOnce([{ id: 1, ticks: 3, merites: 0, croix: 0, retenues: 0 }, { id: 2, ticks: 0, merites: 0, croix: 3, retenues: 1 }])
    .mockResolvedValueOnce([{ id: 9, eleveId: 2, type: 'croix', annule: 0 }]);
  const stats = await getStatistics();
  expect(stats.classes).toHaveLength(1);
  expect(stats.events).toHaveLength(1);
  expect(stats.topParticipatifs[0].id).toBe(1);
  expect(stats.topSurveillance[0].id).toBe(2);
});
