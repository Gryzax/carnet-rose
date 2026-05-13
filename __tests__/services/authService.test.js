jest.mock('expo-web-browser', () => ({
  openAuthSessionAsync: jest.fn(() => Promise.resolve({ type: 'success' }))
}));

describe('authService', () => {
  afterEach(() => jest.resetModules());

  test('Google OAuth appelle Supabase quand configure', async () => {
    const signInWithOAuth = jest.fn(() => Promise.resolve({ data: { url: 'https://auth.example/google' }, error: null }));
    const getUser = jest.fn(() => Promise.resolve({ data: { user: { email: 'rose@example.com' } }, error: null }));
    jest.doMock('../../services/supabase/supabaseClient', () => ({
      appUrl: 'https://app.example/',
      isSupabaseConfigured: () => true,
      supabase: { auth: { signInWithOAuth, getUser } }
    }));

    const { signInWithGoogle } = require('../../services/auth/authService');
    const result = await signInWithGoogle();

    expect(signInWithOAuth).toHaveBeenCalledWith(expect.objectContaining({ provider: 'google' }));
    expect(result.user.email).toBe('rose@example.com');
  });

  test('Apple OAuth appelle Supabase quand configure', async () => {
    const signInWithOAuth = jest.fn(() => Promise.resolve({ data: {}, error: null }));
    const getUser = jest.fn(() => Promise.resolve({ data: { user: null }, error: null }));
    jest.doMock('../../services/supabase/supabaseClient', () => ({
      appUrl: 'https://app.example/',
      isSupabaseConfigured: () => true,
      supabase: { auth: { signInWithOAuth, getUser } }
    }));

    const { signInWithApple } = require('../../services/auth/authService');
    const result = await signInWithApple();

    expect(signInWithOAuth).toHaveBeenCalledWith(expect.objectContaining({ provider: 'apple' }));
    expect(result.message).toContain('Apple');
  });

  test('auth ne bloque pas en mode local', async () => {
    jest.doMock('../../services/supabase/supabaseClient', () => ({
      appUrl: 'https://app.example/',
      isSupabaseConfigured: () => false,
      supabase: null
    }));

    const { getCurrentUser, signInWithGoogle } = require('../../services/auth/authService');
    await expect(getCurrentUser()).resolves.toEqual({ user: null, error: null });
    const result = await signInWithGoogle();
    expect(result.error.message).toContain("Supabase n'est pas configuré");
  });
});
