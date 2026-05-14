jest.mock('../../services/supabase/supabaseClient', () => ({
  isSupabaseConfigured: jest.fn(() => true),
  supabaseRequest: jest.fn(() => Promise.resolve({ data: null, error: null }))
}));

jest.mock('../../services/auth/authService', () => ({
  getCurrentUser: jest.fn(() => Promise.resolve({ user: { id: 'user-1', email: 'demo@example.com' }, error: null })),
  getCurrentSession: jest.fn(() => Promise.resolve({ session: { accessToken: 'token-1' }, error: null }))
}));

jest.mock('../../models/classModel', () => ({
  getClasses: jest.fn(() => Promise.resolve([{ id: 1, nom: '4e Rose', creeLe: '2026-01-01T00:00:00.000Z', derniereUtilisation: '2026-01-02T00:00:00.000Z' }]))
}));

jest.mock('../../models/studentModel', () => ({
  getAllStudents: jest.fn(() => Promise.resolve([{ id: 2, classeId: 1, prenom: 'Ada', nom: 'Lovelace', ticks: 1, croix: 0, merites: 2, retenues: 0, trimestreActuel: 1 }]))
}));

jest.mock('../../models/historyModel', () => ({
  getAllEvents: jest.fn(() => Promise.resolve([{ id: 3, eleveId: 2, type: 'tick', raison: 'Participation', trimestre: 1, creeLe: '2026-01-03T00:00:00.000Z', previousTicks: 0, previousCroix: 0, newTicks: 1, newCroix: 0, annule: 0 }])),
  getAllArchives: jest.fn(() => Promise.resolve([{ id: 4, eleveId: 2, trimestre: 1, merites: 2, retenues: 0, totalTicks: 1, totalCroix: 0, archiveLe: '2026-01-04T00:00:00.000Z' }]))
}));

import { getCurrentUser } from '../../services/auth/authService';
import { getClasses } from '../../models/classModel';
import { supabaseRequest } from '../../services/supabase/supabaseClient';
import { softDeleteClass, upsertClass } from '../../services/sync/classSyncService';
import { upsertEvent } from '../../services/sync/historySyncService';
import { syncAll } from '../../services/sync/syncService';
import { softDeleteStudent, upsertStudent } from '../../services/sync/studentSyncService';

beforeEach(() => {
  jest.clearAllMocks();
  supabaseRequest.mockResolvedValue({ data: null, error: null });
  getCurrentUser.mockResolvedValue({ user: { id: 'user-1', email: 'demo@example.com' }, error: null });
});

test('creation classe appelle un upsert Supabase', async () => {
  await upsertClass({
    classe: { id: 1, nom: '4e Rose', creeLe: '2026-01-01T00:00:00.000Z', derniereUtilisation: '2026-01-02T00:00:00.000Z' },
    user: { id: 'user-1' },
    session: { accessToken: 'token-1' }
  });

  expect(supabaseRequest).toHaveBeenCalledWith('/rest/v1/classes?on_conflict=user_id,local_id', expect.objectContaining({
    method: 'POST',
    accessToken: 'token-1',
    body: expect.stringContaining('"local_id":"1"')
  }));
  expect(JSON.parse(supabaseRequest.mock.calls[0][1].body)).toEqual(expect.objectContaining({ user_id: 'user-1', name: '4e Rose', last_used_at: '2026-01-02T00:00:00.000Z' }));
});

test('suppression classe appelle un soft delete Supabase', async () => {
  await softDeleteClass({ classId: 1, user: { id: 'user-1' }, session: { accessToken: 'token-1' } });

  expect(supabaseRequest).toHaveBeenCalledWith('/rest/v1/classes?user_id=eq.user-1&local_id=eq.1', expect.objectContaining({
    method: 'PATCH',
    body: expect.stringContaining('deleted_at')
  }));
});

test('creation eleve appelle un upsert Supabase', async () => {
  await upsertStudent({
    student: { id: 2, classeId: 1, prenom: 'Ada', nom: 'Lovelace', ticks: 1, croix: 0, merites: 2, retenues: 0, trimestreActuel: 1 },
    user: { id: 'user-1' },
    session: { accessToken: 'token-1' }
  });

  const body = JSON.parse(supabaseRequest.mock.calls[0][1].body);
  expect(supabaseRequest).toHaveBeenCalledWith('/rest/v1/students?on_conflict=user_id,local_id', expect.objectContaining({ method: 'POST' }));
  expect(body).toEqual(expect.objectContaining({ local_id: '2', class_local_id: '1', first_name: 'Ada', last_name: 'Lovelace', crosses: 0, merits: 2 }));
});

test('suppression eleve appelle un soft delete Supabase', async () => {
  await softDeleteStudent({ studentId: 2, user: { id: 'user-1' }, session: { accessToken: 'token-1' } });

  expect(supabaseRequest).toHaveBeenCalledWith('/rest/v1/students?user_id=eq.user-1&local_id=eq.2', expect.objectContaining({
    method: 'PATCH',
    body: expect.stringContaining('deleted_at')
  }));
});

test('tick ou croix insere un evenement Supabase', async () => {
  await upsertEvent({
    event: { id: 3, eleveId: 2, type: 'tick', raison: 'Participation', trimestre: 1, creeLe: '2026-01-03T00:00:00.000Z', previousTicks: 0, previousCroix: 0, newTicks: 1, newCroix: 0 },
    user: { id: 'user-1' },
    session: { accessToken: 'token-1' }
  });

  const body = JSON.parse(supabaseRequest.mock.calls[0][1].body);
  expect(supabaseRequest).toHaveBeenCalledWith('/rest/v1/events?on_conflict=user_id,local_id', expect.objectContaining({ method: 'POST' }));
  expect(body).toEqual(expect.objectContaining({ local_id: '3', student_local_id: '2', event_type: 'tick', reason: 'Participation', term: 1 }));
});

test('syncAll sans utilisateur ne pousse rien', async () => {
  getCurrentUser.mockResolvedValueOnce({ user: null, error: null });

  const result = await syncAll();

  expect(result.synced).toBe(false);
  expect(result.reason).toBe('not-authenticated');
  expect(supabaseRequest).not.toHaveBeenCalled();
});

test('syncAll avec utilisateur pousse les donnees locales', async () => {
  const result = await syncAll();

  expect(result.synced).toBe(true);
  expect(supabaseRequest).toHaveBeenCalledWith('/rest/v1/classes?on_conflict=user_id,local_id', expect.any(Object));
  expect(supabaseRequest).toHaveBeenCalledWith('/rest/v1/students?on_conflict=user_id,local_id', expect.any(Object));
  expect(supabaseRequest).toHaveBeenCalledWith('/rest/v1/events?on_conflict=user_id,local_id', expect.any(Object));
  expect(supabaseRequest).toHaveBeenCalledWith('/rest/v1/term_archives?on_conflict=user_id,local_id', expect.any(Object));
  expect(supabaseRequest).toHaveBeenCalledWith('/rest/v1/sync_state?on_conflict=user_id,local_id', expect.any(Object));
});

test('syncAll ignore les donnees locales marquees deleted_at', async () => {
  getClasses.mockResolvedValueOnce([
    { id: 1, nom: '6e Rose', deleted_at: '2026-01-01T00:00:00.000Z' },
    { id: 2, nom: '4e Rose', creeLe: '2026-01-01T00:00:00.000Z' }
  ]);

  await syncAll();

  const classBodies = supabaseRequest.mock.calls
    .filter(([path]) => path === '/rest/v1/classes?on_conflict=user_id,local_id')
    .map(([, options]) => JSON.parse(options.body));
  expect(classBodies).toEqual([expect.objectContaining({ local_id: '2', name: '4e Rose' })]);
});

test('erreur Supabase retourne une erreur non bloquante', async () => {
  supabaseRequest.mockResolvedValueOnce({ data: null, error: new Error('network') });

  const result = await syncAll();

  expect(result.synced).toBe(false);
  expect(result.error).toBeInstanceOf(Error);
});
