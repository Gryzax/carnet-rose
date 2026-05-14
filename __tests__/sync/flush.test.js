jest.mock('../../database/outbox', () => ({
  listOutbox: jest.fn(() => Promise.resolve([])),
  outboxSize: jest.fn(() => Promise.resolve(0)),
  removeEntry: jest.fn(() => Promise.resolve()),
  bumpAttempts: jest.fn(() => Promise.resolve())
}));
jest.mock('../../net/connectivity', () => ({
  isOnline: jest.fn(() => true)
}));
jest.mock('../../services/remote/context', () => ({
  getRemoteContext: jest.fn(() => Promise.resolve({ ready: true, user: { id: 'u1' }, session: { accessToken: 't1' } }))
}));
jest.mock('../../services/remote/classRemote', () => ({
  pushClass: jest.fn(() => Promise.resolve()),
  softDeleteClassRemote: jest.fn(() => Promise.resolve())
}));
jest.mock('../../services/remote/studentRemote', () => ({
  pushStudent: jest.fn(() => Promise.resolve()),
  softDeleteStudentRemote: jest.fn(() => Promise.resolve())
}));
jest.mock('../../services/remote/historyRemote', () => ({
  pushEvent: jest.fn(() => Promise.resolve()),
  pushArchive: jest.fn(() => Promise.resolve()),
  softDeleteEventRemote: jest.fn(() => Promise.resolve())
}));

import { flushOutbox } from '../../sync/flush';
import { bumpAttempts, listOutbox, outboxSize, removeEntry } from '../../database/outbox';
import { isOnline } from '../../net/connectivity';
import { getRemoteContext } from '../../services/remote/context';
import { pushClass, softDeleteClassRemote } from '../../services/remote/classRemote';
import { pushStudent } from '../../services/remote/studentRemote';
import { pushEvent } from '../../services/remote/historyRemote';

const entry = (over) => ({ id: `o-${Math.random()}`, entity: 'class', op: 'upsert', payload: { id: 'c1' }, attempts: 0, ...over });

beforeEach(() => {
  jest.clearAllMocks();
  isOnline.mockReturnValue(true);
  getRemoteContext.mockResolvedValue({ ready: true, user: { id: 'u1' }, session: { accessToken: 't1' } });
  outboxSize.mockResolvedValue(0);
  listOutbox.mockResolvedValue([]);
});

test('offline: nothing is dispatched, queue size returned', async () => {
  isOnline.mockReturnValue(false);
  outboxSize.mockResolvedValue(3);
  const remaining = await flushOutbox();
  expect(remaining).toBe(3);
  expect(listOutbox).not.toHaveBeenCalled();
  expect(pushClass).not.toHaveBeenCalled();
});

test('unauthenticated context: nothing is dispatched', async () => {
  getRemoteContext.mockResolvedValue({ ready: false, reason: 'not-authenticated' });
  outboxSize.mockResolvedValue(2);
  const remaining = await flushOutbox();
  expect(remaining).toBe(2);
  expect(pushClass).not.toHaveBeenCalled();
});

test('drains entries oldest-first and routes each by entity/op', async () => {
  const e1 = entry({ id: 'o1', entity: 'class', op: 'upsert', payload: { id: 'c1' } });
  const e2 = entry({ id: 'o2', entity: 'student', op: 'upsert', payload: { id: 's1' } });
  const e3 = entry({ id: 'o3', entity: 'event', op: 'upsert', payload: { id: 'ev1' } });
  const e4 = entry({ id: 'o4', entity: 'class', op: 'delete', payload: { id: 'c2' } });
  listOutbox.mockResolvedValue([e1, e2, e3, e4]);

  await flushOutbox();

  expect(pushClass).toHaveBeenCalledWith(expect.objectContaining({ ready: true }), e1.payload);
  expect(pushStudent).toHaveBeenCalledWith(expect.anything(), e2.payload);
  expect(pushEvent).toHaveBeenCalledWith(expect.anything(), e3.payload);
  expect(softDeleteClassRemote).toHaveBeenCalledWith(expect.anything(), 'c2');
  expect(removeEntry).toHaveBeenCalledTimes(4);
});

test('first failure aborts the run and bumps attempts', async () => {
  const e1 = entry({ id: 'o1', entity: 'class', op: 'upsert', payload: { id: 'c1' } });
  const e2 = entry({ id: 'o2', entity: 'student', op: 'upsert', payload: { id: 's1' } });
  listOutbox.mockResolvedValue([e1, e2]);
  pushClass.mockRejectedValueOnce(new Error('network'));
  outboxSize.mockResolvedValue(2);

  const remaining = await flushOutbox();

  expect(remaining).toBe(2);
  expect(bumpAttempts).toHaveBeenCalledWith('o1');
  expect(removeEntry).not.toHaveBeenCalled();
  expect(pushStudent).not.toHaveBeenCalled();
});

test('is single-flight: concurrent calls share one run', async () => {
  listOutbox.mockResolvedValue([]);
  const [a, b] = await Promise.all([flushOutbox(), flushOutbox()]);
  expect(a).toBe(b);
  expect(listOutbox).toHaveBeenCalledTimes(1);
});
