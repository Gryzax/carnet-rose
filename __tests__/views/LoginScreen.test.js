import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { LoginScreen } from '../../views/LoginScreen';
import * as authService from '../../services/auth/authService';
import { isSupabaseConfigured } from '../../services/supabase/supabaseClient';

jest.mock('../../services/supabase/supabaseClient', () => ({
  isSupabaseConfigured: jest.fn(() => false)
}));

jest.mock('../../services/auth/authService', () => ({
  signInWithApple: jest.fn(() => Promise.resolve({ user: null, message: 'Apple pending' })),
  signInWithGoogle: jest.fn(() => Promise.resolve({ user: null, message: 'Google pending' }))
}));

test('Supabase absent bloque proprement le login', () => {
  const onAuthenticated = jest.fn();
  const { getByText, getByTestId, queryByText } = render(<LoginScreen onAuthenticated={onAuthenticated} />);

  expect(getByText('Carnet Rose')).toBeTruthy();
  expect(getByText('Connexion indisponible')).toBeTruthy();
  expect(getByText('La connexion n’est pas encore configurée. Veuillez contacter l’administrateur.')).toBeTruthy();
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
  expect(queryByText('Connexion indisponible')).toBeNull();
});

test('Google appelle signInWithGoogle quand Supabase est configure', async () => {
  isSupabaseConfigured.mockReturnValueOnce(true);
  const { getByTestId } = render(<LoginScreen />);

  fireEvent.press(getByTestId('login-google'));

  await waitFor(() => expect(authService.signInWithGoogle).toHaveBeenCalled());
});

test('Apple appelle signInWithApple quand Supabase est configure', async () => {
  isSupabaseConfigured.mockReturnValueOnce(true);
  const { getByTestId } = render(<LoginScreen />);

  fireEvent.press(getByTestId('login-apple'));

  await waitFor(() => expect(authService.signInWithApple).toHaveBeenCalled());
});
