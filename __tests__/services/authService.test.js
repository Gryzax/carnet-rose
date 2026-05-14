import { Linking } from 'react-native';

jest.mock('../../services/supabase/supabaseClient', () => ({
  getSupabaseAuthUrl: jest.fn((provider, redirectTo) => `https://frmiyddfipejirtbzoxr.supabase.co/auth/v1/authorize?provider=${provider}&redirect_to=${encodeURIComponent(redirectTo)}`),
  isSupabaseConfigured: jest.fn(() => true),
  supabaseRequest: jest.fn(() => Promise.resolve({ data: { id: 'user-1', email: 'demo@example.com' }, error: null }))
}));

const supabaseClient = require('../../services/supabase/supabaseClient');

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(Linking, 'openURL').mockResolvedValue();
  supabaseClient.isSupabaseConfigured.mockReturnValue(true);
});

test('Google utilise Supabase OAuth', async () => {
  const { signInWithGoogle } = require('../../services/auth/authService');

  await signInWithGoogle();

  expect(Linking.openURL).toHaveBeenCalledWith(expect.stringContaining('https://frmiyddfipejirtbzoxr.supabase.co/auth/v1/authorize?provider=google'));
});

test('Apple utilise Supabase OAuth', async () => {
  const { signInWithApple } = require('../../services/auth/authService');

  await signInWithApple();

  expect(Linking.openURL).toHaveBeenCalledWith(expect.stringContaining('https://frmiyddfipejirtbzoxr.supabase.co/auth/v1/authorize?provider=apple'));
});

test('provider non configure ou Supabase absent retourne une erreur francaise sans crash', async () => {
  supabaseClient.isSupabaseConfigured.mockReturnValue(false);
  const { signInWithGoogle } = require('../../services/auth/authService');

  const result = await signInWithGoogle();

  expect(result.user).toBeNull();
  expect(result.message).toBe('La connexion n’est pas encore configurée. Veuillez contacter l’administrateur.');
});
