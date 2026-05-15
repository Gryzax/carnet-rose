describe('supabaseClient', () => {
  const originalEnv = process.env;

  const loadSupabaseClientWithEnv = (env) => {
    jest.resetModules();
    process.env = { ...env };
    return require('../../services/supabase/supabaseClient');
  };

  beforeEach(() => {
    process.env = { ...originalEnv };
    jest.resetModules();
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.resetModules();
  });

  test('detecte Supabase configure avec URL projet simple', () => {
    const { getSupabaseAuthUrl, getSupabaseUrl, isSupabaseConfigured } = loadSupabaseClientWithEnv({
      NODE_ENV: 'test',
      EXPO_PUBLIC_SUPABASE_URL: 'https://frmiyddfipejirtbzoxr.supabase.co',
      EXPO_PUBLIC_SUPABASE_KEY: 'mock_publishable_key',
      EXPO_PUBLIC_APP_URL: 'https://gryzax.github.io/carnet-rose/',
    });

    expect(isSupabaseConfigured()).toBe(true);
    expect(getSupabaseUrl()).toBe('https://frmiyddfipejirtbzoxr.supabase.co');
    expect(getSupabaseAuthUrl('google', 'https://gryzax.github.io/carnet-rose/')).toContain(
      'https://frmiyddfipejirtbzoxr.supabase.co/auth/v1/authorize',
    );
    expect(getSupabaseAuthUrl('google', 'https://gryzax.github.io/carnet-rose/')).not.toContain(
      '/rest/v1',
    );
  });

  test('ne crashe pas sans env', () => {
    const envWithoutSupabase = { NODE_ENV: 'test' };
    delete envWithoutSupabase.EXPO_PUBLIC_SUPABASE_URL;
    delete envWithoutSupabase.EXPO_PUBLIC_SUPABASE_KEY;
    delete envWithoutSupabase.EXPO_PUBLIC_APP_URL;

    const { getSupabaseAuthUrl, isSupabaseConfigured } =
      loadSupabaseClientWithEnv(envWithoutSupabase);

    expect(isSupabaseConfigured()).toBe(false);
    expect(getSupabaseAuthUrl('google', 'https://gryzax.github.io/carnet-rose/')).toBeNull();
  });
});
