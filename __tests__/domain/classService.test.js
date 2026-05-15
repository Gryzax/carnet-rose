jest.mock('../../models/classModel', () => ({
  getClasses: jest.fn(),
  getClassById: jest.fn(),
}));
jest.mock('../../repositories/classRepository', () => ({
  saveClass: jest.fn(() => Promise.resolve()),
  removeClass: jest.fn(() => Promise.resolve()),
  touchClass: jest.fn(() => Promise.resolve()),
}));
jest.mock('../../utils/uuid', () => ({ uuid: jest.fn(() => 'new-id') }));
jest.mock('../../utils/date', () => ({ nowIso: jest.fn(() => '2026-05-15T10:00:00.000Z') }));

import {
  addClass,
  deleteClass,
  loadClasses,
  markClassUsed,
  updateClass,
} from '../../domain/classService';
import { getClassById, getClasses } from '../../models/classModel';
import { removeClass, saveClass, touchClass } from '../../repositories/classRepository';

const classRow = (over = {}) => ({
  id: 'c1',
  name: '6e Rose',
  createdAt: '2026-01-01T00:00:00.000Z',
  lastUsedAt: '2026-01-01T00:00:00.000Z',
  ...over,
});

beforeEach(() => jest.clearAllMocks());

describe('loadClasses', () => {
  test('default alpha sort: returns the model order as-is', async () => {
    const list = [classRow({ id: 'a', name: 'A' }), classRow({ id: 'b', name: 'B' })];
    getClasses.mockResolvedValue(list);
    const out = await loadClasses();
    expect(out).toEqual(list);
  });

  test('recent sort: orders by lastUsedAt desc, missing values last', async () => {
    getClasses.mockResolvedValue([
      classRow({ id: 'old', lastUsedAt: '2025-01-01T00:00:00.000Z' }),
      classRow({ id: 'none', lastUsedAt: undefined }),
      classRow({ id: 'new', lastUsedAt: '2026-05-01T00:00:00.000Z' }),
    ]);
    const out = await loadClasses('recent');
    expect(out.map((c) => c.id)).toEqual(['new', 'old', 'none']);
  });
});

describe('addClass', () => {
  test('persists a trimmed name with fresh id + timestamps', async () => {
    const created = await addClass('  6e Rose  ');
    expect(created).toMatchObject({
      id: 'new-id',
      name: '6e Rose',
      createdAt: '2026-05-15T10:00:00.000Z',
      lastUsedAt: '2026-05-15T10:00:00.000Z',
    });
    expect(saveClass).toHaveBeenCalledWith(created);
  });

  test('rejects an empty/whitespace name and does not persist', async () => {
    await expect(addClass('   ')).rejects.toThrow('Class name is required.');
    await expect(addClass('')).rejects.toThrow('Class name is required.');
    expect(saveClass).not.toHaveBeenCalled();
  });
});

describe('updateClass', () => {
  test('renames an existing class, keeping other fields', async () => {
    const current = classRow({ name: 'Old' });
    getClassById.mockResolvedValue(current);
    const next = await updateClass(current, '  New  ');
    expect(next).toEqual({ ...current, name: 'New' });
    expect(saveClass).toHaveBeenCalledWith(next);
  });

  test('accepts a bare id as well as a class row', async () => {
    const current = classRow({ id: 'c9', name: 'X' });
    getClassById.mockResolvedValue(current);
    const next = await updateClass('c9', 'Y');
    expect(getClassById).toHaveBeenCalledWith('c9');
    expect(next.name).toBe('Y');
  });

  test('rejects when the id is missing', async () => {
    await expect(updateClass(null, 'Whatever')).rejects.toThrow('Class not found.');
    await expect(updateClass('', 'Whatever')).rejects.toThrow('Class not found.');
    expect(saveClass).not.toHaveBeenCalled();
  });

  test('rejects when the name is empty', async () => {
    getClassById.mockResolvedValue(classRow());
    await expect(updateClass('c1', '   ')).rejects.toThrow('Class name is required.');
    expect(saveClass).not.toHaveBeenCalled();
  });

  test('rejects when the row no longer exists', async () => {
    getClassById.mockResolvedValue(null);
    await expect(updateClass('ghost', 'Name')).rejects.toThrow('Class not found.');
    expect(saveClass).not.toHaveBeenCalled();
  });
});

describe('deleteClass', () => {
  test('removes by id (row form)', async () => {
    await deleteClass(classRow({ id: 'c1' }));
    expect(removeClass).toHaveBeenCalledWith('c1');
  });

  test('removes by id (string form)', async () => {
    await deleteClass('c2');
    expect(removeClass).toHaveBeenCalledWith('c2');
  });

  test('rejects when no id can be resolved', async () => {
    await expect(deleteClass(null)).rejects.toThrow('Class not found.');
    expect(removeClass).not.toHaveBeenCalled();
  });
});

describe('markClassUsed', () => {
  test('forwards the id to the repository', async () => {
    await markClassUsed(classRow({ id: 'c7' }));
    expect(touchClass).toHaveBeenCalledWith('c7');
  });

  test('is a silent no-op when no id is given', async () => {
    await markClassUsed(null);
    await markClassUsed('');
    expect(touchClass).not.toHaveBeenCalled();
  });
});
