jest.mock('../../models/classModel', () => ({ getClasses: jest.fn() }));
jest.mock('../../models/studentModel', () => ({ getAllStudents: jest.fn() }));
jest.mock('../../models/historyModel', () => ({ getAllEvents: jest.fn(), getAllArchives: jest.fn() }));

import { getClassroomStatistics } from '../../controllers/statisticsController';
import { getClasses } from '../../models/classModel';
import { getAllStudents } from '../../models/studentModel';
import { getAllArchives, getAllEvents } from '../../models/historyModel';

const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();
const todayIso = () => new Date().toISOString();

const students = [
  { id: 1, classId: 10, firstName: 'Emma', lastName: 'Martin', ticks: 3, crosses: 0, merits: 2, detentions: 0 },
  { id: 2, classId: 10, firstName: 'Lucas', lastName: 'Petit', ticks: 0, crosses: 3, merits: 0, detentions: 1 },
  { id: 3, classId: 20, firstName: 'Chloe', lastName: 'Durand', ticks: 1, crosses: 0, merits: 0, detentions: 0 }
];

beforeEach(() => {
  jest.clearAllMocks();
  getClasses.mockResolvedValue([
    { id: 10, name: '4e Rose' },
    { id: 20, name: '5e Bleu' }
  ]);
  getAllStudents.mockResolvedValue(students);
  getAllArchives.mockResolvedValue([]);
  getAllEvents.mockResolvedValue([]);
});

test('agrège le snapshot du jour', async () => {
  getAllEvents.mockResolvedValue([
    { id: 1, studentId: 1, type: 'tick', reason: 'Participation', createdAt: todayIso(), previousTicks: 1, previousCrosses: 0, cancelled: 0 },
    { id: 2, studentId: 2, type: 'cross', reason: 'Carnet oublié', createdAt: todayIso(), previousTicks: 0, previousCrosses: 1, cancelled: 0 },
    { id: 3, studentId: 2, type: 'cross', reason: 'Comportement', createdAt: daysAgo(3), previousTicks: 0, previousCrosses: 0, cancelled: 0 }
  ]);

  const stats = await getClassroomStatistics({ period: 'week', classId: null });

  expect(stats.today.ticks).toBe(1);
  expect(stats.today.crosses).toBe(1);
  expect(stats.today.forgottenNotebooks).toBe(1);
  expect(stats.today.toWatch).toBe(1); // Lucas a 3 croix
  expect(stats.hasData).toBe(true);
});

test('ignore les évènements annulés et filtre par classe', async () => {
  getAllEvents.mockResolvedValue([
    { id: 1, studentId: 1, type: 'tick', reason: '', createdAt: todayIso(), previousTicks: 0, previousCrosses: 0, cancelled: 0 },
    { id: 2, studentId: 1, type: 'tick', reason: '', createdAt: todayIso(), previousTicks: 0, previousCrosses: 0, cancelled: 1 },
    { id: 3, studentId: 3, type: 'tick', reason: '', createdAt: todayIso(), previousTicks: 0, previousCrosses: 0, cancelled: 0 }
  ]);

  const stats = await getClassroomStatistics({ period: 'week', classId: 10 });

  expect(stats.evolution.ticks).toBe(1); // seul l'évènement actif de la classe 10
});

test('détecte mérites et retenues sur la période', async () => {
  getAllEvents.mockResolvedValue([
    { id: 1, studentId: 1, type: 'tick', reason: '', createdAt: daysAgo(2), previousTicks: 3, previousCrosses: 0, cancelled: 0 },
    { id: 2, studentId: 2, type: 'cross', reason: '', createdAt: daysAgo(2), previousTicks: 0, previousCrosses: 3, cancelled: 0 }
  ]);

  const stats = await getClassroomStatistics({ period: 'month', classId: null });

  expect(stats.evolution.merits).toBe(1);
  expect(stats.evolution.detentions).toBe(1);
});

test('classe le top 3 à encourager et à recadrer', async () => {
  const stats = await getClassroomStatistics({ period: 'trimestre', classId: null });

  expect(stats.top.encourage[0].id).toBe(1); // Emma, meilleur score positif
  expect(stats.top.reframe[0].id).toBe(2); // Lucas, meilleur score négatif
});

test('liste les élèves sans évènement récent', async () => {
  getAllEvents.mockResolvedValue([
    { id: 1, studentId: 1, type: 'tick', reason: '', createdAt: todayIso(), previousTicks: 0, previousCrosses: 0, cancelled: 0 }
  ]);

  const stats = await getClassroomStatistics({ period: 'week', classId: 10 });
  const ids = stats.quickActions.noRecentEvent.map((s) => s.id);

  expect(ids).toContain(2); // Lucas n'a aucun évènement
  expect(ids).not.toContain(1); // Emma a été notée aujourd'hui
});

test('renvoie un climat vide sans données', async () => {
  getAllStudents.mockResolvedValue([
    { id: 1, classId: 10, firstName: 'Emma', lastName: 'Martin', ticks: 0, crosses: 0, merits: 0, detentions: 0 }
  ]);

  const stats = await getClassroomStatistics({ period: 'week', classId: null });

  expect(stats.climate.status).toBe('empty');
  expect(stats.hasData).toBe(false);
});

test('agrège les archives trimestrielles par trimestre', async () => {
  getAllArchives.mockResolvedValue([
    { studentId: 1, trimester: 1, merits: 2, detentions: 0, totalTicks: 9, totalCrosses: 1, archivedAt: daysAgo(40) },
    { studentId: 2, trimester: 1, merits: 1, detentions: 1, totalTicks: 4, totalCrosses: 6, archivedAt: daysAgo(40) }
  ]);

  const stats = await getClassroomStatistics({ period: 'week', classId: null });

  expect(stats.archives).toHaveLength(1);
  expect(stats.archives[0]).toMatchObject({ trimester: 1, students: 2, merits: 3, detentions: 1 });
});
