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
  getAuthStatus: jest.fn(() => ({ enabled: false, localModeEnabled: true })),
  getCurrentUser: jest.fn(() => Promise.resolve({ user: null, error: null })),
  signInWithApple: jest.fn(),
  signInWithGoogle: jest.fn(),
  signOut: jest.fn(() => Promise.resolve({ error: null }))
}));

test('paramètres affiche les sections enrichies', async () => {
  const { getByText } = render(<SettingsScreen navigation={{ navigate: jest.fn(), canGoBack: jest.fn(() => false) }} />);
  await waitFor(() => expect(getByText('Mode local uniquement')).toBeTruthy());
  expect(getByText('À propos')).toBeTruthy();
  expect(getByText('Carnet Rose')).toBeTruthy();
  expect(getByText('Données')).toBeTruthy();
  expect(getByText('Trimestre')).toBeTruthy();
  expect(getByText('Compte')).toBeTruthy();
});

test('export affiche bientôt disponible', async () => {
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  const { getByTestId, getByText } = render(<SettingsScreen navigation={{ navigate: jest.fn(), canGoBack: jest.fn(() => false) }} />);
  await waitFor(() => expect(getByText('Mode local uniquement')).toBeTruthy());
  fireEvent.press(getByTestId('export-data'));
  expect(Alert.alert).toHaveBeenCalledWith('Exporter les données', 'Fonctionnalité bientôt disponible');
});

test("paramètres affiche une flèche retour vers l'accueil", async () => {
  const navigation = { navigate: jest.fn(), canGoBack: jest.fn(() => false), goBack: jest.fn() };
  const { getByTestId, getByText } = render(<SettingsScreen navigation={navigation} />);
  await waitFor(() => expect(getByText('Mode local uniquement')).toBeTruthy());

  fireEvent.press(getByTestId('back-button'));

  expect(navigation.navigate).toHaveBeenCalledWith('Classes');
});

test('se déconnecter revient au login via le callback', async () => {
  const onSignedOut = jest.fn();
  const { getByTestId } = render(<SettingsScreen navigation={{ navigate: jest.fn(), canGoBack: jest.fn(() => false) }} onSignedOut={onSignedOut} />);

  fireEvent.press(getByTestId('sign-out'));

  await waitFor(() => expect(authService.signOut).toHaveBeenCalled());
  expect(onSignedOut).toHaveBeenCalled();
});
