import { getClassById, getClasses } from '../models/classModel';
import { removeClass, saveClass, touchClass } from '../repositories/classRepository';
import { nowIso } from '../utils/date';
import { uuid } from '../utils/uuid';
import type { ClassRow, ClassWithStats } from '../types/domain';

// Class business logic. Cache + Supabase write-through and reactive
// invalidation are handled by the class repository.

export type ClassSort = 'alpha' | 'recent';

const idOf = (classRow: ClassRow | string | null | undefined): string | undefined =>
  typeof classRow === 'object' && classRow ? classRow.id : classRow || undefined;

export const loadClasses = async (sort: ClassSort = 'alpha'): Promise<ClassWithStats[]> => {
  const classes = await getClasses();
  if (sort === 'recent') {
    return [...classes].sort((a, b) =>
      String(b.lastUsedAt || '').localeCompare(String(a.lastUsedAt || '')),
    );
  }
  return classes;
};

export const addClass = async (name: string): Promise<ClassRow> => {
  const normalizedName = String(name || '').trim();
  if (!normalizedName) throw new Error('Class name is required.');
  const classRow: ClassRow = {
    id: uuid(),
    name: normalizedName,
    createdAt: nowIso(),
    lastUsedAt: nowIso(),
  };
  await saveClass(classRow);
  return classRow;
};

export const updateClass = async (classRow: ClassRow | string, name: string): Promise<ClassRow> => {
  const id = idOf(classRow);
  if (!id) throw new Error('Class not found.');
  const normalizedName = String(name || '').trim();
  if (!normalizedName) throw new Error('Class name is required.');
  const current = await getClassById(id);
  if (!current) throw new Error('Class not found.');
  const next: ClassRow = { ...current, name: normalizedName };
  await saveClass(next);
  return next;
};

export const deleteClass = async (classRow: ClassRow | string): Promise<void> => {
  const id = idOf(classRow);
  if (!id) throw new Error('Class not found.');
  await removeClass(id);
};

export const markClassUsed = async (classRow: ClassRow | string): Promise<void> => {
  const id = idOf(classRow);
  if (!id) return;
  await touchClass(id);
};
