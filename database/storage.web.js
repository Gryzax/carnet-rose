import localforage from 'localforage';

const store = localforage.createInstance({ name: 'CarnetRose', storeName: 'database' });
const legacyStore = localforage.createInstance({ name: 'Klassia', storeName: 'database' });
const STORAGE_KEY = 'state:v1';

const emptyState = () => ({
  classes: [],
  eleves: [],
  evenements: [],
  archive_trimestre: [],
  seq: { classes: 0, eleves: 0, evenements: 0, archive_trimestre: 0 }
});

const now = () => new Date().toISOString();

const normalizeSql = (sql) => String(sql).replace(/\s+/g, ' ').trim().toLowerCase();

const loadState = async () => {
  const state = await store.getItem(STORAGE_KEY);
  if (state) return state;
  const legacyState = await legacyStore.getItem(STORAGE_KEY);
  if (legacyState) {
    await store.setItem(STORAGE_KEY, legacyState);
    return legacyState;
  }
  return emptyState();
};

const saveState = (state) => store.setItem(STORAGE_KEY, state);

const nextId = (state, table) => {
  state.seq[table] += 1;
  return state.seq[table];
};

const byName = (a, b) => String(a.nom).localeCompare(String(b.nom), 'fr', { sensitivity: 'base' });

const isActive = (item) => !item?.deleted_at && !item?.deletedAt;

const createWebDb = () => ({
  execAsync: async () => {
    const state = await loadState();
    await saveState(state);
  },

  getFirstAsync: async (sql, ...args) => {
    const query = normalizeSql(sql);
    const state = await loadState();

    if (query.includes('select count(*) as count from classes')) return { count: state.classes.filter(isActive).length };
    if (query.includes('select * from eleves where id = ?')) {
      return state.eleves.find((student) => student.id === args[0] && isActive(student)) || null;
    }
    if (query.includes('select * from classes where id = ?')) {
      return state.classes.find((classe) => classe.id === args[0] && isActive(classe)) || null;
    }
    if (query.includes('select * from evenements where eleveid = ? and annule = 0')) {
      return state.evenements
        .filter((event) => event.eleveId === args[0] && event.annule === 0 && isActive(event))
        .sort((a, b) => String(b.creeLe).localeCompare(String(a.creeLe)) || b.id - a.id)[0] || null;
    }

    throw new Error(`Unsupported web getFirstAsync query: ${sql}`);
  },

  getAllAsync: async (sql, ...args) => {
    const query = normalizeSql(sql);
    const state = await loadState();

    if (query.includes('from classes c left join eleves e')) {
      return [...state.classes].filter(isActive).sort(byName).map((classe) => {
        const students = state.eleves.filter((student) => student.classeId === classe.id && isActive(student));
        return {
          ...classe,
          nombreEleves: students.length,
          totalMerites: students.reduce((sum, student) => sum + student.merites, 0),
          totalRetenues: students.reduce((sum, student) => sum + student.retenues, 0)
        };
      });
    }
    if (query.includes('select * from eleves where classeid = ?')) {
      return state.eleves
        .filter((student) => student.classeId === args[0] && isActive(student))
        .sort((a, b) => String(a.nom).localeCompare(String(b.nom), 'fr', { sensitivity: 'base' }) || String(a.prenom).localeCompare(String(b.prenom), 'fr', { sensitivity: 'base' }));
    }
    if (query.includes('from eleves e join classes c')) {
      return state.eleves.filter((student) => {
        const classe = state.classes.find((item) => item.id === student.classeId);
        return isActive(student) && isActive(classe);
      }).map((student) => ({
        ...student,
        classeNom: state.classes.find((classe) => classe.id === student.classeId && isActive(classe))?.nom || ''
      }));
    }
    if (query.includes('select * from evenements where eleveid = ? and trimestre = ?')) {
      return state.evenements
        .filter((event) => event.eleveId === args[0] && event.trimestre === args[1] && isActive(event))
        .sort((a, b) => String(b.creeLe).localeCompare(String(a.creeLe)));
    }
    if (query.includes('select * from archive_trimestre where eleveid = ?')) {
      return state.archive_trimestre
        .filter((archive) => archive.eleveId === args[0] && isActive(archive))
        .sort((a, b) => String(b.archiveLe).localeCompare(String(a.archiveLe)));
    }
    if (query.includes('select * from evenements order by creele asc')) {
      return [...state.evenements].filter(isActive).sort((a, b) => String(a.creeLe).localeCompare(String(b.creeLe)) || a.id - b.id);
    }
    if (query.includes('select * from archive_trimestre order by archivele asc')) {
      return [...state.archive_trimestre].filter(isActive).sort((a, b) => String(a.archiveLe).localeCompare(String(b.archiveLe)) || a.id - b.id);
    }

    throw new Error(`Unsupported web getAllAsync query: ${sql}`);
  },

  runAsync: async (sql, ...args) => {
    const query = normalizeSql(sql);
    const state = await loadState();
    let id = 0;

    if (query.startsWith('insert into classes')) {
      id = nextId(state, 'classes');
      state.classes.push({ id, nom: args[0], creeLe: now(), derniereUtilisation: now() });
    } else if (query.startsWith('insert into eleves')) {
      id = nextId(state, 'eleves');
      state.eleves.push({
        id,
        classeId: args[0],
        prenom: args[1],
        nom: args[2],
        ticks: args[3] ?? 0,
        croix: args[4] ?? 0,
        merites: args[5] ?? 0,
        retenues: args[6] ?? 0,
        trimestreActuel: 1
      });
    } else if (query.startsWith('update classes set derniereutilisation')) {
      const classe = state.classes.find((item) => item.id === args[0]);
      if (classe) classe.derniereUtilisation = now();
    } else if (query.startsWith('delete from evenements where eleveid in')) {
      const classId = args[0];
      const studentIds = state.eleves.filter((student) => student.classeId === classId).map((student) => student.id);
      state.evenements = state.evenements.filter((event) => !studentIds.includes(event.eleveId));
    } else if (query.startsWith('delete from evenements where eleveid = ?')) {
      state.evenements = state.evenements.filter((event) => event.eleveId !== args[0]);
    } else if (query.startsWith('delete from archive_trimestre where eleveid in')) {
      const classId = args[0];
      const studentIds = state.eleves.filter((student) => student.classeId === classId).map((student) => student.id);
      state.archive_trimestre = state.archive_trimestre.filter((archive) => !studentIds.includes(archive.eleveId));
    } else if (query.startsWith('delete from archive_trimestre where eleveid = ?')) {
      state.archive_trimestre = state.archive_trimestre.filter((archive) => archive.eleveId !== args[0]);
    } else if (query.startsWith('delete from eleves where classeid = ?')) {
      state.eleves = state.eleves.filter((student) => student.classeId !== args[0]);
    } else if (query.startsWith('delete from eleves where id = ?')) {
      state.eleves = state.eleves.filter((student) => student.id !== args[0]);
    } else if (query.startsWith('delete from classes where id = ?')) {
      state.classes = state.classes.filter((classe) => classe.id !== args[0]);
    } else if (query.startsWith('update eleves set ticks = ?, croix = ?')) {
      const student = state.eleves.find((item) => item.id === args[5]);
      if (student) Object.assign(student, { ticks: args[0], croix: args[1], merites: args[2], retenues: args[3], trimestreActuel: args[4] });
    } else if (query.startsWith('update eleves set ticks = 0')) {
      state.eleves = state.eleves.map((student) => ({ ...student, ticks: 0, croix: 0, merites: 0, retenues: 0, trimestreActuel: student.trimestreActuel + 1 }));
    } else if (query.startsWith('insert into evenements')) {
      id = nextId(state, 'evenements');
      state.evenements.push({
        id,
        eleveId: args[0],
        type: args[1],
        raison: args[2],
        trimestre: args[3],
        creeLe: args[4],
        previousTicks: args[5],
        previousCroix: args[6],
        newTicks: args[7],
        newCroix: args[8],
        annule: 0
      });
    } else if (query.startsWith('update evenements set annule = 1')) {
      const event = state.evenements.find((item) => item.id === args[0]);
      if (event) event.annule = 1;
    } else if (query.startsWith('insert into archive_trimestre')) {
      id = nextId(state, 'archive_trimestre');
      state.archive_trimestre.push({
        id,
        eleveId: args[0],
        trimestre: args[1],
        merites: args[2],
        retenues: args[3],
        totalTicks: args[4],
        totalCroix: args[5],
        archiveLe: args[6]
      });
    } else {
      throw new Error(`Unsupported web runAsync query: ${sql}`);
    }

    await saveState(state);
    return { lastInsertRowId: id };
  }
});

let db;

export const getDb = async () => {
  if (!db) db = createWebDb();
  return db;
};

export const migrate = async (database = null) => {
  const conn = database || await getDb();
  await conn.execAsync('');
};

export const seedDemo = async (database = null) => {
  const conn = database || await getDb();
  const count = await conn.getFirstAsync('SELECT COUNT(*) as count FROM classes');
  if (count.count > 0) return;
  const classes = ['6e Rose', '5e Pivoine'];
  const students = [
    ['Emma', 'Martin'], ['Lucas', 'Bernard'], ['Ines', 'Petit'], ['Noah', 'Robert'], ['Lina', 'Durand'],
    ['Hugo', 'Moreau'], ['Chloe', 'Simon'], ['Adam', 'Laurent'], ['Zoe', 'Lefevre'], ['Nina', 'Michel']
  ];
  for (let c = 0; c < classes.length; c += 1) {
    const res = await conn.runAsync('INSERT INTO classes (nom, creeLe, derniereUtilisation) VALUES (?, datetime("now"), datetime("now"))', classes[c]);
    for (let i = 0; i < 5; i += 1) {
      const s = students[c * 5 + i];
      await conn.runAsync('INSERT INTO eleves (classeId, prenom, nom, ticks, croix, merites, retenues, trimestreActuel) VALUES (?, ?, ?, ?, ?, ?, ?, 1)', res.lastInsertRowId, s[0], s[1], i % 4, (i + c) % 4, Math.floor(i / 3), c === 1 && i === 4 ? 1 : 0);
    }
  }
};
