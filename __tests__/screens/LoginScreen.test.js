import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { LoginScreen } from '../../screens/LoginScreen';
import * as authService from '../../services/auth/authService';
import { isSupabaseConfigured } from '../../services/supabase/supabaseClient';

jest.mock('../../services/supabase/supabaseClient', () => ({
  isSupabaseConfigured: jest.fn(() => false)
}));

jest.mock('../../services/auth/authService', () => ({
  getCurrentUser: jest.fn(() => Promise.resolve({ user: null, error: null })),
  consumePendingAuthError: jest.fn(() => null),
  signInWithApple: jest.fn(() => Promise.resolve({ user: null, message: 'Apple pending' })),
  signInWithGoogle: jest.fn(() => Promise.resolve({ user: null, message: 'Google pending' }))
}));

beforeEach(() => {
  jest.clearAllMocks();
  authService.getCurrentUser.mockResolvedValue({ user: null, error: null });
});

test('Supabase absent bloque proprement le login', () => {
  const onAuthenticated = jest.fn();
  const { getByText, getByTestId, queryByText } = render(<LoginScreen onAuthenticated={onAuthenticated} />);

  expect(getByText('Carnet Rose')).toBeTruthy();
  expect(getByText('Sign-in unavailable')).toBeTruthy();
  expect(getByText('Sign-in isn’t set up yet. Please reach out to your administrator.')).toBeTruthy();
  expect(queryByText('Continuer en mode local')).toBeNull();

  fireEvent.press(getByTestId('login-google'));

  expect(authService.signInWithGoogle).not.toHaveBeenCalled();
  expect(onAuthenticated).not.toHaveBeenCalled();
});

test('variables Supabase presentes gardent les boutons Google et Apple disponibles', () => {
  isSupabaseConfigured.mockReturnValueOnce(true);
  const { getByTestId, queryByText } = render(<LoginScreen />);

  expect(getByTestId('login-google')).toBeTruthy();
  expect(getByTestId('login-apple')).toBeTruthy();
  expect(queryByText('Sign-in unavailable')).toBeNull();
});

test('Google appelle signInWithGoogle quand Supabase est configure', async () => {
  isSupabaseConfigured.mockReturnValueOnce(true);
  const { getByTestId } = render(<LoginScreen />);

  fireEvent.press(getByTestId('login-google'));

  await waitFor(() => expect(authService.signInWithGoogle).toHaveBeenCalled());
});

test('LoginScreen redirige si une session utilisateur existe deja', async () => {
  isSupabaseConfigured.mockReturnValueOnce(true);
  authService.getCurrentUser.mockResolvedValueOnce({ user: { email: 'demo@example.com' }, error: null });
  const onAuthenticated = jest.fn();

  render(<LoginScreen onAuthenticated={onAuthenticated} />);

  await waitFor(() => expect(onAuthenticated).toHaveBeenCalledWith({ user: { email: 'demo@example.com' } }));
  expect(authService.signInWithGoogle).not.toHaveBeenCalled();
});

test('Apple appelle signInWithApple quand Supabase est configure', async () => {
  isSupabaseConfigured.mockReturnValueOnce(true);
  const { getByTestId } = render(<LoginScreen />);

  fireEvent.press(getByTestId('login-apple'));

  await waitFor(() => expect(authService.signInWithApple).toHaveBeenCalled());
});
