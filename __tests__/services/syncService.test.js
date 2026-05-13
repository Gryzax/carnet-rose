describe('syncService', () => {
  afterEach(() => jest.resetModules());

  test('ne synchronise pas sans Supabase', async () => {
    jest.doMock('../../services/supabase/supabaseClient', () => ({
      isSupabaseConfigured: () => false
    }));
    const { syncAll } = require('../../services/sync/syncService');
    await expect(syncAll()).resolves.toMatchObject({ synced: false, reason: 'supabase-not-configured' });
  });

  test('ne synchronise pas sans utilisateur connecte', async () => {
    jest.doMock('../../services/supabase/supabaseClient', () => ({
      isSupabaseConfigured: () => true
    }));
    jest.doMock('../../services/auth/authService', () => ({
      getCurrentUser: jest.fn(() => Promise.resolve({ user: null, error: null }))
    }));
    const { syncAll } = require('../../services/sync/syncService');
    await expect(syncAll()).resolves.toMatchObject({ synced: false, reason: 'not-authenticated' });
  });
});
