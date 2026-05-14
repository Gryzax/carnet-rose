describe('supabaseClient', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test('detecte Supabase configure avec URL projet simple', () => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://frmiyddfipejirtbzoxr.supabase.co';
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'sb_publishable_test';

    const { getSupabaseAuthUrl, getSupabaseUrl, isSupabaseConfigured } = require('../../services/supabase/supabaseClient');

    expect(isSupabaseConfigured()).toBe(true);
    expect(getSupabaseUrl()).toBe('https://frmiyddfipejirtbzoxr.supabase.co');
    expect(getSupabaseAuthUrl('google', 'https://gryzax.github.io/carnet-rose/')).toContain('https://frmiyddfipejirtbzoxr.supabase.co/auth/v1/authorize');
    expect(getSupabaseAuthUrl('google', 'https://gryzax.github.io/carnet-rose/')).not.toContain('/rest/v1');
  });

  test('ne crashe pas sans env', () => {
    delete process.env.EXPO_PUBLIC_SUPABASE_URL;
    delete process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

    const { getSupabaseAuthUrl, isSupabaseConfigured } = require('../../services/supabase/supabaseClient');

    expect(isSupabaseConfigured()).toBe(false);
    expect(getSupabaseAuthUrl('google', 'https://gryzax.github.io/carnet-rose/')).toBeNull();
  });
});
