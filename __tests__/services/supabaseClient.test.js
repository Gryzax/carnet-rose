describe('supabaseClient', () => {
  const originalEnv = { ...process.env };

  const loadSupabaseClient = () => {
    jest.resetModules();
    return require('../../services/supabase/supabaseClient');
  };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  test('detecte Supabase configure avec URL projet simple', () => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://frmiyddfipejirtbzoxr.supabase.co';
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'mock_publishable_key';
    process.env.EXPO_PUBLIC_APP_URL = 'https://gryzax.github.io/carnet-rose/';

    const { getSupabaseAuthUrl, getSupabaseUrl, isSupabaseConfigured } = loadSupabaseClient();

    expect(isSupabaseConfigured()).toBe(true);
    expect(getSupabaseUrl()).toBe('https://frmiyddfipejirtbzoxr.supabase.co');
    expect(getSupabaseAuthUrl('google', 'https://gryzax.github.io/carnet-rose/')).toContain('https://frmiyddfipejirtbzoxr.supabase.co/auth/v1/authorize');
    expect(getSupabaseAuthUrl('google', 'https://gryzax.github.io/carnet-rose/')).not.toContain('/rest/v1');
  });

  test('ne crashe pas sans env', () => {
    delete process.env.EXPO_PUBLIC_SUPABASE_URL;
    delete process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    delete process.env.EXPO_PUBLIC_APP_URL;

    const { getSupabaseAuthUrl, isSupabaseConfigured } = loadSupabaseClient();

    expect(isSupabaseConfigured()).toBe(false);
    expect(getSupabaseAuthUrl('google', 'https://gryzax.github.io/carnet-rose/')).toBeNull();
  });
});
