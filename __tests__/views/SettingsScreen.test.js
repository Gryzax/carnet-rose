import { Alert } from 'react-native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { SettingsScreen } from '../../views/SettingsScreen';
import * as authService from '../../services/auth/authService';

jest.mock('../../models/studentModel', () => ({
  getAllStudents: jest.fn(() => Promise.resolve([{ id: 1, merites: 2, retenues: 1, trimestreActuel: 1 }]))
}));

jest.mock('../../controllers/studentController', () => ({
  reinitialiserTrimestre: jest.fn(() => Promise.resolve({ totalEleves: 1, totalMerites: 2, totalRetenues: 1 }))
}));

jest.mock('../../services/auth/authService', () => ({
  getCurrentUser: jest.fn(() => Promise.resolve({ user: { email: 'demo@example.com' }, error: null })),
  signOut: jest.fn(() => Promise.resolve({ error: null }))
}));

jest.mock('../../services/sync/syncService', () => ({
  syncAll: jest.fn(() => Promise.resolve({ synced: true }))
}));

import { syncAll } from '../../services/sync/syncService';

test('parametres affiche les sections enrichies', async () => {
  const { getByText } = render(<SettingsScreen navigation={{ navigate: jest.fn(), canGoBack: jest.fn(() => false) }} />);
  await waitFor(() => expect(getByText('demo@example.com')).toBeTruthy());
  expect(getByText('A propos')).toBeTruthy();
  expect(getByText('Carnet Rose')).toBeTruthy();
  expect(getByText('Donnees')).toBeTruthy();
  expect(getByText('Trimestre')).toBeTruthy();
  expect(getByText('Compte')).toBeTruthy();
});

test('export affiche bientot disponible', async () => {
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  const { getByTestId, getByText } = render(<SettingsScreen navigation={{ navigate: jest.fn(), canGoBack: jest.fn(() => false) }} />);
  await waitFor(() => expect(getByText('demo@example.com')).toBeTruthy());
  fireEvent.press(getByTestId('export-data'));
  expect(Alert.alert).toHaveBeenCalledWith('Exporter les donnees', 'Fonctionnalite bientot disponible');
});

test('synchroniser maintenant appelle syncAll', async () => {
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  const { getByTestId, getByText } = render(<SettingsScreen navigation={{ navigate: jest.fn(), canGoBack: jest.fn(() => false) }} />);
  await waitFor(() => expect(getByText('demo@example.com')).toBeTruthy());

  fireEvent.press(getByTestId('sync-now'));

  await waitFor(() => expect(syncAll).toHaveBeenCalled());
  expect(Alert.alert).toHaveBeenCalledWith('Synchroniser maintenant', 'Synchronisation terminée');
});

test("parametres affiche une fleche retour vers l'accueil", async () => {
  const navigation = { navigate: jest.fn(), canGoBack: jest.fn(() => false), goBack: jest.fn() };
  const { getByTestId, getByText } = render(<SettingsScreen navigation={navigation} />);
  await waitFor(() => expect(getByText('demo@example.com')).toBeTruthy());

  fireEvent.press(getByTestId('back-button'));

  expect(navigation.navigate).toHaveBeenCalledWith('Classes');
});

test('se deconnecter revient au login via le callback', async () => {
  const onSignedOut = jest.fn();
  const { getByTestId, getByText } = render(<SettingsScreen navigation={{ navigate: jest.fn(), canGoBack: jest.fn(() => false) }} onSignedOut={onSignedOut} />);
  await waitFor(() => expect(getByText('demo@example.com')).toBeTruthy());

  fireEvent.press(getByTestId('sign-out'));

  await waitFor(() => expect(authService.signOut).toHaveBeenCalled());
  expect(onSignedOut).toHaveBeenCalled();
});
