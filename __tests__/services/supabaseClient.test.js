describe('supabaseClient', () => {
  const originalEnv = process.env;

  afterEach(() => {
    jest.resetModules();
    process.env = originalEnv;
  });

  test('reste en mode local sans variables env', () => {
    process.env = { ...originalEnv, EXPO_PUBLIC_SUPABASE_URL: '', EXPO_PUBLIC_SUPABASE_ANON_KEY: '' };
    const client = require('../../services/supabase/supabaseClient');
    expect(client.isSupabaseConfigured()).toBe(false);
    expect(client.supabase).toBeNull();
    expect(client.getSupabaseStatus()).toEqual({ configured: false, mode: 'local-only' });
  });

  test('cree un client quand les variables env sont presentes', () => {
    process.env = {
      ...originalEnv,
      EXPO_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      EXPO_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
      EXPO_PUBLIC_APP_URL: 'https://example.com/app/'
    };
    const client = require('../../services/supabase/supabaseClient');
    expect(client.isSupabaseConfigured()).toBe(true);
    expect(client.supabase).toBeTruthy();
    expect(client.appUrl).toBe('https://example.com/app/');
  });
});
