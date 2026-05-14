jest.mock('../../models/studentModel', () => ({
  getAllStudents: jest.fn(),
  getStudentById: jest.fn(),
  updateCounters: jest.fn(),
  resetAllStudents: jest.fn()
}));
jest.mock('../../models/historyModel', () => ({
  createEvent: jest.fn(),
  getLastActiveEvent: jest.fn(),
  archiveStudent: jest.fn(),
  markEventCancelled: jest.fn()
}));
jest.mock('../../models/classModel', () => ({
  touchClass: jest.fn()
}));
jest.mock('../../services/sync/syncService', () => ({
  runBackgroundSync: jest.fn((callback) => callback({ user: { id: 'user-1' }, session: { accessToken: 'token' } }))
}));
jest.mock('../../services/sync/studentSyncService', () => ({
  softDeleteStudent: jest.fn(() => Promise.resolve({ error: null })),
  upsertStudent: jest.fn(() => Promise.resolve({ error: null }))
}));
jest.mock('../../services/sync/historySyncService', () => ({
  upsertEvent: jest.fn(() => Promise.resolve({ error: null }))
}));

import { ajouterCroix, ajouterTick, annulerDerniereAction, reinitialiserTrimestre } from '../../controllers/studentController';
import { getAllStudents, getStudentById, resetAllStudents, updateCounters } from '../../models/studentModel';
import { archiveStudent, createEvent, getLastActiveEvent, markEventCancelled } from '../../models/historyModel';
import { touchClass } from '../../models/classModel';
import { upsertEvent } from '../../services/sync/historySyncService';
import { upsertStudent } from '../../services/sync/studentSyncService';

const eleve = { id: 1, classeId: 5, prenom: 'Emma', nom: 'Martin', ticks: 0, croix: 0, merites: 0, retenues: 0, trimestreActuel: 1 };

beforeEach(() => jest.clearAllMocks());

test('ajouterTick cas normal', async () => {
  createEvent.mockResolvedValueOnce({ lastInsertRowId: 20 });
  const res = await ajouterTick(eleve, 'Participation');
  expect(res.eleve.ticks).toBe(1);
  expect(touchClass).toHaveBeenCalledWith(5);
  expect(createEvent).toHaveBeenCalledWith(expect.objectContaining({ type: 'tick', previousTicks: 0, newTicks: 1 }));
  expect(upsertStudent).toHaveBeenCalledWith(expect.objectContaining({ student: expect.objectContaining({ ticks: 1 }) }));
  expect(upsertEvent).toHaveBeenCalledWith(expect.objectContaining({ event: expect.objectContaining({ id: 20, type: 'tick' }) }));
});

test('tick qui annule une croix', async () => {
  const res = await ajouterTick({ ...eleve, croix: 2 });
  expect(res.eleve.croix).toBe(1);
  expect(res.eleve.ticks).toBe(0);
});

test('mérite déclenché à 4 ticks', async () => {
  const res = await ajouterTick({ ...eleve, ticks: 3 });
  expect(res.meritObtenu).toBe(true);
  expect(res.eleve.ticks).toBe(0);
  expect(res.eleve.merites).toBe(1);
});

test('ajouterCroix cas normal', async () => {
  createEvent.mockResolvedValueOnce({ lastInsertRowId: 21 });
  const res = await ajouterCroix(eleve, 'Comportement');
  expect(res.eleve.croix).toBe(1);
  expect(touchClass).toHaveBeenCalledWith(5);
  expect(createEvent).toHaveBeenCalledWith(expect.objectContaining({ type: 'croix', previousCroix: 0, newCroix: 1 }));
  expect(upsertStudent).toHaveBeenCalledWith(expect.objectContaining({ student: expect.objectContaining({ croix: 1 }) }));
  expect(upsertEvent).toHaveBeenCalledWith(expect.objectContaining({ event: expect.objectContaining({ id: 21, type: 'croix' }) }));
});

test('croix qui retire un tick', async () => {
  const res = await ajouterCroix({ ...eleve, ticks: 2 });
  expect(res.eleve.ticks).toBe(1);
  expect(res.eleve.croix).toBe(1);
});

test('retenue déclenchée à 4 croix', async () => {
  const res = await ajouterCroix({ ...eleve, croix: 3 });
  expect(res.retenueDeclenchee).toBe(true);
  expect(res.eleve.croix).toBe(0);
  expect(res.eleve.retenues).toBe(1);
});

test('annulation dans les 30 secondes', async () => {
  getLastActiveEvent.mockResolvedValue({ id: 9, creeLe: new Date().toISOString(), previousTicks: 1, previousCroix: 0 });
  getStudentById.mockResolvedValue({ ...eleve, ticks: 2 });
  const res = await annulerDerniereAction(1);
  expect(res.annule).toBe(true);
  expect(updateCounters).toHaveBeenCalledWith(1, expect.objectContaining({ ticks: 1, croix: 0 }));
  expect(markEventCancelled).toHaveBeenCalledWith(9);
});

test('refus annulation après 30 secondes', async () => {
  getLastActiveEvent.mockResolvedValue({ id: 9, creeLe: new Date(Date.now() - 31000).toISOString(), previousTicks: 1, previousCroix: 0 });
  const res = await annulerDerniereAction(1);
  expect(res.annule).toBe(false);
});

test('réinitialisation trimestrielle', async () => {
  getAllStudents.mockResolvedValue([{ ...eleve, merites: 2, retenues: 1 }, { ...eleve, id: 2, merites: 1, retenues: 0 }]);
  const res = await reinitialiserTrimestre(1);
  expect(archiveStudent).toHaveBeenCalledTimes(2);
  expect(resetAllStudents).toHaveBeenCalled();
  expect(res.totalMerites).toBe(3);
});
