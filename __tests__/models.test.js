import { createMemStore } from '../test-utils/memStore';

let store;
jest.mock('../database/db', () => ({ getStore: jest.fn(() => Promise.resolve(store)) }));

import { deleteClassCascade, getClassById, getClasses, putClass, replaceAllClasses } from '../models/classModel';
import {
  deleteStudentCascade,
  getAllStudents,
  getStudentById,
  getStudentsByClass,
  putStudent,
  replaceAllStudents
} from '../models/studentModel';
import {
  deleteEvent,
  getAllArchives,
  getArchives,
  getCurrentHistory,
  getLastActiveEvent,
  putArchive,
  putEvent
} from '../models/historyModel';

const seed = () => ({
  classes: [
    { id: 'c1', name: '6e Rose', createdAt: 'a', lastUsedAt: 'a' },
    { id: 'c2', name: '5e Bleu', createdAt: 'b', lastUsedAt: 'b' }
  ],
  students: [
    { id: 's1', classId: 'c1', firstName: 'Emma', lastName: 'Martin', ticks: 1, crosses: 0, merits: 2, detentions: 1, currentTrimester: 1 },
    { id: 's2', classId: 'c1', firstName: 'Lucas', lastName: 'Bernard', ticks: 0, crosses: 3, merits: 0, detentions: 0, currentTrimester: 1 },
    { id: 's3', classId: 'c2', firstName: 'Chloe', lastName: 'Petit', ticks: 0, crosses: 0, merits: 1, detentions: 0, currentTrimester: 1 }
  ],
  events: [
    { id: 'e1', studentId: 's1', type: 'tick', reason: 'Effort', trimester: 1, createdAt: '2026-01-01', previousTicks: 0, previousCrosses: 0, newTicks: 1, newCrosses: 0, cancelled: 0 },
    { id: 'e2', studentId: 's1', type: 'cross', reason: '', trimester: 1, createdAt: '2026-01-02', previousTicks: 1, previousCrosses: 0, newTicks: 1, newCrosses: 1, cancelled: 1 }
  ],
  term_archives: [
    { id: 'a1', studentId: 's1', trimester: 1, merits: 2, detentions: 1, totalTicks: 4, totalCrosses: 1, archivedAt: '2026-01-05' }
  ]
});

beforeEach(() => {
  store = createMemStore(seed());
});

test('getClasses agrège les compteurs par classe et trie par nom', async () => {
  const classes = await getClasses();
  expect(classes.map((c) => c.name)).toEqual(['5e Bleu', '6e Rose']);
  const rose = classes.find((c) => c.id === 'c1');
  expect(rose).toMatchObject({ studentCount: 2, totalMerits: 2, totalDetentions: 1 });
});

test('getClassById et putClass lisent/écrivent le cache', async () => {
  expect(await getClassById('c2')).toMatchObject({ name: '5e Bleu' });
  await putClass({ id: 'c1', name: 'Renommée', createdAt: 'a', lastUsedAt: 'a' });
  expect((await getClassById('c1')).name).toBe('Renommée');
});

test('deleteClassCascade supprime la classe, ses élèves, événements et archives', async () => {
  await deleteClassCascade('c1');
  expect(store.tables.classes.map((c) => c.id)).toEqual(['c2']);
  expect(store.tables.students.map((s) => s.id)).toEqual(['s3']);
  expect(store.tables.events).toHaveLength(0);
  expect(store.tables.term_archives).toHaveLength(0);
});

test('replaceAllClasses remplace tout le contenu', async () => {
  await replaceAllClasses([{ id: 'c9', name: 'Neuve', createdAt: 'z', lastUsedAt: 'z' }]);
  expect(store.tables.classes.map((c) => c.id)).toEqual(['c9']);
});

test('getStudentsByClass filtre et trie par nom de famille', async () => {
  const students = await getStudentsByClass('c1');
  expect(students.map((s) => s.id)).toEqual(['s2', 's1']);
});

test('getAllStudents joint le nom de la classe', async () => {
  const students = await getAllStudents();
  expect(students.find((s) => s.id === 's1').className).toBe('6e Rose');
});

test('getStudentById / putStudent / replaceAllStudents', async () => {
  expect(await getStudentById('s3')).toMatchObject({ firstName: 'Chloe' });
  await putStudent({ ...(await getStudentById('s3')), ticks: 5 });
  expect((await getStudentById('s3')).ticks).toBe(5);
  await replaceAllStudents([]);
  expect(store.tables.students).toHaveLength(0);
});

test('deleteStudentCascade supprime l’élève et son historique', async () => {
  await deleteStudentCascade('s1');
  expect(store.tables.students.map((s) => s.id)).toEqual(['s2', 's3']);
  expect(store.tables.events).toHaveLength(0);
  expect(store.tables.term_archives).toHaveLength(0);
});

test('getCurrentHistory renvoie les événements du trimestre, plus récent d’abord', async () => {
  const history = await getCurrentHistory('s1', 1);
  expect(history.map((e) => e.id)).toEqual(['e2', 'e1']);
});

test('getLastActiveEvent ignore les événements annulés', async () => {
  const last = await getLastActiveEvent('s1');
  expect(last.id).toBe('e1');
});

test('putEvent et deleteEvent modifient le cache', async () => {
  await putEvent({ id: 'e3', studentId: 's2', type: 'tick', reason: '', trimester: 1, createdAt: '2026-02-01', previousTicks: 0, previousCrosses: 0, newTicks: 1, newCrosses: 0, cancelled: 0 });
  expect(store.tables.events).toHaveLength(3);
  await deleteEvent('e1');
  expect(store.tables.events.map((e) => e.id)).toEqual(['e2', 'e3']);
});

test('getArchives / getAllArchives / putArchive', async () => {
  expect(await getArchives('s1')).toHaveLength(1);
  await putArchive({ id: 'a2', studentId: 's2', trimester: 1, merits: 0, detentions: 0, totalTicks: 0, totalCrosses: 3, archivedAt: '2026-01-06' });
  expect(await getAllArchives()).toHaveLength(2);
});
