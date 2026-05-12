import { getDb, migrate, seedDemo } from './storage';

export { getDb, migrate, seedDemo };

export const initDatabase = async () => {
  const conn = await getDb();
  await migrate(conn);
  await seedDemo(conn);
  return conn;
};
