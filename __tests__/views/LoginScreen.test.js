import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { LoginScreen } from '../../views/LoginScreen';
import * as authService from '../../services/auth/authService';
import { isSupabaseConfigured } from '../../services/api/supabaseClient';

jest.mock('../../services/api/supabaseClient', () => ({
  isSupabaseConfigured: jest.fn(() => false)
}));

jest.mock('../../services/auth/authService', () => ({
  signInWithApple: jest.fn(() => Promise.resolve({ user: null, message: 'Apple pending' })),
  signInWithGoogle: jest.fn(() => Promise.resolve({ user: null, message: 'Google pending' }))
}));

test('LoginScreen s affiche si aucun utilisateur connecte', () => {
  const { getByText } = render(<LoginScreen />);

  expect(getByText('Carnet Rose')).toBeTruthy();
  expect(getByText('Suivi hors ligne des eleves')).toBeTruthy();
});

test('le bouton Continuer en mode local n existe plus', () => {
  const { queryByTestId, queryByText } = render(<LoginScreen />);

  expect(queryByTestId('continue-local')).toBeNull();
  expect(queryByText('Continuer en mode local')).toBeNull();
});

test('Supabase absent affiche une erreur et bloque la connexion', () => {
  const onAuthenticated = jest.fn();
  const { getByText, getByTestId } = render(<LoginScreen onAuthenticated={onAuthenticated} />);

  expect(getByText('Connexion indisponible')).toBeTruthy();
  expect(getByText('La connexion n’est pas encore configurée. Veuillez contacter l’administrateur.')).toBeTruthy();

  fireEvent.press(getByTestId('login-google'));

  expect(onAuthenticated).not.toHaveBeenCalled();
  expect(authService.signInWithGoogle).not.toHaveBeenCalled();
});

test('le bouton Google appelle signInWithGoogle quand Supabase est configure', async () => {
  isSupabaseConfigured.mockReturnValueOnce(true);
  const { getByTestId } = render(<LoginScreen />);

  fireEvent.press(getByTestId('login-google'));

  await waitFor(() => expect(authService.signInWithGoogle).toHaveBeenCalled());
});

test('le bouton Apple appelle signInWithApple quand Supabase est configure', async () => {
  isSupabaseConfigured.mockReturnValueOnce(true);
  const { getByTestId } = render(<LoginScreen />);

  fireEvent.press(getByTestId('login-apple'));

  await waitFor(() => expect(authService.signInWithApple).toHaveBeenCalled());
});
