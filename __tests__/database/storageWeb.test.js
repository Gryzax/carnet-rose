jest.mock('localforage', () => {
  const stores = new Map();
  const getStore = (name = 'default') => {
    if (!stores.has(name)) stores.set(name, new Map());
    return stores.get(name);
  };
  return {
    __stores: stores,
    createInstance: jest.fn((options = {}) => {
      const data = getStore(options.name);
      return {
      getItem: jest.fn((key) => Promise.resolve(data.get(key) || null)),
      setItem: jest.fn((key, value) => {
        data.set(key, value);
        return Promise.resolve(value);
      }),
      clear: jest.fn(() => {
        data.clear();
        return Promise.resolve();
      })
      };
    })
  };
});

import localforage from 'localforage';
import { getDb, migrate, seedDemo } from '../../database/storage.web';

test('stockage web: migre les donnees Klassia vers CarnetRose', async () => {
  const legacyState = {
    classes: [{ id: 1, nom: 'Classe migrée', creeLe: 'now', derniereUtilisation: 'now' }],
    eleves: [],
    evenements: [],
    archive_trimestre: [],
    seq: { classes: 1, eleves: 0, evenements: 0, archive_trimestre: 0 }
  };
  localforage.__stores.get('Klassia').set('state:v1', legacyState);

  const db = await getDb();
  const classes = await db.getAllAsync(`
    SELECT c.*, COUNT(e.id) as nombreEleves, COALESCE(SUM(e.merites), 0) as totalMerites, COALESCE(SUM(e.retenues), 0) as totalRetenues
    FROM classes c LEFT JOIN eleves e ON e.classeId = c.id
    GROUP BY c.id ORDER BY c.nom COLLATE NOCASE
  `);

  expect(classes).toEqual([expect.objectContaining({ nom: 'Classe migrée' })]);
  expect(localforage.__stores.get('CarnetRose').get('state:v1')).toEqual(legacyState);

  localforage.__stores.get('Klassia').clear();
  localforage.__stores.get('CarnetRose').clear();
});

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

test('stockage web: ajout de classe persiste dans IndexedDB', async () => {
  const db = await getDb();
  await db.runAsync('INSERT INTO classes (nom, creeLe, derniereUtilisation) VALUES (?, datetime("now"), datetime("now"))', '4e Rose');

  const classes = await db.getAllAsync(`
    SELECT c.*, COUNT(e.id) as nombreEleves, COALESCE(SUM(e.merites), 0) as totalMerites, COALESCE(SUM(e.retenues), 0) as totalRetenues
    FROM classes c LEFT JOIN eleves e ON e.classeId = c.id
    GROUP BY c.id ORDER BY c.nom COLLATE NOCASE
  `);

  expect(classes).toEqual(expect.arrayContaining([expect.objectContaining({ nom: '4e Rose', nombreEleves: 0 })]));
});

test('stockage web: suppression de classe supprime les donnees liees', async () => {
  const db = await getDb();
  const classResult = await db.runAsync('INSERT INTO classes (nom, creeLe, derniereUtilisation) VALUES (?, datetime("now"), datetime("now"))', 'Classe a supprimer');
  const studentResult = await db.runAsync('INSERT INTO eleves (classeId, prenom, nom, ticks, croix, merites, retenues, trimestreActuel) VALUES (?, ?, ?, ?, ?, ?, ?, 1)', classResult.lastInsertRowId, 'Ada', 'Lovelace', 1, 0, 0, 0);
  await db.runAsync(
    'INSERT INTO evenements (eleveId, type, raison, trimestre, creeLe, previousTicks, previousCroix, newTicks, newCroix, annule) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)',
    studentResult.lastInsertRowId, 'tick', 'Participation', 1, new Date().toISOString(), 0, 0, 1, 0
  );
  await db.runAsync('INSERT INTO archive_trimestre (eleveId, trimestre, merites, retenues, totalTicks, totalCroix, archiveLe) VALUES (?, ?, ?, ?, ?, ?, ?)', studentResult.lastInsertRowId, 1, 0, 0, 1, 0, new Date().toISOString());

  await db.runAsync('DELETE FROM evenements WHERE eleveId IN (SELECT id FROM eleves WHERE classeId = ?)', classResult.lastInsertRowId);
  await db.runAsync('DELETE FROM archive_trimestre WHERE eleveId IN (SELECT id FROM eleves WHERE classeId = ?)', classResult.lastInsertRowId);
  await db.runAsync('DELETE FROM eleves WHERE classeId = ?', classResult.lastInsertRowId);
  await db.runAsync('DELETE FROM classes WHERE id = ?', classResult.lastInsertRowId);

  const classes = await db.getAllAsync(`
    SELECT c.*, COUNT(e.id) as nombreEleves, COALESCE(SUM(e.merites), 0) as totalMerites, COALESCE(SUM(e.retenues), 0) as totalRetenues
    FROM classes c LEFT JOIN eleves e ON e.classeId = c.id
    GROUP BY c.id ORDER BY c.nom COLLATE NOCASE
  `);
  const deletedStudent = await db.getFirstAsync('SELECT * FROM eleves WHERE id = ?', studentResult.lastInsertRowId);
  const deletedHistory = await db.getAllAsync('SELECT * FROM evenements WHERE eleveId = ? AND trimestre = ? ORDER BY creeLe DESC', studentResult.lastInsertRowId, 1);
  const deletedArchives = await db.getAllAsync('SELECT * FROM archive_trimestre WHERE eleveId = ? ORDER BY archiveLe DESC', studentResult.lastInsertRowId);

  expect(classes).not.toEqual(expect.arrayContaining([expect.objectContaining({ id: classResult.lastInsertRowId })]));
  expect(deletedStudent).toBeNull();
  expect(deletedHistory).toHaveLength(0);
  expect(deletedArchives).toHaveLength(0);
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

test('stockage web: les donnees marquees deleted_at ne sont pas affichees', async () => {
  localforage.__stores.get('CarnetRose').clear();
  localforage.__stores.get('CarnetRose').set('state:v1', {
    classes: [
      { id: 1, nom: '6e Rose', creeLe: 'now', derniereUtilisation: 'now', deleted_at: '2026-01-01T00:00:00.000Z' },
      { id: 2, nom: '4e Rose', creeLe: 'now', derniereUtilisation: 'now' }
    ],
    eleves: [
      { id: 1, classeId: 1, prenom: 'Demo', nom: 'Supprime', ticks: 0, croix: 0, merites: 0, retenues: 0, trimestreActuel: 1 },
      { id: 2, classeId: 2, prenom: 'Ada', nom: 'Lovelace', ticks: 0, croix: 0, merites: 0, retenues: 0, trimestreActuel: 1 }
    ],
    evenements: [],
    archive_trimestre: [],
    seq: { classes: 2, eleves: 2, evenements: 0, archive_trimestre: 0 }
  });

  const db = await getDb();
  const classes = await db.getAllAsync(`
    SELECT c.*, COUNT(e.id) as nombreEleves, COALESCE(SUM(e.merites), 0) as totalMerites, COALESCE(SUM(e.retenues), 0) as totalRetenues
    FROM classes c LEFT JOIN eleves e ON e.classeId = c.id
    GROUP BY c.id ORDER BY c.nom COLLATE NOCASE
  `);
  const students = await db.getAllAsync('SELECT e.*, c.nom as classeNom FROM eleves e JOIN classes c ON c.id = e.classeId');

  expect(classes).toEqual([expect.objectContaining({ nom: '4e Rose', nombreEleves: 1 })]);
  expect(classes).not.toEqual(expect.arrayContaining([expect.objectContaining({ nom: '6e Rose' })]));
  expect(students).toEqual([expect.objectContaining({ prenom: 'Ada', classeNom: '4e Rose' })]);
});
