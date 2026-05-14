import { createMemStore } from '../../test-utils/memStore';
import { seedDemo } from '../../database/db';

test('seedDemo crée deux classes et dix élèves avec des UUID', async () => {
  const store = createMemStore();
  await seedDemo(store);

  expect(store.tables.classes).toHaveLength(2);
  expect(store.tables.students).toHaveLength(10);
  for (const classRow of store.tables.classes) {
    expect(typeof classRow.id).toBe('string');
    expect(classRow.id.length).toBeGreaterThan(8);
  }
  // Every student points at one of the seeded classes.
  const classIds = new Set(store.tables.classes.map((c) => c.id));
  for (const student of store.tables.students) {
    expect(classIds.has(student.classId)).toBe(true);
  }
});

test('seedDemo est ignoré si le cache contient déjà des classes', async () => {
  const store = createMemStore({
    classes: [{ id: 'c1', name: 'Déjà là', createdAt: 'now', lastUsedAt: 'now' }]
  });
  await seedDemo(store);

  expect(store.tables.classes).toHaveLength(1);
  expect(store.tables.students).toHaveLength(0);
});
