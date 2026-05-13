const mockDb = {
  getAllAsync: jest.fn(),
  getFirstAsync: jest.fn(),
  runAsync: jest.fn()
};

jest.mock('../database/db', () => ({ getDb: jest.fn(() => Promise.resolve(mockDb)) }));

import { chargerClasses, ajouterClasse } from '../controllers/classController';
import { getStatistics } from '../controllers/statisticsController';
import { createClass, getClasses, touchClass } from '../models/classModel';
import { archiveStudent, createEvent, getArchives, getCurrentHistory, getLastActiveEvent, markEventCancelled } from '../models/historyModel';
import { createStudent, getAllStudents, getStudentById, getStudentsByClass, resetAllStudents, updateCounters } from '../models/studentModel';

beforeEach(() => jest.clearAllMocks());

test('classModel exécute les requêtes', async () => {
  await getClasses();
  await createClass('6e Rose');
  await touchClass(1);
  expect(mockDb.getAllAsync).toHaveBeenCalledWith(expect.stringContaining('FROM classes c LEFT JOIN eleves'));
  expect(mockDb.runAsync).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO classes'), '6e Rose');
  expect(mockDb.runAsync).toHaveBeenCalledWith(expect.stringContaining('derniereUtilisation'), 1);
});

test('studentModel exécute les requêtes CRUD', async () => {
  await getStudentsByClass(1);
  await getStudentById(2);
  await getAllStudents();
  await createStudent({ classeId: 1, prenom: 'Emma', nom: 'Martin' });
  await updateCounters(2, { ticks: 1, croix: 2, merites: 3, retenues: 4, trimestreActuel: 1 });
  await resetAllStudents();
  expect(mockDb.getAllAsync).toHaveBeenCalledWith(expect.stringContaining('WHERE classeId = ?'), 1);
  expect(mockDb.getFirstAsync).toHaveBeenCalledWith(expect.stringContaining('WHERE id = ?'), 2);
  expect(mockDb.runAsync).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO eleves'), 1, 'Emma', 'Martin');
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
  const recent = await chargerClasses('recent');
  await ajouterClasse('  4e Rose  ');
  expect(recent[0].nom).toBe('A');
  expect(mockDb.runAsync).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO classes'), '4e Rose');
});

test('classController refuse un nom de classe vide', async () => {
  await expect(ajouterClasse('   ')).rejects.toThrow('Le nom de la classe est obligatoire.');
  expect(mockDb.runAsync).not.toHaveBeenCalled();
});

test('statisticsController calcule les tops', async () => {
  mockDb.getAllAsync
    .mockResolvedValueOnce([{ nom: '6e', totalMerites: 2, totalRetenues: 1 }])
    .mockResolvedValueOnce([{ id: 1, ticks: 3, merites: 0, croix: 0, retenues: 0 }, { id: 2, ticks: 0, merites: 0, croix: 3, retenues: 1 }]);
  const stats = await getStatistics();
  expect(stats.classes).toHaveLength(1);
  expect(stats.topParticipatifs[0].id).toBe(1);
  expect(stats.topSurveillance[0].id).toBe(2);
});
