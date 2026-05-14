const loadDbModule = async (enableDemoSeed) => {
  jest.resetModules();
  process.env.EXPO_PUBLIC_ENABLE_DEMO_SEED = enableDemoSeed;
  const mockConn = {};
  const getDb = jest.fn(() => Promise.resolve(mockConn));
  const migrate = jest.fn(() => Promise.resolve());
  const seedDemo = jest.fn(() => Promise.resolve());
  jest.doMock('../../database/storage', () => ({ getDb, migrate, seedDemo }));
  const dbModule = require('../../database/db');
  await dbModule.initDatabase();
  return { getDb, migrate, seedDemo, mockConn, dbModule };
};

afterEach(() => {
  delete process.env.EXPO_PUBLIC_ENABLE_DEMO_SEED;
  jest.dontMock('../../database/storage');
  jest.resetModules();
});

test('initDatabase ne lance aucun seed automatique par defaut', async () => {
  const { migrate, seedDemo, mockConn, dbModule } = await loadDbModule(undefined);

  expect(dbModule.ENABLE_DEMO_SEED).toBe(false);
  expect(migrate).toHaveBeenCalledWith(mockConn);
  expect(seedDemo).not.toHaveBeenCalled();
});

test('initDatabase lance le seed demo uniquement si explicitement active', async () => {
  const { seedDemo, mockConn, dbModule } = await loadDbModule('true');

  expect(dbModule.ENABLE_DEMO_SEED).toBe(true);
  expect(seedDemo).toHaveBeenCalledWith(mockConn);
});
