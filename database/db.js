import { getDb, migrate, seedDemo } from './storage';

export { getDb, migrate, seedDemo };

export const ENABLE_DEMO_SEED = process.env.EXPO_PUBLIC_ENABLE_DEMO_SEED === 'true';

export const initDatabase = async () => {
  const conn = await getDb();
  await migrate(conn);
  if (ENABLE_DEMO_SEED) await seedDemo(conn);
  return conn;
};
