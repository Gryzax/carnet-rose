import { getStore } from './storage';
import { uuid } from '../utils/uuid';
import { nowIso } from '../utils/date';
import type { CacheStore } from '../types/db';
import type { ClassRow, StudentRow } from '../types/domain';

export { getStore };

export const ENABLE_DEMO_SEED = process.env.EXPO_PUBLIC_ENABLE_DEMO_SEED === 'true';

// Seeds a couple of demo classes when the cache is empty. Backend-agnostic now:
// it just writes domain rows (with UUID ids) through the CacheStore.
export const seedDemo = async (store?: CacheStore): Promise<void> => {
  const cache = store || (await getStore());
  const existing = await cache.all<ClassRow>('classes');
  if (existing.length > 0) return;

  const classNames = ['6e Rose', '5e Pivoine'];
  const studentNames: [string, string][] = [
    ['Emma', 'Martin'], ['Lucas', 'Bernard'], ['Ines', 'Petit'], ['Noah', 'Robert'], ['Lina', 'Durand'],
    ['Hugo', 'Moreau'], ['Chloe', 'Simon'], ['Adam', 'Laurent'], ['Zoe', 'Lefevre'], ['Nina', 'Michel']
  ];

  for (let c = 0; c < classNames.length; c += 1) {
    const classRow: ClassRow = {
      id: uuid(),
      name: classNames[c]!,
      createdAt: nowIso(),
      lastUsedAt: nowIso()
    };
    await cache.put('classes', classRow);
    for (let i = 0; i < 5; i += 1) {
      const [firstName, lastName] = studentNames[c * 5 + i]!;
      const student: StudentRow = {
        id: uuid(),
        classId: classRow.id,
        firstName,
        lastName,
        ticks: i % 4,
        crosses: (i + c) % 4,
        merits: Math.floor(i / 3),
        detentions: c === 1 && i === 4 ? 1 : 0,
        forgets: (i + c) % 3,
        currentTrimester: 1
      };
      await cache.put('students', student);
    }
  }
};

// Wipes every local table (classes, students, events, archives, outbox).
// Used when the user deletes their account so no data lingers on the device.
export const clearLocalData = async (): Promise<void> => {
  const store = await getStore();
  await store.clear();
};

export const initDatabase = async (): Promise<CacheStore> => {
  const store = await getStore();
  if (ENABLE_DEMO_SEED) await seedDemo(store);
  return store;
};
