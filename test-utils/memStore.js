// In-memory CacheStore for tests — mirrors the storage.native / storage.web
// backends without SQLite or localforage. Mock `database/db`'s `getStore` with
// an instance of this in any suite that exercises the model/repository layer.

const createMemStore = (seed = {}) => {
  const tables = {
    classes: [],
    students: [],
    events: [],
    term_archives: [],
    outbox: [],
    ...seed,
  };
  const clone = (rows) => rows.map((row) => ({ ...row }));
  return {
    tables,
    all: jest.fn(async (table) => clone(tables[table] || [])),
    get: jest.fn(async (table, id) => {
      const row = (tables[table] || []).find((item) => item.id === id);
      return row ? { ...row } : null;
    }),
    put: jest.fn(async (table, row) => {
      tables[table] = tables[table] || [];
      const index = tables[table].findIndex((item) => item.id === row.id);
      if (index >= 0) tables[table][index] = { ...row };
      else tables[table].push({ ...row });
    }),
    putMany: jest.fn(async (table, rows) => {
      for (const row of rows) {
        const index = (tables[table] || []).findIndex((item) => item.id === row.id);
        if (index >= 0) tables[table][index] = { ...row };
        else (tables[table] = tables[table] || []).push({ ...row });
      }
    }),
    remove: jest.fn(async (table, id) => {
      tables[table] = (tables[table] || []).filter((item) => item.id !== id);
    }),
    replaceAll: jest.fn(async (table, rows) => {
      tables[table] = clone(rows);
    }),
  };
};

module.exports = { createMemStore };
