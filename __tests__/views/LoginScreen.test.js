import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { LoginScreen } from '../../views/LoginScreen';
import * as authService from '../../services/auth/authService';
import { isSupabaseConfigured } from '../../services/api/supabaseClient';

jest.mock('../../services/api/supabaseClient', () => ({
  isSupabaseConfigured: jest.fn(() => false)
}));

jest.mock('../../services/auth/authService', () => ({
  enableLocalMode: jest.fn(() => Promise.resolve({ localModeEnabled: true, error: null })),
  signInWithApple: jest.fn(() => Promise.resolve({ user: null, message: 'Apple pending' })),
  signInWithGoogle: jest.fn(() => Promise.resolve({ user: null, message: 'Google pending' }))
}));

test('LoginScreen affiche le mode local si Supabase est absent', () => {
  const { getByText, getByTestId } = render(<LoginScreen />);

  expect(getByText('Carnet Rose')).toBeTruthy();
  expect(getByText('Suivi hors ligne des élèves')).toBeTruthy();
  expect(getByText('Mode local disponible')).toBeTruthy();
  expect(getByText("Supabase n'est pas encore configuré.")).toBeTruthy();
  expect(getByTestId('continue-local')).toBeTruthy();
});

test('le bouton Google appelle signInWithGoogle', async () => {
  const { getByTestId } = render(<LoginScreen />);

  fireEvent.press(getByTestId('login-google'));

  await waitFor(() => expect(authService.signInWithGoogle).toHaveBeenCalled());
});

test('le bouton Apple appelle signInWithApple', async () => {
  const { getByTestId } = render(<LoginScreen />);

  fireEvent.press(getByTestId('login-apple'));

  await waitFor(() => expect(authService.signInWithApple).toHaveBeenCalled());
});

test('continuer en mode local authentifie localement', async () => {
  const onAuthenticated = jest.fn();
  const { getByTestId } = render(<LoginScreen onAuthenticated={onAuthenticated} />);

  fireEvent.press(getByTestId('continue-local'));

  await waitFor(() => expect(authService.enableLocalMode).toHaveBeenCalled());
  expect(onAuthenticated).toHaveBeenCalledWith({ user: null, localMode: true });
});

test('le bouton local disparait quand Supabase est configuré', () => {
  isSupabaseConfigured.mockReturnValueOnce(true);
  const { queryByTestId } = render(<LoginScreen />);

  expect(queryByTestId('continue-local')).toBeNull();
});
