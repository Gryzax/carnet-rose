import { Alert } from 'react-native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { SettingsScreen } from '../../views/SettingsScreen';

jest.mock('../../models/studentModel', () => ({
  getAllStudents: jest.fn(() => Promise.resolve([{ id: 1, merites: 2, retenues: 1, trimestreActuel: 1 }]))
}));

jest.mock('../../controllers/studentController', () => ({
  reinitialiserTrimestre: jest.fn(() => Promise.resolve({ totalEleves: 1, totalMerites: 2, totalRetenues: 1 }))
}));

jest.mock('../../services/auth/authService', () => ({
  getCurrentUser: jest.fn(() => Promise.resolve({ user: null, error: null })),
  signInWithApple: jest.fn(() => Promise.resolve({ message: 'Mode local uniquement.' })),
  signInWithGoogle: jest.fn(() => Promise.resolve({ message: 'Mode local uniquement.' })),
  signOut: jest.fn(() => Promise.resolve({ message: 'Vous êtes déconnecté.' }))
}));

jest.mock('../../services/supabase/supabaseClient', () => ({
  getSupabaseStatus: jest.fn(() => ({ configured: false, mode: 'local-only' }))
}));

jest.mock('../../services/sync/syncService', () => ({
  getLastSyncAt: jest.fn(() => null),
  syncAll: jest.fn(() => Promise.resolve({ synced: false, reason: 'supabase-not-configured', message: 'Mode local uniquement.' }))
}));

test('paramètres affiche les sections enrichies', async () => {
  const { getByText, getByTestId } = render(<SettingsScreen navigation={{ navigate: jest.fn(), canGoBack: jest.fn(() => false) }} />);
  await waitFor(() => expect(getByTestId('account-disconnected')).toBeTruthy());
  expect(getByText('À propos')).toBeTruthy();
  expect(getByText('Carnet Rose')).toBeTruthy();
  expect(getByText('Données')).toBeTruthy();
  expect(getByText('Compte')).toBeTruthy();
  expect(getByText('Trimestre')).toBeTruthy();
  expect(getByTestId('sign-in-google')).toBeTruthy();
  expect(getByTestId('sign-in-apple')).toBeTruthy();
  expect(getByTestId('sync-now')).toBeTruthy();
  expect(getByTestId('supabase-local-mode')).toBeTruthy();
});

test('export affiche bientôt disponible', async () => {
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  const { getByTestId } = render(<SettingsScreen navigation={{ navigate: jest.fn(), canGoBack: jest.fn(() => false) }} />);
  await waitFor(() => expect(getByTestId('account-disconnected')).toBeTruthy());
  fireEvent.press(getByTestId('export-data'));
  expect(Alert.alert).toHaveBeenCalledWith('Exporter les données', 'Fonctionnalité bientôt disponible');
});

test("paramètres affiche une flèche retour vers l'accueil", async () => {
  const navigation = { navigate: jest.fn(), canGoBack: jest.fn(() => false), goBack: jest.fn() };
  const { getByTestId } = render(<SettingsScreen navigation={navigation} />);
  await waitFor(() => expect(getByTestId('account-disconnected')).toBeTruthy());

  fireEvent.press(getByTestId('back-button'));

  expect(navigation.navigate).toHaveBeenCalledWith('Classes');
});
