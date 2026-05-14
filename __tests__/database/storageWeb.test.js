jest.mock('localforage', () => {
  const stores = new Map();
  const getBucket = (name = 'default') => {
    if (!stores.has(name)) stores.set(name, new Map());
    return stores.get(name);
  };
  return {
    __stores: stores,
    createInstance: jest.fn((options = {}) => {
      const data = getBucket(options.name + ':' + (options.storeName || ''));
      return {
        getItem: jest.fn((key) => Promise.resolve(data.get(key) ?? null)),
        setItem: jest.fn((key, value) => {
          data.set(key, value);
          return Promise.resolve(value);
        }),
        removeItem: jest.fn((key) => {
          data.delete(key);
          return Promise.resolve();
        })
      };
    })
  };
});

import { getStore } from '../../database/storage.web';

const classRow = { id: 'c1', name: '4e Rose', createdAt: 'now', lastUsedAt: 'now' };

test('stockage web: put puis get/all retournent la ligne', async () => {
  const store = await getStore();
  await store.put('classes', classRow);

  expect(await store.get('classes', 'c1')).toEqual(classRow);
  expect(await store.all('classes')).toEqual([classRow]);
});

test('stockage web: put écrase la ligne existante (upsert par id)', async () => {
  const store = await getStore();
  await store.put('classes', classRow);
  await store.put('classes', { ...classRow, name: '4e Pivoine' });

  const all = await store.all('classes');
  expect(all).toHaveLength(1);
  expect(all[0].name).toBe('4e Pivoine');
});

test('stockage web: remove supprime la ligne', async () => {
  const store = await getStore();
  await store.put('classes', classRow);
  await store.remove('classes', 'c1');

  expect(await store.get('classes', 'c1')).toBeNull();
  expect(await store.all('classes')).toEqual([]);
});

test('stockage web: replaceAll remplace tout le contenu de la table', async () => {
  const store = await getStore();
  await store.put('students', { id: 's1', classId: 'c1' });
  await store.replaceAll('students', [
    { id: 's2', classId: 'c1' },
    { id: 's3', classId: 'c1' }
  ]);

  const ids = (await store.all('students')).map((row) => row.id);
  expect(ids).toEqual(['s2', 's3']);
});

test('stockage web: putMany insère et met à jour en lot', async () => {
  const store = await getStore();
  await store.put('outbox', { id: 'o1', entity: 'class' });
  await store.putMany('outbox', [
    { id: 'o1', entity: 'class', attempts: 1 },
    { id: 'o2', entity: 'student' }
  ]);

  const all = await store.all('outbox');
  expect(all).toHaveLength(2);
  expect(all.find((row) => row.id === 'o1').attempts).toBe(1);
});

test('stockage web: les données persistent entre deux getStore', async () => {
  const first = await getStore();
  await first.put('classes', classRow);

  const second = await getStore();
  expect(await second.all('classes')).toEqual([classRow]);
});
