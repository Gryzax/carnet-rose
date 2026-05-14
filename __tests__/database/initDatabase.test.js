const loadDbModule = async (enableDemoSeed) => {
  jest.resetModules();
  process.env.EXPO_PUBLIC_ENABLE_DEMO_SEED = enableDemoSeed;
  const store = { all: jest.fn(() => Promise.resolve([])), put: jest.fn(() => Promise.resolve()) };
  const getStore = jest.fn(() => Promise.resolve(store));
  jest.doMock('../../database/storage', () => ({ getStore }));
  const dbModule = require('../../database/db');
  const seedSpy = jest.spyOn(dbModule, 'seedDemo');
  await dbModule.initDatabase();
  return { getStore, store, seedSpy, dbModule };
};

afterEach(() => {
  delete process.env.EXPO_PUBLIC_ENABLE_DEMO_SEED;
  jest.dontMock('../../database/storage');
  jest.restoreAllMocks();
  jest.resetModules();
});

test('initDatabase ne lance aucun seed automatique par défaut', async () => {
  const { getStore, store, dbModule } = await loadDbModule(undefined);

  expect(dbModule.ENABLE_DEMO_SEED).toBe(false);
  expect(getStore).toHaveBeenCalled();
  // No demo seed: nothing was written to the cache.
  expect(store.put).not.toHaveBeenCalled();
});

test('initDatabase lance le seed démo uniquement si explicitement activé', async () => {
  const { store, dbModule } = await loadDbModule('true');

  expect(dbModule.ENABLE_DEMO_SEED).toBe(true);
  // Demo seed ran: classes + students were written through the store.
  expect(store.put).toHaveBeenCalled();
});
