jest.mock('../../models/studentModel', () => ({
  getAllStudents: jest.fn(),
  getStudentById: jest.fn(),
}));
jest.mock('../../models/historyModel', () => ({
  getLastActiveEvent: jest.fn(),
}));
jest.mock('../../repositories/studentRepository', () => ({
  saveStudent: jest.fn(() => Promise.resolve()),
  removeStudent: jest.fn(() => Promise.resolve()),
}));
jest.mock('../../repositories/classRepository', () => ({
  touchClass: jest.fn(() => Promise.resolve()),
}));
jest.mock('../../repositories/historyRepository', () => ({
  saveEvent: jest.fn(() => Promise.resolve()),
  removeEvent: jest.fn(() => Promise.resolve()),
  saveArchive: jest.fn(() => Promise.resolve()),
}));

import {
  addCross,
  addForgot,
  addTick,
  resetTrimester,
  undoLastAction,
} from '../../domain/studentService';
import { getAllStudents, getStudentById } from '../../models/studentModel';
import { getLastActiveEvent } from '../../models/historyModel';
import { saveStudent } from '../../repositories/studentRepository';
import { touchClass } from '../../repositories/classRepository';
import { saveArchive, saveEvent } from '../../repositories/historyRepository';

const student = {
  id: 's1',
  classId: 'c5',
  firstName: 'Emma',
  lastName: 'Martin',
  ticks: 0,
  crosses: 0,
  merits: 0,
  detentions: 0,
  forgets: 0,
  currentTrimester: 1,
};

beforeEach(() => jest.clearAllMocks());

test('addTick: normal case writes through repositories', async () => {
  const res = await addTick(student, 'Participation');
  expect(res.student.ticks).toBe(1);
  expect(res.meritObtained).toBe(false);
  expect(saveStudent).toHaveBeenCalledWith(expect.objectContaining({ ticks: 1 }));
  expect(touchClass).toHaveBeenCalledWith('c5');
  expect(saveEvent).toHaveBeenCalledWith(
    expect.objectContaining({
      type: 'tick',
      previousTicks: 0,
      newTicks: 1,
      reason: 'Participation',
    }),
  );
});

test('addTick does not touch existing crosses', async () => {
  const res = await addTick({ ...student, crosses: 2 });
  expect(res.student.crosses).toBe(2);
  expect(res.student.ticks).toBe(1);
});

test('merit triggered at 4 ticks', async () => {
  const res = await addTick({ ...student, ticks: 3 });
  expect(res.meritObtained).toBe(true);
  expect(res.student.ticks).toBe(0);
  expect(res.student.merits).toBe(1);
});

test('addCross: normal case writes through repositories', async () => {
  const res = await addCross(student, 'Comportement');
  expect(res.student.crosses).toBe(1);
  expect(res.detentionTriggered).toBe(false);
  expect(saveStudent).toHaveBeenCalledWith(expect.objectContaining({ crosses: 1 }));
  expect(touchClass).toHaveBeenCalledWith('c5');
  expect(saveEvent).toHaveBeenCalledWith(
    expect.objectContaining({ type: 'cross', previousCrosses: 0, newCrosses: 1 }),
  );
});

test('addCross does not touch existing ticks', async () => {
  const res = await addCross({ ...student, ticks: 2 });
  expect(res.student.ticks).toBe(2);
  expect(res.student.crosses).toBe(1);
});

test('detention triggered at 4 crosses', async () => {
  const res = await addCross({ ...student, crosses: 3 });
  expect(res.detentionTriggered).toBe(true);
  expect(res.student.crosses).toBe(0);
  expect(res.student.detentions).toBe(1);
});

test('addForgot increments the standalone counter and writes a forgot event', async () => {
  const res = await addForgot({ ...student, ticks: 2, crosses: 1, forgets: 1 });
  expect(res.student.forgets).toBe(2);
  // It must not touch ticks, crosses, merits or detentions.
  expect(res.student.ticks).toBe(2);
  expect(res.student.crosses).toBe(1);
  expect(saveStudent).toHaveBeenCalledWith(expect.objectContaining({ forgets: 2 }));
  expect(touchClass).toHaveBeenCalledWith('c5');
  expect(saveEvent).toHaveBeenCalledWith(
    expect.objectContaining({ type: 'forgot', previousForgets: 1, newForgets: 2, reason: null }),
  );
});

test('undo within 30 seconds restores the previous counters', async () => {
  getLastActiveEvent.mockResolvedValue({
    id: 'e9',
    createdAt: new Date().toISOString(),
    previousTicks: 1,
    previousCrosses: 0,
    previousForgets: 3,
  });
  getStudentById.mockResolvedValue({ ...student, ticks: 2, forgets: 4 });
  const res = await undoLastAction('s1');
  expect(res.cancelled).toBe(true);
  expect(saveStudent).toHaveBeenCalledWith(
    expect.objectContaining({ ticks: 1, crosses: 0, forgets: 3 }),
  );
  expect(saveEvent).toHaveBeenCalledWith(expect.objectContaining({ id: 'e9', cancelled: 1 }));
});

test('undo refused after 30 seconds', async () => {
  getLastActiveEvent.mockResolvedValue({
    id: 'e9',
    createdAt: new Date(Date.now() - 31000).toISOString(),
    previousTicks: 1,
    previousCrosses: 0,
  });
  const res = await undoLastAction('s1');
  expect(res.cancelled).toBe(false);
});

test('resetTrimester archives every student and resets counters', async () => {
  getAllStudents.mockResolvedValue([
    { ...student, id: 's1', merits: 2, detentions: 1 },
    { ...student, id: 's2', merits: 1, detentions: 0 },
  ]);
  const res = await resetTrimester(1);
  expect(saveArchive).toHaveBeenCalledTimes(2);
  expect(saveStudent).toHaveBeenCalledTimes(2);
  expect(saveStudent).toHaveBeenCalledWith(
    expect.objectContaining({
      ticks: 0,
      crosses: 0,
      merits: 0,
      detentions: 0,
      currentTrimester: 2,
    }),
  );
  expect(res.totalStudents).toBe(2);
  expect(res.totalMerits).toBe(3);
  expect(res.totalDetentions).toBe(1);
});
