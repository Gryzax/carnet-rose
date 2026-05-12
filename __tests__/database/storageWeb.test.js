jest.mock('localforage', () => {
  const data = new Map();
  return {
    createInstance: jest.fn(() => ({
      getItem: jest.fn((key) => Promise.resolve(data.get(key) || null)),
      setItem: jest.fn((key, value) => {
        data.set(key, value);
        return Promise.resolve(value);
      }),
      clear: jest.fn(() => {
        data.clear();
        return Promise.resolve();
      })
    }))
  };
});

import { getDb, migrate, seedDemo } from '../../database/storage.web';

test('stockage web: seed demo persiste classes et eleves dans IndexedDB', async () => {
  const db = await getDb();
  await migrate(db);
  await seedDemo(db);

  const classes = await db.getAllAsync(`
    SELECT c.*, COUNT(e.id) as nombreEleves, COALESCE(SUM(e.merites), 0) as totalMerites, COALESCE(SUM(e.retenues), 0) as totalRetenues
    FROM classes c LEFT JOIN eleves e ON e.classeId = c.id
    GROUP BY c.id ORDER BY c.nom COLLATE NOCASE
  `);
  const students = await db.getAllAsync('SELECT * FROM eleves WHERE classeId = ? ORDER BY nom COLLATE NOCASE, prenom COLLATE NOCASE', classes[0].id);

  expect(classes).toHaveLength(2);
  expect(classes[0].nombreEleves).toBe(5);
  expect(students).toHaveLength(5);
});

test('stockage web: compteurs, historique et annulation utilisent la meme API que SQLite', async () => {
  const db = await getDb();
  const student = await db.getFirstAsync('SELECT * FROM eleves WHERE id = ?', 1);

  await db.runAsync('UPDATE eleves SET ticks = ?, croix = ?, merites = ?, retenues = ?, trimestreActuel = ? WHERE id = ?', 2, 1, 0, 0, 1, student.id);
  await db.runAsync(
    'INSERT INTO evenements (eleveId, type, raison, trimestre, creeLe, previousTicks, previousCroix, newTicks, newCroix, annule) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)',
    student.id, 'tick', 'Participation', 1, new Date().toISOString(), student.ticks, student.croix, 2, 1
  );

  const updated = await db.getFirstAsync('SELECT * FROM eleves WHERE id = ?', student.id);
  const event = await db.getFirstAsync('SELECT * FROM evenements WHERE eleveId = ? AND annule = 0 ORDER BY creeLe DESC, id DESC LIMIT 1', student.id);
  await db.runAsync('UPDATE evenements SET annule = 1 WHERE id = ?', event.id);
  const history = await db.getAllAsync('SELECT * FROM evenements WHERE eleveId = ? AND trimestre = ? ORDER BY creeLe DESC', student.id, 1);

  expect(updated.ticks).toBe(2);
  expect(event.type).toBe('tick');
  expect(history[0].annule).toBe(1);
});

test('stockage web: reset trimestriel archive puis remet les compteurs a zero', async () => {
  const db = await getDb();
  const students = await db.getAllAsync('SELECT e.*, c.nom as classeNom FROM eleves e JOIN classes c ON c.id = e.classeId');

  await db.runAsync('INSERT INTO archive_trimestre (eleveId, trimestre, merites, retenues, totalTicks, totalCroix, archiveLe) VALUES (?, ?, ?, ?, ?, ?, ?)', students[0].id, 1, students[0].merites, students[0].retenues, students[0].ticks, students[0].croix, new Date().toISOString());
  await db.runAsync('UPDATE eleves SET ticks = 0, croix = 0, merites = 0, retenues = 0, trimestreActuel = trimestreActuel + 1');

  const archives = await db.getAllAsync('SELECT * FROM archive_trimestre WHERE eleveId = ? ORDER BY archiveLe DESC', students[0].id);
  const resetStudent = await db.getFirstAsync('SELECT * FROM eleves WHERE id = ?', students[0].id);

  expect(archives).toHaveLength(1);
  expect(resetStudent.ticks).toBe(0);
  expect(resetStudent.trimestreActuel).toBe(2);
});
