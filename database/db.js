import * as SQLite from 'expo-sqlite';

let db;

export const getDb = async () => {
  if (!db) db = await SQLite.openDatabaseAsync('carnet_rose.db');
  return db;
};

export const migrate = async (database = null) => {
  const conn = database || await getDb();
  await conn.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS classes (id INTEGER PRIMARY KEY AUTOINCREMENT, nom TEXT NOT NULL, creeLe TEXT NOT NULL, derniereUtilisation TEXT);
    CREATE TABLE IF NOT EXISTS eleves (id INTEGER PRIMARY KEY AUTOINCREMENT, classeId INTEGER NOT NULL, prenom TEXT NOT NULL, nom TEXT NOT NULL, ticks INTEGER DEFAULT 0, croix INTEGER DEFAULT 0, merites INTEGER DEFAULT 0, retenues INTEGER DEFAULT 0, trimestreActuel INTEGER DEFAULT 1, FOREIGN KEY(classeId) REFERENCES classes(id));
    CREATE TABLE IF NOT EXISTS evenements (id INTEGER PRIMARY KEY AUTOINCREMENT, eleveId INTEGER NOT NULL, type TEXT NOT NULL, raison TEXT, trimestre INTEGER NOT NULL, creeLe TEXT NOT NULL, previousTicks INTEGER NOT NULL, previousCroix INTEGER NOT NULL, newTicks INTEGER NOT NULL, newCroix INTEGER NOT NULL, annule INTEGER DEFAULT 0, FOREIGN KEY(eleveId) REFERENCES eleves(id));
    CREATE TABLE IF NOT EXISTS archive_trimestre (id INTEGER PRIMARY KEY AUTOINCREMENT, eleveId INTEGER NOT NULL, trimestre INTEGER NOT NULL, merites INTEGER NOT NULL, retenues INTEGER NOT NULL, totalTicks INTEGER NOT NULL, totalCroix INTEGER NOT NULL, archiveLe TEXT NOT NULL, FOREIGN KEY(eleveId) REFERENCES eleves(id));
  `);
};

export const seedDemo = async (database = null) => {
  const conn = database || await getDb();
  const count = await conn.getFirstAsync('SELECT COUNT(*) as count FROM classes');
  if (count.count > 0) return;
  const classes = ['6e Rose', '5e Pivoine'];
  const students = [
    ['Emma', 'Martin'], ['Lucas', 'Bernard'], ['Inès', 'Petit'], ['Noah', 'Robert'], ['Lina', 'Durand'],
    ['Hugo', 'Moreau'], ['Chloé', 'Simon'], ['Adam', 'Laurent'], ['Zoé', 'Lefevre'], ['Nina', 'Michel']
  ];
  for (let c = 0; c < classes.length; c += 1) {
    const res = await conn.runAsync('INSERT INTO classes (nom, creeLe, derniereUtilisation) VALUES (?, datetime("now"), datetime("now"))', classes[c]);
    for (let i = 0; i < 5; i += 1) {
      const s = students[c * 5 + i];
      await conn.runAsync('INSERT INTO eleves (classeId, prenom, nom, ticks, croix, merites, retenues, trimestreActuel) VALUES (?, ?, ?, ?, ?, ?, ?, 1)', res.lastInsertRowId, s[0], s[1], i % 4, (i + c) % 4, Math.floor(i / 3), c === 1 && i === 4 ? 1 : 0);
    }
  }
};

export const initDatabase = async () => {
  const conn = await getDb();
  await migrate(conn);
  await seedDemo(conn);
  return conn;
};
