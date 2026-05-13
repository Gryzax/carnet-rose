import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { ClassesScreen } from '../../views/ClassesScreen';

const mockRefresh = jest.fn(() => Promise.resolve());

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons'
}));

jest.mock('../../hooks/useClasses', () => ({
  useClasses: jest.fn(() => ({
    classes: [],
    loading: false,
    refresh: mockRefresh
  }))
}));

jest.mock('../../controllers/classController', () => ({
  ajouterClasse: jest.fn(() => Promise.resolve({ lastInsertRowId: 3 }))
}));

jest.mock('../../models/studentModel', () => ({
  getAllStudents: jest.fn(() => Promise.resolve([]))
}));

import { ajouterClasse } from '../../controllers/classController';

beforeEach(() => {
  jest.clearAllMocks();
});

test('le FAB ouvre la modale d ajout de classe', () => {
  const { getByTestId, getByPlaceholderText } = render(<ClassesScreen navigation={{ navigate: jest.fn() }} />);

  fireEvent.press(getByTestId('add-class-fab'));

  expect(getByPlaceholderText('Nom de la classe')).toBeTruthy();
});

test('la modale ajoute une classe puis rafraichit la liste', async () => {
  const { getByTestId, getByPlaceholderText, getByText } = render(<ClassesScreen navigation={{ navigate: jest.fn() }} />);

  fireEvent.press(getByTestId('add-class-fab'));
  fireEvent.changeText(getByPlaceholderText('Nom de la classe'), '4e Rose');
  fireEvent.press(getByText('Ajouter'));

  await waitFor(() => expect(ajouterClasse).toHaveBeenCalledWith('4e Rose'));
  expect(mockRefresh).toHaveBeenCalled();
});

test('la modale bloque un nom vide', () => {
  const { getByTestId, getByText } = render(<ClassesScreen navigation={{ navigate: jest.fn() }} />);

  fireEvent.press(getByTestId('add-class-fab'));
  fireEvent.press(getByText('Ajouter'));

  expect(getByText('Le nom de la classe est obligatoire.')).toBeTruthy();
  expect(ajouterClasse).not.toHaveBeenCalled();
});
