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

describe('redirect OAuth (getAppUrl)', () => {
  const originalAppUrl = process.env.EXPO_PUBLIC_APP_URL;

  afterEach(() => {
    process.env.EXPO_PUBLIC_APP_URL = originalAppUrl;
  });

  const redirectFromLastCall = () => {
    const url = new URL(Linking.openURL.mock.calls[0][0]);
    return decodeURIComponent(url.searchParams.get('redirect_to'));
  };

  test('une URL https configuree est utilisee telle quelle', async () => {
    process.env.EXPO_PUBLIC_APP_URL = 'https://gryzax.github.io/carnet-rose/';
    const { signInWithGoogle } = require('../../services/auth/authService');

    await signInWithGoogle();

    expect(redirectFromLastCall()).toBe('https://gryzax.github.io/carnet-rose/');
  });

  test('un hote loopback en http est accepte pour le dev local', async () => {
    process.env.EXPO_PUBLIC_APP_URL = 'http://localhost:8081';
    const { signInWithGoogle } = require('../../services/auth/authService');

    await signInWithGoogle();

    expect(redirectFromLastCall()).toBe('http://localhost:8081');
  });

  test('un domaine http non-loopback retombe sur l URL de prod', async () => {
    process.env.EXPO_PUBLIC_APP_URL = 'http://example.com/app';
    const { signInWithGoogle } = require('../../services/auth/authService');

    await signInWithGoogle();

    expect(redirectFromLastCall()).toBe('https://gryzax.github.io/carnet-rose/');
  });
});

test('provider non configure ou Supabase absent retourne une erreur francaise sans crash', async () => {
  supabaseClient.isSupabaseConfigured.mockReturnValue(false);
  const { signInWithGoogle } = require('../../services/auth/authService');

  const result = await signInWithGoogle();

  expect(result.user).toBeNull();
  expect(result.message).toBe('La connexion n’est pas encore configurée. Veuillez contacter l’administrateur.');
});
