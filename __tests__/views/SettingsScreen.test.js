import { Alert } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import { SettingsScreen } from '../../views/SettingsScreen';

jest.mock('../../models/studentModel', () => ({
  getAllStudents: jest.fn(() => Promise.resolve([{ id: 1, merites: 2, retenues: 1, trimestreActuel: 1 }]))
}));

jest.mock('../../controllers/studentController', () => ({
  reinitialiserTrimestre: jest.fn(() => Promise.resolve({ totalEleves: 1, totalMerites: 2, totalRetenues: 1 }))
}));

test('paramètres affiche les sections enrichies', () => {
  const { getByText } = render(<SettingsScreen navigation={{ navigate: jest.fn(), canGoBack: jest.fn(() => false) }} />);
  expect(getByText('À propos')).toBeTruthy();
  expect(getByText('Carnet Rose')).toBeTruthy();
  expect(getByText('Données')).toBeTruthy();
  expect(getByText('Trimestre')).toBeTruthy();
});

test('export affiche bientôt disponible', () => {
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  const { getByTestId } = render(<SettingsScreen navigation={{ navigate: jest.fn(), canGoBack: jest.fn(() => false) }} />);
  fireEvent.press(getByTestId('export-data'));
  expect(Alert.alert).toHaveBeenCalledWith('Exporter les données', 'Fonctionnalité bientôt disponible');
});

test("paramètres affiche une flèche retour vers l'accueil", () => {
  const navigation = { navigate: jest.fn(), canGoBack: jest.fn(() => false), goBack: jest.fn() };
  const { getByTestId } = render(<SettingsScreen navigation={navigation} />);

  fireEvent.press(getByTestId('back-button'));

  expect(navigation.navigate).toHaveBeenCalledWith('Classes');
});
