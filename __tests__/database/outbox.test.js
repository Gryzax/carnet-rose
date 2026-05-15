// Outbox: offline write queue. We test enqueue's coalescing rules, FIFO
// listing, removal, and attempts bumping — all behaviour the sync manager
// relies on, none of which is exercised elsewhere.

// Jest hoists jest.mock() calls; only identifiers prefixed with `mock` may be
// referenced from inside the factory, so the shared store + counters live
// under that prefix.
const mockState = {
  nowCounter: 0,
  uuidCounter: 0,
  tables: new Map(),
};
const mockTable = (name) => {
  if (!mockState.tables.has(name)) mockState.tables.set(name, new Map());
  return mockState.tables.get(name);
};
const mockStore = {
  all: jest.fn((name) => Promise.resolve(Array.from(mockTable(name).values()))),
  get: jest.fn((name, id) => Promise.resolve(mockTable(name).get(id) || null)),
  put: jest.fn((name, row) => {
    mockTable(name).set(row.id, row);
    return Promise.resolve();
  }),
  remove: jest.fn((name, id) => {
    mockTable(name).delete(id);
    return Promise.resolve();
  }),
};

jest.mock('../../utils/date', () => ({
  nowIso: jest.fn(() => `2026-01-01T00:00:${String(mockState.nowCounter++).padStart(2, '0')}.000Z`),
}));
jest.mock('../../utils/uuid', () => ({
  uuid: jest.fn(() => `id-${++mockState.uuidCounter}`),
}));
jest.mock('../../database/db', () => ({
  getStore: jest.fn(() => Promise.resolve(mockStore)),
}));

const {
  bumpAttempts,
  enqueue,
  listOutbox,
  outboxSize,
  removeEntry,
} = require('../../database/outbox');

beforeEach(async () => {
  for (const entry of await mockStore.all('outbox')) {
    await mockStore.remove('outbox', entry.id);
  }
  mockState.nowCounter = 0;
  mockState.uuidCounter = 0;
  jest.clearAllMocks();
});

test('enqueue appends a pending entry with attempts=0', async () => {
  await enqueue('class', 'upsert', { id: 'c1' });
  const entries = await listOutbox();
  expect(entries).toHaveLength(1);
  expect(entries[0]).toMatchObject({
    entity: 'class',
    op: 'upsert',
    payload: { id: 'c1' },
    attempts: 0,
  });
  expect(entries[0].createdAt).toBeDefined();
});

test('listOutbox returns entries oldest-first (by createdAt)', async () => {
  await enqueue('class', 'upsert', { id: 'c1' });
  await enqueue('student', 'upsert', { id: 's1' });
  await enqueue('event', 'upsert', { id: 'e1' });

  const entries = await listOutbox();
  expect(entries.map((e) => e.payload.id)).toEqual(['c1', 's1', 'e1']);
});

test('outboxSize reflects the pending count', async () => {
  expect(await outboxSize()).toBe(0);
  await enqueue('class', 'upsert', { id: 'c1' });
  await enqueue('student', 'upsert', { id: 's1' });
  expect(await outboxSize()).toBe(2);
});

test('coalescing: a new upsert replaces a queued upsert for the same row', async () => {
  await enqueue('student', 'upsert', { id: 's1', firstName: 'Old' });
  await enqueue('student', 'upsert', { id: 's1', firstName: 'New' });

  const entries = await listOutbox();
  expect(entries).toHaveLength(1);
  expect(entries[0].payload).toEqual({ id: 's1', firstName: 'New' });
});

test('coalescing: delete drops any earlier upsert for an unsynced row (created + deleted offline cancels out)', async () => {
  await enqueue('student', 'upsert', { id: 's1' });
  await enqueue('student', 'delete', { id: 's1' });

  expect(await listOutbox()).toEqual([]);
});

test('coalescing: delete is kept when the prior upsert was already pushed at least once', async () => {
  await enqueue('student', 'upsert', { id: 's1' });
  // Simulate a failed push that bumped attempts — the row exists remotely.
  const [pending] = await listOutbox();
  await bumpAttempts(pending.id);

  await enqueue('student', 'delete', { id: 's1' });

  const entries = await listOutbox();
  expect(entries).toHaveLength(1);
  expect(entries[0]).toMatchObject({ entity: 'student', op: 'delete', payload: { id: 's1' } });
});

test('coalescing scopes by entity AND id (same id under a different entity is untouched)', async () => {
  await enqueue('class', 'upsert', { id: 'x' });
  await enqueue('student', 'upsert', { id: 'x' });
  await enqueue('student', 'upsert', { id: 'x', firstName: 'replaced' });

  const entries = await listOutbox();
  expect(entries).toHaveLength(2);
  const byEntity = Object.fromEntries(entries.map((e) => [e.entity, e]));
  expect(byEntity.class.payload).toEqual({ id: 'x' });
  expect(byEntity.student.payload).toEqual({ id: 'x', firstName: 'replaced' });
});

test('removeEntry deletes by outbox id', async () => {
  await enqueue('class', 'upsert', { id: 'c1' });
  const [entry] = await listOutbox();
  await removeEntry(entry.id);
  expect(await listOutbox()).toEqual([]);
});

test('bumpAttempts increments the counter; no-op for unknown ids', async () => {
  await enqueue('class', 'upsert', { id: 'c1' });
  const [entry] = await listOutbox();

  await bumpAttempts(entry.id);
  await bumpAttempts(entry.id);
  const [after] = await listOutbox();
  expect(after.attempts).toBe(2);

  await expect(bumpAttempts('does-not-exist')).resolves.toBeUndefined();
});
