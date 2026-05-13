import { Alert } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import { SettingsScreen } from '../../views/SettingsScreen';

jest.mock('../../models/studentModel', () => ({
  getAllStudents: jest.fn(() => Promise.resolve([{ id: 1, merites: 2, retenues: 1, trimestreActuel: 1 }]))
}));

jest.mock('../../controllers/studentController', () => ({
  reinitialiserTrimestre: jest.fn(() => Promise.resolve({ totalEleves: 1, totalMerites: 2, totalRetenues: 1 }))
}));

test('parametres affiche les sections enrichies', () => {
  const { getByText } = render(<SettingsScreen />);
  expect(getByText('A propos')).toBeTruthy();
  expect(getByText('Klassia')).toBeTruthy();
  expect(getByText('Donnees')).toBeTruthy();
  expect(getByText('Trimestre')).toBeTruthy();
});

test('export affiche bientot disponible', () => {
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  const { getByTestId } = render(<SettingsScreen />);
  fireEvent.press(getByTestId('export-data'));
  expect(Alert.alert).toHaveBeenCalledWith('Exporter les donnees', 'Fonctionnalite bientot disponible');
});
